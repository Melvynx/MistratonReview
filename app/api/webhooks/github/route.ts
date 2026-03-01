import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import {
  verifyWebhook,
  getInstallationOctokit,
  getPRFiles,
  postReview,
  mapDiffPositions,
  countBySeverity,
} from "@/lib/github";
import { runReviewAgent } from "@/lib/review-agent";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

const MAX_FILES_PER_REVIEW = 25;

export async function POST(request: Request) {
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const rawBody = await request.text();

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !verifyWebhook(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event !== "pull_request") {
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  }

  try {
    const payload = JSON.parse(rawBody);

    const action = payload?.action;
    const pullRequest = payload?.pull_request;
    const repository = payload?.repository;
    const installation = payload?.installation;

    if (
      !action ||
      !pullRequest?.number ||
      !pullRequest?.head?.sha ||
      !repository?.owner?.login ||
      !repository?.name ||
      !installation?.id
    ) {
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 },
      );
    }

    if (!["opened", "synchronize", "reopened"].includes(action)) {
      return NextResponse.json({ message: "Action ignored" }, { status: 200 });
    }

    const owner: string = repository.owner.login;
    const repo: string = repository.name;
    const pullNumber: number = pullRequest.number;
    const commitId: string = pullRequest.head.sha;
    const installationId: number = installation.id;

    const octokit = getInstallationOctokit(installationId);
    const files = await getPRFiles(octokit, owner, repo, pullNumber);

    if (files.length === 0) {
      return NextResponse.json(
        { message: "No reviewable files" },
        { status: 200 },
      );
    }

    const filesToReview = files
      .slice(0, MAX_FILES_PER_REVIEW)
      .filter((f): f is typeof f & { patch: string } => Boolean(f.patch));

    // Run the agentic review - the agent reads files, understands context, then reviews
    const agentResult = await runReviewAgent({
      octokit,
      owner,
      repo,
      pullNumber,
      files: filesToReview.map((f) => ({
        filename: f.filename,
        patch: f.patch,
        status: f.status,
      })),
      prTitle: pullRequest.title ?? "",
      prBody: pullRequest.body ?? "",
    });

    // Map comments to valid diff positions
    const allComments = agentResult.comments.filter((comment) => {
      const file = filesToReview.find((f) => f.filename === comment.path);
      if (!file) return false;
      const positionMap = mapDiffPositions(file.patch);
      return positionMap.has(comment.line);
    });

    const summary = agentResult.summary;
    await postReview({
      octokit,
      owner,
      repo,
      pullNumber,
      comments: allComments,
      summary,
      commitId,
    });

    // Persist review results to database
    try {
      const repoRecord = await prisma.githubRepository.findFirst({
        where: {
          fullName: `${owner}/${repo}`,
          installation: { installationId: installationId },
          isActive: true,
        },
        select: { id: true, organizationId: true },
      });

      if (repoRecord) {
        const counts = countBySeverity(allComments);
        const review = await prisma.pullRequestReview.create({
          data: {
            repositoryId: repoRecord.id,
            organizationId: repoRecord.organizationId,
            pullNumber,
            title: pullRequest.title ?? `PR #${pullNumber}`,
            author: pullRequest.user?.login ?? "unknown",
            headSha: commitId,
            status: "completed",
            filesReviewed: filesToReview.length,
            commentsCount: allComments.length,
            criticalCount: counts.critical,
            warningCount: counts.warning,
            suggestionCount: counts.suggestion,
            summary,
            htmlUrl:
              pullRequest.html_url ??
              `https://github.com/${owner}/${repo}/pull/${pullNumber}`,
          },
        });

        if (allComments.length > 0) {
          await prisma.reviewComment.createMany({
            data: allComments.map((c) => ({
              reviewId: review.id,
              path: c.path,
              line: c.line,
              severity: c.severity,
              body: c.body,
            })),
          });
        }
      }
    } catch (dbError) {
      const dbMessage =
        dbError instanceof Error ? dbError.message : "Unknown DB error";
      logger.error(`Failed to save review to DB: ${dbMessage}`);
    }

    return NextResponse.json({
      success: true,
      filesReviewed: filesToReview.length,
      commentsPosted: allComments.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Webhook processing error: ${message}`);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
