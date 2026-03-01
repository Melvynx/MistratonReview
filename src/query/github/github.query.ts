import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const installationSelect = {
  id: true,
  installationId: true,
  accountLogin: true,
  accountType: true,
  createdAt: true,
  repositories: {
    where: { isActive: true },
    select: {
      id: true,
      githubId: true,
      name: true,
      fullName: true,
      private: true,
      defaultBranch: true,
    },
    orderBy: { name: "asc" as const },
  },
} satisfies Prisma.GithubInstallationSelect;

export const getOrgInstallation = async (orgId: string) => {
  return prisma.githubInstallation.findFirst({
    where: { organizationId: orgId },
    select: installationSelect,
    orderBy: { createdAt: "desc" },
  });
};

export type OrgInstallation = Prisma.PromiseReturnType<
  typeof getOrgInstallation
>;

export const getOrgRepositories = async (orgId: string) => {
  return prisma.githubRepository.findMany({
    where: { organizationId: orgId, isActive: true },
    select: {
      id: true,
      githubId: true,
      name: true,
      fullName: true,
      private: true,
      defaultBranch: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
};

export type OrgRepositories = Prisma.PromiseReturnType<
  typeof getOrgRepositories
>;

export const getOrgReviews = async (orgId: string, limit = 20) => {
  return prisma.pullRequestReview.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      pullNumber: true,
      title: true,
      author: true,
      status: true,
      filesReviewed: true,
      commentsCount: true,
      criticalCount: true,
      warningCount: true,
      suggestionCount: true,
      summary: true,
      htmlUrl: true,
      createdAt: true,
      repository: {
        select: {
          name: true,
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

export type OrgReviews = Prisma.PromiseReturnType<typeof getOrgReviews>;

export const getOrgReviewStats = async (orgId: string) => {
  const [totalReviews, totalComments, reposCount] = await Promise.all([
    prisma.pullRequestReview.count({
      where: { organizationId: orgId },
    }),
    prisma.pullRequestReview.aggregate({
      where: { organizationId: orgId },
      _sum: { commentsCount: true },
    }),
    prisma.githubRepository.count({
      where: { organizationId: orgId, isActive: true },
    }),
  ]);

  return {
    totalReviews,
    totalComments: totalComments._sum.commentsCount ?? 0,
    reposCount,
  };
};

export type OrgReviewStats = Prisma.PromiseReturnType<typeof getOrgReviewStats>;

export const getReviewWithComments = async (
  reviewId: string,
  orgId: string,
) => {
  return prisma.pullRequestReview.findFirst({
    where: { id: reviewId, organizationId: orgId },
    select: {
      id: true,
      pullNumber: true,
      title: true,
      author: true,
      headSha: true,
      status: true,
      filesReviewed: true,
      commentsCount: true,
      criticalCount: true,
      warningCount: true,
      suggestionCount: true,
      summary: true,
      htmlUrl: true,
      createdAt: true,
      repository: {
        select: {
          name: true,
          fullName: true,
        },
      },
      comments: {
        select: {
          id: true,
          path: true,
          line: true,
          severity: true,
          body: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
};

export type ReviewWithComments = Prisma.PromiseReturnType<
  typeof getReviewWithComments
>;
