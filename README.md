# MistratonReview

**AI-powered code review for every pull request, powered by Mistral AI.**

> Built for the [Mistral AI Hackathon](https://mistral.ai/) - an agentic GitHub App that automatically reviews every PR using Mistral AI as a senior code reviewer.

## What is MistratonReview?

MistratonReview is a GitHub App that installs on your repositories and automatically reviews every pull request within seconds. It uses **Mistral AI** (`mistral-large-latest`) with an agentic approach - the AI doesn't just look at diffs, it actively reads your codebase to understand context before making any judgment.

### How It Works

```
PR Opened -> GitHub Webhook -> Fetch PR Diff -> Mistral AI Agent Review -> Inline Comments
```

1. You open a pull request
2. GitHub sends a webhook to MistratonReview
3. The AI agent reads the diff, then explores your codebase for context (imports, consumers, project structure)
4. It posts inline code review comments on exact lines with severity ratings
5. A summary comment shows the overall assessment with severity breakdown

### Key Features

- **Agentic Review** - The AI uses tools (`readFile`, `listDirectory`) to explore your repo and understand how changed code is actually used before reviewing
- **Inline Comments** - Review comments appear directly on the relevant lines in the PR
- **Severity Levels** - Each comment is classified as Critical, Warning, or Suggestion
- **Smart File Filtering** - Automatically skips lockfiles, minified files, images, generated code, and type declarations
- **Summary Report** - Every review includes a summary comment with a severity breakdown table
- **Review History** - Dashboard to track all reviews across your repositories

## Tech Stack

| Category | Technology |
|----------|------------|
| **AI Engine** | [Mistral AI](https://mistral.ai/) (`mistral-large-latest`) via [@ai-sdk/mistral](https://www.npmjs.com/package/@ai-sdk/mistral) |
| **AI Framework** | [Vercel AI SDK](https://sdk.vercel.ai/) with tool calling (agentic) |
| **Framework** | [Next.js 16](https://nextjs.org/) with App Router |
| **Language** | TypeScript (strict mode) |
| **GitHub Integration** | [Octokit](https://github.com/octokit/rest.js) + GitHub App (webhooks, OAuth) |
| **Database** | PostgreSQL with [Prisma ORM](https://www.prisma.io/) |
| **Auth** | [Better Auth](https://www.better-auth.com/) with GitHub OAuth |
| **Styling** | [TailwindCSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Deployment** | [Vercel](https://vercel.com/) |

## Architecture

### Agentic Review Flow

The core of MistratonReview is an AI agent (not a simple prompt-response). Using the Vercel AI SDK's `generateText` with tool calling:

```
Mistral AI Agent
  |-- readFile(path)       -> Reads any source file from the repo via GitHub API
  |-- listDirectory(path)  -> Lists directory contents to understand structure
  |-- submitReview(...)    -> Submits the final review with comments and summary
```

The agent follows a structured review process:

1. **Phase 1: Understand Context** - Reads project files, checks imports, understands deployment context
2. **Phase 2: Deep Review** - Analyzes each changed file for bugs, security issues, performance problems
3. **Phase 3: Filter Ruthlessly** - Only keeps comments a senior engineer would actually flag

### Webhook Flow

```
GitHub (PR event)
  -> POST /api/webhooks/github
  -> Verify HMAC-SHA256 signature
  -> Fetch PR files via Octokit
  -> Filter out non-reviewable files
  -> Run agentic review with Mistral AI
  -> Post inline comments + summary via GitHub API
  -> Persist review to database
```

### Database Schema

```
GithubInstallation (1) -> (N) GithubRepository (1) -> (N) PullRequestReview (1) -> (N) ReviewComment
```

## Mistral AI Integration

MistratonReview uses Mistral AI in two ways:

### 1. Agentic Review (Primary - `src/lib/review-agent.ts`)

Uses `@ai-sdk/mistral` with the Vercel AI SDK for tool-calling. The agent can make up to 15 steps, reading files and exploring the repo before submitting its review.

```typescript
const result = await generateText({
  model: mistral("mistral-large-latest"),
  system: SYSTEM_PROMPT,
  prompt: userMessage,
  tools: { readFile, listDirectory, submitReview },
  stopWhen: stepCountIs(15),
  temperature: 0.1,
});
```

### 2. Direct Review (Fallback - `src/lib/mistral.ts`)

Uses `@mistralai/mistralai` SDK directly for simpler, per-file reviews with JSON structured output.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database
- A [GitHub App](https://docs.github.com/en/apps/creating-github-apps)
- A [Mistral AI API key](https://console.mistral.ai/)

### 1. Clone the repository

```bash
git clone https://github.com/Melvynx/MistratonReview.git
cd MistratonReview
pnpm install
```

### 2. Configure environment variables

```bash
cp .env-template .env
```

Fill in the required values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GITHUB_APP_ID` | Your GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | Your GitHub App private key |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying GitHub webhooks |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `MISTRAL_API_KEY` | Your Mistral AI API key |
| `BETTER_AUTH_SECRET` | Random secret for auth sessions |

### 3. Setup the database

```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

### 4. Run the development server

```bash
pnpm dev
```

### 5. Setup GitHub App

Create a GitHub App with:
- **Webhook URL**: `https://your-domain.com/api/webhooks/github`
- **Permissions**: Pull requests (read/write), Contents (read)
- **Events**: Pull request

## Project Structure

```
app/
  api/
    webhooks/github/     # Webhook receiver for PR events
    github/auth/         # GitHub OAuth callback
  orgs/[orgSlug]/
    setup/               # GitHub App installation setup
    page.tsx             # Dashboard with review history
src/
  lib/
    github.ts            # GitHub API helpers (Octokit, webhook verification, PR comments)
    mistral.ts           # Direct Mistral AI integration
    review-agent.ts      # Agentic review with tool calling
  features/
    github/              # GitHub setup server actions
    landing/             # Marketing landing page
  query/
    github/              # Database queries for GitHub data
prisma/
  schema/
    schema.prisma        # Database models (installations, repos, reviews, comments)
```

## Demo

Live at: [https://mistratonreview.vercel.app](https://mistratonreview.vercel.app)

## Built By

- **Melvyn Malherbe** ([@melvynx](https://github.com/Melvynx))

## License

MIT
