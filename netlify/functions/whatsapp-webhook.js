/**
 * ForbiddenYoga WhatsApp Onboarding Webhook
 * Handles incoming WhatsApp messages and manages conversation flow
 */

const { getStore } = require('@netlify/blobs');

const CRYPTO_ADDRESS = '0x450d6188aadd0f6f4d167cfc8d092842903b36d6';
const PAYPAL_API_BASE = 'https://api-m.paypal.com'; // Use https://api-m.sandbox.paypal.com for testing

// PayPal integration functions
async function getPayPalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('PayPal credentials not configured');
        return null;
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
}

async function createPayPalOrder(amount, description) {
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) return null;

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: amount.toString()
                },
                description: description
            }],
            application_context: {
                brand_name: 'ForbiddenYoga',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW',
                return_url: 'https://www.forbidden-yoga.com/payment-success.html',
                cancel_url: 'https://www.forbidden-yoga.com/payment-cancelled.html'
            }
        })
    });

    const order = await response.json();
    const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;
    return approvalUrl;
}

// Conversation states
const STATES = {
    WELCOME: 'welcome',
    AWAITING_CHOICE: 'awaiting_choice',
    COACHING_PAYMENT: 'coaching_payment',
    PSYCHIC_PAYMENT: 'psychic_payment',
    GENERAL_QUESTION: 'general_question',
    CANNOT_AFFORD: 'cannot_afford',
    NEWSLETTER_PROMPT: 'newsletter_prompt',
    COMPLETED: 'completed'
};

// Message templates
const MESSAGES = {
    WELCOME: `Hi there sweetheart, lovely to see you!

Welcome to ForbiddenYoga.

What brings you here today?
1. Coaching with Michael
2. Psychic cleansing with Stanislav
3. General questions`,

    COACHING_PAYMENT_PROMPT: `One month intense coaching with Michael.

Learn Tantra and understand the Tantric lineage of Michael Vogenberg. The program costs 5,000 USD, paid in advance.

How would you like to pay?
1. Crypto
2. Credit card
3. PayPal`,

    PSYCHIC_INTRO: `Psychic cleansing and channel opening with Stanislav.

Video session with a translator from Russian into your language. Price: 500 USD.

How would you like to pay?
1. Crypto
2. Credit card
3. PayPal`,

    CRYPTO_PAYMENT: `Please send your payment to the following address:

${CRYPTO_ADDRESS}

Once payment is confirmed, we will be in touch.`,

    CANNOT_AFFORD: `We understand. Please leave a message explaining your situation and what support you are looking for.`,

    NEWSLETTER_PROMPT: `Do you want to stay on the ForbiddenYoga WhatsApp list to receive information, news, and updates about upcoming projects?

Reply YES or NO`,

    COACHING_BOOKED: `Michael will contact you directly on WhatsApp. There are no fixed appointment slots. Michael initiates the contact when appropriate.`,

    NEWSLETTER_CONFIRMED: `You have been added to the ForbiddenYoga updates list. Thank you!`,

    NEWSLETTER_DECLINED: `No problem. Thank you for your interest in ForbiddenYoga.`,

    GENERAL_QUESTION_RESPONSE: `Thank you for your message. We will get back to you as soon as possible.`
};

// Persistent state storage using Netlify Blobs
async function getUserState(userId) {
    try {
        const store = getStore('whatsapp-states');
        const data = await store.get(userId, { type: 'json' });
        return data || { state: STATES.WELCOME, data: {} };
    } catch (error) {
        console.log('Error getting user state:', error);
        return { state: STATES.WELCOME, data: {} };
    }
}

async function setUserState(userId, state, data = {}) {
    try {
        const store = getStore('whatsapp-states');
        const currentState = await getUserState(userId);
        const newState = { state, data: { ...currentState.data, ...data } };
        await store.setJSON(userId, newState);
    } catch (error) {
        console.log('Error setting user state:', error);
    }
}

async function sendWhatsAppMessage(to, message, phoneNumberId, accessToken) {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: { body: message }
        })
    });

    const result = await response.json();
    return result;
}

function normalizeInput(text) {
    return text.toLowerCase().trim();
}

