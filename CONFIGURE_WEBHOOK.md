# Configure WhatsApp Webhook in Meta

## Prerequisites
- Netlify environment variables set (see NETLIFY_ENV_SETUP.md)
- Netlify deployment complete and live

## Step-by-Step Instructions

### Step 1: Go to WhatsApp Configuration

Navigate to:
https://developers.facebook.com/apps/1394406562408267/whatsapp-business/wa-settings/

Or:
1. Go to https://developers.facebook.com/apps/
2. Click your app (test)
3. Click "WhatsApp" in left sidebar
4. Click "Configuration"

### Step 2: Edit Webhook

1. Find the "Webhook" section
2. Click "Edit" button

3. Enter these values:

**Callback URL:**
```
https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook
```

**Verify Token:**
```
YOUR_WEBHOOK_VERIFY_TOKEN
```

4. Click "Verify and Save"

### Step 3: Verify Success

If successful, you'll see:
- ✅ Green checkmark next to the webhook URL
- Status: "Active"

If it fails:
- Check that Netlify deployment is complete
- Check that environment variables are saved in Netlify
- Check the webhook URL is exactly as shown above (no extra spaces/characters)

### Step 4: Subscribe to Webhook Fields

1. Below the webhook configuration, find "Webhook fields"
2. Click "Manage"
3. Subscribe to these fields:
   - ✅ **messages** (required)
   - ✅ **message_status** (optional but recommended)
4. Click "Save"

### Step 5: Test the Webhook

#### Option A: Send Test Message via API

```bash
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PERSONAL_PHONE",
    "type": "text",
    "text": {
      "body": "Test from Forbidden Yoga WhatsApp Bot"
    }
  }'
```

Replace `YOUR_PERSONAL_PHONE` with your phone number in international format (e.g., 14155551234)

#### Option B: Test via Website Button

1. Go to https://forbidden-yoga.com
2. Scroll to bottom
3. Click "ONBOARDING THE FORBIDDEN" button
4. Should open WhatsApp with the test number
5. Send a message "Hello"
6. You should receive the welcome message + menu within 5 seconds

### Step 6: Check Netlify Function Logs

To see if webhook is receiving messages:

1. Go to: https://app.netlify.com/sites/forbidden-yoga/functions
2. Click on "whatsapp-webhook"
3. View real-time logs
4. Send a test message
5. You should see log entries showing the message received

## Troubleshooting

### Webhook Verification Fails

**Error:** "The URL couldn't be validated"

**Solutions:**
- Wait 2-3 minutes for Netlify deployment to complete
- Check Netlify Functions tab shows "whatsapp-webhook" is deployed
- Verify WHATSAPP_VERIFY_TOKEN in Netlify matches exactly: `fy_webhook_2024`
- Check no typos in callback URL

### Webhook Verified But No Messages Received

**Solutions:**
- Ensure webhook fields are subscribed to "messages"
- Check WHATSAPP_ACCESS_TOKEN is set in Netlify
- Check WHATSAPP_PHONE_NUMBER_ID matches: `863457346858125`
- View Netlify function logs for errors

### Button Opens WhatsApp But No Auto-Response

**This is expected for test numbers!**

The Meta test number (+1 555 004 6562) has limitations:
- Can only send to 5 approved test recipients
- You need to add recipient phone numbers in Meta first

To add test recipients:
1. Go to: https://developers.facebook.com/apps/1394406562408267/whatsapp-business/wa-dev-console/
2. Scroll to "Step 2: Send messages with the API"
3. Click "Add recipient phone number"
4. Enter your personal WhatsApp number
5. You'll receive a verification code via WhatsApp
6. Enter the code to approve

After adding yourself as a test recipient, try again!

## Production Setup (Later)

For production with a real business number:
1. Register a real phone number (not test number)
2. Complete business verification with Meta
3. Update phone number in index.html
4. All limitations will be removed

## Success Criteria

✅ Webhook shows green checkmark in Meta
✅ Subscribed to "messages" field
✅ Netlify function logs show incoming messages
✅ Test message receives automated response
✅ Full conversation flow works (menu → payment → opt-in)

## Next: Test Full Flow

See TESTING_GUIDE.md for comprehensive testing procedures.
