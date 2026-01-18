---
name: step-06-setup-env
description: Setup environment variables by copying template and filling values
prev_step: steps/step-05-update-landing.md
next_step: steps/step-07-finalize.md
---

# Step 6: Setup Environment Variables

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER commit .env file to git
- ✅ ALWAYS explain how to get each env variable
- 📋 YOU ARE an environment setup assistant
- 💬 FOCUS on one env variable at a time
- 🚫 FORBIDDEN to store sensitive values in logs or output

## EXECUTION PROTOCOLS:

- 🎯 Copy .env-template to .env first
- 💾 Ask for each env var one by one
- 📖 Explain how to obtain each value
- 🚫 FORBIDDEN to skip the "how to get" explanation

## CONTEXT BOUNDARIES:

<available_state>
From previous steps:

| Variable | Description |
|----------|-------------|
| `{app_name}` | Application name |
| `{language}` | User's preferred language |
</available_state>

## YOUR TASK:

Copy .env-template to .env, then guide user through setting up each environment variable with clear instructions on how to obtain each value.

---

## EXECUTION SEQUENCE:

### 1. Check if .env Already Exists

```bash
ls -la .env 2>/dev/null
```

**If .env exists:**

Use AskUserQuestion:
```yaml
questions:
  - header: "Env"
    question: "{language=en ? '.env file already exists. What would you like to do?' : 'Le fichier .env existe déjà. Que voulez-vous faire ?'}"
    options:
      - label: "{language=en ? 'Keep existing and fill missing' : 'Garder l\\'existant et remplir les manquants'}"
        description: "{language=en ? 'Only ask for empty variables' : 'Demander uniquement les variables vides'}"
      - label: "{language=en ? 'Start fresh' : 'Recommencer à zéro'}"
        description: "{language=en ? 'Overwrite with template' : 'Écraser avec le template'}"
      - label: "{language=en ? 'Skip env setup' : 'Passer la config env'}"
        description: "{language=en ? 'I will configure later' : 'Je configurerai plus tard'}"
    multiSelect: false
```

**If .env doesn't exist:**
- Copy template: `cp .env-template .env`

### 2. Read Current .env

```bash
Read: .env
```

Parse all environment variables and their current values (empty or filled).

### 3. Environment Variables Guide

**Ask for each variable one by one. For each:**
1. Show variable name
2. Explain what it's for
3. Explain HOW TO GET IT
4. Ask user to paste value or type "skip"
5. Update .env with the value

---

## ENV VARIABLES REFERENCE

### DATABASE_URL & DATABASE_URL_UNPOOLED

**What:** PostgreSQL database connection string

**DETECT OS AND AUTO-INSTALL:**

```bash
# Check OS
OS=$(uname -s)
```

---

**macOS (auto-install with Homebrew):**

```bash
# Install Postgres.app via Homebrew
brew install --cask postgres-app

# Open the app (will auto-configure)
open -a Postgres

# Wait for app to start
sleep 5

# Get current username (Postgres.app uses system username)
USERNAME=$(whoami)

# Create database
createdb {app_name_kebab}

# Verify connection works
psql -d {app_name_kebab} -c "SELECT 1;" > /dev/null 2>&1 && echo "✓ Database connection OK" || echo "✗ Connection failed"
```

**Connection string:** `postgresql://{USERNAME}:@localhost:5432/{app_name_kebab}`

Example: `postgresql://melvynx:@localhost:5432/my-app`

**Note:** In Postgres.app preferences, enable "Start at Login" for auto-start.

---

**Linux (Ubuntu/Debian):**

```bash
# Install PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# Start the service
sudo systemctl start postgresql

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Create database
sudo -u postgres createdb {app_name_kebab}

# Verify connection works
PGPASSWORD=postgres psql -U postgres -d {app_name_kebab} -c "SELECT 1;" > /dev/null 2>&1 && echo "✓ Database connection OK" || echo "✗ Connection failed"
```

**Connection string:** `postgresql://postgres:postgres@localhost:5432/{app_name_kebab}`

