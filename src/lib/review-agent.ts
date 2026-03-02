import { generateText, tool, stepCountIs } from "ai";
import { createMistral } from "@ai-sdk/mistral";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { countBySeverity } from "@/lib/github";
import type { ReviewComment } from "@/lib/github";
import type { Octokit } from "@octokit/rest";

type ReviewAgentParams = {
  octokit: Octokit;
  owner: string;
  repo: string;
  pullNumber: number;
  commitId: string;
  files: { filename: string; patch: string; status: string }[];
  prTitle: string;
  prBody: string;
};

type AgentResult = {
  comments: ReviewComment[];
  summary: string;
};

const BLOCKED_PATHS = [
  "node_modules",
  ".next",
  "dist",
  "build",
  "vendor",
  ".git",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
];

const BLOCKED_EXTENSIONS = [".env", ".pem", ".key"];

function isBlockedPath(path: string): boolean {
  if (path.includes("..")) return true;
  const normalized = path.replace(/^\.\//, "");
  const segments = normalized.split("/");
  if (segments.some((s) => BLOCKED_PATHS.includes(s))) return true;
  if (BLOCKED_EXTENSIONS.some((ext) => normalized.endsWith(ext))) return true;
  return false;
}

function createReadFileTool(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
) {
  return tool({
    description:
      "Read a source file from the repository at the PR's head commit. Use to understand imports, check consumers, read config files, or get context.",
    inputSchema: z.object({
      path: z.string().describe("File path relative to repo root"),
    }),
    execute: async (input: { path: string }) => {
      if (isBlockedPath(input.path)) {
        return `Blocked: ${input.path} - read source files only.`;
      }
      logger.info(`[agent] Reading: ${input.path}`);
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: input.path,
          ref,
        });
        if ("content" in data && data.content) {
          const content = Buffer.from(data.content, "base64").toString("utf-8");
          if (content.length > 10000) {
            return `File: ${input.path} (truncated)\n\n${content.slice(0, 10000)}\n\n... (truncated)`;
          }
          return `File: ${input.path}\n\n${content}`;
        }
        return `${input.path} is a directory.`;
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403) {
          return `Permission denied: cannot read ${input.path}. The GitHub App may not have "contents: read" permission for this repository. Skip reading files and use the diff context instead.`;
        }
        return `Could not read ${input.path} - file may not exist.`;
      }
    },
  });
}

function createListDirectoryTool(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
) {
  return tool({
    description:
      "List files in a directory. Use to understand project structure and find related files.",
    inputSchema: z.object({
      path: z
        .string()
        .describe("Directory path relative to repo root (use '.' for root)"),
    }),
    execute: async (input: { path: string }) => {
      if (isBlockedPath(input.path)) {
        return `Blocked: ${input.path} - source directories only.`;
      }
      logger.info(`[agent] Listing: ${input.path}`);
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: input.path === "." ? "" : input.path,
          ref,
        });
        if (Array.isArray(data)) {
          return data
            .map(
              (item) => `${item.type === "dir" ? "dir " : "file"} ${item.path}`,
            )
            .join("\n");
        }
        return `${input.path} is a file, not a directory.`;
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403) {
          return `Permission denied: cannot list ${input.path}. The GitHub App may not have "contents: read" permission. Use the diff context instead.`;
        }
        return `Could not list ${input.path}.`;
      }
    },
  });
}

// ── Phase 1: Context Gathering ──

const CONTEXT_SYSTEM_PROMPT = `You are a senior engineer preparing to review a pull request. Before reviewing any code, you need to deeply understand the project setup.

Your goal: build a complete mental model of this project so that your review comments are accurate and context-aware.

## What you MUST determine (read files to find out):
1. Framework and build tool (React? Vue? Next.js? Vite? Webpack? CRA?)
2. TypeScript config - especially the "jsx" field (classic needs React import, react-jsx does NOT)
3. Key dependencies and their versions
4. Project structure and architecture patterns
5. Testing setup (if any)
6. Styling approach (Tailwind? CSS modules? styled-components?)
7. Deployment context (web app? library? CLI? mobile?)

## How to explore:
1. Read package.json first - it tells you the framework, build tool, and dependencies
2. Read tsconfig.json (or tsconfig.app.json) - the "jsx" field is critical for React projects
3. List the root directory to understand project structure
4. Read any config files (vite.config, next.config, etc.)

## IMPORTANT:
- Read ONE file at a time. Think about what you learned before reading the next.
- After gathering enough context (usually 3-5 files), stop exploring and write a detailed summary.
- Your summary will be used to prevent false positives in the actual review.
- Be very specific about technical details like JSX transform mode, TypeScript strictness, etc.`;

