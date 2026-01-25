# Checkout & Shipping System Implementation Plan
## Nefer Kali Healing - Non-Profit E-Commerce

---

## Executive Summary

This plan outlines the implementation of a complete checkout and shipping system for Nefer Kali Healing using:
- **Stripe** for payments (with non-profit considerations)
- **Stripe Subscriptions** for recurring product deliveries
- **Shippo** for shipping label generation and tracking

### Non-Profit Compliance Requirements
Since this is a 501(c)(3) non-profit, there are specific requirements for receipts and tax documentation that must be addressed.

---

## Phase 1: Database Schema Updates

### New Tables Required

#### 1. `orders` Table
Stores all order information.

```sql
create table orders (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Stripe Integration
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  
  -- Order Status
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  
  -- Customer Info
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  
  -- Shipping Address
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text default 'US',
  
  -- Billing Address (if different)
  billing_address_line1 text,
  billing_address_line2 text,
  billing_city text,
  billing_state text,
  billing_postal_code text,
  billing_country text default 'US',
  
  -- Pricing
  subtotal numeric(10, 2) not null,
  shipping_cost numeric(10, 2) default 0,
  tax_amount numeric(10, 2) default 0,
  discount_amount numeric(10, 2) default 0,
  total numeric(10, 2) not null,
  
  -- Coupon
  coupon_code text,
  coupon_id uuid references coupons(id),
  
  -- Subscription
  is_subscription_order boolean default false,
  subscription_id uuid references subscriptions(id),
  
  -- Shippo Integration
  shippo_shipment_id text,
  shippo_transaction_id text,
  tracking_number text,
  tracking_url text,
  shipping_label_url text,
  shipping_carrier text,
  shipping_service text,
  estimated_delivery_date date,
  
  -- Non-profit Receipt
  receipt_sent boolean default false,
  receipt_sent_at timestamp with time zone,
  
  -- Notes
  customer_notes text,
  internal_notes text
);
```

#### 2. `order_items` Table
Individual line items for each order.

```sql
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_id uuid references orders(id) on delete cascade not null,
  
  -- Product Info
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  
  -- Snapshot at time of purchase (prices can change)
  product_title text not null,
  variant_title text,
  sku text,
  
  -- Quantity & Pricing
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  
  -- Subscription info
  is_subscription boolean default false,
  subscription_frequency text
);
```

#### 3. `subscriptions` Table
Stores recurring subscription information.

```sql
create table subscriptions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Stripe Subscription
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  
  -- Customer Info
  customer_email text not null,
  customer_name text not null,
  
  -- Shipping Address
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text default 'US',
  
  -- Status
  status text default 'active' check (status in ('active', 'paused', 'cancelled', 'past_due')),
  
  -- Billing
  billing_interval text not null, -- 'every-2-weeks', 'monthly', 'every-3-months'
  next_billing_date timestamp with time zone,
  
  -- Pricing
  recurring_amount numeric(10, 2) not null,
  discount_percent numeric(5, 2) default 0,
  
  -- Cancellation
  cancelled_at timestamp with time zone,
  cancellation_reason text
);
```

#### 4. `subscription_items` Table
Products included in each subscription.

```sql
create table subscription_items (
  id uuid default uuid_generate_v4() primary key,
  subscription_id uuid references subscriptions(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  variant_id uuid references product_variants(id),
  quantity integer default 1,
  unit_price numeric(10, 2) not null
);
```

#### 5. `shipping_rates` Table (Optional - for custom shipping rules)
```sql
create table shipping_rates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  min_order_value numeric(10, 2),
  max_order_value numeric(10, 2),
  flat_rate numeric(10, 2),
  free_shipping_threshold numeric(10, 2),
  is_active boolean default true
);
```

---

## Phase 2: Stripe Setup

### 2.1 Non-Profit Stripe Account Configuration

1. **Apply for Non-Profit Discount**
   - Email `nonprofit@stripe.com` with:
     - Your EIN or IRS 501(c)(3) status letter
     - Primary email on your Stripe account
     - Confirmation that 80%+ of volume is tax-deductible donations
   - Discounted rate: ~2.2% + $0.30 per transaction