**Ask user about auto-start:**

Use AskUserQuestion:
```yaml
questions:
  - header: "Auto-start"
    question: "{language=en ? 'Enable PostgreSQL auto-start on boot?' : 'Activer le démarrage automatique de PostgreSQL au boot ?'}"
    options:
      - label: "{language=en ? 'Yes (Recommended)' : 'Oui (Recommandé)'}"
        description: "{language=en ? 'PostgreSQL starts automatically' : 'PostgreSQL démarre automatiquement'}"
      - label: "{language=en ? 'No' : 'Non'}"
        description: "{language=en ? 'I will start it manually' : 'Je le démarrerai manuellement'}"
    multiSelect: false
```

**If Yes:**
```bash
sudo systemctl enable postgresql
```

---

**Windows WSL:**

```bash
# Install PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# Start the service
sudo service postgresql start

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Create database
sudo -u postgres createdb {app_name_kebab}

# Verify connection works
PGPASSWORD=postgres psql -U postgres -d {app_name_kebab} -c "SELECT 1;" > /dev/null 2>&1 && echo "✓ Database connection OK" || echo "✗ Connection failed"
```

**Connection string:** `postgresql://postgres:postgres@localhost:5432/{app_name_kebab}`

**Ask user about auto-start:**

Use AskUserQuestion:
```yaml
questions:
  - header: "Auto-start"
    question: "{language=en ? 'Add PostgreSQL auto-start to your shell?' : 'Ajouter le démarrage auto de PostgreSQL à votre shell ?'}"
    options:
      - label: "{language=en ? 'Yes (Recommended)' : 'Oui (Recommandé)'}"
        description: "{language=en ? 'Adds to .bashrc/.zshrc' : 'Ajoute au .bashrc/.zshrc'}"
      - label: "{language=en ? 'No' : 'Non'}"
        description: "{language=en ? 'I will run: sudo service postgresql start' : 'Je lancerai: sudo service postgresql start'}"
    multiSelect: false
```

**If Yes:**
```bash
# Detect shell config file
if [ -f ~/.zshrc ]; then
  echo "sudo service postgresql start > /dev/null 2>&1" >> ~/.zshrc
elif [ -f ~/.bashrc ]; then
  echo "sudo service postgresql start > /dev/null 2>&1" >> ~/.bashrc
fi
```

---

**FOR PRODUCTION (all OS):**

```
1. Go to https://neon.tech (recommended)
2. Create a new project
3. Copy the connection string (pooled for DATABASE_URL)
4. Copy the direct connection for DATABASE_URL_UNPOOLED
```

---

### REDIS_URL

**What:** Redis cache connection for performance

**How to get:**
```
# English
RECOMMENDED - Vercel KV (Redis):
1. Go to Vercel Dashboard > Storage > Create Database > KV
2. Connect it to your project
3. The KV_URL is automatically added to your environment
4. Use KV_URL as REDIS_URL (they're compatible)

Alternative - Upstash (free tier):
1. Go to https://upstash.com
2. Create a Redis database
3. Copy the Redis URL from the dashboard

Local development:
Use: redis://localhost:6379 (requires Docker or local Redis)

# French
RECOMMANDÉ - Vercel KV (Redis):
1. Allez dans Vercel Dashboard > Storage > Create Database > KV
2. Connectez-le à votre projet
3. KV_URL est automatiquement ajouté à votre environnement
4. Utilisez KV_URL comme REDIS_URL (ils sont compatibles)

Alternative - Upstash (gratuit):
1. Allez sur https://upstash.com
2. Créez une base Redis
3. Copiez l'URL Redis depuis le dashboard

Développement local:
Utilisez: redis://localhost:6379 (nécessite Docker ou Redis local)
```

---

### GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET

**What:** GitHub OAuth for social login

