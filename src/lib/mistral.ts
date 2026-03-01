import { Mistral } from "@mistralai/mistralai";
import { logger } from "@/lib/logger";
import type { ReviewComment } from "@/lib/github";
import { countBySeverity } from "@/lib/github";

type ParsedReview = {
  comments?: unknown[];
  summary?: string;
};

const SYSTEM_PROMPT = `You are a senior code reviewer at a top tech company.
Review the following code diff from a pull request.

For each issue you find, return a JSON object with this structure:
{
  "comments": [
    {
      "path": "src/file.ts",
      "line": 42,
      "severity": "critical" | "warning" | "suggestion",
      "body": "Your review comment explaining the issue and how to fix it"
    }
  ],
  "summary": "Brief overall assessment of the changes"
}

Rules:
- Only comment on real issues (bugs, security, performance, best practices)
- Do NOT comment on formatting or style
- Do NOT comment on things that are fine
- Be concise and actionable
- Reference the specific code when relevant
- If the diff looks good, return an empty comments array`;

export type ReviewResult = {
  comments: ReviewComment[];
  summary: string;
};

let mistralClient: Mistral | null = null;

function getMistralClient(): Mistral {
  if (mistralClient) return mistralClient;

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not configured");
  }

  mistralClient = new Mistral({ apiKey });
  return mistralClient;
}

export async function reviewFile(
  filename: string,
  patch: string,
): Promise<ReviewResult> {
  const client = getMistralClient();

  try {
    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `File: ${filename}\n\nDiff:\n${patch}` },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return { comments: [], summary: "Unable to parse AI response" };
    }

    const parsed = JSON.parse(content) as ParsedReview;

    if (!Array.isArray(parsed.comments)) {
      return { comments: [], summary: parsed.summary ?? "No issues found" };
    }

    const validComments = parsed.comments
      .filter(
        (c): c is ReviewComment =>
          typeof c === "object" &&
          c !== null &&
          typeof (c as Record<string, unknown>).path === "string" &&
          typeof (c as Record<string, unknown>).line === "number" &&
          typeof (c as Record<string, unknown>).body === "string" &&
          ["critical", "warning", "suggestion"].includes(
            (c as Record<string, unknown>).severity as string,
          ),
      )
      .map((c) => ({ ...c, path: filename }));

    return {
      comments: validComments,
      summary: parsed.summary ?? "Review complete",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error reviewing ${filename}: ${message}`);
    return { comments: [], summary: `Error reviewing ${filename}` };
  }
}

export function generateSummary(allComments: ReviewComment[]): string {
  const counts = countBySeverity(allComments);
  const total = allComments.length;

  if (total === 0) {
    return "No issues found. The code changes look good!";
  }

  const parts: string[] = [];
  if (counts.critical > 0)
    parts.push(
      `${counts.critical} critical issue${counts.critical > 1 ? "s" : ""}`,
    );
  if (counts.warning > 0)
    parts.push(`${counts.warning} warning${counts.warning > 1 ? "s" : ""}`);
  if (counts.suggestion > 0)
    parts.push(
      `${counts.suggestion} suggestion${counts.suggestion > 1 ? "s" : ""}`,
    );

  return `Found ${total} issue${total > 1 ? "s" : ""}: ${parts.join(", ")}.`;
}
