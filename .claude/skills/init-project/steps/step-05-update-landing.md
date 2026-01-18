---
name: step-05-update-landing
description: Update landing page copy using a background agent
prev_step: steps/step-04-update-theme.md
next_step: steps/step-06-setup-env.md
---

# Step 5: Update Landing Page

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER modify component structure - only update copy/text
- ✅ ALWAYS launch a background agent for this task
- 📋 YOU ARE an orchestrator launching a specialized agent
- 💬 FOCUS on delegating the copy update task
- 🚫 FORBIDDEN to block on landing page updates - run in background

## EXECUTION PROTOCOLS:

- 🎯 Launch background agent with full context
- 💾 Agent will update all landing page copy
- 📖 Continue to step 06 without waiting
- 🚫 FORBIDDEN to manually edit landing page files in this step

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
| `{language}` | User's preferred language |
</available_state>

## YOUR TASK:

Launch a background agent to update all landing page copy based on the project information, then immediately proceed to the final step.

---

## EXECUTION SEQUENCE:

### 1. Prepare Agent Context

**Build comprehensive context for the background agent:**

```markdown
# Landing Page Copy Update Task

## Project Context
- **App Name:** {app_name}
- **Purpose:** {app_purpose}
- **Main Features:** {main_features as bullet list}
{if has_prd: '- **PRD Available:** Yes - use it for detailed messaging'}

## Your Task
Update ALL landing page copy to match the new project. This includes:

1. **Hero Section** (`src/features/landing/hero.tsx` or similar)
   - Headline: Compelling hook for {app_name}
   - Subheadline: Clear value proposition
   - CTA button text

2. **Stats Section** (`src/features/landing/stats-section.tsx`)
   - Update stats to be relevant to {app_name}
   - Use realistic placeholder numbers

3. **Features Section** (`src/features/landing/feature-section.tsx`)
   - Replace with actual features from: {main_features}
   - Write compelling descriptions for each

4. **Pain Points Section** (`src/features/landing/pain.tsx`)
   - Update pain points to match target users
   - Make problems feel relatable

5. **Reviews/Testimonials** (all review components)
   - Update with relevant testimonial copy
   - Match reviewer roles to target users

6. **CTA Sections** (`src/features/landing/cta/`)
   - Update all CTA copy
   - Make them action-oriented for {app_name}

7. **FAQ Section** (`app/page.tsx` - FAQ data)
   - Update questions to match {app_name}
   - Write helpful, specific answers

8. **Pricing Section** (if copy needs update)
   - Update plan descriptions if relevant

## Guidelines
- Keep tone professional but approachable
- No emojis in copy (use Lucide icons in code)
- Replace ALL "Threader" references with "{app_name}"
- Make copy specific to the product, not generic
- Use active voice
- Keep sentences concise

## File Locations to Check
- `app/page.tsx` - Main landing page with inline data
- `src/features/landing/` - All landing components
- `src/features/layout/footer.tsx` - Footer content

## Important
- Do NOT change component structure or styling
- Only update text/string content
- Keep TypeScript types intact
- Preserve formatting and indentation
```

### 2. Launch Background Agent

**CRITICAL: Use Task tool with `run_in_background: true`**

```yaml
Task:
  description: "Update landing copy"
  subagent_type: "Snipper"
  run_in_background: true
  prompt: |
    {full context from step 1}

    After updating:
    1. Run `pnpm ts` to verify no TypeScript errors
    2. List all files modified
    3. Summarize the key copy changes made
```

**Store the agent ID for potential follow-up.**

### 3. Notify User

**English:**
```
I've launched a background agent to update the landing page copy.

The agent is working on:
- Hero section with {app_name} messaging
- Features section with your {len(main_features)} features
- Testimonials tailored to your target users
- FAQ with relevant questions
- All CTA sections

This is running in the background - we'll continue with the final step.
You can check on the agent's progress anytime.
```

**French:**
```
J'ai lancé un agent en arrière-plan pour mettre à jour le contenu de la landing page.

L'agent travaille sur :
- Section hero avec le message de {app_name}
- Section features avec vos {len(main_features)} fonctionnalités
- Témoignages adaptés à vos utilisateurs cibles
- FAQ avec des questions pertinentes
- Toutes les sections CTA

Cela s'exécute en arrière-plan - nous continuons avec l'étape finale.
Vous pouvez vérifier la progression de l'agent à tout moment.
```

### 4. Optional: Quick Manual Updates

**If user prefers not to use background agent:**

Use AskUserQuestion:
```yaml
questions:
  - header: "Landing"
    question: "{language=en ? 'How would you like to update the landing page?' : 'Comment voulez-vous mettre à jour la landing page ?'}"
    options:
      - label: "{language=en ? 'Background agent (Recommended)' : 'Agent en arrière-plan (Recommandé)'}"
        description: "{language=en ? 'Agent updates all copy automatically' : 'L\\'agent met à jour tout le contenu automatiquement'}"
      - label: "{language=en ? 'Skip for now' : 'Passer pour l\\'instant'}"
        description: "{language=en ? 'I will update manually later' : 'Je mettrai à jour manuellement plus tard'}"
      - label: "{language=en ? 'Quick essentials only' : 'Essentiels rapides seulement'}"
        description: "{language=en ? 'Only update hero and app name references' : 'Mettre à jour seulement le hero et les références au nom'}"
    multiSelect: false
```

**If "Quick essentials only":**
- Only update hero headline in `app/page.tsx`
- Replace "Threader" → {app_name} globally
- Don't launch background agent

---

## LANDING PAGE FILE REFERENCE

**For the background agent to understand the structure:**

```
app/page.tsx
├── LandingHeader
├── Hero
├── StatsSection
├── BentoGridSection
├── PainSection
├── ReviewTriple (3 reviews inline)
├── ReviewSingle (1 review inline)
├── FeaturesSection (4 features inline)
├── CTAImageSection
├── CTASectionCard
├── CtaSection
├── Pricing
├── FAQSection (7 FAQs inline)
├── ReviewGrid (10 reviews inline)
├── EmailFormSection
└── Footer
```

---

## SUCCESS METRICS:

✅ Background agent launched successfully
✅ Agent received full project context
✅ User notified of background task
✅ Proceeded to step 06 without blocking
✅ (Agent will verify TypeScript after changes)

## FAILURE MODES:

❌ Blocking to wait for agent completion
❌ Manually editing landing files here
❌ Not providing enough context to agent
❌ Forgetting to store agent ID
❌ Launching agent without run_in_background flag

## LANDING PROTOCOLS:

- Background agent handles all copy updates
- This step should complete in seconds (just launch)
- Agent has permission to modify all landing files
- Agent must preserve component structure
- Agent must run TypeScript verification

---

## NEXT STEP:

Immediately after launching background agent, load `./step-06-setup-env.md`

<critical>
Remember: Launch agent and MOVE ON - do not wait for completion!
</critical>