async function gatherProjectContext(
  mistral: ReturnType<typeof createMistral>,
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  prTitle: string,
  prBody: string,
  fileList: string,
): Promise<string> {
  logger.info("[agent] Phase 1: Gathering project context...");

  try {
    const result = await generateText({
      model: mistral("mistral-large-latest"),
      system: CONTEXT_SYSTEM_PROMPT,
      prompt: `I'm about to review this pull request. First, help me understand the project.

## PR: ${prTitle}
${prBody ? `Description: ${prBody}\n` : ""}
## Changed files:
${fileList}

Start by reading package.json, then tsconfig.json, then explore the project structure. After you understand the project, write a comprehensive summary of your findings. Include specific details like the JSX transform mode, TypeScript settings, framework version, etc.`,
      tools: {
        readFile: createReadFileTool(octokit, owner, repo, ref),
        listDirectory: createListDirectoryTool(octokit, owner, repo, ref),
      },
      stopWhen: stepCountIs(8),
      temperature: 0.1,
    });

    for (const [i, step] of result.steps.entries()) {
      const calls = step.toolCalls
        .map((tc) => {
          const input = tc.input as { path: string };
          return `${tc.toolName}(${input.path})`;
        })
        .join(", ");
      if (calls) logger.info(`[agent] Context step ${i + 1}: ${calls}`);
    }

    const context = result.text || "No context gathered.";
    logger.info(
      `[agent] Phase 1 complete: ${result.steps.length} steps, ${result.usage.totalTokens} tokens`,
    );
    return context;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[agent] Phase 1 failed: ${msg}`);
    return "Could not gather project context. Review with caution.";
  }
}

// ── Phase 2: Per-File Deep Review ──

function buildFileReviewSystemPrompt(projectContext: string): string {
  return `You are a principal engineer reviewing a SINGLE file change in a pull request. You have already studied the project and have verified facts about its setup.

## Verified Project Context (these are FACTS - do NOT contradict them)
${projectContext}

## Review Process
1. Read the diff carefully - understand what changed and why
2. If you need more context (who imports this file, what types are used), use readFile to check
3. Only flag issues that are REAL problems given the project context above
4. Call submitFileReview with your findings. 0 comments is perfectly fine.

## Severity Rules (be very strict)
- **critical**: Bugs that WILL cause incorrect behavior in production. Security vulnerabilities that CAN be exploited. Data loss risks. NEVER use for "could be better" suggestions.
- **warning**: Performance issues users WILL notice. Error handling gaps that WILL cause crashes in production. Race conditions. Missing validation on EXTERNAL input.
- **suggestion**: Improvements that genuinely matter. Dead code that should be cleaned up. Patterns that prevent future bugs.

## BEFORE writing any comment, verify:
1. Does this contradict the project context above? (e.g., flagging missing React import when project uses react-jsx) -> DELETE
2. Is this actually a problem, or just a different style? -> DELETE if style
3. Would a senior engineer at a top company flag this in a real review? -> DELETE if no
4. Can I provide a specific, actionable fix? -> DELETE if I can only say "consider X"

## NEVER comment on:
- Missing React import (if project uses react-jsx/automatic JSX transform)
- Style/formatting preferences (spacing, naming conventions)
- Font fallback choices
- ARIA labels unless there's a real accessibility problem
- Import ordering
- Documentation or comments
- "You could also do X" when the current approach works fine
- Unused variables/props unless they indicate an actual bug (like a prop that SHOULD be used but isn't wired up)

## Comment Formatting (GitHub Markdown)
Write each comment body with proper GitHub markdown:
1. Start with a clear 1-sentence problem statement
2. Explain WHY it matters in this specific context
3. Provide a concrete fix using a fenced code block with language tag:

\`\`\`ts
// your fix here
\`\`\`

Make sure code blocks have a blank line before and after them. Never put code inline when it spans multiple lines.`;
}

async function reviewSingleFile(
  mistral: ReturnType<typeof createMistral>,
  projectContext: string,
  file: { filename: string; patch: string; status: string },
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
): Promise<ReviewComment[]> {
  logger.info(`[agent] Phase 2: Reviewing ${file.filename}...`);

  let comments: ReviewComment[] = [];

  try {
    const result = await generateText({
      model: mistral("mistral-large-latest"),
      system: buildFileReviewSystemPrompt(projectContext),
      prompt: `Review this file change:

### ${file.filename} (${file.status})
\`\`\`diff
${file.patch}
\`\`\`

Analyze this diff. If you need to understand how this code is used by other files, use readFile to check consumers/importers. Then call submitFileReview with your findings.`,
      tools: {
        readFile: createReadFileTool(octokit, owner, repo, ref),
        listDirectory: createListDirectoryTool(octokit, owner, repo, ref),
        submitFileReview: tool({
          description:
            "Submit your review for this file. Call once when done. 0 comments is fine if no real issues found.",
          inputSchema: z.object({
            comments: z.array(
              z.object({
                path: z.string(),
                line: z
                  .number()
                  .describe(
                    "Line number in the NEW file (from + lines in diff)",
                  ),
                severity: z.enum(["critical", "warning", "suggestion"]),
                body: z
                  .string()
                  .describe(
                    "The specific problem, why it matters in this context, and a concrete fix",
                  ),
              }),
            ),
          }),
          execute: async (input: { comments: ReviewComment[] }) => {
            comments = input.comments;
            return `Review submitted: ${input.comments.length} comments recorded.`;
          },
        }),
      },
      stopWhen: stepCountIs(6),
      temperature: 0.1,
    });

    const didSubmit = result.steps.some((step) =>
      step.toolCalls.some((tc) => tc.toolName === "submitFileReview"),
    );

    for (const [i, step] of result.steps.entries()) {
      const calls = step.toolCalls
        .map((tc) => {
          if (tc.toolName === "readFile" || tc.toolName === "listDirectory") {
            const input = tc.input as { path: string };
            return `${tc.toolName}(${input.path})`;
          }
          if (tc.toolName === "submitFileReview") {
            const input = tc.input as { comments: ReviewComment[] };
            return `submitFileReview(${input.comments.length} comments)`;
          }
          return tc.toolName;
        })
        .join(", ");
      if (calls)
        logger.info(`[agent]   ${file.filename} step ${i + 1}: ${calls}`);
    }

    if (!didSubmit) {
      logger.warn(
        `[agent]   ${file.filename}: submitFileReview was never called (step limit reached)`,
      );
    }

    logger.info(
      `[agent]   ${file.filename}: ${comments.length} comments, ${result.usage.totalTokens} tokens`,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[agent] Failed to review ${file.filename}: ${msg}`);
  }

  return comments;
}

// ── Phase 3: Calibration & Synthesis ──

const CALIBRATION_SYSTEM_PROMPT = `You are the final quality gate for a code review. You receive all comments from per-file analysis and must calibrate them before they are posted.

## Your job:
1. For EACH comment, verify it against the project context. DELETE any that contradict known project facts.
2. Check severity accuracy: is a "critical" actually a real production bug? Downgrade to "warning" or "suggestion" if not.
3. Remove pedantic comments that don't matter in practice.
4. Check for cross-file issues: does changing file A affect consumers in file B?
5. Write a 1-3 sentence summary of the PR quality.

## Rules for deletion:
- If the comment contradicts the project context (e.g., flagging missing React import in a react-jsx project) -> DELETE
- If "would a senior engineer at Google actually block the PR for this?" -> no -> DELETE
- If the fix is vague like "consider doing X" without a specific problem -> DELETE
- If the issue is about style, formatting, or preferences -> DELETE

## Rules for severity adjustment:
- "critical" should ONLY be used for bugs that WILL break production or security vulnerabilities
- If a "critical" is really just "could be improved" -> downgrade to "suggestion" or DELETE
- If a "warning" is really just a minor observation -> downgrade to "suggestion" or DELETE

## Output:
- You may ONLY keep, remove, or modify comments from the input list. Do NOT invent new comments.
- If 0 comments survive filtering, that's great. LGTM reviews are valuable.
- Write a summary that accurately reflects the PR quality.

Call submitFinalReview with the filtered comments and summary.`;

async function calibrateAndSynthesize(
  mistral: ReturnType<typeof createMistral>,
  projectContext: string,
  allComments: ReviewComment[],
  prTitle: string,
  prBody: string,
): Promise<AgentResult> {
  logger.info(`[agent] Phase 3: Calibrating ${allComments.length} comments...`);

  if (allComments.length === 0) {
    logger.info("[agent] Phase 3: No comments to calibrate, LGTM");
    return {
      comments: [],
      summary: `**${prTitle}** - Clean PR, no issues found. LGTM!`,
    };
  }

  const commentsText = allComments
    .map(
      (c, i) => `${i + 1}. [${c.severity}] ${c.path}:${c.line}\n   ${c.body}`,
    )
    .join("\n\n");

  let finalResult: AgentResult = {
    comments: allComments,
    summary: "Review complete.",
  };

  try {
    await generateText({
      model: mistral("mistral-large-latest"),
      system: CALIBRATION_SYSTEM_PROMPT,
      prompt: `## Project Context (verified facts)
${projectContext}

## PR: ${prTitle}
${prBody ? `Description: ${prBody}\n` : ""}
## All Review Comments (${allComments.length} total)
${commentsText}

Calibrate these comments. Remove false positives. Adjust severity. Then call submitFinalReview with the surviving comments and a summary.`,
      tools: {
        submitFinalReview: tool({
          description:
            "Submit the final calibrated review. Only keep comments that are real, actionable issues.",
          inputSchema: z.object({
            comments: z.array(
              z.object({
                path: z.string(),
                line: z.number(),
                severity: z.enum(["critical", "warning", "suggestion"]),
                body: z.string(),
              }),
            ),
            summary: z
              .string()
              .describe(
                "1-3 sentences: what this PR does, quality assessment, and any blocking concerns",
              ),
          }),
          execute: async (input: {
            comments: ReviewComment[];
            summary: string;
          }) => {
            finalResult = {
              comments: input.comments,
              summary: input.summary,
            };
            return `Final review submitted: ${input.comments.length} comments.`;
          },
        }),
      },
      toolChoice: { type: "tool", toolName: "submitFinalReview" },
      temperature: 0.1,
    });

    logger.info(
      `[agent] Phase 3 complete: ${finalResult.comments.length}/${allComments.length} comments survived calibration`,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[agent] Phase 3 failed: ${msg}, returning unfiltered`);
  }

  return finalResult;
}

// ── Main Entry Point ──

export async function runReviewAgent(
  params: ReviewAgentParams,
): Promise<AgentResult> {
  const { octokit, owner, repo, commitId, files, prTitle, prBody } = params;

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    logger.error("[agent] MISTRAL_API_KEY is not configured");
    return {
      comments: [],
      summary: "Review failed: MISTRAL_API_KEY is not configured",
    };
  }

  const mistral = createMistral({ apiKey });

  const fileList = files.map((f) => `- ${f.filename} (${f.status})`).join("\n");

  try {
    logger.info(
      `[agent] Starting review: ${owner}/${repo}#${params.pullNumber} (${files.length} files)`,
    );

    // Phase 1: Understand the project before reviewing anything
    const projectContext = await gatherProjectContext(
      mistral,
      octokit,
      owner,
      repo,
      commitId,
      prTitle,
      prBody,
      fileList,
    );
    logger.info("[agent] Project context acquired");

    // Phase 2: Review each file individually with full project context
    // Sequential is intentional - each file gets deep, focused analysis
    const allComments: ReviewComment[] = [];
    for (let i = 0; i < files.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      const fileComments = await reviewSingleFile(
        mistral,
        projectContext,
        files[i],
        octokit,
        owner,
        repo,
        commitId,
      );
      allComments.push(...fileComments);
      // Small delay between files to avoid Mistral rate limits
      if (i < files.length - 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    logger.info(
      `[agent] All files reviewed: ${allComments.length} total comments`,
    );

    // Phase 3: Calibrate severity, remove false positives, synthesize
    const finalResult = await calibrateAndSynthesize(
      mistral,
      projectContext,
      allComments,
      prTitle,
      prBody,
    );

    const counts = countBySeverity(finalResult.comments);

    logger.info(
      `[agent] Review complete: ${finalResult.comments.length} final comments (${counts.critical} critical, ${counts.warning} warnings, ${counts.suggestion} suggestions)`,
    );

    return finalResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[agent] Error: ${message}`);
    return {
      comments: [],
      summary: `Review failed: ${message}`,
    };
  }
}
