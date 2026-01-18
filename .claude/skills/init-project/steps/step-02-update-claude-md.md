---
name: step-02-update-claude-md
description: Update CLAUDE.md with project information
prev_step: steps/step-01-gather-info.md
next_step: steps/step-03-update-config.md
---

# Step 2: Update CLAUDE.md

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER delete existing CLAUDE.md content - only update the "About the project" section
- ✅ ALWAYS read CLAUDE.md first before editing
- 📋 YOU ARE a documentation writer, not a code implementer
- 💬 FOCUS on clear, concise project documentation
- 🚫 FORBIDDEN to modify any section except "About the project"

## EXECUTION PROTOCOLS:

- 🎯 Read existing CLAUDE.md to understand structure
- 💾 Edit only the designated section
- 📖 Preserve all existing rules and conventions
- 🚫 FORBIDDEN to add sections that don't fit the existing format

## CONTEXT BOUNDARIES:

<available_state>
From previous steps:

| Variable | Description |
|----------|-------------|
| `{app_name}` | Application name |
| `{app_purpose}` | Main purpose/description |
| `{main_features}` | List of main features |
| `{has_prd}` | Whether PRD was provided |
| `{prd_content}` | PRD content (if provided) |
| `{has_archi}` | Whether architecture doc was provided |
| `{archi_content}` | Architecture content (if provided) |
| `{language}` | User's preferred language |
</available_state>

## YOUR TASK:

Update the "About the project" section in CLAUDE.md with comprehensive project information based on gathered data.

---

## EXECUTION SEQUENCE:

### 1. Read Current CLAUDE.md

```bash
# Read the file first
Read: /Users/melvynx/Developer/indie/nowts/CLAUDE.md
```

**Identify the section to update:**
```markdown
## About the project <NAME>

If you read this, ask question about the project to fill this part...
```

### 2. Generate Project Documentation

**Create the new "About the project" section content:**

```markdown
## About the project {app_name}

{app_purpose}

### Main Features

{For each feature in main_features:}
- **{Feature Title}**: {Brief description}

### Goals

{Extract 2-3 key goals from app_purpose and features}

### Target Users

{Infer from app_purpose who the target users are}
```

**If PRD was provided (`{has_prd}` = true):**
Add a section with key insights:

```markdown
### Product Requirements Summary

{Extract key points from {prd_content}:}
- Core user stories
- Key success metrics
- Priority features
```

**If Architecture was provided (`{has_archi}` = true):**
Add a section with architecture overview:

```markdown
### Architecture Notes

{Extract key points from {archi_content}:}
- Key architectural decisions
- Important integrations
- Data flow overview
```

### 3. Edit CLAUDE.md

**Use the Edit tool to replace ONLY the "About the project" section:**

```
Edit file: CLAUDE.md
old_string: ## About the project <NAME>

If you read this, ask question about the project to fill this part. You need to describe what is the purpose of the project, main feature and goals.

new_string: {generated content from step 2}
```

**CRITICAL: Do NOT touch any other section of CLAUDE.md!**

### 4. Verify Changes

After editing, read the file again to confirm:
- Only "About the project" section changed
- All other sections intact
- No formatting issues

### 5. Report to User

**English:**
```
CLAUDE.md has been updated with your project information:

- Project name: {app_name}
- Purpose documented
- {len(main_features)} main features listed
{if has_prd: '- PRD summary included'}
{if has_archi: '- Architecture notes included'}

The AI agents will now have full context about your project.
```

**French:**
```
CLAUDE.md a été mis à jour avec les informations de votre projet :

- Nom du projet : {app_name}
- Objectif documenté
- {len(main_features)} fonctionnalités principales listées
{if has_prd: '- Résumé du PRD inclus'}
{if has_archi: '- Notes d\'architecture incluses'}

Les agents IA auront maintenant le contexte complet de votre projet.
```

---

## EXAMPLE OUTPUT

For an app named "TaskFlow" with purpose "A task management app for remote teams":

```markdown
## About the project TaskFlow

TaskFlow is a task management application designed specifically for remote teams. It helps distributed teams stay organized, track progress, and collaborate effectively across different time zones.

### Main Features

- **Task Board**: Kanban-style board with drag-and-drop task management
- **Team Collaboration**: Real-time updates and comments on tasks
- **Time Tracking**: Built-in time tracking for each task
- **Analytics Dashboard**: Team productivity metrics and insights
- **Integrations**: Connect with Slack, GitHub, and other tools

### Goals

1. Simplify task management for distributed teams
2. Improve visibility into team workload and progress
3. Reduce context-switching by centralizing work

### Target Users

- Remote teams (5-50 people)
- Project managers
- Freelancers working with multiple clients
```

---

## SUCCESS METRICS:

✅ CLAUDE.md read before editing
✅ Only "About the project" section modified
✅ Project name correctly inserted
✅ Purpose clearly documented
✅ All main features listed with descriptions
✅ PRD summary added (if provided)
✅ Architecture notes added (if provided)
✅ User notified of changes
✅ All other sections remain unchanged

## FAILURE MODES:

❌ Deleting or modifying other sections
❌ Not reading file before editing
❌ Creating malformed markdown
❌ Missing any provided information
❌ Generic/vague descriptions instead of specific details

## DOCUMENTATION PROTOCOLS:

- Keep descriptions concise but specific
- Use active voice ("helps teams track" not "teams can track")
- Avoid jargon unless it's domain-specific
- Make it useful for AI agents to understand the project

---

## NEXT STEP:

After CLAUDE.md is updated and verified, load `./step-03-update-config.md`

<critical>
Remember: ONLY modify the "About the project" section - preserve everything else!
</critical>
