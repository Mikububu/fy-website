#!/bin/bash

# Automated Netlify Environment Variables Setup
# This script sets all required environment variables for WhatsApp integration

echo "🚀 Forbidden Yoga - WhatsApp Integration Setup"
echo "=============================================="
echo ""

# Check if NETLIFY_AUTH_TOKEN is set
if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
  echo "❌ NETLIFY_AUTH_TOKEN not set"
  echo ""
  echo "Please set your Netlify API token:"
  echo "1. Go to: https://app.netlify.com/user/applications#personal-access-tokens"
  echo "2. Create a new token"
  echo "3. Run: export NETLIFY_AUTH_TOKEN='your-token-here'"
  echo "4. Then run this script again"
  exit 1
fi

# Get site ID
echo "📡 Finding Netlify site..."
SITE_ID=$(curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  "https://api.netlify.com/api/v1/sites?name=forbidden-yoga" | \
  python3 -c "import sys, json; sites = json.load(sys.stdin); print(sites[0]['id'] if sites else '')")

if [ -z "$SITE_ID" ]; then
  echo "❌ Could not find forbidden-yoga site"
  echo "Please check your Netlify token has access to the site"
  exit 1
fi

echo "✅ Found site: $SITE_ID"
echo ""

# Define environment variables
declare -A ENV_VARS
ENV_VARS[WHATSAPP_ACCESS_TOKEN]="EAAT0NJPTJ0sBQE7mfdbtZCHDujZAHeu2EJJsPB1RZAA8K70mwQVazZAdLUoKXOXdFyaKTmIjwRQb5jhfMmJy0RZCd7YiUBDTivfeOHqhG7ZBiYQufAlVRMnAr77CFY8l0uzoa48MB6ZBFKZBsCTj8NmChKyfpo5er7OAF0mTlSG3eKq5eGJTm6bV5aL6MbJi2H8HCtsYGHh7ZCedUaFhQk1dZCafvAOvGIyUaNBZAZBMiqYGWvXj8Ng1Wkfv78ZCNCIRW08dYmTEaJXporxCO6A9BU4a3QtPz"
ENV_VARS[WHATSAPP_PHONE_NUMBER_ID]="863457346858125"
ENV_VARS[WHATSAPP_BUSINESS_ACCOUNT_ID]="2058340678311162"
ENV_VARS[WHATSAPP_APP_SECRET]="1503be87b8baa00cf4221f2d406987d4"
ENV_VARS[WEBHOOK_VERIFY_TOKEN]="ForbiddenYoga_Secure_2025_Token_XYZ789"
ENV_VARS[CRYPTO_WALLET_ADDRESS]="0x450d6188aadd0f6f4d167cfc8d092842903b36d6"

echo "📝 Setting environment variables..."
echo ""

# Set each variable
for key in "${!ENV_VARS[@]}"; do
  value="${ENV_VARS[$key]}"

  echo "Setting $key..."

  response=$(curl -s -X POST \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/env" \
    -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key\": \"$key\",
      \"values\": [{
        \"value\": \"$value\",
        \"context\": \"all\"
      }]
    }")

  if echo "$response" | grep -q "key"; then
    echo "  ✅ $key set successfully"
  else
    echo "  ⚠️  $key might already exist or had an error"
    echo "  Response: $response"
  fi
done

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "🔄 Netlify will automatically redeploy your site with the new variables."
echo "⏱️  Wait 2-3 minutes for deployment to complete."
echo ""
echo "Next steps:"
echo "1. Check deployment: https://app.netlify.com/sites/forbidden-yoga/deploys"
echo "2. When deployed, configure webhook in Meta (see CONFIGURE_WEBHOOK.md)"
echo "3. Test the integration!"
echo ""
echo "🎉 Setup complete!"
