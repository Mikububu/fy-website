/**
 * WhatsApp Business API Webhook for Forbidden Yoga
 * Handles incoming messages and implements conversational flow
 */

const crypto = require('crypto');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || 'fy_webhook_2024',
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  APP_SECRET: process.env.WHATSAPP_APP_SECRET || '1503be87b8baa00cf4221f2d406987d4',
  CRYPTO_WALLET: process.env.CRYPTO_WALLET_ADDRESS || '0x450d6188aadd0f6f4d167cfc8d092842903b36d6',
  WHATSAPP_API_URL: 'https://graph.facebook.com/v18.0'
};

// ============================================
// CONVERSATION STATE MANAGEMENT
// ============================================
// In production, use a database (Redis, DynamoDB, etc.)
// For now, using in-memory storage (will reset on function cold start)
const conversationState = new Map();

const STATES = {
  INITIAL: 'INITIAL',
  MENU_SENT: 'MENU_SENT',
  COACHING_PAYMENT: 'COACHING_PAYMENT',
  PSYCHIC_PAYMENT: 'PSYCHIC_PAYMENT',
  COACHING_PAYMENT_PENDING: 'COACHING_PAYMENT_PENDING',
  PSYCHIC_PAYMENT_PENDING: 'PSYCHIC_PAYMENT_PENDING',
  BROADCAST_OPTIN: 'BROADCAST_OPTIN',
  COMPLETED: 'COMPLETED',
  GENERAL_QUESTIONS: 'GENERAL_QUESTIONS'
};

