#!/usr/bin/env python3
"""Set Netlify environment variables for WhatsApp integration"""

import requests
import json

# Configuration
NETLIFY_TOKEN = "nfp_qubuGtQyMZ8QxwPhxbAT2EcsgpdxLY7Qd4ba"
ACCOUNT_ID = "6708c9456e59b608121e4b46"
SITE_ID = "bb5469f4-0d91-49a9-852c-c9a6d7bf41b1"

# Environment variables to set
ENV_VARS = {
    "WHATSAPP_ACCESS_TOKEN": "EAAT0NJPTJ0sBQMFOSTMmg9yDNRpZC6nZCcbUuEynW4lkv9TjMtD0iHTROGWLpgImY7xO81GyAqUsDxAZB0D9IYtOG7pZB0JbixPuOWZBeZCv8ecZBl0ZAmebcNlp7S5r5lHnZBaVX0Vomn94ggP9PHok5ivYpPZC1SWVhbICi1mgXed91bPOQikHFjwLGiGdBut3jS2AZDZD",
    "WHATSAPP_PHONE_NUMBER_ID": "1353307962914332",
    "WHATSAPP_BUSINESS_ACCOUNT_ID": "2058340678311162",
    "WHATSAPP_APP_SECRET": "1503be87b8baa00cf4221f2d406987d4",
    "WEBHOOK_VERIFY_TOKEN": "ForbiddenYoga_Secure_2025_Token_XYZ789",
    "CRYPTO_WALLET_ADDRESS": "0x450d6188aadd0f6f4d167cfc8d092842903b36d6"
}

headers = {
    "Authorization": f"Bearer {NETLIFY_TOKEN}",
    "Content-Type": "application/json"
}

print("🚀 Setting Netlify Environment Variables")
print("=" * 50)
print()

for key, value in ENV_VARS.items():
    print(f"Setting {key}...", end=" ")

    # Create/update environment variable
    url = f"https://api.netlify.com/api/v1/accounts/{ACCOUNT_ID}/env/{key}?site_id={SITE_ID}"

    payload = {
        "key": key,
        "scopes": ["builds", "functions", "runtime", "post_processing"],
        "values": [{
            "value": value,
            "context": "all"
        }]
    }

    try:
        response = requests.put(url, headers=headers, json=payload)

        if response.status_code in [200, 201]:
            print("✅")
        elif response.status_code == 404:
            # Try POST instead of PUT for creating new vars
            url_post = f"https://api.netlify.com/api/v1/accounts/{ACCOUNT_ID}/env"
            payload["site_id"] = SITE_ID
            response = requests.post(url_post, headers=headers, json=payload)
            if response.status_code in [200, 201]:
                print("✅ (created)")
            else:
                print(f"❌ ({response.status_code})")
                print(f"   Error: {response.text}")
        else:
            print(f"❌ ({response.status_code})")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

print()
print("✅ All environment variables set!")
print()
print("Next steps:")
print("1. Netlify will auto-redeploy (wait 2-3 minutes)")
print("2. Configure webhook in Meta")
print("3. Test the integration!")