2. **Important Non-Profit Receipt Requirements**
   
   Your tax receipts MUST include:
   - Organization name: "Nefer Kali Healing"
   - Organization EIN (Tax ID number)
   - Date of contribution/purchase
   - Amount of contribution
   - **Statement of goods/services provided** (This is critical!)
     - For product purchases: Must state the fair market value of products received
     - The tax-deductible portion = Total payment - Fair market value of goods
   - Statement: "No goods or services were provided in exchange for this contribution" (for pure donations only)

### 2.2 Stripe Products Setup

```javascript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create a Stripe Product for each product
async function createStripeProduct(product: Product) {
  return await stripe.products.create({
    name: product.title,
    description: product.short_description,
    images: [product.featured_image_url],
    metadata: {
      supabase_id: product.id,
      category: product.category,
    },
  });
}

// Create prices for one-time purchase and subscription
async function createStripePrices(stripeProductId: string, product: Product) {
  // One-time price
  const oneTimePrice = await stripe.prices.create({
    product: stripeProductId,
    unit_amount: Math.round(product.price * 100), // cents
    currency: 'usd',
  });

  // Subscription prices (if subscription is available)
  let subscriptionPrices = [];
  if (product.subscription_available) {
    const discountedAmount = Math.round(
      product.price * (1 - product.subscription_discount_percent / 100) * 100
    );

    for (const frequency of product.subscription_frequency_options || []) {
      const interval = getStripeInterval(frequency);
      subscriptionPrices.push(await stripe.prices.create({
        product: stripeProductId,
        unit_amount: discountedAmount,
        currency: 'usd',
        recurring: interval,
      }));
    }
  }

  return { oneTimePrice, subscriptionPrices };
}
```

### 2.3 Checkout Session Creation

```javascript
// api/create-checkout-session.ts
export async function createCheckoutSession(items: CartItem[], options: CheckoutOptions) {
  const lineItems = items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.title,
        images: [item.image_url],
        metadata: { product_id: item.product_id },
      },
      unit_amount: Math.round(item.price * 100),
      ...(item.isSubscription && {
        recurring: getStripeInterval(item.subscriptionFrequency),
      }),
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: options.hasSubscription ? 'subscription' : 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: ['US', 'CA'], // Add more as needed
    },
    shipping_options: await getShippingOptions(items),
    customer_email: options.email,
    success_url: `${process.env.SITE_URL}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_URL}/cart`,
    metadata: {
      order_source: 'nefer-kali-healing',
      is_nonprofit: 'true',
    },
    // For non-profit: Include statement in receipt
    payment_intent_data: {
      description: 'Nefer Kali Healing - Product Purchase (See receipt for tax-deductible details)',
      statement_descriptor: 'NKH HEALING',
    },
  });

  return session;
}
```

---

## Phase 3: Shippo Integration

### 3.1 Shippo Setup

```javascript
// lib/shippo.ts
import Shippo from 'shippo';

export const shippo = new Shippo(process.env.SHIPPO_API_KEY!);

// Create shipment and get rates
export async function createShipment(order: Order, items: OrderItem[]) {
  // Your address (ship from)
  const addressFrom = {
    name: 'Nefer Kali Healing',
    street1: process.env.BUSINESS_ADDRESS_LINE1,
    city: process.env.BUSINESS_CITY,
    state: process.env.BUSINESS_STATE,
    zip: process.env.BUSINESS_ZIP,
    country: 'US',
    phone: process.env.BUSINESS_PHONE,
    email: process.env.BUSINESS_EMAIL,
  };

  // Customer address (ship to)
  const addressTo = {
    name: order.customer_name,
    street1: order.shipping_address_line1,
    street2: order.shipping_address_line2,
    city: order.shipping_city,
    state: order.shipping_state,
    zip: order.shipping_postal_code,
    country: order.shipping_country,
    phone: order.customer_phone,
    email: order.customer_email,
  };

  // Package dimensions (calculate based on items)
  const parcel = calculateParcelSize(items);

  const shipment = await shippo.shipment.create({
    address_from: addressFrom,
    address_to: addressTo,
    parcels: [parcel],
    async: false,
  });

  return shipment;
}

// Get shipping rates
export async function getShippingRates(shipment: Shippo.Shipment) {
  // Filter for preferred carriers
  return shipment.rates.filter(rate => 
    ['usps_priority', 'usps_first', 'ups_ground', 'fedex_ground'].includes(rate.servicelevel.token)
  );
}

// Purchase shipping label
export async function purchaseShippingLabel(rateId: string) {
  const transaction = await shippo.transaction.create({
    rate: rateId,
    label_file_type: 'PDF',
    async: false,
  });

  return {
    tracking_number: transaction.tracking_number,
    tracking_url: transaction.tracking_url_provider,
    label_url: transaction.label_url,
    transaction_id: transaction.object_id,
  };
}
```

