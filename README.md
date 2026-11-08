# KARMA — Culture, Merch, Artists & Events

**Status:** source-code MVP / deployment-ready starter; *not yet deployed to a live domain*. The project follows the supplied Karma Development Plan and the Karma App System Design & Analysis document, including editorial, artist discovery, events, merchandise, studio enquiries and installable PWA support.

## What works

- Editorial homepage and article detail pages, artist hub and individual profiles.
- Merchandising catalogue, product detail pages, persistent shopping bag and checkout.
- PayChangu **hosted Standard Checkout**: server creates session; guest redirects to hosted payment; webhook verifies signature; server fetches verified transaction before marking an order paid; amount, reference and currency are checked; inventory decrements transactionally.
- Paid event tickets and free-event RSVPs with constrained availability.
- Registration and sign-in using hashed passwords, signed HttpOnly cookies, and USER/ARTIST/ADMIN roles. Admin routes use server-side role checks. (Artist self-publishing is deferred.)
- User order status, user account history, event RSVP list.
- Admin backstage to create/edit/delete artists, articles, events and products, view bookings, inspect paid orders, and update fulfillment statuses. Refunds are not automated.
- Brand studio service enquiry form.
- Mobile-responsive design, app icon, web manifest, offline fallback service worker.

## Stack

- **Next.js 15 (React 19, TypeScript)** — both UI and API routes, deployable as one Vercel project. The original plan suggested a separate Express backend; this MVP deliberately uses Next.js server routes to reduce infrastructure, authentication complexity and deployment costs. An Express API can be extracted later.
- **Prisma 6 + PostgreSQL** — Supabase project recommended. There are no hardcoded database credentials.
- **Zod, Zustand, bcryptjs, jose** — input validation, cart state, password hashing, server-signed sessions.
- **PayChangu** — hosted checkout, server-side transaction verification and HMAC-SHA256 webhook validation. No direct secret key is ever sent to the browser.

## 1. Run locally

Requires **Node 20+** and a PostgreSQL database (Supabase is suitable).

```bash
npm install
cp .env.example .env
# edit .env and fill DATABASE_URL, DIRECT_URL, SESSION_SECRET
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Without `DATABASE_URL`, pages render clearly labeled **sample/demo content** for design review; logins, orders, RSVPs, enquiries and admin editing require the database. With a database configured, `npm run db:seed` provisions the admin but **does not create fake sellable products or events**. Publish real merchandise, artists, editorial and confirmed events through `/admin`. Only for a disposable staging database, set `SEED_DEMO_CONTENT=true` before running the seed command.

To create your admin user, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (12+ characters) before `npm run db:seed`, then sign in at `/login` and navigate to `/admin`.

## 2. Configure PayChangu

1. Create a merchant account and obtain a **test secret key** and **webhook secret** from the PayChangu dashboard. Never put either in a `NEXT_PUBLIC_*` variable.
2. Set `PAYCHANGU_SECRET_KEY`, `PAYCHANGU_WEBHOOK_SECRET`, and `NEXT_PUBLIC_APP_URL` in `.env`. For live payments, `NEXT_PUBLIC_APP_URL` must be the HTTPS origin of your deployed website (no trailing slash).
3. In **PayChangu dashboard → Settings → API & Webhooks**, configure webhook URL:

   `https://YOUR-KARMA-DOMAIN/api/paychangu/webhook`

4. Test a merchant sandbox transaction end-to-end. PayChangu redirects payment success to `/api/paychangu/callback`, which triggers server verification and redirects to `/order?ref=...`. Unsuccessful attempts return to `/order` using the `return_url`.
5. Only switch to live keys after testing, confirming the webhook secret, DNS, and SSL.

PayChangu API paths used:

- `POST https://api.paychangu.com/payment`
- `GET https://api.paychangu.com/verify-payment/{tx_ref}`
- Webhook signature: `Signature` header = hex HMAC-SHA256 of raw body with webhook secret. The handler **also re-queries PayChangu** and compares exact transaction ref, MWK currency, and amount at least equal to order total.

Useful documentation:

- https://developer.paychangu.com/docs/standard-checkout
- https://developer.paychangu.com/docs/transaction-verification
- https://developer.paychangu.com/docs/webhooks

### Payment state handling

`PENDING` → `PAID` only after successful server verification and stock/ticket decrement. If PayChangu reports success but stock is insufficient, status becomes `PAID_REVIEW` for manual resolution. `FAILED` is assigned only after provider verification or checkout initiation failure. Browser redirects never imply successful payment.

