const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment configuration
let environment;
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const mode = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

if (clientId && clientSecret) {
    if (mode === 'live') {
        environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    } else {
        environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    }
    console.log(`✓ PayPal initialized (${mode} mode)`);
} else {
    console.log('ℹ PayPal credentials not configured. PayPal payments disabled.');
}

const client = environment ? new paypal.core.PayPalHttpClient(environment) : null;

/**
 * Create a PayPal order
 * @param {number} amount - Amount in UGX
 * @param {string} currency - Currency code (default: UGX)
 * @param {string} description - Payment description
 * @param {string} returnUrl - URL to redirect after successful payment
 * @param {string} cancelUrl - URL to redirect if payment is cancelled
 * @returns {Promise<object>} PayPal order details with approval URL
 */
async function createOrder(amount, currency = 'UGX', description = 'Pledge Payment', returnUrl, cancelUrl) {
    if (!client) {
        throw new Error('PayPal not configured. Please add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env');
    }

    // Convert UGX to USD for PayPal (PayPal doesn't support UGX directly)
    // 1 USD = approximately 3,700 UGX
    const usdAmount = currency === 'UGX' ? (amount / 3700).toFixed(2) : amount.toFixed(2);
    const paypalCurrency = currency === 'UGX' ? 'USD' : currency;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: paypalCurrency,
                value: usdAmount
            },
            description: description,
            custom_id: description // Store original description
        }],
        application_context: {
            brand_name: 'PledgeHub Pledge',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
            return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
            cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`
        }
    });

    try {
        const order = await client.execute(request);
        
        // Extract approval URL
        const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
        
        return {
            success: true,
            orderId: order.result.id,
            approvalUrl: approvalUrl,
            status: order.result.status,
            amount: usdAmount,
            currency: paypalCurrency,
            originalAmount: amount,
            originalCurrency: currency
        };
    } catch (error) {
        console.error('PayPal create order error:', error);
        throw new Error(`Failed to create PayPal order: ${error.message}`);
    }
}

/**
 * Capture/Execute a PayPal order after approval
 * @param {string} orderId - PayPal order ID
 * @returns {Promise<object>} Capture result
 */
async function captureOrder(orderId) {
    if (!client) {
        throw new Error('PayPal not configured');
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
        const capture = await client.execute(request);
        
        return {
            success: true,
            orderId: capture.result.id,
            status: capture.result.status,
            payerId: capture.result.payer.payer_id,
            payerEmail: capture.result.payer.email_address,
            payerName: capture.result.payer.name.given_name + ' ' + capture.result.payer.name.surname,
            amount: capture.result.purchase_units[0].payments.captures[0].amount.value,
            currency: capture.result.purchase_units[0].payments.captures[0].amount.currency_code,
            captureId: capture.result.purchase_units[0].payments.captures[0].id,
            createTime: capture.result.create_time,
            updateTime: capture.result.update_time
        };
    } catch (error) {
        console.error('PayPal capture order error:', error);
        throw new Error(`Failed to capture PayPal payment: ${error.message}`);
    }
}

/**
 * Get order details
 * @param {string} orderId - PayPal order ID
 * @returns {Promise<object>} Order details
 */
async function getOrderDetails(orderId) {
    if (!client) {
        throw new Error('PayPal not configured');
    }

    const request = new paypal.orders.OrdersGetRequest(orderId);

    try {
        const order = await client.execute(request);
        return {
            success: true,
            order: order.result
        };
    } catch (error) {
        console.error('PayPal get order error:', error);
        throw new Error(`Failed to get PayPal order: ${error.message}`);
    }
}

/**
 * Refund a captured payment
 * @param {string} captureId - PayPal capture ID
 * @param {number} amount - Amount to refund
 * @param {string} currency - Currency code
 * @returns {Promise<object>} Refund result
 */
async function refundPayment(captureId, amount = null, currency = 'USD') {
    if (!client) {
        throw new Error('PayPal not configured');
    }

    const request = new paypal.payments.CapturesRefundRequest(captureId);
    request.requestBody({
        amount: amount ? {
            currency_code: currency,
            value: amount.toFixed(2)
        } : undefined // If no amount, full refund
    });

    try {
        const refund = await client.execute(request);
        return {
            success: true,
            refundId: refund.result.id,
            status: refund.result.status,
            amount: refund.result.amount.value,
            currency: refund.result.amount.currency_code
        };
    } catch (error) {
        console.error('PayPal refund error:', error);
        throw new Error(`Failed to refund PayPal payment: ${error.message}`);
    }
}

/**
 * Check if PayPal is available
 * @returns {boolean}
 */
function isAvailable() {
    return client !== null;
}

module.exports = {
    createOrder,
    captureOrder,
    getOrderDetails,
    refundPayment,
    isAvailable
};
