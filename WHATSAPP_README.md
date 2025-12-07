# WhatsApp Business Integration - Forbidden Yoga

## 📋 Project Overview

This implementation replaces the Calendly booking system with WhatsApp Business API conversational onboarding.

**What's Changed:**
- ✅ Calendar button → "ONBOARDING THE FORBIDDEN" WhatsApp link
- ✅ Automated conversational flow (coaching, psychic cleansing, general questions)
- ✅ Payment handling (crypto, credit card, PayPal)
- ✅ Broadcast list opt-in
- ✅ Serverless webhook using Netlify Functions

---

## 📁 Files Created

### Documentation
- `WHATSAPP_SETUP_GUIDE.md` - Step-by-step Meta Business setup
- `DEPLOYMENT_GUIDE.md` - How to deploy the integration
- `PAYMENT_INTEGRATION_GUIDE.md` - Payment processor integration
- `TESTING_GUIDE.md` - Comprehensive testing procedures
- `WHATSAPP_README.md` - This file

### Code
- `netlify/functions/whatsapp-webhook.js` - Main webhook handler
- `netlify/functions/package.json` - Dependencies
- `.env.example` - Environment variable template
- `netlify.toml` - Updated Netlify configuration
- `.gitignore` - Updated to exclude secrets

### To Be Modified (By You)
- `index.html` (lines 523-539) - Update button to WhatsApp link

---

## 🚀 Quick Start Guide

### 1. Complete WhatsApp Setup (30 minutes)

Follow `WHATSAPP_SETUP_GUIDE.md` to:

1. Create Meta Business Account
2. Create WhatsApp Business App
3. Register phone number
4. Get access token (permanent)
5. Submit message templates for approval
6. Get Phone Number ID and App Secret

**You'll need:**
- Business email
- Phone number (not currently on WhatsApp)
- Business verification documents (possibly)

### 2. Update Website Button (5 minutes)

**Edit `index.html`:**

Replace lines 523-539 with:

```html
<!-- Footer -->
<footer class="footer">
    <div class="footer-booking">
        <a href="https://wa.me/YOURNUMBERHERE?text=Hello%2C%20I%27m%20interested%20in%20ForbiddenYoga" class="book-guru-button" target="_blank" rel="noopener noreferrer">ONBOARDING THE FORBIDDEN</a>
    </div>
    <div class="footer-links">
        <a href="/privacy.html">Privacy Policy</a>
        <span>•</span>
        <a href="/terms.html">Terms & Conditions</a>
    </div>
    <div class="footer-copyright">Spiritual Art Performance Project</div>
</footer>
```

**Important:** Replace `YOURNUMBERHERE` with your WhatsApp Business number:
- Format: Country code + number (no + or spaces)
- Example: `14155551234` for +1 (415) 555-1234

**Delete:**
```html
<!-- SuperSaaS Booking Widget -->
<script src="https://cdn.supersaas.net/widget.js"></script>
<script class="supersaas-widget">var supersaas = new SuperSaaS("Forbidden_Yoga","FY_Coaching_session",{
    css: "https://www.forbidden-yoga.com/supersaas-custom.css"
})</script>
```

### 3. Set Environment Variables in Netlify (10 minutes)

Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables

Add these (get values from WhatsApp setup):

| Variable | Value |
|----------|-------|
| `WHATSAPP_ACCESS_TOKEN` | Your permanent token from Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | From WhatsApp API Setup |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | From WhatsApp Manager |
| `WHATSAPP_APP_SECRET` | From App Settings → Basic |
| `WEBHOOK_VERIFY_TOKEN` | Create random string (save it) |
| `CRYPTO_WALLET_ADDRESS` | `0x450d6188aadd0f6f4d167cfc8d092842903b36d6` |

### 4. Deploy (2 minutes)

```bash
# Commit changes
git add .
git commit -m "Add WhatsApp Business integration"
git push origin main
```

Netlify auto-deploys. Check deployment status in dashboard.

### 5. Configure Webhook in Meta (5 minutes)

After deployment:

1. Go to: https://developers.facebook.com/apps/YOUR_APP_ID
2. Click **WhatsApp** → **Configuration**
3. Under "Webhook", click **Edit**
4. Enter:
   - **Callback URL:** `https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook`
   - **Verify Token:** Same value from step 3 above
5. Click **Verify and Save**
6. Subscribe to: `messages` and `message_status`

### 6. Test (15 minutes)

