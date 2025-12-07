# Quick Start - WhatsApp Integration

## 🎯 Your 3-Step Action Plan

### Step 1: Meta Setup (Today - 30 min)
1. Go to https://business.facebook.com
2. Create Meta Business Account
3. Go to https://developers.facebook.com/apps
4. Create app → Select "Business"
5. Add WhatsApp product
6. Register phone number (must not be on regular WhatsApp)
7. Get these values and save them:
   - Access Token (permanent - not temp!)
   - Phone Number ID
   - App Secret
   - Create Webhook Verify Token (random string)

### Step 2: Deploy Code (Tomorrow - After template approval)
1. **Update index.html line 525:**
   ```html
   <a href="https://wa.me/YOURNUMBER?text=Hello%2C%20I%27m%20interested%20in%20ForbiddenYoga"
      class="book-guru-button" target="_blank">ONBOARDING THE FORBIDDEN</a>
   ```

2. **Delete lines 536-539** (SuperSaaS scripts)

3. **Add to Netlify environment variables:**
   - WHATSAPP_ACCESS_TOKEN
   - WHATSAPP_PHONE_NUMBER_ID
   - WHATSAPP_BUSINESS_ACCOUNT_ID
   - WHATSAPP_APP_SECRET
   - WEBHOOK_VERIFY_TOKEN
   - CRYPTO_WALLET_ADDRESS

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Add WhatsApp integration"
   git push origin main
   ```

5. **Configure webhook in Meta:**
   - URL: `https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook`
   - Verify Token: (same as env variable)
   - Subscribe to: `messages`

### Step 3: Test (Same day as deployment - 15 min)
1. Click button on website → Opens WhatsApp ✅
2. Send "Hello" → Receive welcome + menu ✅
3. Reply "1" → Receive coaching payment options ✅
4. Reply "1" → Receive crypto address ✅
5. Reply "PAID" → Receive verification + broadcast question ✅
6. Reply "YES" → Receive final message ✅

---

## 📋 Environment Variables Cheat Sheet

Copy these to Netlify (Site Settings → Environment Variables):

```
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxx (from Meta System Users)
WHATSAPP_PHONE_NUMBER_ID=123456789012345 (from WhatsApp API Setup)
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345 (from WhatsApp Manager)
WHATSAPP_APP_SECRET=abc123xyz (from App Settings → Basic)
WEBHOOK_VERIFY_TOKEN=YourRandomString123! (create this yourself)
CRYPTO_WALLET_ADDRESS=0x450d6188aadd0f6f4d167cfc8d092842903b36d6
```

---

## ⚡ Code Changes Required

**File: index.html**

**FIND (lines 523-539):**
```html
<footer class="footer">
    <div class="footer-booking">
        <button onclick="supersaas.show()" class="book-guru-button">BOOK A GURU SESSION</button>
    </div>
```

**REPLACE WITH:**
```html
<footer class="footer">
    <div class="footer-booking">
        <a href="https://wa.me/14155551234?text=Hello%2C%20I%27m%20interested%20in%20ForbiddenYoga"
           class="book-guru-button" target="_blank" rel="noopener noreferrer">ONBOARDING THE FORBIDDEN</a>
    </div>
```

**IMPORTANT:** Replace `14155551234` with YOUR WhatsApp Business number!

**DELETE (lines 536-539):**
```html
<!-- SuperSaaS Booking Widget -->
<script src="https://cdn.supersaas.net/widget.js"></script>
<script class="supersaas-widget">var supersaas = new SuperSaaS("Forbidden_Yoga","FY_Coaching_session",{
    css: "https://www.forbidden-yoga.com/supersaas-custom.css"
})</script>
```

---

## 🔗 Important URLs

**Meta Setup:**
- Business Manager: https://business.facebook.com
- Developer Apps: https://developers.facebook.com/apps
- WhatsApp Manager: https://business.facebook.com/wa/manage/

**After Deployment:**
- Your webhook: https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook
- Netlify dashboard: https://app.netlify.com
- Function logs: Netlify Dashboard → Functions → whatsapp-webhook

---

## 🎬 Conversation Flow Quick Reference

```
User: "Hello"
Bot: Welcome message
Bot: Menu (1, 2, or 3)

User: "1" (Coaching $5k)
Bot: Payment method? (1: Crypto, 2: Card, 3: PayPal, 4: Can't afford)

User: "1" (Crypto)
Bot: Send to 0x450d6188aadd0f6f4d167cfc8d092842903b36d6
Bot: Reply PAID when done

User: "PAID"
Bot: Verifying...
Bot: Payment verified ✅
Bot: Join broadcast list? YES/NO

User: "YES"
Bot: Michael will contact you directly
```

---

## ⚠️ Common Mistakes

1. **Using temp access token** → Get permanent token from System Users
2. **Wrong phone format** → No +, no spaces: `14155551234`
3. **Webhook verify token mismatch** → Must match in Netlify AND Meta
4. **Forgot to subscribe webhook** → Subscribe to `messages` field
5. **Testing before templates approved** → User-initiated messages work, bot messages need approved templates

---

## 📞 What You Need

**Before Starting:**
- [ ] Phone number NOT on regular WhatsApp
- [ ] Business email for Meta account
- [ ] Access to Netlify dashboard
- [ ] Access to forbidden-yoga.com repo

**From Meta (during setup):**
- [ ] Permanent Access Token
- [ ] Phone Number ID
- [ ] Business Account ID
- [ ] App Secret

**You Create:**
- [ ] Webhook Verify Token (random string)

---

## 🚨 Rollback Plan

If something breaks:

```bash
git revert HEAD
git push origin main
```

Or manually restore the SuperSaaS button from git history.

---

## ✅ Launch Checklist

Before removing calendar:

- [ ] Meta setup complete
- [ ] Phone number verified
- [ ] Access token (permanent) obtained
- [ ] All env vars added to Netlify
- [ ] Code deployed
- [ ] Webhook verified (green checkmark in Meta)
- [ ] Tested: Send "Hello" → Receive menu
- [ ] Tested: Full flow (1→1→PAID→YES)
- [ ] Tested from different phone
- [ ] Privacy policy updated
- [ ] Ready to manually verify payments

---

## 📚 Full Documentation

For detailed guides, see:
- `WHATSAPP_README.md` - Overview and architecture
- `WHATSAPP_SETUP_GUIDE.md` - Meta setup walkthrough
- `DEPLOYMENT_GUIDE.md` - Deployment steps
- `PAYMENT_INTEGRATION_GUIDE.md` - Payment automation
- `TESTING_GUIDE.md` - Testing procedures

---

## 💡 Pro Tips

1. **Test with Meta test number first** (5 recipients limit)
2. **Submit templates ASAP** (24-48hr approval time)
3. **Use ngrok for local testing** before deploying
4. **Monitor Netlify logs** closely first week
5. **Have rollback plan ready** before launch

---

## Time Estimate

- Meta setup: 30 minutes
- Template approval: 24-48 hours (waiting)
- Code changes: 10 minutes
- Deployment: 5 minutes
- Testing: 15 minutes

**Total active time: ~1 hour**
**Total calendar time: 2-3 days**

---

Start with Step 1 above, then check `WHATSAPP_SETUP_GUIDE.md` for detailed instructions!
