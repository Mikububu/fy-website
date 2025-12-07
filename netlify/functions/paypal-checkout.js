/**
 * ForbiddenYoga PayPal Checkout
 * Creates PayPal orders for coaching and psychic sessions
 */

const PAYPAL_API_BASE = 'https://api-m.paypal.com'; // Use https://api-m.sandbox.paypal.com for testing

async function getPayPalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

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

async function createOrder(amount, description, currency = 'USD') {
    const accessToken = await getPayPalAccessToken();

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
                    currency_code: currency,
                    value: amount.toString()
                },
                description: description
            }],
            application_context: {
                brand_name: 'ForbiddenYoga',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW',
                return_url: process.env.PAYPAL_RETURN_URL || 'https://www.forbidden-yoga.com/payment-success.html',
                cancel_url: process.env.PAYPAL_CANCEL_URL || 'https://www.forbidden-yoga.com/payment-cancelled.html'
            }
        })
    });

    const order = await response.json();
    return order;
}

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { service } = body;

        let amount, description;

        switch (service) {
            case 'coaching':
                amount = 5000;
                description = 'ForbiddenYoga - One Month Intense Coaching with Michael';
                break;
            case 'psychic':
                amount = 500;
                description = 'ForbiddenYoga - Psychic Cleansing Session with Stanislav';
                break;
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid service type' })
                };
        }

        const order = await createOrder(amount, description);

        // Find the approval URL
        const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;

        if (!approvalUrl) {
            console.error('PayPal order creation failed:', order);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to create payment order' })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: order.id,
                approvalUrl: approvalUrl,
                amount: amount,
                description: description
            })
        };

    } catch (error) {
        console.error('PayPal checkout error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