1. Visit https://forbidden-yoga.com
2. Click "ONBOARDING THE FORBIDDEN" button
3. Send "Hello" in WhatsApp
4. Should receive welcome message + menu
5. Test full flow (see TESTING_GUIDE.md)

---

## 💬 Conversation Flow

```
User sends message
    ↓
[BOT] Welcome message
[BOT] Menu (1: Coaching, 2: Psychic, 3: Questions)
    ↓
User chooses 1 (Coaching - $5,000)
    ↓
[BOT] Payment method? (1: Crypto, 2: Card, 3: PayPal, 4: Can't afford)
    ↓
User chooses 1 (Crypto)
    ↓
[BOT] Send to: 0x450d6188aadd0f6f4d167cfc8d092842903b36d6
[BOT] Reply PAID when done
    ↓
User: "PAID"
    ↓
[BOT] Verifying...
[BOT] Payment verified ✅
[BOT] Join broadcast list? (YES/NO)
    ↓
User: "YES"
    ↓
[BOT] Michael will contact you directly
[COMPLETED]
```

**Alternative flows:**
- Choice 2: Psychic cleansing ($500)
- Choice 3: General questions (free form)
- Choice 4: Cannot afford (explain situation)

---

## 🔧 Architecture

```
User's WhatsApp
    ↓
WhatsApp Business API (Meta)
    ↓
Webhook POST request
    ↓
forbidden-yoga.com/.netlify/functions/whatsapp-webhook
    ↓
Netlify Function (serverless)
    ↓
1. Verify webhook signature
2. Parse incoming message
3. Get conversation state (in-memory or Redis)
4. Process message through state machine
5. Send response via WhatsApp API
6. Update conversation state
    ↓
Response sent to user
```

**State Management:**
- **Development:** In-memory Map (resets on cold start)
- **Production:** Upstash Redis (recommended - see PAYMENT_INTEGRATION_GUIDE.md)

**Security:**
- Webhook signature verification (prevents spoofing)
- Environment variables in Netlify (not in code)
- HTTPS only
- No sensitive data logged

---

## 💳 Payment Integration

**Currently Implemented:**
- ✅ Display crypto wallet address
- ✅ Generate payment links (placeholder)
- ⚠️ Manual payment verification (admin confirms)

**To Add for Full Automation:**

See `PAYMENT_INTEGRATION_GUIDE.md` for:

1. **Stripe** - Credit card auto-verification
2. **PayPal API** - PayPal auto-verification
3. **Etherscan API** - Crypto auto-verification
4. **Upstash Redis** - Persistent conversation state

**Quick Start (Manual Verification):**

The bot will:
1. Send payment link
2. User claims "PAID"
3. You manually check wallet/PayPal/Stripe
4. Manually trigger bot to continue (or it continues after delay)

**Later:** Add webhook listeners to auto-verify.

---

## 📊 Monitoring

### Netlify Function Logs

**Via Dashboard:**
1. Netlify Dashboard → Functions tab
2. Click `whatsapp-webhook`
3. View real-time logs

**Via CLI:**
```bash
netlify functions:log whatsapp-webhook --follow
```

### What to Monitor

**Daily (first week):**
- Function errors
- Response times
- Payment claims vs actual payments
- Conversation drop-off points

**Weekly:**
- Conversion rates (visitor → contact → payment)
- Most common user paths
- Average time to conversion

**Alerts to Set Up:**
- Function failure rate > 5%
- Response time > 5 seconds
- Payment fraud attempts

---

## 🐛 Troubleshooting

### "Webhook verification failed"

**Check:**
- `WEBHOOK_VERIFY_TOKEN` in Netlify matches Meta
- Webhook URL exactly: `https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook`
- Function deployed successfully (check Netlify Functions tab)

### "Not receiving messages"

**Check:**
- Webhook subscribed to `messages` field in Meta
- `WHATSAPP_ACCESS_TOKEN` is valid (not temp token)
- Phone number configured correctly
- Check Netlify function logs for errors

### "Can't send messages"

**Check:**
- `WHATSAPP_PHONE_NUMBER_ID` is correct
- Access token has `whatsapp_business_messaging` permission
- Not hitting rate limits (250 messages/day for free tier)

### "Button doesn't open WhatsApp"

**Check:**
- Phone number format: no +, no spaces (e.g., `14155551234`)
- Link format: `https://wa.me/14155551234?text=...`
- Test in different browsers/devices

---

## 🔐 Security Checklist

