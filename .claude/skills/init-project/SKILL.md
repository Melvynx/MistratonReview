---
name: init-project
description: Initialize NowTS project with app name, purpose, theme, and landing page content
argument-hint: "[app-name]"
---

# Init Project - NowTS Initialization Workflow

<objective>
Initialize a NowTS project by gathering project information, updating CLAUDE.md, configuring app settings, applying a theme from tinte.dev, and customizing the landing page copy.
</objective>

<when_to_use>
Use this workflow when:
- Starting a new project based on NowTS
- Reconfiguring an existing NowTS project with new branding
- Setting up project documentation and configuration from scratch
</when_to_use>

<parameters>
**Arguments:**
- `[app-name]` - Optional app name to skip the first question

**No flags** - This workflow is fully interactive to gather all necessary information.
</parameters>

<state_variables>
**Persist throughout all steps:**

| Variable | Type | Description |
|----------|------|-------------|
| `{app_name}` | string | Application name |
| `{app_purpose}` | string | Main purpose/description of the app |
| `{main_features}` | list | List of main features |
| `{has_prd}` | boolean | Whether user provided a PRD |
| `{prd_content}` | string | PRD content if provided |
| `{has_archi}` | boolean | Whether user provided architecture doc |
| `{archi_content}` | string | Architecture content if provided |
| `{theme_command}` | string | tinte.dev CLI command for theme |
| `{language}` | string | Detected user language (en/fr) |
| `{repo_url}` | string | New GitHub repository URL (if created) |
</state_variables>

<entry_point>
Load `steps/step-00-init.md`
</entry_point>

<step_files>
| Step | File | Purpose |
|------|------|---------|
| 00 | `step-00-init.md` | Initialize workflow, detect language, parse arguments |
| 01 | `step-01-gather-info.md` | Gather all project information via questions |
| 02 | `step-02-update-claude-md.md` | Update CLAUDE.md with project info |
| 03 | `step-03-update-config.md` | Update site-config.ts and other config files |
| 04 | `step-04-update-theme.md` | Apply theme from tinte.dev |
| 05 | `step-05-update-landing.md` | Update landing page copy (background agent) |
| 06 | `step-06-setup-env.md` | Setup .env with guided variable configuration |
| 07 | `step-07-finalize.md` | Final validation and summary |

</step_files>

<workflow_diagram>
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Step 00     │───►│  Step 01     │───►│  Step 02     │
│  Initialize  │    │  Gather Info │    │  CLAUDE.md   │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
       ┌───────────────────────────────────────┘
       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Step 03     │───►│  Step 04     │───►│  Step 05     │
│  Config      │    │  Theme       │    │  Landing     │
└──────────────┘    └──────────────┘    │ (background) │
                                        └──────────────┘
                                               │
       ┌───────────────────────────────────────┘
       ▼
┌──────────────┐    ┌──────────────┐
│  Step 06     │───►│  Step 07     │
│  Setup .env  │    │  Finalize    │
└──────────────┘    └──────────────┘
```
</workflow_diagram>

<important_files>
**Files that will be modified:**

| File | Changes |
|------|---------|
| `CLAUDE.md` | Project description, features, goals |
| `src/site-config.ts` | App name, description, URLs, branding |
| `app/globals.css` | Theme colors from tinte.dev |
| `app/page.tsx` | Landing page structure (if needed) |
| `src/features/landing/*` | Landing page components copy |
| `.env` | Environment variables (created from .env-template) |
</important_files>
