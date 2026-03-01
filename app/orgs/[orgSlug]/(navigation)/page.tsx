import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/nowts/typography";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  GitFork,
  GitPullRequest,
  Globe,
  Lock,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import {
  getOrgInstallation,
  getOrgReviews,
  getOrgReviewStats,
} from "@/query/github/github.query";
import { cn } from "@/lib/utils";

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

function severityBadge(label: string, count: number, className: string) {
  if (count === 0) return null;
  return (
    <span
      className={cn("rounded-full px-2 py-0.5 text-xs font-medium", className)}
    >
      {count} {label}
    </span>
  );
}

export default async function DashboardPage() {
  const org = await getRequiredCurrentOrgCache();
  const installation = await getOrgInstallation(org.id);

  if (!installation) {
    return (
      <Layout size="lg">
        <LayoutHeader>
          <LayoutTitle>Dashboard</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Get Started with MistratonReview
              </CardTitle>
              <CardDescription>
                Install the GitHub App to start getting AI-powered code reviews
                on every pull request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg">
                <Link
                  href="https://github.com/apps/mistratonreview/installations/new"
                  target="_blank"
                >
                  <Download className="mr-2 size-4" />
                  Install on GitHub
                  <ExternalLink className="ml-2 size-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </LayoutContent>
      </Layout>
    );
  }

  const [stats, reviews] = await Promise.all([
    getOrgReviewStats(org.id),
    getOrgReviews(org.id, 10),
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="size-4 text-green-500" />;
      case "pending":
        return <Clock className="size-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="size-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Dashboard</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <div className="flex flex-col gap-8">
          {/* Stats Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="text-muted-foreground size-5" />
                    <span className="text-2xl font-bold">
                      {stats.totalReviews}
                    </span>
                  </div>
                  <Typography variant="muted">Total Reviews</Typography>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="text-muted-foreground size-5" />
                    <span className="text-2xl font-bold">
                      {stats.totalComments}
                    </span>
                  </div>
                  <Typography variant="muted">Total Comments</Typography>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <GitFork className="text-muted-foreground size-5" />
                    <span className="text-2xl font-bold">
                      {stats.reposCount}
                    </span>
                  </div>
                  <Typography variant="muted">Repos Monitored</Typography>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews Section */}
          <div className="flex flex-col gap-4">
            <div>
              <Typography variant="h3">Recent Reviews</Typography>
            </div>
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Typography variant="muted">
                    Waiting for your first pull request review...
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-1 flex-col gap-1">
                            <Link
                              href={review.htmlUrl}
                              target="_blank"
                              className="flex items-center gap-2 hover:underline"
                            >
                              <span className="font-semibold">
                                {review.title}
                              </span>
                              <ExternalLink className="text-muted-foreground size-3" />
                            </Link>
                            <Typography variant="muted" className="text-sm">
                              PR #{review.pullNumber} in{" "}
                              {review.repository.name}
                            </Typography>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(review.status)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <Typography variant="muted" className="text-sm">
                              By {review.author}
                            </Typography>
                            <Typography variant="muted" className="text-sm">
                              {timeAgo(review.createdAt)}
                            </Typography>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {severityBadge(
                              "Critical",
                              review.criticalCount,
                              "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
                            )}
                            {severityBadge(
                              "Warning",
                              review.warningCount,
                              "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-200",
                            )}
                            {severityBadge(
                              "Suggestion",
                              review.suggestionCount,
                              "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Monitored Repos Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Typography variant="h3">Monitored Repos</Typography>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href="https://github.com/apps/mistratonreview/installations/new"
                  target="_blank"
                >
                  Manage repos
                  <ExternalLink className="ml-2 size-3" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {installation.repositories.map((repo) => (
                <Card key={repo.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      {repo.private ? (
                        <Lock className="text-muted-foreground size-4" />
                      ) : (
                        <Globe className="text-muted-foreground size-4" />
                      )}
                      <Typography className="font-medium">
                        {repo.name}
                      </Typography>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </LayoutContent>
    </Layout>
  );
}
