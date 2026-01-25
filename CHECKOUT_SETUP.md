# Stripe & Supabase Setup Guide
## Nefer Kali Healing Checkout System

---

## Step 1: Database Schema

Run `checkout_schema.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open `checkout_schema.sql` from your project
3. Click "Run" to create the tables

---

## Step 2: Environment Variables

### Local Development (.env.local)
Add to your `.env.local` file:

```env
# Stripe (get from Stripe Dashboard > Developers > API keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here

# Supabase (already configured)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### Supabase Edge Function Secrets
Go to Supabase Dashboard → Edge Functions → Secrets and add:

| Secret Name | Value |
|-------------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (from Stripe) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (create webhook first) |

---

## Step 3: Deploy Edge Functions

### Install Supabase CLI
```bash
npm install -g supabase
```

### Login to Supabase
```bash
supabase login
```

### Link Project
```bash
supabase link --project-ref your-project-ref
```

### Deploy Functions
```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

---

## Step 4: Configure Stripe Webhook

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add Endpoint**
3. Enter your endpoint URL:
   ```
   https://[your-project-ref].supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add Endpoint**
6. Copy the **Signing Secret** (starts with `whsec_`)
7. Add it to Supabase Edge Function Secrets as `STRIPE_WEBHOOK_SECRET`

---

## Step 5: Test Checkout

1. Go to `/offerings` and add a product to cart
2. Click "Proceed to Checkout"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify order appears in database

---

## Non-Profit Stripe Discount

Apply for reduced Stripe fees:
1. Email `nonprofit@stripe.com`
2. Include:
   - Your EIN: **99-3021724**
   - Account email
   - Confirm 80%+ is donation volume

Standard rate: 2.9% + $0.30
Non-profit rate: 2.2% + $0.30

---

## Troubleshooting

### Checkout not redirecting?
- Check browser console for errors
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Verify Edge Function is deployed

### Webhook not processing?
- Check Supabase Edge Function logs
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Test with Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`

### Orders not appearing in database?
- Check Edge Function logs for errors
- Verify Supabase service role key is set
- Run `checkout_schema.sql` if tables missing
