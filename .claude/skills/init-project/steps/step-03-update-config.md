---
name: step-03-update-config
description: Update site-config.ts and other configuration files
prev_step: steps/step-02-update-claude-md.md
next_step: steps/step-04-update-theme.md
---

# Step 3: Update Configuration Files

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER change TypeScript types or export structure
- ✅ ALWAYS read config files before editing
- 📋 YOU ARE a configuration updater, not a restructurer
- 💬 FOCUS on updating values, not adding new fields
- 🚫 FORBIDDEN to break existing imports or types

## EXECUTION PROTOCOLS:

- 🎯 Read each config file before making changes
- 💾 Update only the relevant values
- 📖 Preserve code style and formatting
- 🚫 FORBIDDEN to add fields that don't exist in the original

## CONTEXT BOUNDARIES:

<available_state>
From previous steps:

| Variable | Description |
|----------|-------------|
| `{app_name}` | Application name |
| `{app_purpose}` | Main purpose/description |
| `{language}` | User's preferred language |
</available_state>

## YOUR TASK:

Update site-config.ts with the new application name, description, and branding information.

---

## EXECUTION SEQUENCE:

### 1. Read Current Configuration

```bash
Read: /Users/melvynx/Developer/indie/nowts/src/site-config.ts
```

**Current structure to understand:**
```typescript
export const SiteConfig = {
  title: "NOW.TS",
  description: "...",
  prodUrl: "https://demo.nowts.app",
  appId: "nowts",
  domain: "demo.nowts.app",
  // ... other fields
};
```

### 2. Prepare New Values

**Based on `{app_name}` and `{app_purpose}`:**

| Field | New Value | Notes |
|-------|-----------|-------|
| `title` | `{app_name}` | App name as-is |
| `description` | `{app_purpose}` (first sentence) | Keep under 160 chars |
| `appId` | `{app_name.toLowerCase().replace(/\s+/g, '-')}` | Kebab-case |

**Ask user for additional info:**

Use AskUserQuestion:
```yaml
questions:
  - header: "Domain"
    question: "{language=en ? 'What will be your production domain?' : 'Quel sera votre domaine de production ?'}"
    options:
      - label: "{language=en ? 'I have a domain' : 'J\\'ai un domaine'}"
        description: "{language=en ? 'I will enter my domain' : 'Je vais entrer mon domaine'}"
      - label: "{language=en ? 'Keep demo domain for now' : 'Garder le domaine demo pour l\\'instant'}"
        description: "{language=en ? 'Will update later' : 'Je mettrai à jour plus tard'}"
    multiSelect: false
```

**If user has domain:**
- Ask for domain (e.g., "myapp.com")
- Set `prodUrl` = `https://{domain}`
- Set `domain` = `{domain}`

**If keeping demo:**
- Keep current values

### 3. Edit site-config.ts

**Use Edit tool to update values:**

```typescript
// Example edit for title
old_string: title: "NOW.TS",
new_string: title: "{app_name}",
```

```typescript
// Example edit for description
old_string: description: "Collect and showcase powerful video and text testimonials",
new_string: description: "{truncated_app_purpose}",
```

```typescript
// Example edit for appId
old_string: appId: "nowts",
new_string: appId: "{kebab_app_id}",
```

**If domain provided:**
```typescript
old_string: prodUrl: "https://demo.nowts.app",
new_string: prodUrl: "https://{user_domain}",

old_string: domain: "demo.nowts.app",
new_string: domain: "{user_domain}",
```

### 4. Update Company Information (Optional)

Use AskUserQuestion:
```yaml
questions:
  - header: "Company"
    question: "{language=en ? 'Do you want to update company information?' : 'Voulez-vous mettre à jour les informations de l\\'entreprise ?'}"
    options:
      - label: "{language=en ? 'Yes, update company info' : 'Oui, mettre à jour'}"
        description: "{language=en ? 'I will provide company details' : 'Je vais fournir les détails'}"
      - label: "{language=en ? 'Skip for now (Recommended)' : 'Passer pour l\\'instant (Recommandé)'}"
        description: "{language=en ? 'Keep default values' : 'Garder les valeurs par défaut'}"
    multiSelect: false
```

**If updating:**
- Ask for company name
- Ask for company address
- Update the `company` object in config

### 5. Verify TypeScript

After edits, verify no TypeScript errors:

```bash
pnpm ts
```

**If errors occur:**
- Identify the issue
- Fix the edit
- Re-run verification

### 6. Report Changes

**English:**
```
Configuration updated:

**site-config.ts:**
- title: {old} → {new}
- description: updated
- appId: {old} → {new}
{if domain_changed: '- domain: {old} → {new}'}
{if company_changed: '- company info: updated'}

TypeScript verification: {passed/failed}
```

**French:**
```
Configuration mise à jour :

**site-config.ts:**
- title: {old} → {new}
- description: mis à jour
- appId: {old} → {new}
{if domain_changed: '- domain: {old} → {new}'}
{if company_changed: '- infos entreprise: mises à jour'}

Vérification TypeScript : {passed/failed}
```

---

## ADDITIONAL CONFIG FILES

**If any of these need updates based on project info, handle them:**

### package.json (name field only)
```json
{
  "name": "{kebab_app_id}",
  ...
}
```

### .env.example (if it exists)
- Update example values with app-specific placeholders
- Do NOT update actual .env files (security)

---

## SUCCESS METRICS:

✅ site-config.ts read before editing
✅ title updated to app name
✅ description updated (under 160 chars)
✅ appId updated to kebab-case
✅ Domain updated (if provided)
✅ TypeScript verification passes
✅ No structural changes to config
✅ User informed of changes

## FAILURE MODES:

❌ Changing config structure or types
❌ Breaking TypeScript compilation
❌ Description too long (>160 chars)
❌ Invalid appId format
❌ Editing .env files with secrets
❌ Not verifying TypeScript after changes

## CONFIGURATION PROTOCOLS:

- Keep description under 160 characters for SEO
- appId must be valid: lowercase, no spaces, alphanumeric + hyphens
- Domain should not include protocol (https://)
- Always verify TypeScript compiles after changes

---

## NEXT STEP:

After configuration is updated and verified, load `./step-04-update-theme.md`

<critical>
Remember: Only UPDATE values - never change structure or add new fields!
</critical>
