# WhatsApp Business API Setup Guide for Forbidden Yoga

## Phase 1: WhatsApp Business Account Setup

### Step 1: Create Meta Business Account
1. Go to https://business.facebook.com
2. Click "Create Account"
3. Fill in business details:
   - Business name: "Forbidden Yoga" or "Sensual Liberation Collective"
   - Your name
   - Business email
4. Verify your email address

### Step 2: Create WhatsApp Business App
1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Select "Business" as app type
4. Fill in app details:
   - App name: "ForbiddenYoga Bot"
   - Contact email: your business email
   - Business Account: select your Meta Business Account
5. Click "Create App"

### Step 3: Add WhatsApp Product
1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set Up"
3. Select or create a Business Portfolio
4. This will take you to the WhatsApp API setup page

### Step 4: Get Your Phone Number
You have two options:

**Option A: Use Test Number (for development)**
- Meta provides a test number automatically
- Good for testing, but has limitations (only 5 test recipients)
- Number shown in "API Setup" > "Step 1: Select phone numbers"

**Option B: Register Your Own Number (for production)**
1. Go to "API Setup" > "Phone Numbers"
2. Click "Add phone number"
3. Enter your business phone number
4. Verify via SMS code
5. **IMPORTANT:** This number cannot be:
   - Already on regular WhatsApp
   - A personal number in use
   - Consider getting a new number for the business

### Step 5: Get Your Access Token
1. In WhatsApp API Setup, go to "Step 3: Send messages with the API"
2. You'll see a "Temporary access token" - **DO NOT USE FOR PRODUCTION**
3. To generate a permanent token:
   - Go to "System Users" in Business Settings
   - Click "Add" and create a system user (e.g., "WhatsApp Bot User")
   - Assign "Admin" role
   - Click "Generate New Token"
   - Select your WhatsApp app
   - Select permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
   - Copy and save this token securely (you won't see it again)

### Step 6: Get Configuration IDs
In the WhatsApp API Setup page, note these values:

1. **Phone Number ID**:
   - Found in "API Setup" > "Step 1"
   - Format: `123456789012345`

2. **WhatsApp Business Account ID (WABA ID)**:
   - Found in top left of WhatsApp section
   - Format: `123456789012345`

3. **App ID**:
   - Found in App Settings > Basic
   - Format: `1234567890123456`

4. **App Secret**:
   - Found in App Settings > Basic > "Show" button
   - Keep this secret!

### Step 7: Create Webhook Verify Token
1. Generate a random string (use password generator)
2. Example: `ForbiddenYoga_Webhook_2025_SecureToken`
3. Save this - you'll need it for webhook setup

---

## Phase 2: Message Template Approval

WhatsApp requires pre-approved templates for business-initiated messages.

### Required Templates

#### Template 1: Welcome Message
**Name:** `welcome_message`
**Category:** UTILITY
**Language:** English
**Content:**
```
Welcome to ForbiddenYoga. If you have a question about a Sensual Liberation Retreat please leave your message.

If you are interested in private coaching or if you want to learn Tantra or understand the Tantric lineage of Michael Vogenberg you can apply for the one month intense coaching program with Michael. The program costs 5,000 USD and the full amount is paid in advance.

We also offer psychic cleansing and channel opening with our Forbidden Yoga psychic Stanislav. This is a video session with a translator from Russian into your language. The price is 500 USD.
```

#### Template 2: Choice Menu
**Name:** `choice_menu`
**Category:** UTILITY
**Language:** English
**Content:**
```
Which of these are you interested in?

1️⃣ One month intense coaching with Michael ($5,000)
2️⃣ Psychic cleansing with Stanislav ($500)
3️⃣ General questions only

Reply with 1, 2, or 3
```

#### Template 3: Broadcast List Opt-in
**Name:** `broadcast_optin`
**Category:** UTILITY
**Language:** English
**Content:**
```
Do you want to stay on the ForbiddenYoga WhatsApp list to receive information, news and updates about upcoming projects?

Reply YES or NO
```

#### Template 4: Final Confirmation
**Name:** `final_confirmation`
**Category:** UTILITY
**Language:** English
**Content:**
```
Michael will contact you directly on WhatsApp. There are no fixed appointment slots. Michael initiates the contact when appropriate.
```

### How to Submit Templates
1. Go to WhatsApp Manager: https://business.facebook.com/wa/manage/message-templates/
2. Click "Create Template"
3. Fill in template details as above
4. Submit for review
5. Approval typically takes 24-48 hours
6. You'll receive email notification when approved

**Note:** You can test your bot before template approval using user-initiated messages (when users message you first).

---

## Phase 3: Webhook Configuration

You need a publicly accessible HTTPS endpoint to receive WhatsApp messages.

### Recommended Architecture: Netlify Functions

**Why Netlify Functions:**
- Already using Netlify for hosting
- Serverless (no server management)
- Free tier sufficient for your use case
- Automatic HTTPS
- Environment variables built-in

### Alternative Options:
1. **Vercel Serverless Functions** - Similar to Netlify
2. **Railway.app** - Easy Node.js deployment
3. **Render.com** - Free tier with persistent storage
4. **DigitalOcean App Platform** - More control, $5/month

### Webhook Requirements:
1. Must be HTTPS (not HTTP)
2. Must respond to GET requests for verification
3. Must respond to POST requests with message data
4. Must verify webhook signature from Meta

---

## Phase 4: Security Considerations

### Environment Variables to Store:
```
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_APP_SECRET=your_app_secret
WEBHOOK_VERIFY_TOKEN=ForbiddenYoga_Webhook_2025_SecureToken
CRYPTO_WALLET_ADDRESS=0x450d6188aadd0f6f4d167cfc8d092842903b36d6
PAYPAL_API_CLIENT_ID=your_paypal_client_id
PAYPAL_API_SECRET=your_paypal_secret
```

### Never Commit to Git:
- Access tokens
- App secrets
- API keys
- Webhook verify tokens

### Webhook Verification:
Every POST request from Meta includes a signature in `X-Hub-Signature-256` header. You must verify this to prevent spoofing.

---

## Phase 5: Testing Strategy

### Test Progression:
1. **Manual Testing Phase**
   - Use WhatsApp test number
   - Add your personal number as test recipient
   - Test each conversation flow manually
   - Verify all message templates work

2. **Beta Testing Phase**
   - Add 3-5 trusted contacts
   - Run through full flows
   - Test payment verification (small amounts)
   - Verify broadcast list functionality

3. **Production Soft Launch**
   - Enable on website
   - Monitor first 10 conversations closely
   - Be ready to respond manually if bot fails

4. **Full Production**
   - After successful soft launch
   - Monitor daily for first week

---

## Quick Reference: Key Information

| Item | Location |
|------|----------|
| App Dashboard | https://developers.facebook.com/apps/YOUR_APP_ID |
| WhatsApp Manager | https://business.facebook.com/wa/manage/ |
| Message Templates | https://business.facebook.com/wa/manage/message-templates/ |
| Phone Numbers | WhatsApp Manager > Phone numbers |
| API Setup | App Dashboard > WhatsApp > API Setup |

---

## Next Steps

1. Complete Phase 1 setup
2. Get all tokens and IDs documented
3. Submit message templates for approval
4. While waiting for approval, set up webhook infrastructure
5. Implement conversational flow logic
6. Test thoroughly before going live

**Estimated Timeline:**
- Meta setup: 1-2 hours
- Template approval: 24-48 hours
- Webhook development: 4-8 hours
- Testing: 2-4 hours
- **Total: 3-5 days**
