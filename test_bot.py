#!/usr/bin/env python3
"""Test WhatsApp bot - Send message and check webhook"""

import requests
import json

# Configuration
ACCESS_TOKEN = "EAAT0NJPTJ0sBQMFOSTMmg9yDNRpZC6nZCcbUuEynW4lkv9TjMtD0iHTROGWLpgImY7xO81GyAqUsDxAZB0D9IYtOG7pZB0JbixPuOWZBeZCv8ecZBl0ZAmebcNlp7S5r5lHnZBaVX0Vomn94ggP9PHok5ivYpPZC1SWVhbICi1mgXed91bPOQikHFjwLGiGdBut3jS2AZDZD"
PHONE_NUMBER_ID = "863457346858125"
YOUR_WHATSAPP = "6285190247022"

print("🧘 Forbidden Yoga Bot Test")
print("=" * 50)
print()

# Test 1: Check webhook configuration
print("1️⃣ Checking webhook configuration...")
response = requests.get(
    f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}",
    params={
        "fields": "webhook_configuration",
        "access_token": ACCESS_TOKEN
    }
)
webhook_data = response.json()
print(f"   Webhook URL: {webhook_data.get('webhook_configuration', {}).get('application', 'Not set')}")
print()

# Test 2: Send test message
print("2️⃣ Sending test message to your WhatsApp...")
message_data = {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": YOUR_WHATSAPP,
    "type": "text",
    "text": {
        "preview_url": False,
        "body": "🧘 Test from Forbidden Yoga bot!\n\nReply with 'Hello' to test the automated conversation flow."
    }
}

response = requests.post(
    f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages",
    headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    },
    json=message_data
)

result = response.json()
if response.status_code == 200:
    print(f"   ✅ Message sent successfully!")
    print(f"   Message ID: {result.get('messages', [{}])[0].get('id', 'Unknown')}")
else:
    print(f"   ❌ Failed to send message")
    print(f"   Error: {result.get('error', {}).get('message', 'Unknown error')}")
print()

# Test 3: Check webhook endpoint
print("3️⃣ Testing webhook endpoint...")
webhook_test = requests.get(
    "https://forbidden-yoga.com/.netlify/functions/whatsapp-webhook",
    params={
        "hub.mode": "subscribe",
        "hub.verify_token": "fy_webhook_2024",
        "hub.challenge": "test_challenge_123"
    }
)
if webhook_test.status_code == 200 and webhook_test.text == "test_challenge_123":
    print("   ✅ Webhook verification working!")
else:
    print(f"   ❌ Webhook verification failed")
    print(f"   Status: {webhook_test.status_code}")
    print(f"   Response: {webhook_test.text}")
print()

print("=" * 50)
print("📱 Check your WhatsApp for the test message!")
print("📝 Reply with 'Hello' to test the bot response")
print()
print("Next steps:")
print("1. Check if you received the test message")
print("2. Reply 'Hello' to the test message")
print("3. You should get welcome message + menu within 5 seconds")
print()
print("If bot doesn't respond to your 'Hello':")
print("- Go to: https://developers.facebook.com/apps/1394406562408267/whatsapp-business/wa-settings/")
print("- Look for 'Webhook fields' section")
print("- Make sure 'messages' is SUBSCRIBED (has checkmark)")
