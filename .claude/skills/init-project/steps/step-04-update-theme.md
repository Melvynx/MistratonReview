---
name: step-04-update-theme
description: Apply theme from tinte.dev using the CLI command
prev_step: steps/step-03-update-config.md
next_step: steps/step-05-update-landing.md
---

# Step 4: Update Theme

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER lose NOWTS custom CSS (success, warning, info colors)
- ✅ ALWAYS use `git diff` after applying theme to check for lost data
- ✅ ALWAYS restore any deleted NOWTS custom CSS
- 📋 YOU ARE a theme installer with data preservation responsibility
- 💬 FOCUS on applying theme while preserving custom styles
- 🚫 FORBIDDEN to skip the git diff verification step

## EXECUTION PROTOCOLS:

- 🎯 Run the theme command with --overwrite flag
- 💾 Use `git diff app/globals.css` to check what changed
- 📖 Look for deleted lines containing NOWTS, --success, --warning, --info
- 🚫 FORBIDDEN to proceed if critical data was deleted without restoring it

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

### 5. VERIFY NO DATA LOST WITH GIT DIFF (CRITICAL)

**Immediately after theme is applied, use git diff to check what changed:**

```bash
git diff app/globals.css
```

**Look for deleted lines (lines starting with `-`) containing:**

| Critical Content | If Deleted |
|------------------|------------|
| `/* NOWTS */` | Must restore NOWTS custom colors |
| `--success:` | Must restore success color |
| `--warning:` | Must restore warning color |
| `--info:` | Must restore info color |
| `@layer base` | Must restore base layer styles |
| `#nprogress` | Must restore NProgress styles |

**IF ANY CRITICAL DATA WAS DELETED:**

1. **Get the deleted content from git:**
```bash
git diff app/globals.css | grep "^-" | grep -E "(NOWTS|--success|--warning|--info|@layer base|nprogress)"
```

2. **Manually add back the missing sections:**

   **NOWTS colors for `:root`** (add before closing `}` of `:root`):
   ```css
   /* NOWTS */
   --success: hsl(151 55% 41%);
   --success-foreground: hsl(137 72% 94%);
   --warning: hsl(24 94% 50%);
   --warning-foreground: hsl(24 97% 93%);
   --info: hsl(221.2 83.2% 53.3%);
   --info-foreground: hsl(210 40% 98%);
   ```

   **NOWTS colors for `.dark`** (add before closing `}` of `.dark`):
   ```css
   /* NOWTS */
   --success: hsl(151deg 55% 41.5%);
   --success-foreground: hsl(137 72% 94%);
   --warning: hsl(24deg 94% 50%);
   --warning-foreground: hsl(24deg 97% 93.2%);
   --info: hsl(217.2 91.2% 59.8%);
   --info-foreground: hsl(222.2 47.4% 11.2%);
   ```

3. **If too much was lost, REVERT entirely:**
```bash
git checkout app/globals.css
```

Then inform user the theme was not applied to preserve customizations.

### 6. Run TypeScript Check

**Verify no TypeScript errors:**
```bash
pnpm ts
```

### 7. Report Results

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

✅ Theme command validated and executed
✅ `git diff app/globals.css` run to check changes
✅ No NOWTS custom colors deleted (or restored if deleted)
✅ No @layer base styles deleted (or restored if deleted)
✅ TypeScript verification passes

## FAILURE MODES:

❌ Not running git diff after theme application
❌ Ignoring deleted NOWTS custom colors in diff
❌ Ignoring deleted @layer base styles in diff
❌ Proceeding without restoring lost data

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
