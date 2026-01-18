---
name: step-06-finalize
description: Final validation and summary of all changes
prev_step: steps/step-05-update-landing.md
next_step: null
---

# Step 6: Finalize

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER skip validation - always run checks
- ✅ ALWAYS provide a complete summary of changes
- 📋 YOU ARE a finalizer and validator
- 💬 FOCUS on verification and next steps
- 🚫 FORBIDDEN to end without actionable guidance

## EXECUTION PROTOCOLS:

- 🎯 Run validation checks (TypeScript, Lint)
- 💾 Compile summary of all changes made
- 📖 Provide clear next steps for user
- 🚫 FORBIDDEN to skip the verification step

## CONTEXT BOUNDARIES:

<available_state>
From all previous steps:

| Variable | Description |
|----------|-------------|
| `{app_name}` | Application name |
| `{app_purpose}` | Main purpose/description |
| `{main_features}` | List of main features |
| `{has_prd}` | Whether PRD was provided |
| `{has_archi}` | Whether architecture doc was provided |
| `{theme_command}` | Theme applied (or null) |
| `{language}` | User's preferred language |
| `{landing_agent_id}` | Background agent ID (if launched) |
</available_state>

## YOUR TASK:

Validate all changes, provide a comprehensive summary, and guide user on next steps.

---

## EXECUTION SEQUENCE:

### 1. Run Validation Checks

**Run these commands to verify project integrity:**

```bash
# TypeScript check
pnpm ts

# Lint check
pnpm lint:ci
```

**Collect results:**
- TypeScript: PASS/FAIL (error count if failed)
- Lint: PASS/FAIL (error count if failed)

### 2. Check Background Agent Status

**If landing page agent was launched:**

```bash
# Check if agent is still running or completed
# Use TaskOutput tool if available
```

**Report status:**
- Still running: "Landing page updates in progress"
- Completed: "Landing page updates complete"
- Failed: "Landing page agent encountered issues"

### 3. Generate Summary

**Compile all changes made across steps:**

---

**English Summary:**

