import { generateText, tool, stepCountIs } from "ai";
import { createMistral } from "@ai-sdk/mistral";
import { z } from "zod";
import { logger } from "@/lib/logger";
import type { ReviewComment } from "@/lib/github";
import type { Octokit } from "@octokit/rest";

type ReviewAgentParams = {
  octokit: Octokit;
  owner: string;
  repo: string;
  pullNumber: number;
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
];

const SYSTEM_PROMPT = `You are a principal engineer at a top tech company. You review code the way the best human reviewers do - by deeply understanding context before making any judgment.

## YOUR REVIEW PROCESS (follow this exactly)

### Phase 1: Understand Context
Before writing a single comment, you MUST understand:
- What is this project? (read package.json, README, or config files if unclear)
- What is this PR trying to do? (read title + description carefully)
- Who are the consumers of the changed code? (use readFile to check who imports it)
- What's the deployment context? (web app? library? CLI? desktop app? mobile?)

Use the readFile and listDirectory tools to build this understanding. Read the files that IMPORT the changed files - that tells you how the code is actually used.

### Phase 2: Review Each File
For each changed file, ask yourself:
- Does this change introduce a BUG that will cause incorrect behavior?
- Does this change create a SECURITY vulnerability that could be exploited?
- Does this change cause a PERFORMANCE problem that users will notice?
- Is there an ERROR HANDLING gap that will cause a crash in production?
- Is there a RACE CONDITION or concurrency issue?

### Phase 3: Filter Ruthlessly
Before submitting, for EACH comment, ask:
- "Would a senior engineer at Google/Meta actually flag this in a real review?"
- "Does this matter given the actual context of this project?"
- "Is this a real problem or am I just being pedantic?"

DELETE any comment where the answer is "it doesn't really matter in practice."

## SEVERITY RULES (be very strict)

**critical** - ONLY for:
- Bugs that WILL cause incorrect behavior in production
- Security vulnerabilities that CAN be exploited
- Data loss or corruption risks
- Never use critical for "could be better" suggestions

**warning** - ONLY for:
- Performance issues that users WILL notice
- Error handling gaps that WILL cause crashes
- Race conditions in concurrent code
- Missing validation on external input

**suggestion** - For:
- Improvements that make the code genuinely better
- Patterns that prevent future bugs
- Accessibility improvements that matter
- Dead code that should be cleaned up

## WHAT TO NEVER COMMENT ON
- Font fallback choices (they're temporary during load)
- Adding ARIA labels unless there's a real accessibility problem
- Unused props/params unless they indicate a bug (like a prop that SHOULD be used but isn't)
- Style preferences (spacing, naming, formatting)
- "You could also do X" when the current approach works fine
- Documentation or comments
- Import ordering

## COMMENT FORMAT
Each comment must:
1. State the ACTUAL problem (not a hypothetical)
2. Explain WHY it matters in this specific context
3. Provide a CONCRETE code fix (not just "consider doing X")

Example of a GOOD comment:
"This fetch call has no error handling. If the API returns a non-200 response, the app will show a blank screen because the response is used directly in setState without checking .ok first. Fix: wrap in try/catch or check response.ok before parsing."

Example of a BAD comment (never write these):
"Consider adding error handling here for robustness." (too vague, no specific problem identified)

## FINAL CHECK
If you have 0 comments, that's fine - not every PR needs comments. A clean "LGTM" is better than inventing fake issues. Only submit comments you'd bet your reputation on.`;

