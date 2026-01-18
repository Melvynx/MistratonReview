---
name: step-00-init
description: Initialize workflow - detect language, parse arguments, prepare state
next_step: steps/step-01-gather-info.md
---

# Step 0: Initialization

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER skip language detection
- ✅ ALWAYS detect user language from their first message
- 📋 YOU ARE an initializer, not a questioner yet
- 💬 FOCUS on setup only - questions come in step 01
- 🚫 FORBIDDEN to start gathering info before init is complete

## EXECUTION PROTOCOLS:

- 🎯 Detect language first, then parse any arguments
- 💾 Store detected language for all future communications
- 📖 Complete initialization before loading step 01
- 🚫 FORBIDDEN to load step-01 until language is detected

## CONTEXT BOUNDARIES:

- This is the first step - no previous context exists
- User may have provided an app name as argument
- Adapt all future communications to detected language

## YOUR TASK:

Initialize the workflow by detecting user language and parsing any provided arguments.

---

## INITIALIZATION SEQUENCE:

### 1. Detect User Language

**Analyze the user's message to determine their preferred language:**

- If message is in French → `{language}` = "fr"
- If message is in English → `{language}` = "en"
- If unclear → Default to "en"

**Store this for all future communications.**

### 2. Parse Arguments

**Check if user provided an app name:**

```
Input: /init-project MyApp
→ {app_name} = "MyApp"

Input: /init-project
→ {app_name} = null (will be asked in step 01)
```

### 3. Initialize State Variables

```yaml
app_name: {parsed or null}
app_purpose: null
main_features: []
has_prd: false
prd_content: null
has_archi: false
archi_content: null
theme_command: null
language: {detected}
```

### 4. Greet User

**In detected language, provide a brief welcome:**

**English:**
```
I'll help you initialize your NowTS project. This workflow will:

1. Gather project information
2. Update CLAUDE.md with project details
3. Configure app settings (site-config.ts)
4. Apply your chosen theme
5. Update landing page copy

Let's get started!
```

**French:**
```
Je vais vous aider à initialiser votre projet NowTS. Ce workflow va :

1. Collecter les informations du projet
2. Mettre à jour CLAUDE.md avec les détails
3. Configurer les paramètres (site-config.ts)
4. Appliquer le thème choisi
5. Mettre à jour le contenu de la landing page

C'est parti !
```

---

## SUCCESS METRICS:

✅ User language correctly detected
✅ Arguments parsed (if provided)
✅ State variables initialized
✅ User greeted in their language
✅ Ready to proceed to step 01

## FAILURE MODES:

❌ Skipping language detection
❌ Starting to ask questions in this step
❌ Not initializing all state variables
❌ Proceeding without greeting

## INITIALIZATION PROTOCOLS:

- Keep greeting concise - don't overwhelm user
- If app name provided, acknowledge it
- Set positive tone for the workflow

---

## NEXT STEP:

After initialization, immediately load `./step-01-gather-info.md`

<critical>
Remember: Init is ONLY about setup - all questions happen in step 01!
</critical>
