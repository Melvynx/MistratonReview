import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { Typography } from "@/components/nowts/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle,
  Clock,
  ExternalLink,
  FileCode,
  Inbox,
  MessageSquare,
  Search,
  Webhook,
  XCircle,
} from "lucide-react";
import { combineWithParentMetadata } from "@/lib/metadata";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { getOrgInstallation, getOrgReviews } from "@/query/github/github.query";

export const generateMetadata = combineWithParentMetadata({
  title: "Reviews",
  description: "PR review history",
});

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type ReviewStatus = "pending" | "completed" | "failed";

function getStatusIcon(status: ReviewStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle className="size-5 text-green-600" />;
    case "pending":
      return <Clock className="size-5 text-yellow-600" />;
    case "failed":
      return <XCircle className="size-5 text-red-600" />;
  }
}

export default async function RoutePage(
  props: PageProps<"/orgs/[orgSlug]/users">,
) {
  const org = await getRequiredCurrentOrgCache();
  const installation = await getOrgInstallation(org.id);
  const reviews = installation ? await getOrgReviews(org.id, 50) : [];

  const hasInstallation = !!installation;
  const hasReviews = reviews.length > 0;

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Review Activity</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Automatic Code Reviews</CardTitle>
              <CardDescription>
                MistratonReview automatically reviews pull requests via
                webhooks. Review comments are posted directly on your GitHub
                PRs.
              </CardDescription>
            </CardHeader>
          </Card>

          {!hasInstallation && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <div className="bg-muted flex size-16 items-center justify-center rounded-full">
                  <Inbox className="text-muted-foreground size-8" />
                </div>
                <Typography variant="large">No reviews yet</Typography>
                <Typography variant="muted">
                  Install the GitHub App to start reviewing PRs.
                </Typography>
                <Button asChild>
                  <Link
                    href="https://github.com/apps/mistratonreview/installations/new"
                    target="_blank"
                  >
                    Install on GitHub
                    <ExternalLink className="ml-2 size-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {hasInstallation && !hasReviews && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <div className="bg-muted flex size-16 items-center justify-center rounded-full">
                  <Clock className="text-muted-foreground size-8" />
                </div>
                <Typography variant="large">
                  Waiting for pull requests
                </Typography>
                <Typography variant="muted">
                  Open a PR on any connected repository to trigger a review.
                </Typography>
              </CardContent>
            </Card>
          )}

          {hasReviews && (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link
                          href={review.htmlUrl}
                          target="_blank"
                          className="hover:underline"
                        >
                          <CardTitle className="text-base">
                            {review.title}
                          </CardTitle>
                        </Link>
                        <CardDescription className="mt-1">
                          PR #{review.pullNumber} in {review.repository.name} by{" "}
                          {review.author}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(review.status as ReviewStatus)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {review.criticalCount > 0 && (
                        <span className="bg-destructive/10 text-destructive inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm">
                          {review.criticalCount} Critical
                        </span>
                      )}
                      {review.warningCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                          {review.warningCount} Warning
                        </span>
                      )}
                      {review.suggestionCount > 0 && (
                        <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm">
                          {review.suggestionCount} Suggestion
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <FileCode className="size-4" />
                        {review.filesReviewed} file
                        {review.filesReviewed !== 1 ? "s" : ""}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="size-4" />
                        {review.commentsCount} comment
                        {review.commentsCount !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {review.summary && (
                      <Typography variant="muted" className="line-clamp-2">
                        {review.summary.length > 200
                          ? `${review.summary.substring(0, 200)}...`
                          : review.summary}
                      </Typography>
                    )}

                    <Typography
                      variant="small"
                      className="text-muted-foreground"
                    >
                      {timeAgo(review.createdAt)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Typography variant="h3">How Reviews Work</Typography>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <Webhook className="text-primary size-5" />
                  <CardTitle className="text-base">Webhook Received</CardTitle>
                  <CardDescription>
                    GitHub sends a webhook when a PR is opened or updated.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Search className="text-primary size-5" />
                  <CardTitle className="text-base">Code Analyzed</CardTitle>
                  <CardDescription>
                    Mistral AI analyzes the code diff for bugs, security, and
                    performance issues.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <MessageSquare className="text-primary size-5" />
                  <CardTitle className="text-base">Comments Posted</CardTitle>
                  <CardDescription>
                    Inline comments are posted on the specific lines that need
                    attention.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <BarChart3 className="text-primary size-5" />
                  <CardTitle className="text-base">Summary Generated</CardTitle>
                  <CardDescription>
                    A severity breakdown is posted as a review summary on the
                    PR.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </LayoutContent>
    </Layout>
  );
}
