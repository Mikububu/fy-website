# Netlify Environment Variables Setup

## Quick Setup Instructions

1. Go to: https://app.netlify.com/sites/forbidden-yoga/configuration/env

2. Click "Add a variable" for each of these:

### Required Variables:

**WHATSAPP_ACCESS_TOKEN**
```
EAAT0NJPTJ0sBQE7mfdbtZCHDujZAHeu2EJJsPB1RZAA8K70mwQVazZAdLUoKXOXdFyaKTmIjwRQb5jhfMmJy0RZCd7YiUBDTivfeOHqhG7ZBiYQufAlVRMnAr77CFY8l0uzoa48MB6ZBFKZBsCTj8NmChKyfpo5er7OAF0mTlSG3eKq5eGJTm6bV5aL6MbJi2H8HCtsYGHh7ZCedUaFhQk1dZCafvAOvGIyUaNBZAZBMiqYGWvXj8Ng1Wkfv78ZCNCIRW08dYmTEaJXporxCO6A9BU4a3QtPz
```

**WHATSAPP_PHONE_NUMBER_ID**
```
863457346858125
```

**WHATSAPP_BUSINESS_ACCOUNT_ID**
```
2058340678311162
```

**WHATSAPP_APP_SECRET**
```
1503be87b8baa00cf4221f2d406987d4
```

**WEBHOOK_VERIFY_TOKEN**
```
ForbiddenYoga_Secure_2025_Token_XYZ789
```

**CRYPTO_WALLET_ADDRESS**
```
0x450d6188aadd0f6f4d167cfc8d092842903b36d6
```

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