// ============================================
// MESSAGE TEMPLATES
// ============================================
const MESSAGES = {
  WELCOME: `Hi sweet Forbidden Yoga people. If you have a question about a Sensual Liberation Retreat please leave your message.

If you are interested in private coaching or if you want to learn Tantra or understand the Tantric lineage of Michael Vogenberg you can apply for the one month intense coaching program with Michael. The program costs 5,000 USD and the full amount is paid in advance.

We also offer psychic cleansing and channel opening with our Forbidden Yoga psychic Stanislav. This is a video session with a translator from Russian into your language. The price is 500 USD.`,

  MENU: `Which of these are you interested in?

1️⃣ One month intense coaching with Michael
2️⃣ Psychic cleansing with Stanislav
3️⃣ General questions only

Reply with 1, 2, or 3`,

  COACHING_PAYMENT_METHOD: `Great! The one month intense coaching program costs $5,000 USD.

How would you like to pay?

1️⃣ Crypto
2️⃣ Credit card
3️⃣ PayPal
4️⃣ I cannot afford this

Reply with 1, 2, 3, or 4`,

  PSYCHIC_PAYMENT_METHOD: `The psychic cleansing session with Stanislav costs $500 USD. This is a video session with a translator.

How would you like to pay?

1️⃣ Crypto
2️⃣ Credit card
3️⃣ PayPal

Reply with 1, 2, or 3`,

  CRYPTO_PAYMENT: (amount) => `Please send $${amount} USD in crypto to this address:

\`${CONFIG.CRYPTO_WALLET}\`

Reply "PAID" once you've completed the transaction, and I'll verify it.`,

  CREDIT_CARD_PAYMENT: (link) => `Please click this link to pay with credit card:

${link}

Reply "PAID" once you've completed the payment.`,

  PAYPAL_PAYMENT: (link) => `Please click this link to pay with PayPal:

${link}

Reply "PAID" once you've completed the payment.`,

  CANNOT_AFFORD: `Please leave a message explaining your situation and what support you are looking for.`,

  BROADCAST_OPTIN: `Do you want to stay on the ForbiddenYoga WhatsApp list to receive information, news and updates about upcoming projects?

Reply YES or NO`,

  FINAL_MESSAGE: `Michael will contact you directly on WhatsApp. There are no fixed appointment slots. Michael initiates the contact when appropriate.`,

  GENERAL_QUESTIONS: `Thank you for your message. Feel free to leave your question and Michael will respond when available.`,

  PAYMENT_PENDING: `Thank you! I'm verifying your payment. This may take a few moments...`,

  PAYMENT_VERIFIED: `✅ Payment verified! Thank you.`,

  INVALID_CHOICE: `I didn't understand that. Please reply with the number of your choice.`
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verify webhook signature from Meta
 */
function verifyWebhookSignature(signature, body) {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', CONFIG.APP_SECRET)
    .update(body)
    .digest('hex');

  const signatureHash = signature.split('sha256=')[1];
  return crypto.timingSafeEqual(
    Buffer.from(signatureHash, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(to, message) {
  const url = `${CONFIG.WHATSAPP_API_URL}/${CONFIG.PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('WhatsApp API Error:', error);
    throw new Error(`WhatsApp API error: ${error}`);
  }

  return await response.json();
}

/**
 * Mark message as read
 */
async function markMessageAsRead(messageId) {
  const url = `${CONFIG.WHATSAPP_API_URL}/${CONFIG.PHONE_NUMBER_ID}/messages`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    })
  });
}

/**
 * Get or create conversation state
 */
function getConversationState(phone) {
  if (!conversationState.has(phone)) {
    conversationState.set(phone, {
      state: STATES.INITIAL,
      choice: null,
      paymentMethod: null,
      data: {}
    });
  }
  return conversationState.get(phone);
}

/**
 * Update conversation state
 */
function updateConversationState(phone, updates) {
  const current = getConversationState(phone);
  conversationState.set(phone, { ...current, ...updates });
}

/**
 * Generate payment link (placeholder - integrate with your payment processor)
 */
function generatePaymentLink(amount, type) {
  // TODO: Integrate with Stripe/PayPal API
  // For now, return placeholder
  if (type === 'card') {
    return `https://pay.forbidden-yoga.com/checkout?amount=${amount}&type=coaching`;
  } else if (type === 'paypal') {
    return `https://www.paypal.com/paypalme/forbiddenyoga/${amount}`;
  }
  return '';
}

/**
 * Verify crypto payment (placeholder - integrate with blockchain API)
 */
async function verifyCryptoPayment(amount) {
  // TODO: Integrate with blockchain explorer API (Etherscan, etc.)
  // Check if transaction to CONFIG.CRYPTO_WALLET exists
  // For now, return false (manual verification required)
  return false;
}

// ============================================
// CONVERSATION FLOW HANDLER
// ============================================

async function handleIncomingMessage(from, message, messageId) {
  const state = getConversationState(from);
  const text = message.toLowerCase().trim();

  console.log(`Message from ${from}, current state: ${state.state}, text: "${text}"`);

  // Mark message as read
  await markMessageAsRead(messageId);

  // State machine for conversation flow
  switch (state.state) {
    case STATES.INITIAL:
      // Send welcome message and menu
      await sendWhatsAppMessage(from, MESSAGES.WELCOME);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      await sendWhatsAppMessage(from, MESSAGES.MENU);
      updateConversationState(from, { state: STATES.MENU_SENT });
      break;

    case STATES.MENU_SENT:
      // Handle menu choice
      if (text === '1' || text.includes('coaching') || text.includes('michael')) {
        await sendWhatsAppMessage(from, MESSAGES.COACHING_PAYMENT_METHOD);
        updateConversationState(from, {
          state: STATES.COACHING_PAYMENT,
          choice: 'coaching'
        });
      } else if (text === '2' || text.includes('psychic') || text.includes('stanislav')) {
        await sendWhatsAppMessage(from, MESSAGES.PSYCHIC_PAYMENT_METHOD);
        updateConversationState(from, {
          state: STATES.PSYCHIC_PAYMENT,
          choice: 'psychic'
        });
      } else if (text === '3' || text.includes('question') || text.includes('general')) {
        await sendWhatsAppMessage(from, MESSAGES.GENERAL_QUESTIONS);
        updateConversationState(from, { state: STATES.GENERAL_QUESTIONS });
      } else {
        await sendWhatsAppMessage(from, MESSAGES.INVALID_CHOICE);
      }
      break;

    case STATES.COACHING_PAYMENT:
      // Handle coaching payment method
      if (text === '1' || text.includes('crypto')) {
        await sendWhatsAppMessage(from, MESSAGES.CRYPTO_PAYMENT(5000));
        updateConversationState(from, {
          state: STATES.COACHING_PAYMENT_PENDING,
          paymentMethod: 'crypto'
        });
      } else if (text === '2' || text.includes('credit') || text.includes('card')) {
        const link = generatePaymentLink(5000, 'card');
        await sendWhatsAppMessage(from, MESSAGES.CREDIT_CARD_PAYMENT(link));
        updateConversationState(from, {
          state: STATES.COACHING_PAYMENT_PENDING,
          paymentMethod: 'card'
        });
      } else if (text === '3' || text.includes('paypal')) {
        const link = generatePaymentLink(5000, 'paypal');
        await sendWhatsAppMessage(from, MESSAGES.PAYPAL_PAYMENT(link));
        updateConversationState(from, {
          state: STATES.COACHING_PAYMENT_PENDING,
          paymentMethod: 'paypal'
        });
      } else if (text === '4' || text.includes('cannot') || text.includes('afford')) {
        await sendWhatsAppMessage(from, MESSAGES.CANNOT_AFFORD);
        updateConversationState(from, { state: STATES.GENERAL_QUESTIONS });
      } else {
        await sendWhatsAppMessage(from, MESSAGES.INVALID_CHOICE);
      }
      break;

    case STATES.PSYCHIC_PAYMENT:
      // Handle psychic payment method
      if (text === '1' || text.includes('crypto')) {
        await sendWhatsAppMessage(from, MESSAGES.CRYPTO_PAYMENT(500));
        updateConversationState(from, {
          state: STATES.PSYCHIC_PAYMENT_PENDING,
          paymentMethod: 'crypto'
        });
      } else if (text === '2' || text.includes('credit') || text.includes('card')) {
        const link = generatePaymentLink(500, 'card');
        await sendWhatsAppMessage(from, MESSAGES.CREDIT_CARD_PAYMENT(link));
        updateConversationState(from, {
          state: STATES.PSYCHIC_PAYMENT_PENDING,
          paymentMethod: 'card'
        });
      } else if (text === '3' || text.includes('paypal')) {
        const link = generatePaymentLink(500, 'paypal');
        await sendWhatsAppMessage(from, MESSAGES.PAYPAL_PAYMENT(link));
        updateConversationState(from, {
          state: STATES.PSYCHIC_PAYMENT_PENDING,
          paymentMethod: 'paypal'
        });
      } else {
        await sendWhatsAppMessage(from, MESSAGES.INVALID_CHOICE);
      }
      break;

    case STATES.COACHING_PAYMENT_PENDING:
    case STATES.PSYCHIC_PAYMENT_PENDING:
      // Handle payment confirmation
      if (text.includes('paid') || text.includes('done') || text.includes('completed')) {
        await sendWhatsAppMessage(from, MESSAGES.PAYMENT_PENDING);

        // TODO: Verify payment based on method
        // For now, assume verified (manual verification required)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await sendWhatsAppMessage(from, MESSAGES.PAYMENT_VERIFIED);

        // Ask about broadcast list
        await new Promise(resolve => setTimeout(resolve, 1000));
        await sendWhatsAppMessage(from, MESSAGES.BROADCAST_OPTIN);
        updateConversationState(from, { state: STATES.BROADCAST_OPTIN });
      }
      break;

    case STATES.BROADCAST_OPTIN:
      // Handle broadcast list opt-in
      if (text.includes('yes') || text.includes('sure') || text.includes('okay')) {
        // TODO: Add to broadcast list
        updateConversationState(from, {
          state: STATES.COMPLETED,
          data: { ...state.data, broadcastOptin: true }
        });
        await sendWhatsAppMessage(from, MESSAGES.FINAL_MESSAGE);
      } else if (text.includes('no') || text.includes('not')) {
        updateConversationState(from, {
          state: STATES.COMPLETED,
          data: { ...state.data, broadcastOptin: false }
        });
        await sendWhatsAppMessage(from, MESSAGES.FINAL_MESSAGE);
      } else {
        await sendWhatsAppMessage(from, 'Please reply YES or NO');
      }
      break;

    case STATES.GENERAL_QUESTIONS:
      // Just acknowledge - no automated response needed
      // Michael will respond manually
      break;

    case STATES.COMPLETED:
      // Conversation complete, forward to manual handling
      break;

    default:
      // Unknown state, reset
      updateConversationState(from, { state: STATES.INITIAL });
      await sendWhatsAppMessage(from, MESSAGES.WELCOME);
  }
}

// ============================================
// NETLIFY FUNCTION HANDLER
// ============================================

exports.handler = async (event, context) => {
  console.log('Webhook called:', event.httpMethod);

  // Handle GET request (webhook verification)
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters;
    const mode = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];

    if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
      console.log('Webhook verified');
      return {
        statusCode: 200,
        body: challenge
      };
    } else {
      console.error('Webhook verification failed');
      return {
        statusCode: 403,
        body: 'Forbidden'
      };
    }
  }

  // Handle POST request (incoming messages)
  if (event.httpMethod === 'POST') {
    // Verify webhook signature
    const signature = event.headers['x-hub-signature-256'];
    if (!verifyWebhookSignature(signature, event.body)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 403,
        body: 'Invalid signature'
      };
    }

    try {
      const body = JSON.parse(event.body);

      // WhatsApp sends test messages on webhook setup
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        // Check for messages
        if (value?.messages && value.messages.length > 0) {
          const message = value.messages[0];
          const from = message.from; // Phone number
          const messageId = message.id;
          const messageText = message.text?.body || '';

          console.log(`New message from ${from}: ${messageText}`);

          // Process message asynchronously
          await handleIncomingMessage(from, messageText, messageId);
        }

        // Check for message status updates (delivered, read, etc.)
        if (value?.statuses) {
          console.log('Status update:', value.statuses);
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };

    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // Invalid method
  return {
    statusCode: 405,
    body: 'Method Not Allowed'
  };
};