**How to get:**
```
# English
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: {app_name}
   - Homepage URL: http://localhost:3000 (dev) or your production URL
   - Callback URL: http://localhost:3000/api/auth/callback/github
4. Click "Register application"
5. Copy Client ID
6. Generate and copy Client Secret

# French
1. Allez sur https://github.com/settings/developers
2. Cliquez "New OAuth App"
3. Remplissez:
   - Application name: {app_name}
   - Homepage URL: http://localhost:3000 (dev) ou votre URL de prod
   - Callback URL: http://localhost:3000/api/auth/callback/github
4. Cliquez "Register application"
5. Copiez le Client ID
6. Générez et copiez le Client Secret
```

---

### BETTER_AUTH_SECRET

**What:** Secret key for authentication encryption

**AUTO-GENERATE THIS - DO NOT ASK USER:**

```bash
# Generate and store the secret automatically
SECRET=$(openssl rand -base64 32)
echo "BETTER_AUTH_SECRET=$SECRET"
```

**Execution:**
1. Run `openssl rand -base64 32` to generate a secret
2. Automatically update .env with the generated value
3. Inform user: "Generated BETTER_AUTH_SECRET automatically"

**DO NOT ask user to paste this - generate it yourself!**

---

### RESEND_API_KEY

**What:** API key for sending transactional emails

**How to get:**
```
# English
1. Go to https://resend.com
2. Sign up / Log in
3. Go to API Keys → Create API Key
4. Copy the key (starts with re_)

# French
1. Allez sur https://resend.com
2. Inscrivez-vous / Connectez-vous
3. Allez dans API Keys → Create API Key
4. Copiez la clé (commence par re_)
```

---

### EMAIL DOMAIN SETUP (CRITICAL - ASK BEFORE EMAIL_FROM)

**BEFORE asking for EMAIL_FROM, ask if user has a domain:**

Use AskUserQuestion:
```yaml
questions:
  - header: "Domain"
    question: "{language=en ? 'Do you have a domain name for your app?' : 'Avez-vous un nom de domaine pour votre app ?'}"
    options:
      - label: "{language=en ? 'Yes, I have a domain' : 'Oui, j\\'ai un domaine'}"
        description: "{language=en ? 'e.g., myapp.com, myapp.io' : 'ex: myapp.com, myapp.io'}"
      - label: "{language=en ? 'No, not yet' : 'Non, pas encore'}"
        description: "{language=en ? 'I will use Resend test mode' : 'Je vais utiliser le mode test de Resend'}"
    multiSelect: false
```

**Store response as `{has_domain}`**

---

#### If user HAS a domain:

**Ask for the domain:**
```
# English
What is your domain name? (e.g., myapp.com)

# French
Quel est votre nom de domaine ? (ex: myapp.com)
```

**Store response as `{user_domain}`**

**Then explain domain verification:**
```
# English
You need to verify your domain in Resend:
1. Go to Resend Dashboard → Domains
2. Click "Add Domain" and enter: {user_domain}
3. Add the DNS records shown (MX, TXT for SPF/DKIM)
4. Wait for verification (usually 5-15 minutes)

After verification, set:
- EMAIL_FROM: "{app_name} <contact@{user_domain}>"
- NEXT_PUBLIC_EMAIL_CONTACT: "contact@{user_domain}"

# French
Vous devez vérifier votre domaine dans Resend:
1. Allez dans Resend Dashboard → Domains
2. Cliquez "Add Domain" et entrez: {user_domain}
3. Ajoutez les enregistrements DNS affichés (MX, TXT pour SPF/DKIM)
4. Attendez la vérification (généralement 5-15 minutes)

Après vérification, configurez:
- EMAIL_FROM: "{app_name} <contact@{user_domain}>"
- NEXT_PUBLIC_EMAIL_CONTACT: "contact@{user_domain}"
```

**Auto-fill .env with:**
```
EMAIL_FROM="{app_name} <contact@{user_domain}>"
NEXT_PUBLIC_EMAIL_CONTACT="contact@{user_domain}"
```

---

#### If user DOES NOT have a domain:

