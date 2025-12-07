# Payment Integration Guide

## Overview

The WhatsApp bot needs to verify payments before proceeding. This guide covers integrating with different payment methods.

---

## 1. Crypto Payment Verification

### Recommended Service: Etherscan API (for Ethereum)

**Sign up:**
1. Go to https://etherscan.io/apis
2. Create free account
3. Get API key

**Implementation:**

```javascript
// Add to netlify/functions/whatsapp-webhook.js

async function verifyCryptoPayment(walletAddress, expectedAmount, timeWindow = 3600) {
  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== '1') {
    return { verified: false, error: 'API error' };
  }

  // Check recent transactions (within time window)
  const nowSeconds = Math.floor(Date.now() / 1000);
  const recentTxs = data.result.filter(tx =>
    nowSeconds - parseInt(tx.timeStamp) < timeWindow
  );

  // Look for transaction matching expected amount (convert from Wei)
  for (const tx of recentTxs) {
    const valueInEth = parseInt(tx.value) / 1e18;
    const valueInUsd = valueInEth * await getEthPrice(); // You'd need to implement this

    if (Math.abs(valueInUsd - expectedAmount) < 10) { // $10 tolerance
      return {
        verified: true,
        txHash: tx.hash,
        amount: valueInUsd,
        timestamp: tx.timeStamp
      };
    }
  }

  return { verified: false, error: 'No matching transaction found' };
}

async function getEthPrice() {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
  const data = await response.json();
  return data.ethereum.usd;
}
```

**Alternative: Manual Verification**

If you prefer manual verification:

```javascript
// Send notification to admin
async function notifyAdminPaymentClaim(phone, amount, method) {
  // Send to your personal WhatsApp
  await sendWhatsAppMessage(YOUR_ADMIN_PHONE,
    `🔔 Payment claim:\nFrom: ${phone}\nAmount: $${amount}\nMethod: ${method}\n\nCheck wallet and reply VERIFY ${phone} to approve`
  );
}
```

---

## 2. Stripe Integration (Credit Card)

### Setup

1. **Create Stripe Account:** https://stripe.com
2. **Get API Keys:** Dashboard → Developers → API keys
3. **Install Stripe SDK:**

```bash
cd netlify/functions
npm init -y
npm install stripe
```

### Implementation

Create new function: `netlify/functions/create-payment.js`

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { amount, phone, type } = JSON.parse(event.body);

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        phone: phone,
        type: type // 'coaching' or 'psychic'
      }
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: type === 'coaching' ? 'One Month Coaching with Michael' : 'Psychic Cleansing with Stanislav',
              description: type === 'coaching' ? 'Intense one-month coaching program' : 'Video session with translator'
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://forbidden-yoga.com/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://forbidden-yoga.com/payment-cancelled`,
      metadata: {
        phone: phone,
        type: type
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

**Update webhook to use Stripe:**

```javascript
// In whatsapp-webhook.js
function generatePaymentLink(amount, type, phone) {
  if (type === 'card') {
    // Call your Netlify function to create Stripe session
    return `https://forbidden-yoga.com/.netlify/functions/create-payment?amount=${amount}&type=${type}&phone=${phone}`;
  }
  // ... rest of code
}
```

**Verify Stripe Payment:**

Create webhook handler: `netlify/functions/stripe-webhook.js`

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );

    // Handle successful payment
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      const phone = session.metadata.phone;
      const type = session.metadata.type;

      // Update conversation state to mark payment verified
      // Send confirmation to user via WhatsApp
      await sendWhatsAppMessage(phone, MESSAGES.PAYMENT_VERIFIED);
      // Continue with broadcast opt-in flow
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};
```

---

## 3. PayPal Integration

### Setup

1. **Create PayPal Business Account:** https://www.paypal.com/business
2. **Get API Credentials:** Dashboard → Apps & Credentials
3. **Create REST API App**

### Option A: PayPal.me Links (Simple)

```javascript
function generatePayPalLink(amount) {
  // Your PayPal.me username
  const paypalUsername = 'forbiddenyoga';
  return `https://www.paypal.me/${paypalUsername}/${amount}`;
}
```

**Limitation:** No automatic verification

### Option B: PayPal Checkout (Advanced)

Create function: `netlify/functions/create-paypal-order.js`

```javascript
const fetch = require('node-fetch');

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

