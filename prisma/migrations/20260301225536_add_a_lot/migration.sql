-- CreateTable
CREATE TABLE "github_installation" (
    "id" TEXT NOT NULL,
    "installationId" INTEGER NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'Organization',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_repository" (
    "id" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "installationId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pull_request_review" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pullNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "headSha" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "filesReviewed" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "criticalCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "suggestionCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pull_request_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_comment" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_installation_installationId_key" ON "github_installation"("installationId");

-- CreateIndex
CREATE INDEX "github_installation_organizationId_idx" ON "github_installation"("organizationId");

-- CreateIndex
CREATE INDEX "github_repository_organizationId_idx" ON "github_repository"("organizationId");

-- CreateIndex
CREATE INDEX "github_repository_installationId_idx" ON "github_repository"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "github_repository_githubId_organizationId_key" ON "github_repository"("githubId", "organizationId");

-- CreateIndex
CREATE INDEX "pull_request_review_organizationId_idx" ON "pull_request_review"("organizationId");

-- CreateIndex
CREATE INDEX "pull_request_review_repositoryId_idx" ON "pull_request_review"("repositoryId");

-- CreateIndex
CREATE INDEX "review_comment_reviewId_idx" ON "review_comment"("reviewId");

-- AddForeignKey
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_repository" ADD CONSTRAINT "github_repository_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "github_installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_repository" ADD CONSTRAINT "github_repository_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_request_review" ADD CONSTRAINT "pull_request_review_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "github_repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_request_review" ADD CONSTRAINT "pull_request_review_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comment" ADD CONSTRAINT "review_comment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "pull_request_review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