**Explain limitations and set test mode:**
```
# English
No problem! Resend provides a test mode:

LIMITATIONS (without domain):
- Can ONLY send emails to YOUR OWN email address (the one you signed up with)
- Emails come from: onboarding@resend.dev
- Perfect for development and testing

When you get a domain later, you can update these values.

Setting up test mode...

# French
Pas de problème ! Resend fournit un mode test:

LIMITATIONS (sans domaine):
- Peut SEULEMENT envoyer des emails à VOTRE propre adresse email (celle utilisée pour l'inscription)
- Les emails viennent de: onboarding@resend.dev
- Parfait pour le développement et les tests

Quand vous aurez un domaine, vous pourrez mettre à jour ces valeurs.

Configuration du mode test...
```

**Auto-fill .env with:**
```
EMAIL_FROM="onboarding@resend.dev"
NEXT_PUBLIC_EMAIL_CONTACT="onboarding@resend.dev"
```

**Inform user:**
```
# English
✓ Email configured in TEST MODE
- Emails will come from: onboarding@resend.dev
- Can only send to your Resend account email
- Update EMAIL_FROM when you have a domain

# French
✓ Email configuré en MODE TEST
- Les emails viendront de: onboarding@resend.dev
- Peut seulement envoyer à l'email de votre compte Resend
- Mettez à jour EMAIL_FROM quand vous aurez un domaine
```

---

### RESEND_AUDIENCE_ID

**What:** Audience ID for newsletter/email list

**How to get:**
```
# English
1. In Resend dashboard, go to Audiences
2. Create an audience (e.g., "{app_name} Newsletter")
3. Copy the Audience ID

# French
1. Dans le dashboard Resend, allez dans Audiences
2. Créez une audience (ex: "{app_name} Newsletter")
3. Copiez l'Audience ID
```

---

### STRIPE_SECRET_KEY & NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

**What:** Stripe API keys for payments

**How to get:**
```
# English
1. Go to https://dashboard.stripe.com/apikeys
2. Copy "Publishable key" → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
3. Copy "Secret key" → STRIPE_SECRET_KEY

Use TEST keys for development (start with pk_test_ and sk_test_)

# French
1. Allez sur https://dashboard.stripe.com/apikeys
2. Copiez "Publishable key" → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
3. Copiez "Secret key" → STRIPE_SECRET_KEY

Utilisez les clés TEST pour le dev (commencent par pk_test_ et sk_test_)
```

---

### STRIPE_WEBHOOK_SECRET

**What:** Secret for verifying Stripe webhook events

**How to get:**
```
# English
For local development:
1. Install Stripe CLI: brew install stripe/stripe-cli/stripe
2. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe
3. Copy the webhook signing secret (starts with whsec_)

For production:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: https://yourdomain.com/api/webhooks/stripe
3. Copy the signing secret

# French
Pour le développement local:
1. Installez Stripe CLI: brew install stripe/stripe-cli/stripe
2. Lancez: stripe listen --forward-to localhost:3000/api/webhooks/stripe
3. Copiez le webhook signing secret (commence par whsec_)

Pour la production:
1. Allez dans Stripe Dashboard → Developers → Webhooks
2. Ajoutez endpoint: https://votredomaine.com/api/webhooks/stripe
3. Copiez le signing secret
```

---

### STRIPE_*_PLAN_ID (Pro, Pro Yearly, Ultra, Ultra Yearly)

**What:** Stripe Price IDs for subscription plans

**How to get:**
```
# English
1. Go to Stripe Dashboard → Products
2. Create your products (Pro, Ultra)
3. Add prices (monthly and yearly)
4. Copy each Price ID (starts with price_)

Skip these for now if you haven't set up billing yet.

# French
1. Allez dans Stripe Dashboard → Products
2. Créez vos produits (Pro, Ultra)
3. Ajoutez les prix (mensuel et annuel)
4. Copiez chaque Price ID (commence par price_)

Passez ces variables si vous n'avez pas encore configuré la facturation.
```

---

### NEXT_PUBLIC_POSTHOG_KEY & NEXT_PUBLIC_POSTHOG_HOST

