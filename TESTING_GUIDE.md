# Testing Guide - WhatsApp Integration

## Pre-Deployment Testing

### 1. Local Testing Setup

**Install Dependencies:**

```bash
cd netlify/functions
npm install
```

**Set up local environment:**

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your test credentials
```

**Run Netlify Dev locally:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Run local dev server
netlify dev
```

Your webhook will be available at:
`http://localhost:8888/.netlify/functions/whatsapp-webhook`

### 2. Expose Local Webhook (for WhatsApp testing)

Use ngrok to expose local server:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Expose port 8888
ngrok http 8888
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and use:
`https://abc123.ngrok.io/.netlify/functions/whatsapp-webhook`

Set this as your webhook URL in Meta temporarily.

---

## Testing Checklist

### Phase 1: Basic Webhook Testing

- [ ] **Webhook Verification (GET request)**
  ```bash
  curl "https://your-function-url?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
  # Should return: test123
  ```

- [ ] **Webhook receives POST requests**
  - Send test message from Meta API tester
  - Check Netlify function logs
  - Verify signature validation works

- [ ] **Response time < 5 seconds**
  - WhatsApp requires response within 5 seconds
  - Check function logs for timing

### Phase 2: Conversation Flow Testing

**Test Script Format:**
```
Test: [Description]
Send: [User message]
Expected: [Bot response]
State: [Expected conversation state]
```

#### Test 1: Initial Contact

```
Test: First message from new user
Send: "Hello"
Expected:
  1. Welcome message
  2. Menu with 3 options (after 1 second)
State: MENU_SENT
```

#### Test 2: Menu Choice - Coaching

```
Test: User selects coaching option
Send: "1"
Expected: Coaching payment method menu
State: COACHING_PAYMENT
```

#### Test 3: Menu Choice - Psychic

```
Test: User selects psychic option
Send: "2"
Expected: Psychic payment method menu
State: PSYCHIC_PAYMENT
```

#### Test 4: Menu Choice - General Questions

```
Test: User has general questions
Send: "3"
Expected: General questions acknowledgment
State: GENERAL_QUESTIONS
```

#### Test 5: Coaching - Crypto Payment

```
Test: Select crypto for coaching
Send: "1" (when in COACHING_PAYMENT state)
Expected:
  - Crypto wallet address displayed
  - Exact address: 0x450d6188aadd0f6f4d167cfc8d092842903b36d6
  - Instructions to reply "PAID"
State: COACHING_PAYMENT_PENDING
```

#### Test 6: Coaching - Credit Card

```
Test: Select credit card for coaching
Send: "2" (when in COACHING_PAYMENT state)
Expected: Payment link for $5,000
State: COACHING_PAYMENT_PENDING
```

#### Test 7: Coaching - PayPal

```
Test: Select PayPal for coaching
Send: "3" (when in COACHING_PAYMENT state)
Expected: PayPal payment link for $5,000
State: COACHING_PAYMENT_PENDING
```

#### Test 8: Cannot Afford

```
Test: User cannot afford coaching
Send: "4" (when in COACHING_PAYMENT state)
Expected: Message asking to explain situation
State: GENERAL_QUESTIONS
```

#### Test 9: Payment Confirmation

```
Test: User claims payment made
Send: "PAID" (when in COACHING_PAYMENT_PENDING state)
Expected:
  1. "Verifying payment..." message
  2. "Payment verified" message (after 2 seconds)
  3. Broadcast opt-in question
State: BROADCAST_OPTIN
```

#### Test 10: Broadcast Opt-in YES

```
Test: User wants to join broadcast list
Send: "YES" (when in BROADCAST_OPTIN state)
Expected: Final message from Michael
State: COMPLETED
```

#### Test 11: Broadcast Opt-in NO

```
Test: User doesn't want broadcast list
Send: "NO" (when in BROADCAST_OPTIN state)
Expected: Final message from Michael
State: COMPLETED
```

#### Test 12: Invalid Input Handling

```
Test: User sends invalid menu choice
Send: "xyz" (when in MENU_SENT state)
Expected: "I didn't understand that. Please reply with the number of your choice."
State: Unchanged (MENU_SENT)
```

#### Test 13: Natural Language Alternatives

```
Test: User uses natural language instead of number
Send: "I want coaching with Michael"
Expected: Coaching payment method menu
State: COACHING_PAYMENT
```

### Phase 3: Edge Cases

- [ ] **Multiple rapid messages**
  - Send 5 messages in quick succession
  - Verify all are processed in order
  - Check for race conditions

- [ ] **Special characters in messages**
  - Send: "Hello! 🙏 I'm interested"
  - Verify emojis handled correctly

- [ ] **Very long messages**
  - Send 500+ character message
  - Verify doesn't crash

- [ ] **Message when conversation complete**
  - After reaching COMPLETED state
  - Send: "Hello again"
  - Expected: Should handle gracefully (restart or acknowledge)

- [ ] **State persistence**
  - Start conversation
  - Wait 10 minutes
  - Continue conversation
  - Verify state maintained (if using Redis)

- [ ] **Payment claimed multiple times**
  - Send "PAID" when already in BROADCAST_OPTIN
  - Verify doesn't create duplicate flow

### Phase 4: Payment Integration Testing

#### Crypto Testing

- [ ] **Correct wallet address displayed**
  - Verify: `0x450d6188aadd0f6f4d167cfc8d092842903b36d6`
  - Check no typos or formatting issues

- [ ] **Small test transaction**
  - Send $10 in crypto to wallet
  - Verify detection (if auto-verification enabled)

#### Stripe Testing

- [ ] **Generate payment link**
  - Verify link works
  - Opens Stripe checkout

