---
name: step-01-gather-info
description: Gather all project information through sequential questions
prev_step: steps/step-00-init.md
next_step: steps/step-02-update-claude-md.md
---

# Step 1: Gather Project Information

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER ask all questions at once - ask ONE question at a time
- ✅ ALWAYS use AskUserQuestion tool for structured questions
- 📋 YOU ARE an interviewer gathering project details
- 💬 FOCUS on understanding the project deeply
- 🚫 FORBIDDEN to proceed without all required info

## EXECUTION PROTOCOLS:

- 🎯 Ask questions in sequence, wait for each answer
- 💾 Store each answer before proceeding to next question
- 📖 Complete ALL questions before loading step 02
- 🚫 FORBIDDEN to skip optional questions without asking

## CONTEXT BOUNDARIES:

- From step 00: `{language}`, `{app_name}` (may be null)
- User language determines question language
- PRD and ARCHI are optional - user may skip

## YOUR TASK:

Gather project information through a series of questions: app name, purpose, PRD, architecture doc, and theme preference.

---

## QUESTION SEQUENCE:

### Question 1: App Name (if not provided)

**Skip if `{app_name}` already set from arguments.**

Use AskUserQuestion:
```yaml
questions:
  - header: "App Name"
    question: "{language=en ? 'What is the name of your application?' : 'Quel est le nom de votre application ?'}"
    options:
      - label: "Enter name"
        description: "I'll type the app name"
    multiSelect: false
```

**Store response as `{app_name}`**

---

### Question 2: App Purpose

Ask user to describe the main purpose:

**English prompt:**
```
What is the main purpose of {app_name}?

Describe in 1-3 sentences what problem it solves and who it's for.
Example: "A SaaS platform that helps freelancers track time and invoice clients automatically."
```

**French prompt:**
```
Quel est l'objectif principal de {app_name} ?

Décrivez en 1-3 phrases le problème qu'il résout et pour qui.
Exemple : "Une plateforme SaaS qui aide les freelances à suivre leur temps et facturer automatiquement."
```

**Store response as `{app_purpose}`**

---

### Question 3: Main Features

Ask user to list 3-5 main features:

**English prompt:**
```
What are the 3-5 main features of {app_name}?

List them one per line, for example:
- User authentication with social login
- Dashboard with analytics
- Team collaboration
- Billing and subscriptions
```

**French prompt:**
```
Quelles sont les 3-5 fonctionnalités principales de {app_name} ?

Listez-les une par ligne, par exemple :
- Authentification avec login social
- Dashboard avec analytics
- Collaboration d'équipe
- Facturation et abonnements
```

**Store response as `{main_features}` (parse into list)**

---

### Question 4: PRD Document

Use AskUserQuestion:
```yaml
questions:
  - header: "PRD"
    question: "{language=en ? 'Do you have a PRD (Product Requirements Document) to share?' : 'Avez-vous un PRD (Product Requirements Document) à partager ?'}"
    options:
      - label: "{language=en ? 'Yes, I have a PRD' : 'Oui, j\\'ai un PRD'}"
        description: "{language=en ? 'I will paste the PRD content' : 'Je vais coller le contenu du PRD'}"
      - label: "{language=en ? 'No PRD' : 'Pas de PRD'}"
        description: "{language=en ? 'Continue without PRD' : 'Continuer sans PRD'}"
    multiSelect: false
```

**If "Yes":**
- Ask user to paste PRD content
- Store as `{prd_content}`
- Set `{has_prd}` = true

**If "No":**
- Set `{has_prd}` = false

---

### Question 5: Architecture Document