exports.handler = async (event) => {
  const { amount, phone, type } = JSON.parse(event.body);
  const accessToken = await getPayPalAccessToken();

  const response = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toString()
        },
        description: type === 'coaching' ? 'Coaching Program' : 'Psychic Cleansing'
      }],
      application_context: {
        return_url: 'https://forbidden-yoga.com/payment-success',
        cancel_url: 'https://forbidden-yoga.com/payment-cancelled'
      }
    })
  });

  const order = await response.json();
  const approveLink = order.links.find(link => link.rel === 'approve').href;

  return {
    statusCode: 200,
    body: JSON.stringify({ url: approveLink, orderId: order.id })
  };
};
```

---

## 4. Database for Payment Tracking

### Recommended: Upstash Redis (Free Tier)

**Why Redis:**
- Free tier: 10,000 requests/day
- No credit card required
- Perfect for conversation state
- Fast lookups

**Setup:**

1. Go to https://upstash.com
2. Create account
3. Create Redis database
4. Get connection URL

**Install SDK:**

```bash
cd netlify/functions
npm install @upstash/redis
```

**Implementation:**

```javascript
// Add to whatsapp-webhook.js
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN
});

// Replace in-memory Map with Redis
async function getConversationState(phone) {
  const state = await redis.get(`conversation:${phone}`);
  return state || {
    state: STATES.INITIAL,
    choice: null,
    paymentMethod: null,
    data: {}
  };
}

async function updateConversationState(phone, updates) {
  const current = await getConversationState(phone);
  const updated = { ...current, ...updates };
  await redis.set(`conversation:${phone}`, updated, { ex: 86400 }); // 24hr expiry
  return updated;
}

async function markPaymentVerified(phone, txDetails) {
  await redis.set(`payment:${phone}`, {
    verified: true,
    ...txDetails,
    timestamp: Date.now()
  }, { ex: 2592000 }); // 30 day expiry
}

async function isPaymentVerified(phone) {
  const payment = await redis.get(`payment:${phone}`);
  return payment && payment.verified;
}
```

---

## 5. Environment Variables Update

Add these to Netlify:

```
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...

# Etherscan (for crypto verification)
ETHERSCAN_API_KEY=...

# Upstash Redis
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
```

---

## 6. Payment Flow Summary

### Automated Flow (Recommended for Production):

1. User selects payment method
2. Bot generates payment link via Stripe/PayPal API
3. User completes payment
4. Payment processor webhook notifies your server
5. Server verifies payment and updates conversation state
6. Bot automatically continues conversation

### Semi-Automated Flow (Easier to Start):

1. User selects payment method
2. Bot sends payment link (PayPal.me or manual Stripe link)
3. User completes payment and replies "PAID"
4. Bot sends admin notification
5. Admin checks payment manually
6. Admin confirms via WhatsApp command or dashboard
7. Bot continues conversation

---

## 7. Testing Payments

### Stripe Test Mode:

Use test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### PayPal Sandbox:

1. Create sandbox accounts: https://developer.paypal.com/dashboard/accounts
2. Use test credentials
3. Test with sandbox buyer account

### Crypto Testnet:

Use Ethereum Goerli testnet for testing:
- Get test ETH from faucet
- Use testnet wallet address
- Test with Goerli Etherscan API

---

## 8. Compliance & Legal

**Important considerations:**

1. **PCI Compliance:** Never store credit card details - use Stripe/PayPal
2. **Terms & Conditions:** Update your terms to include refund policy
3. **Privacy Policy:** Disclose payment data handling
4. **Receipts:** Send receipt after payment verification
5. **Refund Process:** Document how refunds are handled
6. **Tax:** Consider sales tax / VAT requirements

---

## Quick Start Recommendation

**For fastest deployment:**

1. Start with PayPal.me links (no verification)
2. Use manual admin approval for payments
3. After testing, upgrade to:
   - Stripe for credit cards (auto-verification)
   - Etherscan API for crypto (auto-verification)
   - Upstash Redis for state management

This gets you live quickly, then you can add automation incrementally.
