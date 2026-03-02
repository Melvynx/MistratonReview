import crypto from "crypto";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

export type ReviewComment = {
  path: string;
  line: number;
  severity: "critical" | "warning" | "suggestion";
  body: string;
};

export type PostReviewParams = {
  octokit: Octokit;
  owner: string;
  repo: string;
  pullNumber: number;
  comments: ReviewComment[];
  summary: string;
  commitId: string;
};

export type SeverityCounts = {
  critical: number;
  warning: number;
  suggestion: number;
};

const SKIP_PATTERNS = [
  /\.lock$/,
  /\.min\.(js|css)$/,
  /^\.next\//,
  /^node_modules\//,
  /\.(png|jpg|gif|svg|ico|woff|woff2|ttf|eot)$/,
  /generated/i,
  /\.d\.ts$/,
  /\.map$/,
  /^\.claude\//,
  /^\.vscode\//,
  /^\.idea\//,
  /\.md$/,
  /\.mdx$/,
  /\.txt$/,
  /\.env/,
];

export function countBySeverity(comments: ReviewComment[]): SeverityCounts {
  return {
    critical: comments.filter((c) => c.severity === "critical").length,
    warning: comments.filter((c) => c.severity === "warning").length,
    suggestion: comments.filter((c) => c.severity === "suggestion").length,
  };
}

export function verifyWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function getInstallationOctokit(installationId: number): Octokit {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey: privateKey.replace(/\\n/g, "\n"),
      installationId,
    },
  });
}

export async function getPRFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
) {
  const { data: files } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return files.filter((file) => {
    if (!file.patch) return false;
    return !SKIP_PATTERNS.some((pattern) => pattern.test(file.filename));
  });
}

export function mapDiffPositions(patch: string): Map<number, number> {
  const lines = patch.split("\n");
  const map = new Map<number, number>();
  let diffPosition = 0;
  let currentLine = 0;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
      if (!match) {
        diffPosition++;
        continue;
      }
      currentLine = parseInt(match[1]) - 1;
      diffPosition++;
      continue;
    }
    diffPosition++;
    if (!line.startsWith("-")) {
      currentLine++;
      map.set(currentLine, diffPosition);
    }
  }
  return map;
}

export async function getInstallationRepos(
  installationId: number,
  options?: { query?: string; perPage?: number },
) {
  const octokit = getInstallationOctokit(installationId);
  const perPage = options?.perPage ?? 20;
  const q = options?.query?.trim();

  if (q) {
    // Use search API to find repos by name within this installation's scope
    const { data: installationData } =
      await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 1,
      });

    // Get the installation owner from the first repo or fall back
    const owner = installationData.repositories[0]?.owner.login ?? "";

    if (!owner) {
      return { repositories: [], totalCount: 0 };
    }

    const { data: searchData } = await octokit.rest.search.repos({
      q: `${q} user:${owner} fork:true`,
      per_page: perPage,
    });

    return {
      repositories: searchData.items.map((item) => ({
        id: item.id,
        name: item.name,
        full_name: item.full_name,
        private: item.private,
        default_branch: item.default_branch,
        owner: item.owner,
      })),
      totalCount: searchData.total_count,
    };
  }

  // No search - return first page
  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: perPage,
  });

  return {
    repositories: data.repositories.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      default_branch: r.default_branch,
      owner: r.owner,
    })),
    totalCount: data.total_count,
  };
}

function severityEmoji(severity: string): string {
  const map: Record<string, string> = {
    critical: "🔴",
    warning: "🟡",
    suggestion: "💡",
  };
  return map[severity] ?? "💡";
}

export async function postReview(params: PostReviewParams) {
  const { octokit, owner, repo, pullNumber, comments, summary, commitId } =
    params;

  const reviewComments = comments.map((c) => ({
    path: c.path,
    line: c.line,
    side: "RIGHT" as const,
    body: `${severityEmoji(c.severity)} **${c.severity.toUpperCase()}**\n\n${c.body}`,
  }));

  const counts = countBySeverity(comments);

  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    commit_id: commitId,
    event: "COMMENT",
    body: `## 🤖 MistratonReview - AI Code Review\n\n${summary}\n\n| Severity | Count |\n|----------|-------|\n| 🔴 Critical | ${counts.critical} |\n| 🟡 Warning | ${counts.warning} |\n| 💡 Suggestion | ${counts.suggestion} |`,
    comments: reviewComments,
  });
}