async function processMessage(userId, messageText) {
    const userState = await getUserState(userId);
    const input = normalizeInput(messageText);

    let response = '';
    let newState = userState.state;
    let newData = {};

    switch (userState.state) {
        case STATES.WELCOME:
            // First message - send welcome and menu
            response = MESSAGES.WELCOME;
            newState = STATES.AWAITING_CHOICE;
            break;

        case STATES.AWAITING_CHOICE:
            // User choosing between coaching, psychic, or general
            if (input.includes('1') || input.includes('coaching') || input.includes('michael') || input.includes('one month')) {
                response = MESSAGES.COACHING_PAYMENT_PROMPT;
                newState = STATES.COACHING_PAYMENT;
                newData = { service: 'coaching', amount: 5000 };
            } else if (input.includes('2') || input.includes('psychic') || input.includes('stanislav') || input.includes('cleansing')) {
                response = MESSAGES.PSYCHIC_INTRO;
                newState = STATES.PSYCHIC_PAYMENT;
                newData = { service: 'psychic', amount: 500 };
            } else if (input.includes('3') || input.includes('general') || input.includes('question')) {
                response = MESSAGES.GENERAL_QUESTION_RESPONSE;
                newState = STATES.NEWSLETTER_PROMPT;
            } else {
                // Treat as general question
                response = MESSAGES.GENERAL_QUESTION_RESPONSE;
                newState = STATES.NEWSLETTER_PROMPT;
            }
            break;

        case STATES.COACHING_PAYMENT:
        case STATES.PSYCHIC_PAYMENT:
            // User choosing payment method
            const isCoaching = userState.state === STATES.COACHING_PAYMENT;
            const amount = isCoaching ? 5000 : 500;
            const description = isCoaching
                ? 'ForbiddenYoga - One Month Intense Coaching with Michael'
                : 'ForbiddenYoga - Psychic Cleansing Session with Stanislav';

            if (input.includes('crypto') || input.includes('1') || input.includes('bitcoin') || input.includes('eth')) {
                response = MESSAGES.CRYPTO_PAYMENT;
                if (isCoaching) {
                    response += '\n\n' + MESSAGES.COACHING_BOOKED;
                }
                newState = STATES.NEWSLETTER_PROMPT;
                newData = { paymentMethod: 'crypto' };
            } else if (input.includes('credit') || input.includes('card') || input.includes('2') || input.includes('paypal') || input.includes('3')) {
                // Create PayPal checkout for both credit card and PayPal
                const paymentUrl = await createPayPalOrder(amount, description);
                if (paymentUrl) {
                    response = `Please complete your payment here:\n${paymentUrl}`;
                } else {
                    response = 'Payment system temporarily unavailable. Please try again later or contact us directly.';
                }
                if (isCoaching && paymentUrl) {
                    response += '\n\n' + MESSAGES.COACHING_BOOKED;
                }
                newState = STATES.NEWSLETTER_PROMPT;
                newData = { paymentMethod: input.includes('paypal') ? 'paypal' : 'credit_card' };
            } else if (input.includes('afford') || input.includes('expensive') || input.includes('money') || input.includes('cannot') || input.includes("can't")) {
                response = MESSAGES.CANNOT_AFFORD;
                newState = STATES.CANNOT_AFFORD;
            } else {
                // Unknown payment choice, ask again
                response = 'Please choose a payment method:\n1. Crypto\n2. Credit card\n3. PayPal';
            }
            break;

        case STATES.CANNOT_AFFORD:
            // User explaining their situation
            response = `Thank you for sharing. We have received your message and will review it.\n\n${MESSAGES.NEWSLETTER_PROMPT}`;
            newState = STATES.NEWSLETTER_PROMPT;
            break;

        case STATES.NEWSLETTER_PROMPT:
            // User responding to newsletter prompt
            if (input.includes('yes') || input.includes('y') || input === '1') {
                response = MESSAGES.NEWSLETTER_CONFIRMED;
                newState = STATES.COMPLETED;
                newData = { newsletter: true };
            } else if (input.includes('no') || input.includes('n') || input === '2') {
                response = MESSAGES.NEWSLETTER_DECLINED;
                newState = STATES.COMPLETED;
                newData = { newsletter: false };
            } else {
                response = 'Please reply YES or NO to join our updates list.';
            }
            break;

        case STATES.COMPLETED:
            // Conversation completed, restart if they message again
            response = MESSAGES.WELCOME;
            newState = STATES.AWAITING_CHOICE;
            break;

        default:
            response = MESSAGES.WELCOME;
            newState = STATES.AWAITING_CHOICE;
    }

    await setUserState(userId, newState, newData);
    return response;
}

exports.handler = async (event, context) => {
    // Handle webhook verification (GET request from Meta)
    if (event.httpMethod === 'GET') {
        const params = event.queryStringParameters || {};
        const mode = params['hub.mode'];
        const token = params['hub.verify_token'];
        const challenge = params['hub.challenge'];

        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('Webhook verified successfully');
            return {
                statusCode: 200,
                body: challenge
            };
        } else {
            console.log('Webhook verification failed');
            return {
                statusCode: 403,
                body: 'Verification failed'
            };
        }
    }

    // Handle incoming messages (POST request)
    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body);

            // Check if this is a WhatsApp message
            if (body.object === 'whatsapp_business_account') {
                const entries = body.entry || [];

                for (const entry of entries) {
                    const changes = entry.changes || [];

                    for (const change of changes) {
                        if (change.field === 'messages') {
                            const value = change.value;
                            const messages = value.messages || [];

                            for (const message of messages) {
                                if (message.type === 'text') {
                                    const from = message.from; // User's phone number
                                    const text = message.text.body;

                                    console.log(`Received message from ${from}: ${text}`);

                                    // Get environment variables
                                    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
                                    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

                                    // Process the message and get response
                                    const responseText = await processMessage(from, text);

                                    // Send response
                                    if (responseText) {
                                        await sendWhatsAppMessage(from, responseText, phoneNumberId, accessToken);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ status: 'ok' })
            };
        } catch (error) {
            console.error('Error processing webhook:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Internal server error' })
            };
        }
    }

    return {
        statusCode: 405,
        body: 'Method not allowed'
    };
};