**What:** PostHog analytics (optional)

**How to get:**
```
# English
1. Go to https://posthog.com
2. Create a project
3. Go to Settings → Project API Key
4. Copy the key and host URL

Skip if you don't need analytics yet.

# French
1. Allez sur https://posthog.com
2. Créez un projet
3. Allez dans Settings → Project API Key
4. Copiez la clé et l'URL host

Passez si vous n'avez pas encore besoin d'analytics.
```

---

### FILE UPLOAD PROVIDER

**What:** Storage provider for file uploads (images, documents)

**CRITICAL: Ask user which provider they want to use BEFORE asking for env vars.**

Use AskUserQuestion:
```yaml
questions:
  - header: "Storage"
    question: "{language=en ? 'Which file upload provider do you want to use?' : 'Quel fournisseur de stockage voulez-vous utiliser ?'}"
    options:
      - label: "{language=en ? 'Vercel Blob (Recommended)' : 'Vercel Blob (Recommandé)'}"
        description: "{language=en ? 'Simple, auto-configured on Vercel' : 'Simple, auto-configuré sur Vercel'}"
      - label: "Cloudflare R2 / AWS S3"
        description: "{language=en ? 'More control, works anywhere' : 'Plus de contrôle, fonctionne partout'}"
      - label: "UploadThing"
        description: "{language=en ? 'Developer-friendly, generous free tier' : 'Dev-friendly, free tier généreux'}"
      - label: "{language=en ? 'Skip for now' : 'Passer pour l\\'instant'}"
        description: "{language=en ? 'I will configure later' : 'Je configurerai plus tard'}"
    multiSelect: false
```

**Store response as `{file_upload_provider}`**

---

#### If Vercel Blob selected:

**Env var:** `BLOB_READ_WRITE_TOKEN`

**How to get:**
```
# English
On Vercel (production):
- Automatically configured when you connect Vercel Blob storage
- Go to Vercel Dashboard > Storage > Create Database > Blob
- Connect to your project - done!

For local development:
1. Go to Vercel Dashboard > Storage > Blob > Tokens
2. Create a token with read/write access
3. Copy the token (starts with vercel_blob_)

# French
Sur Vercel (production):
- Automatiquement configuré quand vous connectez Vercel Blob
- Allez dans Vercel Dashboard > Storage > Create Database > Blob
- Connectez à votre projet - c'est fait !

Pour le développement local:
1. Allez dans Vercel Dashboard > Storage > Blob > Tokens
2. Créez un token avec accès read/write
3. Copiez le token (commence par vercel_blob_)
```

**The adapter is already configured at `src/lib/files/vercel-blob-adapter.ts`**

---

#### If Cloudflare R2 / AWS S3 selected:

**1. Install dependencies:**
```bash
pnpm add @aws-sdk/client-s3 mime-types
pnpm add -D @types/mime-types
```

**2. Ask for these env vars:**

| Variable | How to get |
|----------|------------|
| `AWS_ENDPOINT` | Cloudflare: `https://{account-id}.r2.cloudflarestorage.com` |
| `AWS_ACCESS_KEY_ID` | From R2/S3 API tokens |
| `AWS_SECRET_ACCESS_KEY` | From R2/S3 API tokens |
| `AWS_S3_BUCKET_NAME` | Your bucket name |
| `R2_URL` | Public URL for your bucket |

**3. Create adapter file:**

Create `src/lib/files/r2-adapter.ts` with the code from docs/file-adapters.

**4. Update import in `src/features/images/upload-image.action.ts`:**
```typescript
import { fileAdapter } from "@/lib/files/r2-adapter";
```

---

#### If UploadThing selected:

**1. Install dependency:**
```bash
pnpm add uploadthing
```

**2. Ask for env var:** `UPLOADTHING_TOKEN`

**How to get:**
```
# English
1. Go to https://uploadthing.com
2. Create a project
3. Go to API Keys
4. Copy your token

# French
1. Allez sur https://uploadthing.com
2. Créez un projet
3. Allez dans API Keys
4. Copiez votre token
```

