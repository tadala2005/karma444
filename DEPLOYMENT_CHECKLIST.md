# Karma MVP — Launch Checklist

## Required before the first real payment

- [ ] Create Supabase project, obtain pooled `DATABASE_URL` and direct `DIRECT_URL`, test `npm run db:push`.
- [ ] Set strong `SESSION_SECRET`, admin email and password, and provision account via `npm run db:seed`.
- [ ] Publish real artists, events, images, stories and merch inventory from `/admin`; sample content is not seeded by default.
- [ ] Configure PayChangu sandbox secret key and webhook secret.
- [ ] Deploy to Vercel and set `NEXT_PUBLIC_APP_URL` to the correct HTTPS origin.
- [ ] Configure webhook `https://YOUR-DOMAIN/api/paychangu/webhook` in PayChangu dashboard.
- [ ] Run a real PayChangu test checkout: verify reference, amount, currency, signature, webhook, order state and inventory decrement.
- [ ] Test duplicate webhook delivery — do not double-deduct stock.
- [ ] Test expired/invalid payment, cancelled checkout, and under-stock paid order → `PAID_REVIEW`.
- [ ] Verify both free-event RSVP capacity and paid-event ticket quantity.
- [ ] Add brand-specific Instagram handle and real support/contact details.
- [ ] Publish legally reviewed privacy policy, terms, fulfillment and refund policies.
- [ ] Set shared distributed rate limiting, error monitoring and payment reconciliation job.
- [ ] Set up order and RSVP confirmation emails before a larger public launch.

## Notes

No live PayChangu or Supabase credentials are included in this repository. This is an MVP codebase, not proof of an operating production merchant integration. Real payment tests cannot be completed without account credentials and a publicly reachable webhook URL.