Use AskUserQuestion:
```yaml
questions:
  - header: "ARCHI"
    question: "{language=en ? 'Do you have an architecture document to share?' : 'Avez-vous un document d\\'architecture à partager ?'}"
    options:
      - label: "{language=en ? 'Yes, I have architecture docs' : 'Oui, j\\'ai des docs d\\'architecture'}"
        description: "{language=en ? 'I will paste the architecture content' : 'Je vais coller le contenu de l\\'architecture'}"
      - label: "{language=en ? 'No architecture doc' : 'Pas de doc d\\'architecture'}"
        description: "{language=en ? 'Continue without architecture doc' : 'Continuer sans doc d\\'architecture'}"
    multiSelect: false
```

**If "Yes":**
- Ask user to paste architecture content
- Store as `{archi_content}`
- Set `{has_archi}` = true

**If "No":**
- Set `{has_archi}` = false

---

### Question 6: Theme Selection

**English prompt:**
```
Time to choose a theme for {app_name}!

1. Go to https://tinte.dev
2. Browse themes and find one you like
3. Copy the CLI command (e.g., `npx shadcn@latest add https://tinte.dev/t/...`)
4. Paste it here

Or type "skip" to keep the current theme.
```

**French prompt:**
```
Choisissons un thème pour {app_name} !

1. Allez sur https://tinte.dev
2. Parcourez les thèmes et trouvez-en un qui vous plaît
3. Copiez la commande CLI (ex: `npx shadcn@latest add https://tinte.dev/t/...`)
4. Collez-la ici

Ou tapez "skip" pour garder le thème actuel.
```

**Store response as `{theme_command}` (or null if skipped)**

---

## SUMMARY BEFORE PROCEEDING

After all questions, present a summary:

**English:**
```
Here's what I've gathered:

**App Name:** {app_name}
**Purpose:** {app_purpose}
**Main Features:**
{main_features formatted as bullet list}

**PRD:** {has_prd ? 'Provided' : 'Not provided'}
**Architecture:** {has_archi ? 'Provided' : 'Not provided'}
**Theme:** {theme_command ? 'Will apply: ' + theme_command : 'Keep current'}

Ready to proceed with the configuration?
```

**French:**
```
Voici ce que j'ai collecté :

**Nom de l'app:** {app_name}
**Objectif:** {app_purpose}
**Fonctionnalités principales:**
{main_features formatted as bullet list}

**PRD:** {has_prd ? 'Fourni' : 'Non fourni'}
**Architecture:** {has_archi ? 'Fournie' : 'Non fournie'}
**Thème:** {theme_command ? 'À appliquer: ' + theme_command : 'Garder l\\'actuel'}

Prêt à procéder à la configuration ?
```

Use AskUserQuestion:
```yaml
questions:
  - header: "Confirm"
    question: "{language=en ? 'Is this information correct?' : 'Ces informations sont-elles correctes ?'}"
    options:
      - label: "{language=en ? 'Yes, proceed (Recommended)' : 'Oui, continuer (Recommandé)'}"
        description: "{language=en ? 'Start configuring the project' : 'Commencer la configuration'}"
      - label: "{language=en ? 'No, let me correct' : 'Non, je veux corriger'}"
        description: "{language=en ? 'Go back to fix information' : 'Revenir pour corriger'}"
    multiSelect: false
```

---

## SUCCESS METRICS:

✅ App name collected (from args or question)
✅ App purpose clearly defined
✅ Main features listed (3-5 items)
✅ PRD status determined (with content if provided)
✅ Architecture status determined (with content if provided)
✅ Theme command collected or skipped
✅ User confirmed summary

## FAILURE MODES:

❌ Asking all questions at once
❌ Not using AskUserQuestion for structured choices
❌ Proceeding without user confirmation
❌ Missing any required field (name, purpose, features)
❌ Not adapting language to user preference

## GATHERING PROTOCOLS:

- Be patient - let user take time to answer
- If answer is vague, ask follow-up for clarity
- Accept "skip" for optional items (PRD, ARCHI, theme)
- Validate theme command format before storing

---

## NEXT STEP:

After user confirms summary, load `./step-02-update-claude-md.md`

<critical>
Remember: Ask ONE question at a time and WAIT for response before next question!
</critical>