**3. Create adapter file:**

Create `src/lib/files/uploadthing-adapter.ts`:
```typescript
import { UTApi } from "uploadthing/server";
import type { UploadFileAdapter } from "./upload-file";

export const utapi = new UTApi({});

export const fileAdapter: UploadFileAdapter = {
  uploadFile: async (params) => {
    const response = await utapi.uploadFiles([params.file]);

    if (response[0].error) {
      return { error: new Error(response[0].error.message), data: null };
    }

    return { error: null, data: { url: response[0].data.ufsUrl } };
  },
  uploadFiles: async (params) => {
    const response = await utapi.uploadFiles(params.map((param) => param.file));

    return response.map((res) => {
      if (res.error) {
        return { error: new Error(res.error.message), data: null };
      }
      return { error: null, data: { url: res.data.ufsUrl } };
    });
  },
};
```

**4. Update import in `src/features/images/upload-image.action.ts`:**
```typescript
import { fileAdapter } from "@/lib/files/uploadthing-adapter";
```

---

## ASKING FLOW

For each variable, follow this pattern:

**1. Show the variable:**
```
# English
Setting up: DATABASE_URL

# French
Configuration de: DATABASE_URL
```

**2. Explain what and how:**
```
{Show the "What" and "How to get" from reference above}
```

**3. Ask for value:**
```
# English
Paste your DATABASE_URL value, or type "skip" to configure later:

# French
Collez votre valeur DATABASE_URL, ou tapez "skip" pour configurer plus tard:
```

**4. Update .env:**
- If value provided: Update the line in .env
- If "skip": Leave empty, continue to next

**5. Confirm and continue:**
```
# English
✓ DATABASE_URL configured
Next: DATABASE_URL_UNPOOLED

# French
✓ DATABASE_URL configuré
Suivant: DATABASE_URL_UNPOOLED
```

---

## PRIORITY ORDER

Ask in this order (most critical first):

1. **DATABASE_URL** & **DATABASE_URL_UNPOOLED** (required)
2. **REDIS_URL** (required for caching)
3. **BETTER_AUTH_SECRET** (required, auto-generate - don't ask!)
4. **GITHUB_CLIENT_ID** & **GITHUB_CLIENT_SECRET** (for OAuth)
5. **RESEND_API_KEY** (for emails)
6. **DOMAIN QUESTION** (ask if user has domain - determines EMAIL_FROM)
7. **EMAIL_FROM** & **NEXT_PUBLIC_EMAIL_CONTACT** (auto-fill based on domain answer)
8. **STRIPE_SECRET_KEY** & **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
9. **STRIPE_WEBHOOK_SECRET**
10. STRIPE_*_PLAN_ID (can skip)
11. **RESEND_AUDIENCE_ID** (can skip)
12. **NEXT_PUBLIC_POSTHOG_*** (optional)
13. **FILE UPLOAD PROVIDER** (ask which provider, then configure accordingly)

---

## SUCCESS METRICS:

✅ .env file created from template
✅ Each variable explained with "how to get"
✅ User can skip any variable
✅ .env updated with provided values
✅ File upload provider chosen and configured
✅ Adapter file created/updated if needed
✅ Summary of configured vs skipped variables
✅ .env NOT committed to git

## FAILURE MODES:

❌ Not explaining how to get each variable
❌ Asking for all variables at once
❌ Storing sensitive values in visible output
❌ Committing .env to git
❌ Not offering "skip" option

## ENV PROTOCOLS:

- Always explain before asking
- Group related variables (e.g., both Stripe keys together)
- Offer auto-generation for secrets (BETTER_AUTH_SECRET)
- Remind user to never commit .env
- Suggest test/dev values when appropriate

---

## NEXT STEP:

After env setup, load `./step-07-finalize.md`

<critical>
Remember: NEVER log or display sensitive values in full. Always explain HOW TO GET each value!
</critical>
