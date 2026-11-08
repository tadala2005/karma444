# KARMA — GitHub + Vercel Quick Launch

This is the **source code**, not an already-hosted site. It uses one Next.js application for both the frontend and the server API, PostgreSQL via Prisma, and PayChangu's hosted checkout. It requires your own credentials to process real payments.

## 1) Push the ZIP contents to GitHub

1. Download and **extract** `karma-app-github-ready.zip`. The code files (including `package.json`) are at the ZIP's top level.
2. Create an empty repository on GitHub; do not add a README during repo creation.
3. Open Terminal/PowerShell **inside the extracted folder** and run:

```bash
git init
git add .
git commit -m "Initial Karma app MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/karma-app.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username and use your GitHub authentication when prompted. Never push your `.env` file or secret keys. The `.gitignore` excludes them.

## 2) Create your production database

Create a Supabase PostgreSQL project and obtain:

- `DATABASE_URL` — pooled connection URL, with TLS.
- `DIRECT_URL` — direct connection URL, with TLS.

In your **local extracted folder**:

```bash
npm install
cp .env.example .env
# Update .env with the real connection strings, SESSION_SECRET,
# and SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD.
npm run db:push
npm run db:seed
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if required. For `SESSION_SECRET`, generate a 32+ character cryptographically random value (e.g., `openssl rand -base64 48`).

**The seed command provisions your admin account without creating pretend sellable products or events.** Log in and visit `/admin` to publish actual artists, stories, stock and confirmed events. For a disposable preview database only, opt into placeholders with `SEED_DEMO_CONTENT=true`.

## 3) Deploy via Vercel

1. Create a project at https://vercel.com/new and **Import Git Repository**.
2. Choose the `karma-app` repository and use the **Next.js** framework preset.
3. Root Directory = `./` (the root of the extracted source files).
4. Set the environment variables listed in `.env.example` through Vercel → Project Settings → Environment Variables. **Do not upload or commit your `.env`**.
5. `NEXT_PUBLIC_APP_URL` must equal your live site's HTTPS origin, without a trailing `/` (e.g. `https://your-site.vercel.app`).
6. Deploy. Vercel will run `npm run build`, which also generates Prisma Client.

If you change your domain, update `NEXT_PUBLIC_APP_URL`, redeploy, and update the PayChangu webhook.

## 4) Configure PayChangu

1. Obtain **test** `PAYCHANGU_SECRET_KEY` and `PAYCHANGU_WEBHOOK_SECRET` from your merchant dashboard.
2. Set both as **server-side** Vercel environment variables (not `NEXT_PUBLIC_` names).
3. In your PayChangu dashboard's API & Webhooks settings, configure:

```
https://YOUR_LIVE_KARMA_DOMAIN/api/paychangu/webhook
```

4. Run a sandbox/test checkout to verify callback, webhook signature, server-side transaction verification, paid-order status, and inventory deduction.
5. Switch to live credentials **only after the end-to-end test succeeds**.

The server verifies the PayChangu transaction reference, currency (MWK), amount, and payment status before fulfilling paid orders. A redirect by itself does not mean the payment succeeded.

PayChangu documentation:
- https://developer.paychangu.com/docs/standard-checkout
- https://developer.paychangu.com/docs/transaction-verification
- https://developer.paychangu.com/docs/webhooks

## 5) Run CI and production checks

Pushing to GitHub triggers `.github/workflows/ci.yml`, which installs dependencies and runs source/payment tests and a Next.js build. Watch the **Actions** tab for a green result. On your local machine you can also run:

```bash
npm test
npm run lint
npm run build
```

**Limitations until a live environment is configured:** No live payment tests have been run using your merchant credentials; no real database migration has been run against your Supabase project; npm dependency installation/full production build was unavailable in the packaging environment. The GitHub Actions workflow runs these code checks once the repository is connected. Production launch also needs real product photos, support details, checkout/returns terms, monitoring, a shared rate limiter and payment reconciliation.
