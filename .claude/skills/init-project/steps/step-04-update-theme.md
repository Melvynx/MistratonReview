---
name: step-04-update-theme
description: Apply theme from tinte.dev using the CLI command
prev_step: steps/step-03-update-config.md
next_step: steps/step-05-update-landing.md
---

# Step 4: Update Theme

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER modify globals.css manually - use the CLI command
- ✅ ALWAYS run the exact command user provided from tinte.dev
- 📋 YOU ARE a theme installer using shadcn CLI
- 💬 FOCUS on running the command and verifying results
- 🚫 FORBIDDEN to guess or construct theme URLs

## EXECUTION PROTOCOLS:

- 🎯 Use the exact CLI command from tinte.dev
- 💾 Run the command with automatic overwrite flag
- 📖 Verify theme was applied correctly
- 🚫 FORBIDDEN to manually edit CSS variables

## CONTEXT BOUNDARIES:

<available_state>
From previous steps:

| Variable | Description |
|----------|-------------|
| `{theme_command}` | tinte.dev CLI command (e.g., `npx shadcn@latest add https://www.tinte.dev/r/mono`) |
| `{language}` | User's preferred language |
</available_state>

## YOUR TASK:

Run the tinte.dev CLI command to apply the theme, then verify the changes.

---

## EXECUTION SEQUENCE:

### 1. Check if Theme Was Provided

**If `{theme_command}` is null or "skip":**
- Skip this step entirely
- Report to user that theme was skipped
- Proceed to step 05

**If theme command provided:**
- Continue with theme installation

### 2. Validate Command Format

**Expected format:**
```bash
npx shadcn@latest add https://www.tinte.dev/r/{theme-name}
```

**Examples of valid commands:**
- `npx shadcn@latest add https://www.tinte.dev/r/mono`
- `npx shadcn@latest add https://www.tinte.dev/r/catppuccin-mocha`
- `npx shadcn@latest add https://www.tinte.dev/r/rose-pine`

**If command doesn't match pattern:**
- Ask user to verify the command
- They should copy it directly from tinte.dev

### 3. Run the Theme Command

**Execute the command with automatic overwrite:**

```bash
{theme_command} --overwrite
```

**The `--overwrite` flag ensures:**
- Existing theme in globals.css gets replaced
- No interactive prompts asking for confirmation

**Example:**
```bash
npx shadcn@latest add https://www.tinte.dev/r/mono --overwrite
```

**Wait for command to complete.**

### 4. Handle Command Output

**If successful:**
- Command will update `app/globals.css` with new theme variables
- May also update some component files if theme includes them

**If failed:**
- Check error message
- Common issues:
  - Network error: Ask user to try again
  - Invalid URL: Ask user to verify URL from tinte.dev
  - Permission error: Check file permissions

### 5. Verify Theme Applied

**Read globals.css to confirm changes:**

```bash
Read: /Users/melvynx/Developer/indie/nowts/app/globals.css
```

**Look for theme-specific indicators:**
- New color values in `:root` and `.dark` sections
- Theme name may appear in comments

**Run TypeScript check:**
```bash
pnpm ts
```

### 6. Report Results

**English:**
```
Theme applied successfully!

**Command executed:**
{theme_command} --overwrite

**Changes:**
- `app/globals.css` updated with new theme colors
- Light and dark mode colors configured

**Verify visually:**
Run `pnpm dev` and check http://localhost:3000

If you don't like the theme, you can run another tinte.dev command to change it.
```

**French:**
```
Thème appliqué avec succès !

**Commande exécutée:**
{theme_command} --overwrite

**Changements:**
- `app/globals.css` mis à jour avec les nouvelles couleurs
- Couleurs mode clair et sombre configurées

**Vérifier visuellement:**
Lancez `pnpm dev` et vérifiez http://localhost:3000

Si le thème ne vous plaît pas, vous pouvez exécuter une autre commande tinte.dev pour le changer.
```

---

## HANDLING EDGE CASES

### If command fails with network error:

Use AskUserQuestion:
```yaml
questions:
  - header: "Retry"
    question: "{language=en ? 'Theme installation failed (network error). What would you like to do?' : 'Installation du thème échouée (erreur réseau). Que voulez-vous faire ?'}"
    options:
      - label: "{language=en ? 'Retry (Recommended)' : 'Réessayer (Recommandé)'}"
        description: "{language=en ? 'Try running the command again' : 'Essayer d\\'exécuter la commande à nouveau'}"
      - label: "{language=en ? 'Skip theme' : 'Passer le thème'}"
        description: "{language=en ? 'Continue without theme change' : 'Continuer sans changer le thème'}"
    multiSelect: false
```

### If command fails with invalid URL:

```
The theme URL appears to be invalid.

Please go to https://www.tinte.dev and:
1. Choose a theme you like
2. Click the "Copy" button to get the CLI command
3. Paste it here

The command should look like:
npx shadcn@latest add https://www.tinte.dev/r/theme-name
```

### If user wants to change theme later:

```
You can change the theme anytime by running:
npx shadcn@latest add https://www.tinte.dev/r/{new-theme} --overwrite

Browse themes at https://www.tinte.dev
```

---

## SUCCESS METRICS:

✅ Theme command validated
✅ Command executed with --overwrite flag
✅ globals.css updated with new theme
✅ TypeScript verification passes
✅ User informed of changes
✅ Instructions for changing theme provided

## FAILURE MODES:

❌ Manually editing CSS instead of using CLI
❌ Running command without --overwrite (causes prompts)
❌ Not validating command format
❌ Not handling network failures gracefully
❌ Forgetting to verify TypeScript after changes

## THEME PROTOCOLS:

- Always use `--overwrite` flag to avoid interactive prompts
- The CLI command handles all CSS updates automatically
- tinte.dev themes are designed for shadcn/ui compatibility
- User can run multiple theme commands to try different themes

---

## NEXT STEP:

After theme is applied (or skipped), load `./step-05-update-landing.md`

<critical>
Remember: Use the CLI command directly - don't manually edit CSS!
</critical>