```markdown
# {app_name} - Project Initialization Complete

## What Was Updated

### CLAUDE.md
- Project description added
- {len(main_features)} main features documented
{if has_prd: '- PRD summary included'}
{if has_archi: '- Architecture notes included'}

### Configuration (site-config.ts)
- App name: {app_name}
- App ID: {app_id}
- Description updated
{if domain_changed: '- Production domain configured'}

### Theme (globals.css)
{if theme_command: '- New theme applied from tinte.dev' : '- Theme unchanged (skipped)'}

### Landing Page
- Background agent {status}: updating all copy
- Hero, features, testimonials, FAQ, CTAs

## Validation Results

| Check | Status |
|-------|--------|
| TypeScript | {ts_result} |
| ESLint | {lint_result} |
| Landing Agent | {agent_status} |

## Next Steps

1. **Start dev server:** `pnpm dev`
2. **Review landing page:** Check copy updates at http://localhost:3000
3. **Update remaining content:**
   - Logo and favicon in `/public/`
   - Email templates in `/emails/`
   - Legal pages (privacy, terms)
4. **Set up environment:**
   - Copy `.env.example` to `.env`
   - Configure database, auth, and Stripe
5. **Deploy:**
   - Push to GitHub
   - Deploy to Vercel

## Files Modified

- `CLAUDE.md`
- `src/site-config.ts`
{if theme_applied: '- `app/globals.css`'}
{if landing_updated: '- `app/page.tsx`\n- `src/features/landing/*`'}

---

Your {app_name} project is ready for development!
```

---

**French Summary:**

```markdown
# {app_name} - Initialisation du Projet Terminée

## Ce Qui a Été Mis à Jour

### CLAUDE.md
- Description du projet ajoutée
- {len(main_features)} fonctionnalités principales documentées
{if has_prd: '- Résumé du PRD inclus'}
{if has_archi: '- Notes d\'architecture incluses'}

### Configuration (site-config.ts)
- Nom de l'app : {app_name}
- App ID : {app_id}
- Description mise à jour
{if domain_changed: '- Domaine de production configuré'}

### Thème (globals.css)
{if theme_command: '- Nouveau thème appliqué depuis tinte.dev' : '- Thème inchangé (ignoré)'}

### Landing Page
- Agent en arrière-plan {status} : mise à jour de tout le contenu
- Hero, features, témoignages, FAQ, CTAs

## Résultats de Validation

| Vérification | Statut |
|--------------|--------|
| TypeScript | {ts_result} |
| ESLint | {lint_result} |
| Agent Landing | {agent_status} |

## Prochaines Étapes

1. **Démarrer le serveur dev :** `pnpm dev`
2. **Vérifier la landing page :** Voir les mises à jour sur http://localhost:3000
3. **Mettre à jour le contenu restant :**
   - Logo et favicon dans `/public/`
   - Templates email dans `/emails/`
   - Pages légales (privacy, terms)
4. **Configurer l'environnement :**
   - Copier `.env.example` vers `.env`
   - Configurer database, auth, et Stripe
5. **Déployer :**
   - Push sur GitHub
   - Déployer sur Vercel

## Fichiers Modifiés

- `CLAUDE.md`
- `src/site-config.ts`
{if theme_applied: '- `app/globals.css`'}
{if landing_updated: '- `app/page.tsx`\n- `src/features/landing/*`'}

---

Votre projet {app_name} est prêt pour le développement !
```

### 4. Handle Validation Failures

**If TypeScript fails:**
```
TypeScript errors detected. Run `pnpm ts` to see details.
Common fixes:
- Check site-config.ts for type mismatches
- Verify CLAUDE.md didn't break any imports (unlikely)
```

**If Lint fails:**
```
Lint errors detected. Run `pnpm lint` to auto-fix.
Most lint issues are auto-fixable.
```

### 5. Offer Follow-up Actions

Use AskUserQuestion:
```yaml
questions:
  - header: "Next"
    question: "{language=en ? 'What would you like to do next?' : 'Que voulez-vous faire ensuite ?'}"
    options:
      - label: "{language=en ? 'Start dev server' : 'Démarrer le serveur dev'}"
        description: "{language=en ? 'Run pnpm dev to see changes' : 'Exécuter pnpm dev pour voir les changements'}"
      - label: "{language=en ? 'Check landing agent' : 'Vérifier l\\'agent landing'}"
        description: "{language=en ? 'See background agent status' : 'Voir le statut de l\\'agent en arrière-plan'}"
      - label: "{language=en ? 'Fix validation issues' : 'Corriger les erreurs de validation'}"
        description: "{language=en ? 'Help me fix TypeScript/Lint errors' : 'Aidez-moi à corriger les erreurs TypeScript/Lint'}"
      - label: "{language=en ? 'All done!' : 'Tout est bon !'}"
        description: "{language=en ? 'End initialization workflow' : 'Terminer le workflow d\\'initialisation'}"
    multiSelect: false
```

**Handle response:**

- **Start dev server:** Run `pnpm dev` and report URL
- **Check landing agent:** Use TaskOutput to check agent status
- **Fix validation:** Help user fix any errors
- **All done:** End workflow with encouragement

---

## SUCCESS METRICS:

✅ TypeScript validation run
✅ Lint validation run
✅ Background agent status checked
✅ Comprehensive summary provided
✅ Next steps clearly listed
✅ Files modified documented
✅ User offered follow-up actions

## FAILURE MODES:

❌ Skipping validation checks
❌ Providing vague summary
❌ Not listing modified files
❌ Missing next steps
❌ Ending without offering help

## FINALIZATION PROTOCOLS:

- Always run both ts and lint checks
- Be honest about failures - help fix them
- Make summary scannable with clear sections
- Next steps should be actionable, not vague
- End on a positive, encouraging note

---

## WORKFLOW COMPLETE

This is the final step. After user confirms completion or chooses a follow-up action, the workflow ends.

<critical>
Remember: Validation is not optional - always verify the project compiles!
</critical>