### 3.2 Shipping Rate Options at Checkout

```javascript
// api/shipping-rates.ts
export async function getCheckoutShippingOptions(address: ShippingAddress, items: CartItem[]) {
  // Create a test shipment to get live rates
  const shipment = await createShipment({ ...mockOrder, ...address }, items);
  const rates = await getShippingRates(shipment);

  // Format for Stripe Checkout
  return rates.map(rate => ({
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: {
        amount: Math.round(parseFloat(rate.amount) * 100),
        currency: 'usd',
      },
      display_name: rate.provider + ' - ' + rate.servicelevel.name,
      delivery_estimate: {
        minimum: { unit: 'business_day', value: rate.estimated_days },
        maximum: { unit: 'business_day', value: rate.estimated_days + 2 },
      },
      metadata: {
        shippo_rate_id: rate.object_id,
      },
    },
  }));
}
```

---

## Phase 4: Webhook Handlers

### 4.1 Stripe Webhook for Order Processing

```javascript
// api/webhooks/stripe.ts
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;
      
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      // For subscription renewals
      await handleSubscriptionPayment(event.data.object);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  // 1. Create order in database
  const order = await createOrder(session);
  
  // 2. Get shipping rate from session
  const shippoRateId = session.shipping_options?.[0]?.shipping_rate?.metadata?.shippo_rate_id;
  
  // 3. Purchase shipping label
  if (shippoRateId) {
    const shippingInfo = await purchaseShippingLabel(shippoRateId);
    await updateOrderShipping(order.id, shippingInfo);
  }
  
  // 4. Send confirmation email with non-profit receipt
  await sendOrderConfirmation(order);
  
  // 5. Update inventory
  await updateInventory(order.items);
}
```

### 4.2 Shippo Webhook for Tracking Updates

```javascript
// api/webhooks/shippo.ts
export async function handleShippoWebhook(event: ShippoWebhookEvent) {
  if (event.event === 'track_updated') {
    const { tracking_number, tracking_status } = event.data;
    
    // Update order status
    await supabase
      .from('orders')
      .update({ 
        status: mapShippoStatus(tracking_status.status),
        updated_at: new Date().toISOString(),
      })
      .eq('tracking_number', tracking_number);
      
    // Send tracking update email to customer
    if (tracking_status.status === 'DELIVERED') {
      await sendDeliveryConfirmation(tracking_number);
    }
  }
}
```

---

## Phase 5: Frontend Components

### 5.1 Cart Context & State

```
components/
├── cart/
│   ├── CartContext.tsx      # Global cart state
│   ├── CartDrawer.tsx       # Slide-out cart sidebar
│   ├── CartItem.tsx         # Individual cart item row
│   └── CartSummary.tsx      # Subtotal, shipping, total
```

### 5.2 Checkout Flow Pages

```
pages/
├── Cart.tsx                 # Full cart page
├── Checkout.tsx             # Redirect to Stripe Checkout
├── OrderConfirmation.tsx    # Post-purchase confirmation
├── OrderTracking.tsx        # Track shipment status
└── account/
    ├── Orders.tsx           # Order history
    └── Subscriptions.tsx    # Manage subscriptions
```

