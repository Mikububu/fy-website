# Deployment Guide - WhatsApp Business Integration

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Completed WhatsApp Business API setup (see WHATSAPP_SETUP_GUIDE.md)
- [ ] Obtained all required tokens and IDs
- [ ] Submitted message templates for approval
- [ ] WhatsApp Business phone number registered
- [ ] Netlify account with deployment access

## Step-by-Step Deployment

### 1. Update Website Button

**File:** `index.html` (lines 523-539)

Replace the current footer booking section with:

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

**Replace `YOURNUMBERHERE` with your WhatsApp Business number in international format:**
- Example: For +1 (415) 555-1234, use: `14155551234`
- No + sign, no spaces, no parentheses
- Include country code

**Delete these lines (536-539):**
```html
<!-- SuperSaaS Booking Widget -->
<script src="https://cdn.supersaas.net/widget.js"></script>
<script class="supersaas-widget">var supersaas = new SuperSaaS("Forbidden_Yoga","FY_Coaching_session",{
    css: "https://www.forbidden-yoga.com/supersaas-custom.css"
})</script>
```

### 2. Optional: Delete Unused Files

Since you're removing the calendar integration, you can delete:
- `supersaas-custom.css`

**Command:**
```bash
rm supersaas-custom.css
```

### 3. Set Up Environment Variables in Netlify

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your forbidden-yoga site
3. Navigate to: **Site settings** → **Environment variables**
4. Click **Add a variable** for each of these:

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `WHATSAPP_ACCESS_TOKEN` | Your permanent token | Meta Business Suite → System Users |
| `WHATSAPP_PHONE_NUMBER_ID` | Your phone number ID | WhatsApp API Setup → Phone Numbers |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Your WABA ID | WhatsApp Manager (top left) |
| `WHATSAPP_APP_SECRET` | Your app secret | App Settings → Basic |
| `WEBHOOK_VERIFY_TOKEN` | Create a random string | Use password generator |
| `CRYPTO_WALLET_ADDRESS` | Your crypto wallet | Already have: 0x450d6... |

**Important:**
- Click "Save" after adding each variable
- These are only visible to you
- Never commit these to git

### 4. Deploy to Netlify

**Option A: Via Git (Recommended)**

```bash
# Commit your changes
git add .
git commit -m "Add WhatsApp Business integration

- Updated booking button to WhatsApp link
- Added webhook function for conversational flow
- Removed SuperSaaS calendar integration"

# Push to main branch
git push origin main
```

Netlify will automatically detect the push and deploy.

**Option B: Manual Deploy via Netlify CLI**

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### 5. Configure WhatsApp Webhook

After deployment, you'll get a webhook URL. It will be:
```
https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook
```

**Set this in Meta:**

1. Go to your WhatsApp App Dashboard: https://developers.facebook.com/apps/YOUR_APP_ID
2. Click **WhatsApp** → **Configuration**
3. Under "Webhook", click **Edit**
4. Enter:
   - **Callback URL:** `https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook`
   - **Verify Token:** Same value you set in `WEBHOOK_VERIFY_TOKEN`
5. Click **Verify and Save**

If verification succeeds, you'll see a green checkmark.

6. Subscribe to webhook fields:
   - Click **Manage** next to Webhook Fields
   - Enable: `messages` and `message_status`
   - Click **Save**

### 6. Test the Integration

**Test 1: Website Button**
1. Visit https://forbidden-yoga.com
2. Scroll to footer
3. Click "ONBOARDING THE FORBIDDEN"
4. Should open WhatsApp with your business number

**Test 2: Send Test Message**
1. From your personal phone, send "Hello" to your WhatsApp Business number
2. Should receive welcome message within seconds
3. Should receive menu with 3 options

**Test 3: Full Flow**
1. Reply "1" for coaching
2. Should ask for payment method
3. Reply "1" for crypto
4. Should receive wallet address
5. Test each flow path

### 7. Monitoring and Logs

**View Netlify Function Logs:**
1. Go to Netlify Dashboard
2. Click **Functions** tab
3. Click `whatsapp-webhook`
4. View real-time logs

**Check for errors:**
```bash
# Via Netlify CLI
netlify functions:log whatsapp-webhook
```

### 8. Production Readiness Checklist

Before announcing to users:

- [ ] All message templates approved by Meta
- [ ] Webhook verified and connected
- [ ] Environment variables set correctly
- [ ] Test all conversation flows (1, 2, 3)
- [ ] Test all payment methods
- [ ] Verify crypto wallet address displayed correctly
- [ ] Test "cannot afford" flow
- [ ] Test broadcast opt-in/opt-out
- [ ] Set up payment verification system
- [ ] Create process for manual payment confirmation
- [ ] Test from multiple phone numbers
- [ ] Verify messages arrive within 5 seconds
- [ ] Check logs for errors

---

## Troubleshooting

### Issue: Webhook verification fails

**Solution:**
- Verify `WEBHOOK_VERIFY_TOKEN` in Netlify matches what you entered in Meta
- Check webhook URL is exactly: `https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook`
- Ensure function is deployed (check Netlify Functions tab)

### Issue: Not receiving messages

**Solution:**
- Check webhook is subscribed to `messages` field
- Verify `WHATSAPP_ACCESS_TOKEN` is valid (not expired)
- Check Netlify function logs for errors
- Ensure phone number is correctly configured

### Issue: Can't send messages

**Solution:**
- Verify `WHATSAPP_PHONE_NUMBER_ID` is correct
- Check access token has `whatsapp_business_messaging` permission
- For template messages, ensure templates are approved
- Check WhatsApp API rate limits

### Issue: Button doesn't work

**Solution:**
- Verify phone number format: country code + number (e.g., `14155551234`)
- Check no extra characters in `wa.me` link
- Test in different browsers

---

## Rollback Plan

If something goes wrong:

1. **Quick fix:** Revert index.html changes
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Emergency:** Restore SuperSaaS button manually
   - Copy old code from git history
   - Push to main

3. **Disable webhook:**
   - Go to Meta WhatsApp Configuration
   - Unsubscribe from webhook fields

---

## Next Steps After Deployment

1. **Set up payment verification system**
   - Integrate Stripe API for credit card verification
   - Set up PayPal IPN for payment confirmation
   - Use blockchain explorer API for crypto verification

2. **Add persistent storage**
   - Set up Redis or MongoDB for conversation state
   - Prevents state loss on function cold starts

3. **Implement broadcast list**
   - Create database table for opt-in users
   - Set up scheduled function for broadcasts

4. **Analytics**
   - Track conversion rates (menu choice → payment)
   - Monitor response times
   - Log conversation patterns

5. **Rate limiting**
   - Prevent spam/abuse
   - Limit messages per user per hour

---

## Maintenance

**Weekly:**
- Check Netlify function logs for errors
- Verify webhook still connected
- Test a full conversation flow

**Monthly:**
- Review access token expiration
- Check WhatsApp API changes
- Update dependencies if needed

**When needed:**
- Update message templates (requires Meta approval)
- Adjust conversation flows
- Update payment links
