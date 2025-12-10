# Netlify Environment Variables Setup

## Quick Setup Instructions

1. Go to: https://app.netlify.com/sites/forbidden-yoga/configuration/env

2. Click "Add a variable" for each of these:

### Required Variables:

**WHATSAPP_ACCESS_TOKEN**
```
YOUR_WHATSAPP_ACCESS_TOKEN_HERE
```
Get this from Meta Business Manager (System User with whatsapp_business_messaging permissions)

**WHATSAPP_PHONE_NUMBER_ID**
```
YOUR_PHONE_NUMBER_ID_HERE
```
Get this from your WhatsApp Business API settings in Meta Developer Console

**WHATSAPP_BUSINESS_ACCOUNT_ID**
```
YOUR_BUSINESS_ACCOUNT_ID_HERE
```
Get this from your WhatsApp Business Account in Meta Business Manager

**WHATSAPP_APP_SECRET**
```
YOUR_APP_SECRET_HERE
```
Get this from your App Settings > Basic in Meta Developer Console

**WEBHOOK_VERIFY_TOKEN**
```
YOUR_WEBHOOK_VERIFY_TOKEN_HERE
```
Create a secure random string (e.g., use: openssl rand -base64 32)

**CRYPTO_WALLET_ADDRESS**
```
YOUR_CRYPTO_WALLET_ADDRESS_HERE
```
Your Ethereum/crypto wallet address for receiving payments

3. Click "Save" after adding each one

4. After saving all variables, Netlify will automatically redeploy your site

5. Wait 2-3 minutes for deployment to complete

## Verify Deployment

Check deployment status:
https://app.netlify.com/sites/forbidden-yoga/deploys

When it shows "Published", your webhook will be live at:
https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook

## Next Steps

After environment variables are set and site is deployed:
1. Configure webhook in Meta (see CONFIGURE_WEBHOOK.md)
2. Test the integration