### 5.3 Admin Order Management

```
pages/admin/
├── Orders.tsx               # Order list & management
├── OrderDetail.tsx          # Single order view
└── Subscriptions.tsx        # Subscription management
```

---

## Phase 6: Non-Profit Receipt Email Template

```html
<!-- Email template for non-profit compliant receipt -->
<h1>Thank You for Supporting Nefer Kali Healing!</h1>

<p><strong>Organization:</strong> Nefer Kali Healing (501(c)(3))</p>
<p><strong>EIN:</strong> [Your-EIN-Number]</p>
<p><strong>Date:</strong> {{ order_date }}</p>
<p><strong>Receipt #:</strong> {{ order_id }}</p>

<h2>Order Details</h2>
<table>
  <tr>
    <th>Item</th>
    <th>Qty</th>
    <th>Fair Market Value</th>
  </tr>
  {{ #each items }}
  <tr>
    <td>{{ title }}</td>
    <td>{{ quantity }}</td>
    <td>${{ unit_price }}</td>
  </tr>
  {{ /each }}
</table>

<p><strong>Total Payment:</strong> ${{ total }}</p>
<p><strong>Fair Market Value of Goods:</strong> ${{ goods_value }}</p>
<p><strong>Tax-Deductible Amount:</strong> ${{ tax_deductible_amount }}</p>

<hr>

<p><em>
  For tax purposes, please retain this receipt. 
  The tax-deductible portion of your contribution is limited to the amount 
  by which your payment exceeds the fair market value of goods received.
  Please consult your tax advisor for guidance.
</em></p>

<p>
  <strong>Statement:</strong> Goods and/or services were provided in exchange 
  for this contribution. The fair market value of these goods/services is 
  estimated at ${{ goods_value }}.
</p>
```

---

## Implementation Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| **Phase 1** | 2-3 days | Database schema creation & migrations |
| **Phase 2** | 3-4 days | Stripe integration (checkout, products, prices) |
| **Phase 3** | 2-3 days | Shippo integration (rates, labels, tracking) |
| **Phase 4** | 2-3 days | Webhook handlers for both services |
| **Phase 5** | 4-5 days | Frontend components (cart, checkout, order tracking) |
| **Phase 6** | 1-2 days | Email templates & non-profit receipt system |
| **Testing** | 2-3 days | End-to-end testing with Stripe/Shippo test modes |

**Total Estimated Time: 16-23 days**

---

## Environment Variables Required

```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Shippo
SHIPPO_API_KEY=shippo_live_...
SHIPPO_WEBHOOK_SECRET=...

# Business Address (for shipping from)
BUSINESS_NAME="Nefer Kali Healing"
BUSINESS_ADDRESS_LINE1="..."
BUSINESS_CITY="..."
BUSINESS_STATE="..."
BUSINESS_ZIP="..."
BUSINESS_PHONE="..."
BUSINESS_EMAIL="..."
BUSINESS_EIN="..."

# Site
SITE_URL=https://neferkalihealing.org
```

---

## Questions to Answer Before Implementation

1. **EIN Number**: What is your 501(c)(3) EIN?
2. **Business Address**: What address should packages ship FROM?
3. **Shipping Carriers**: Which carriers do you prefer? (USPS, UPS, FedEx)
4. **Free Shipping**: Do you want a free shipping threshold? (e.g., orders over $50)
5. **International Shipping**: Do you want to ship internationally?
6. **Subscription Pause**: Should customers be able to pause subscriptions?
7. **Tax Collection**: Do you need to collect sales tax? (Non-profits often exempt)

---

## Next Steps

1. **Review this plan** and let me know if you want to adjust anything
2. **Answer the questions** above so I can customize the implementation
3. **Create Stripe account** (if not already done) and apply for non-profit discount
4. **Create Shippo account** and get API keys
5. **Begin Phase 1** - I'll create the database schema

Would you like me to proceed with Phase 1 (Database Schema), or do you have questions about any part of this plan?