- [ ] **Test card payment**
  - Use test card: 4242 4242 4242 4242
  - Complete payment
  - Verify webhook received
  - Check user receives confirmation

- [ ] **Cancelled payment**
  - Start payment
  - Click back/cancel
  - Verify handles gracefully

#### PayPal Testing

- [ ] **PayPal.me link correct**
  - Click link
  - Verify amount pre-filled

- [ ] **Sandbox payment**
  - If using PayPal API
  - Test with sandbox account

### Phase 5: Security Testing

- [ ] **Webhook signature validation**
  ```bash
  # Send POST without valid signature
  curl -X POST https://your-webhook-url \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  # Should return 403 Forbidden
  ```

- [ ] **Invalid verify token**
  ```bash
  # Try webhook verification with wrong token
  curl "https://your-webhook-url?hub.mode=subscribe&hub.verify_token=WRONG&hub.challenge=test"
  # Should return 403
  ```

- [ ] **Environment variables not exposed**
  - Check function responses don't leak tokens
  - Verify no secrets in error messages

- [ ] **Rate limiting (if implemented)**
  - Send 100 messages in 1 minute
  - Verify rate limit kicks in

### Phase 6: Performance Testing

- [ ] **Response time under load**
  - Send messages from 3 users simultaneously
  - Verify all < 5 second response time

- [ ] **Cold start time**
  - Wait 15 minutes (function cold)
  - Send message
  - Measure response time

- [ ] **Message delivery success rate**
  - Send 20 test messages
  - Verify all 20 delivered

---

## Automated Testing Script

Save as `test-whatsapp.js`:

```javascript
const fetch = require('node-fetch');

const WEBHOOK_URL = 'https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook';
const PHONE = '+14155551234'; // Your test phone

async function sendTestMessage(message) {
  const webhook_payload = {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: PHONE,
            id: `test_${Date.now()}`,
            text: { body: message },
            timestamp: Math.floor(Date.now() / 1000)
          }]
        }
      }]
    }]
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': 'sha256=test' // You'd need to calculate this properly
    },
    body: JSON.stringify(webhook_payload)
  });

  console.log(`Sent: "${message}" - Status: ${response.status}`);
}

async function runTests() {
  console.log('Starting automated tests...\n');

  // Test 1: Initial message
  await sendTestMessage('Hello');
  await sleep(2000);

  // Test 2: Select coaching
  await sendTestMessage('1');
  await sleep(2000);

  // Test 3: Select crypto
  await sendTestMessage('1');
  await sleep(2000);

  // Test 4: Claim payment
  await sendTestMessage('PAID');
  await sleep(3000);

  // Test 5: Opt into broadcast
  await sendTestMessage('YES');

  console.log('\nTests complete!');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runTests();
```

---

## Manual Testing Workflow

### Day 1: Basic Flow

1. Send "Hello" from your phone
2. Follow full coaching flow
3. Follow full psychic flow
4. Test general questions flow

### Day 2: Payment Methods

1. Test all 3 payment methods for coaching
2. Test all 3 payment methods for psychic
3. Test "cannot afford" flow

### Day 3: Edge Cases

1. Test invalid inputs
2. Test natural language inputs
3. Test message timing

### Day 4: Integration Testing

1. Make small real payment (refund after)
2. Test full end-to-end flow
3. Verify admin receives notifications

### Day 5: User Acceptance Testing

1. Invite 3 beta testers
2. Have them test without instructions
3. Collect feedback
4. Fix issues found

---

## Monitoring After Launch

### Daily (First Week)

- [ ] Check Netlify function logs for errors
- [ ] Review conversation states (check Redis)
- [ ] Verify all payments claimed are legitimate
- [ ] Response time metrics

### Weekly (First Month)

- [ ] Conversion rate: visitors → WhatsApp contact
- [ ] Conversion rate: WhatsApp contact → menu choice
- [ ] Conversion rate: menu choice → payment
- [ ] Average time to payment
- [ ] Drop-off points in conversation

### Ongoing

- [ ] WhatsApp API rate limits
- [ ] Function execution costs
- [ ] Storage costs (Redis)
- [ ] Payment processor fees

---

## Debugging Checklist

**Issue: Not receiving messages**

1. Check webhook subscribed to "messages"
2. Verify WHATSAPP_ACCESS_TOKEN valid
3. Check Netlify function logs
4. Verify phone number configuration
5. Test sending message via API directly

**Issue: Messages delayed**

1. Check function cold start time
2. Verify no infinite loops
3. Check external API response times (payment, Redis)
4. Review Netlify function timeout settings

**Issue: State not persisting**

1. Verify Redis connection
2. Check state expiry settings
3. Confirm conversation state being saved
4. Test Redis get/set directly

**Issue: Payments not verifying**

1. Check payment webhook configured
2. Verify webhook secret correct
3. Check payment processor test mode vs live mode
4. Review payment webhook logs

---

## Success Criteria

Before declaring "production ready":

- [ ] All 13 core conversation flows work
- [ ] Response time < 3 seconds average
- [ ] No errors in 100 consecutive messages
- [ ] Payment verification works (at least manual)
- [ ] 3 beta testers complete full flow successfully
- [ ] Monitoring and alerts configured
- [ ] Rollback plan tested
- [ ] Admin can manually intervene if bot fails

---

## Testing Tools

**Recommended:**

1. **Postman** - API testing
2. **ngrok** - Local webhook testing
3. **Netlify CLI** - Local function testing
4. **WhatsApp Business API Test Tool** - In Meta dashboard
5. **Redis CLI** - State inspection
6. **Stripe CLI** - Webhook testing

**Install all:**

```bash
npm install -g netlify-cli
brew install ngrok
npm install -g stripe-cli
```
