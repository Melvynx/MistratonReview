# CLAUDE.md

This file provides guidance to AI Agents.

## About the project MistratonReview

MistratonReview is an AI-powered GitHub App that automatically reviews every pull request using Mistral AI. It installs on GitHub repositories and, within seconds of opening a PR, posts inline code review comments from a senior AI reviewer - catching bugs, security issues, and performance problems.

### Main Features

- **GitHub App Installation + OAuth**: One-click install via GitHub App with OAuth flow
- **Automatic PR Review**: Webhook-driven - reviews trigger automatically on PR open/update
- **Mistral AI Analysis**: Sends PR diffs to Mistral AI with a senior reviewer system prompt
- **Inline Code Comments**: Posts review comments on exact lines in the PR
- **Summary Review**: Posts an overview comment with severity breakdown (critical/warning/suggestion)
- **Landing Page**: Marketing page with "Install on GitHub" CTA

### Goals

1. Eliminate code review bottlenecks by providing instant AI feedback
2. Catch bugs, security vulnerabilities, and performance issues that human reviewers miss
3. Provide actionable, specific review comments (not style/formatting nitpicks)

### Target Users

- Development teams looking to speed up their code review process
- Open source maintainers managing high PR volumes
- Individual developers wanting a second pair of eyes on their code

### Product Requirements Summary

- P0 (MVP): GitHub App auth, webhook receiver, PR diff fetching, Mistral AI review, inline comments, summary comment, landing page
- P1: Review severity levels, file skipping (lockfiles, generated code), rate limiting
- P2: Dashboard for review history, per-repo config file, Slack/Discord notifications

### Architecture Notes

- **Auth**: GitHub App OAuth (custom, NOT Better Auth)
- **AI**: Mistral AI SDK (`@mistralai/mistralai`) with `mistral-large-latest` model
- **GitHub API**: Octokit (`@octokit/rest`, `@octokit/auth-app`) for PR interaction
- **Database**: Stateless for MVP (no database required)
- **Webhook Flow**: GitHub webhook -> verify signature -> fetch PR diff -> Mistral review -> post inline comments
- **File Filtering**: Skips lockfiles, minified files, images, generated code, type declarations

## Important Files

- `src/lib/auth.ts` - Authentication configuration
- `src/features/dialog-manager/` - Global dialog system
- `src/lib/actions/actions-utils.ts` - Server action utilities
- `src/features/form/tanstack-form.tsx` - TanStack Form components (useForm, Form, field components)
- `src/site-config.ts` - Site configuration
- `src/lib/actions/safe-actions.ts` - All Server Action SHOULD use this logic
- `src/lib/zod-route.ts` - See `.claude/rules/api-routes.md` for detailed patterns

### Database Schemas

- `prisma/schema/schema.prisma` - Main database schema
- `prisma/schema/better-auth.prisma` - Better Auth schema (auto-generated)

## TypeScript imports

Always use TypeScript path aliases instead of relative imports:

- `@/*` → `./src/*` (e.g., `@/components/ui/button`)
- `@email/*` → `./emails/*` (e.g., `@email/welcome`)
- `@app/*` → `./app/*` (e.g., `@app/api/route`)

## Workflow modification

🚨 **CRITICAL RULE - ALWAYS FOLLOW THIS** 🚨

**BEFORE editing any files, you MUST Read at least 3 files** that will help you to understand how to make a coherent and consistency.

This is **NON-NEGOTIABLE**. Do not skip this step under any circumstances. Reading existing files ensures:

- Code consistency with project patterns
- Proper understanding of conventions
- Following established architecture
- Avoiding breaking changes

**Types of files you MUST read:**

1. **Similar files**: Read files that do similar functionality to understand patterns and conventions
2. **Imported dependencies**: Read the definition/implementation of any imports you're not 100% sure how to use correctly - understand their API, types, and usage patterns

**Steps to follow:**

1. Read at least 3 relevant existing files (similar functionality + imported dependencies)
2. Understand the patterns, conventions, and API usage
3. Only then proceed with creating/editing files