export async function runReviewAgent(
  params: ReviewAgentParams,
): Promise<AgentResult> {
  const { octokit, owner, repo, files, prTitle, prBody } = params;

  const mistral = createMistral({
    apiKey: process.env.MISTRAL_API_KEY ?? "",
  });

  const fileList = files.map((f) => `- ${f.filename} (${f.status})`).join("\n");

  const diffs = files
    .map((f) => `### ${f.filename}\n\`\`\`diff\n${f.patch}\n\`\`\``)
    .join("\n\n");

  const userMessage = `## Pull Request: ${prTitle}

${prBody ? `### Description\n${prBody}\n` : ""}
### Changed Files
${fileList}

### Diffs
${diffs}

Follow your review process:
1. First use readFile/listDirectory to understand the project context and how the changed code is used
2. Then review each file deeply
3. Filter your comments ruthlessly - only keep what truly matters
4. Call submitReview with your findings`;

  const reviewTools = {
    readFile: tool({
      description:
        "Read a source file from the repo. Use this to understand imports, check consumers of changed code, read types, or get context. NEVER read node_modules or generated files.",
      inputSchema: z.object({
        path: z.string().describe("File path relative to repo root"),
      }),
      execute: async (input: { path: string }) => {
        if (BLOCKED_PATHS.some((b) => input.path.startsWith(b))) {
          logger.info(`[agent] Blocked read: ${input.path}`);
          return `Blocked: ${input.path} - read source files only.`;
        }

        logger.info(`[agent] Reading: ${input.path}`);
        try {
          const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: input.path,
          });

          if ("content" in data && data.content) {
            const content = Buffer.from(data.content, "base64").toString(
              "utf-8",
            );
            if (content.length > 10000) {
              return `File: ${input.path} (truncated)\n\n${content.slice(0, 10000)}\n\n... (truncated)`;
            }
            return `File: ${input.path}\n\n${content}`;
          }

          return `${input.path} is a directory.`;
        } catch {
          return `Could not read ${input.path} - file may not exist.`;
        }
      },
    }),

    listDirectory: tool({
      description:
        "List files in a directory. Use to understand project structure and find related files.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("Directory path relative to repo root (use '.' for root)"),
      }),
      execute: async (input: { path: string }) => {
        if (BLOCKED_PATHS.some((b) => input.path.startsWith(b))) {
          logger.info(`[agent] Blocked listDir: ${input.path}`);
          return `Blocked: ${input.path} - source directories only.`;
        }

        logger.info(`[agent] Listing: ${input.path}`);
        try {
          const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: input.path === "." ? "" : input.path,
          });

          if (Array.isArray(data)) {
            return data
              .map(
                (item) =>
                  `${item.type === "dir" ? "dir " : "file"} ${item.path}`,
              )
              .join("\n");
          }

          return `${input.path} is a file, not a directory.`;
        } catch {
          return `Could not list ${input.path}.`;
        }
      },
    }),

    submitReview: tool({
      description:
        "Submit your final review. Only call this ONCE after you've completed your full analysis. Every comment must pass your internal 'would a senior engineer flag this?' filter.",
      inputSchema: z.object({
        comments: z.array(
          z.object({
            path: z.string().describe("File path"),
            line: z
              .number()
              .describe(
                "Line number in the NEW file (from the + lines in the diff)",
              ),
            severity: z
              .enum(["critical", "warning", "suggestion"])
              .describe(
                "critical=bugs/security ONLY, warning=perf/errors, suggestion=real improvements",
              ),
            body: z
              .string()
              .describe("The problem, why it matters HERE, and a concrete fix"),
          }),
        ),
        summary: z
          .string()
          .describe(
            "1-3 sentences: what this PR does, overall quality assessment, and any blocking concerns",
          ),
      }),
      execute: async (input: {
        comments: ReviewComment[];
        summary: string;
      }) => {
        return { comments: input.comments, summary: input.summary };
      },
    }),
  };

  try {
    logger.info(
      `[agent] Starting review: ${owner}/${repo}#${params.pullNumber} (${files.length} files)`,
    );

    const result = await generateText({
      model: mistral("mistral-large-latest"),
      system: SYSTEM_PROMPT,
      prompt: userMessage,
      tools: reviewTools,
      stopWhen: stepCountIs(15),
      temperature: 0.1,
    });

    logger.info(
      `[agent] Done: ${result.steps.length} steps, ${result.usage.totalTokens} tokens`,
    );

    for (const [i, step] of result.steps.entries()) {
      const calls = step.toolCalls
        .map((tc) => {
          if (tc.toolName === "readFile" || tc.toolName === "listDirectory") {
            const input = tc.input as { path: string };
            return `${tc.toolName}(${input.path})`;
          }
          return tc.toolName;
        })
        .join(", ");
      if (calls) {
        logger.info(`[agent] Step ${i + 1}: ${calls}`);
      }
    }

    for (const step of result.steps) {
      for (const toolResult of step.toolResults) {
        if (toolResult.toolName === "submitReview") {
          const output = toolResult.output as {
            comments: ReviewComment[];
            summary: string;
          };
          logger.info(
            `[agent] Submitted: ${output.comments.length} comments (${output.comments.filter((c) => c.severity === "critical").length} critical, ${output.comments.filter((c) => c.severity === "warning").length} warnings, ${output.comments.filter((c) => c.severity === "suggestion").length} suggestions)`,
          );
          return {
            comments: output.comments,
            summary: output.summary,
          };
        }
      }
    }

    logger.error("[agent] Did not call submitReview");
    return {
      comments: [],
      summary: "The AI reviewer could not complete the review.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[agent] Error: ${message}`);
    return {
      comments: [],
      summary: `Review failed: ${message}`,
    };
  }
}