The current MVP does **not** automate refunds, delivery courier tracking, transactional emails, or reserved stock during a payment session. Manual review may be needed when stock sells out between checkout initiation and payment confirmation. Do not promise guaranteed stock until the order is `PAID`.

## 3. Deploy to Vercel + Supabase

1. Create a Supabase Postgres project and copy the pooled `DATABASE_URL` and direct `DIRECT_URL` connection strings. These should use TLS.
2. Push this project to GitHub. In Vercel, import the repository and set the root to this app directory.
3. Set all required Environment Variables from `.env.example` in the Vercel project; `NEXT_PUBLIC_APP_URL` must equal your live HTTPS domain.
4. Run `npm run db:push` and `npm run db:seed` **from a trusted local machine** with production database credentials. Never expose these credentials publicly.
5. Deploy (build command: `npm run build`); set PayChangu's webhook URL to the deployed endpoint; verify signature and successful test order. Publish real content in `/admin` before your public launch.
6. Before launch, replace placeholder editorial/images/events, configure a real Karma contact address, and get legal privacy, terms and fulfillment policies reviewed.

## 4. Tests

```bash
npm test
npm run build
```

Tests include webhook HMAC signature validation, mismatch cases, and payment verification invariants. Real database and PayChangu test-key end-to-end testing is still required before accepting actual customer payments.

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout` | Accounts |
| `GET /api/auth/me`, `/api/account/orders` | Current user and owned orders/RSVPs |
| `POST /api/checkout` | Server-validated total, create order and hosted payment |
| `GET /api/paychangu/callback`, `POST /api/paychangu/webhook` | Payment return and signed notifications |
| `POST /api/payment/verify` | Server-side re-verification |
| `GET /api/orders/:reference` | Limited public order-status lookup by opaque reference |
| `POST /api/rsvp` | Free-event reservation |
| `POST /api/bookings` | Studio booking enquiry |
| `GET /api/admin/overview` | Admin only content and operations overview |
| `POST /api/admin/:resource`, `PUT/DELETE /api/admin/:resource/:id` | Admin content management |
| `PATCH /api/admin/orders/:id` | Admin fulfillment transitions (PAID → PROCESSING → SHIPPED → DELIVERED) |

## Security and release notes

- **No demo payments are marked as paid.** Real provider credentials and a valid database are required.
- Server-side authorization on admin API routes; passwords salted and hashed, HttpOnly `SameSite=Lax` session cookie; independent webhook secret, HMAC timing-safe signature comparison.
- Rate limiting is **instance-local** and insufficient for scaled serverless production; replace with a shared rate limiter (e.g., Upstash Redis) before a high-traffic launch.
- The seed script never inserts illustrative catalogue records by default. `SEED_DEMO_CONTENT=true` explicitly enables staging-only sample content; it should not be used with a live production database.
- Free event RSVP is tied to unique email per event, in a serializable transaction.
- Further production tasks: password reset/email verification, CSRF hardening, payment reconciliation cron, CDN-owned licensed imagery, explicit order cancellation/refund policies, accessible image alt review, transactional emails, secure media uploads, analytics and monitoring.

© KARMA. What You Deserve.

## Final source audit — 8 November 2026

- Restored a single matching set of Next.js pages, UI components and responsive stylesheet. This corrects the mismatched class names left by two UI iterations.
- Added expired-event ticket checks, an ended-event message on event pages, and server-side aggregate inventory checks across product-size variations.
- Preserved PayChangu webhook HMAC checks and independent transaction reconciliation, with recovery from a FAILED payment attempt if the provider later verifies a successful transaction.
- Static syntax parse succeeded for all 66 TypeScript/TSX files, and all local import paths resolved.
- All 3 PayChangu/payment unit tests passed using the installed Node.js runtime and TypeScript transpiler.
- **Not yet verified:** a full `npm install`, Next.js production build, database migration against live Supabase, or PayChangu sandbox/live checkout. These require working package-registry access and external merchant/database credentials. CI will run the normal build after the code is pushed to GitHub.

## GitHub ZIP handoff

See **`GITHUB_DEPLOY.md`** for an extract-to-GitHub walkthrough and Vercel + PayChangu setup.

Extract the ZIP into a **new GitHub repository root** (the archive contains files at its top level). Do not upload the ZIP itself as your code. Commit `package.json`, `.env.example`, `app/`, `components/`, `lib/`, `prisma/`, `public/`, and `.github/`. Do not commit `.env` or credentials. Vercel framework preset: **Next.js**; Root Directory: `./` if extracted files are at repository root. Run migrations and seed your admin from your local machine, not from a public deployment endpoint.