- [x] Environment variables in Netlify (not committed to git)
- [x] `.env` in `.gitignore`
- [x] Webhook signature verification
- [x] HTTPS only
- [ ] Rate limiting (TODO - add if spam becomes issue)
- [ ] PCI compliance (use Stripe - never store cards)
- [ ] Privacy policy updated
- [ ] Terms updated with refund policy

---

## 📈 Roadmap

### Phase 1: MVP (Current)
- [x] Basic WhatsApp integration
- [x] Conversational flow
- [x] Manual payment verification
- [x] Deployment to Netlify

### Phase 2: Automation
- [ ] Stripe integration (auto-verify credit card)
- [ ] Etherscan integration (auto-verify crypto)
- [ ] PayPal API (auto-verify PayPal)
- [ ] Upstash Redis (persistent state)

### Phase 3: Advanced Features
- [ ] Broadcast list management
- [ ] Scheduled broadcasts
- [ ] Analytics dashboard
- [ ] Admin panel for manual intervention
- [ ] Conversation history export

### Phase 4: Optimization
- [ ] Multi-language support
- [ ] A/B test message variations
- [ ] Smart payment reminders
- [ ] Abandoned cart recovery

---

## 📞 Support

**Issue?** Check in order:

1. `TROUBLESHOOTING` section above
2. `TESTING_GUIDE.md` for test procedures
3. Netlify function logs
4. WhatsApp API status: https://developers.facebook.com/status/
5. Meta Business Help: https://business.facebook.com/business/help

**Common Resources:**
- Meta Developer Docs: https://developers.facebook.com/docs/whatsapp
- Netlify Functions: https://docs.netlify.com/functions/overview/
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp/cloud-api

---

## 💰 Cost Estimate

**Free Tier (0-1,000 conversations/month):**
- WhatsApp API: Free (1,000 conversations)
- Netlify Functions: Free (125k invocations)
- Upstash Redis: Free (10k requests/day)
- **Total: $0/month**

**Paid Tier (1,000+ conversations/month):**
- WhatsApp API: ~$0.005 - $0.09 per conversation
- Netlify Functions: $25/month (after free tier)
- Upstash Redis: $0.20/month (after free tier)
- Stripe fees: 2.9% + $0.30 per transaction
- **Estimated: $50-200/month** (depends on volume)

---

## ✅ Pre-Launch Checklist

Before removing calendar and going live:

- [ ] All WhatsApp setup complete
- [ ] Message templates approved by Meta
- [ ] Environment variables set in Netlify
- [ ] Webhook verified and connected
- [ ] Website button updated and tested
- [ ] Full conversation flow tested (all 3 paths)
- [ ] Payment links working
- [ ] Test from 3 different phones
- [ ] Admin notification process defined
- [ ] Rollback plan ready
- [ ] Privacy policy updated
- [ ] Terms & conditions updated
- [ ] Monitoring set up

**Estimated Time to Launch:** 2-4 days
- Day 1: Meta setup + template submission
- Day 2: Wait for template approval
- Day 3: Code deployment + testing
- Day 4: Final testing + go live

---

## 🎯 Success Metrics

**Track these after launch:**

- Click-through rate (website button → WhatsApp)
- Response rate (WhatsApp opened → message sent)
- Conversion rate (message sent → menu choice)
- Payment rate (menu choice → payment claim)
- Completion rate (payment → broadcast opt-in)

**Target benchmarks:**
- Response rate: >60%
- Menu choice rate: >80%
- Payment claim rate: >30%
- Overall conversion: >15%

---

## 📝 Notes

**Payment Verification:**
Currently requires manual verification. See `PAYMENT_INTEGRATION_GUIDE.md` for automation options.

**Conversation State:**
Uses in-memory storage (resets on function cold start). For production, migrate to Redis.

**Message Templates:**
Meta requires 24-48hr approval. Plan accordingly.

**Phone Number:**
Cannot use number already on regular WhatsApp. Consider getting dedicated business number.

**Testing:**
Use Meta test number for development. Has limit of 5 test recipients.

---

**Questions?** Review the guides:
1. `WHATSAPP_SETUP_GUIDE.md` - Meta Business setup
2. `DEPLOYMENT_GUIDE.md` - Deployment steps
3. `PAYMENT_INTEGRATION_GUIDE.md` - Payment automation
4. `TESTING_GUIDE.md` - Testing procedures

**Ready to deploy?** Start with `WHATSAPP_SETUP_GUIDE.md`
