/**
 * ForbiddenYoga WhatsApp Onboarding Webhook
 * Handles incoming WhatsApp messages and manages conversation flow
 */

// In-memory conversation state (for serverless, consider using a database for production)
// For now, we'll use a simple state machine approach
const CRYPTO_ADDRESS = '0x450d6188aadd0f6f4d167cfc8d092842903b36d6';

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
    WELCOME: `Welcome to ForbiddenYoga. If you have a question about a Sensual Liberation Retreat please leave your message. If you are interested in private coaching or if you want to learn Tantra or understand the Tantric lineage of Michael Vogenberg you can apply for the one month intense coaching program with Michael. The program costs 5,000 USD and the full amount is paid in advance. We also offer psychic cleansing and channel opening with our Forbidden Yoga psychic Stanislav. This is a video session with a translator from Russian into your language. The price is 500 USD.

Which of these are you interested in?
1. One month intense coaching with Michael
2. Psychic cleansing with Stanislav
3. General questions only`,

    COACHING_PAYMENT_PROMPT: `The one month intense coaching program with Michael costs 5,000 USD, paid in advance.

How would you like to pay?
1. Crypto
2. Credit card
3. PayPal`,

    PSYCHIC_INTRO: `This is a 500 USD video session with a translator from Russian into your language.

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

// Simple state storage (in production, use a database like FaunaDB, Supabase, etc.)
const userStates = new Map();

function getUserState(userId) {
    return userStates.get(userId) || { state: STATES.WELCOME, data: {} };
}

function setUserState(userId, state, data = {}) {
    userStates.set(userId, { state, data: { ...getUserState(userId).data, ...data } });
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

function processMessage(userId, messageText, paymentLink) {
    const userState = getUserState(userId);
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
            if (input.includes('crypto') || input.includes('1') || input.includes('bitcoin') || input.includes('eth')) {
                response = MESSAGES.CRYPTO_PAYMENT;
                if (userState.state === STATES.COACHING_PAYMENT) {
                    response += '\n\n' + MESSAGES.COACHING_BOOKED;
                }
                newState = STATES.NEWSLETTER_PROMPT;
                newData = { paymentMethod: 'crypto' };
            } else if (input.includes('credit') || input.includes('card') || input.includes('2')) {
                response = `Please complete your payment here:\n${paymentLink}`;
                if (userState.state === STATES.COACHING_PAYMENT) {
                    response += '\n\n' + MESSAGES.COACHING_BOOKED;
                }
                newState = STATES.NEWSLETTER_PROMPT;
                newData = { paymentMethod: 'credit_card' };
            } else if (input.includes('paypal') || input.includes('3')) {
                response = `Please complete your payment here:\n${paymentLink}`;
                if (userState.state === STATES.COACHING_PAYMENT) {
                    response += '\n\n' + MESSAGES.COACHING_BOOKED;
                }
                newState = STATES.NEWSLETTER_PROMPT;
                newData = { paymentMethod: 'paypal' };
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

    setUserState(userId, newState, newData);
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
                                    const paymentLink = process.env.WHATSAPP_PAYMENT_LINK || 'https://forbidden-yoga.com/payment';

                                    // Process the message and get response
                                    const responseText = processMessage(from, text, paymentLink);

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
