<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Nefer Kali Healing

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key
   - `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
   - `VITE_EMAILJS_*` — EmailJS service/template/public/private keys
   - `VITE_KIT_API_KEY` / `VITE_KIT_FORM_ID` — ConvertKit newsletter

   `.env.local` is ignored by git and should never be committed.

3. Run the app:
   ```bash
   npm run dev
   ```

## Stripe Webhook Setup

Orders are created when Stripe sends a `checkout.session.completed` webhook to Supabase.

1. In Stripe Dashboard → Developers → Webhooks, add an endpoint:
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```
2. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copy the webhook signing secret (`whsec_...`).
4. In Supabase Dashboard → Edge Functions → Secrets, add:
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_SECRET_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`
   - `EMAILJS_PUBLIC_KEY`
   - `EMAILJS_PRIVATE_KEY`
   - `SHIPPO_API_KEY` (optional)

## Placing a Test Order

1. Make sure your Stripe account is in **Test mode**.
2. Use Stripe's test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any 3 digits
   - ZIP: any 5 digits
3. Complete a checkout on the site.
4. Verify in Stripe → Webhooks that `checkout.session.completed` was delivered successfully.
5. Check Supabase → Table Editor → `orders` to confirm the order was created.

## Backfilling Missed Orders

If webhooks were not configured, completed Stripe checkouts won't appear in Supabase. To backfill them:

```bash
STRIPE_SECRET_KEY=sk_live_... \
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node scripts/backfill-stripe-orders.js
```

The script looks back 30 days, skips orders that already exist, and creates the missing ones.

## Security Notes

- Several API keys and URLs that were previously hardcoded in source files have been moved to `.env.local` or Supabase Edge Function secrets.
- Because those values were committed to git, treat them as compromised and **rotate them** in their respective dashboards:
  - Supabase: Project Settings → API → `anon` key and `service_role` key
  - Resend: API Keys
  - EmailJS: Account → Public/Private keys
  - Stripe: Developers → API keys
  - ConvertKit: Account → API key
