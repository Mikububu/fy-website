# How to Get Your Meta WhatsApp Information

## 1. Get Phone Number

Go to: https://business.facebook.com/wa/manage/phone-numbers/

**What to copy:**
- The phone number shown (e.g., +1 415 555 1234)
- Format for website: Remove +, spaces, parentheses → `14155551234`

---

## 2. Get Phone Number ID

Go to: https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-dev-console/

Look for "Phone number ID" - it's a long number like: `123456789012345`

**Or use this API call:**

```bash
curl -X GET "https://graph.facebook.com/v18.0/YOUR_BUSINESS_ACCOUNT_ID/phone_numbers" \
  -H "Authorization: Bearer YOUR_TEMP_ACCESS_TOKEN"
```

---

## 3. Get Business Account ID (WABA ID)

Go to: https://business.facebook.com/wa/manage/home/

Look in the URL or top-left corner. It's a number like: `123456789012345`

**Or it's shown in the WhatsApp API Setup page at the top**

---

## 4. Get App Secret

Go to: https://developers.facebook.com/apps/YOUR_APP_ID/settings/basic/

Click "Show" next to "App Secret"

---

## 5. Get Temporary Access Token

Go to: https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-dev-console/

Look for "Temporary access token" - copy the whole thing (starts with "EAA...")

**Note:** This expires in 24 hours. We'll use it to test, then upgrade to permanent.

---

## Quick Test Command

Once you have the info, test it works:

```bash
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_TEMP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PERSONAL_PHONE",
    "type": "text",
    "text": {
      "body": "Test from Forbidden Yoga WhatsApp API"
    }
  }'
```

Replace:
- `YOUR_PHONE_NUMBER_ID` - From step 2
- `YOUR_TEMP_ACCESS_TOKEN` - From step 5
- `YOUR_PERSONAL_PHONE` - Your personal phone (international format: 14155551234)

If you get a success response, you're ready to proceed!

---

## What to Send Me

Please provide:

```
WHATSAPP_BUSINESS_PHONE: +1 415 555 1234 (the business number)
PHONE_NUMBER_ID: 123456789012345
BUSINESS_ACCOUNT_ID: 123456789012345
APP_SECRET: abc123xyz
TEMP_ACCESS_TOKEN: EAA...
```

I'll use these to complete the setup.
