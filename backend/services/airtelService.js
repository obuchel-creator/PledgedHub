const axios = require('axios');
const crypto = require('crypto');

// Airtel Money API Configuration
const AIRTEL_CLIENT_ID = process.env.AIRTEL_CLIENT_ID;
const AIRTEL_CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET;
const AIRTEL_MERCHANT_ID = process.env.AIRTEL_MERCHANT_ID;
const AIRTEL_PIN = process.env.AIRTEL_PIN; // Encrypted PIN
const AIRTEL_ENVIRONMENT = process.env.AIRTEL_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'production'
const AIRTEL_CALLBACK_URL = process.env.AIRTEL_CALLBACK_URL || `${process.env.APP_URL}/api/payments/airtel/callback`;

const BASE_URL = AIRTEL_ENVIRONMENT === 'production'
    ? 'https://openapi.airtel.africa'
    : 'https://openapiuat.airtel.africa';

let airtelToken = null;
let tokenExpiry = null;

if (AIRTEL_CLIENT_ID && AIRTEL_CLIENT_SECRET) {
    console.log(`✓ Airtel Money initialized (${AIRTEL_ENVIRONMENT} mode)`);
} else {
    console.log('ℹ Airtel Money credentials not configured. Airtel payments disabled.');
}

/**
 * Get or refresh Airtel API access token
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
    // Return cached token if still valid
    if (airtelToken && tokenExpiry && Date.now() < tokenExpiry) {
        return airtelToken;
    }

    try {
        const response = await axios.post(
            `${BASE_URL}/auth/oauth2/token`,
            {
                client_id: AIRTEL_CLIENT_ID,
                client_secret: AIRTEL_CLIENT_SECRET,
                grant_type: 'client_credentials'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        airtelToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min before expiry

        return airtelToken;
    } catch (error) {
        console.error('Airtel token error:', error.response?.data || error.message);
        throw new Error(`Failed to get Airtel access token: ${error.message}`);
    }
}

/**
 * Request payment from Airtel Money account
 * @param {string} phoneNumber - Phone number in format 256700123456 (without +)
 * @param {number} amount - Amount in UGX
 * @param {string} reference - Your transaction reference
 * @param {string} description - Payment description
 * @returns {Promise<object>} Payment request result
 */
async function requestPayment(phoneNumber, amount, reference, description = 'Pledge Payment') {
    if (!AIRTEL_CLIENT_ID || !AIRTEL_CLIENT_SECRET || !AIRTEL_MERCHANT_ID) {
        throw new Error('Airtel Money not configured. Please add credentials to .env');
    }

    // Normalize phone number (remove + if present, ensure 256 prefix)
    let normalizedPhone = phoneNumber.replace(/\+/g, '');
    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '256' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('256')) {
        normalizedPhone = '256' + normalizedPhone;
    }

    // Generate unique transaction ID
    const transactionId = `OMUK-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    try {
        const token = await getAccessToken();

        const payload = {
            reference: reference,
            subscriber: {
                country: 'UG',
                currency: 'UGX',
                msisdn: normalizedPhone
            },
            transaction: {
                amount: amount,
                country: 'UG',
                currency: 'UGX',
                id: transactionId
            }
        };

        const response = await axios.post(
            `${BASE_URL}/merchant/v1/payments/`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Country': 'UG',
                    'X-Currency': 'UGX'
                }
            }
        );

        const data = response.data;

        console.log(`[Airtel] Payment request sent: ${transactionId}`);

        return {
            success: true,
            transactionId: transactionId,
            airtelTransactionId: data.data?.transaction?.id,
            status: data.status?.code === '200' ? 'PENDING' : 'FAILED',
            statusMessage: data.status?.message,
            phoneNumber: normalizedPhone,
            amount: amount,
            currency: 'UGX',
            reference: reference,
            message: data.status?.message || 'Payment request sent. User will receive prompt on their phone.'
        };
    } catch (error) {
        console.error('Airtel request payment error:', error.response?.data || error.message);
        
        // Handle specific Airtel errors
        const errorData = error.response?.data;
        const errorMessage = errorData?.status?.message || 
                           errorData?.message || 
                           error.message;

        throw new Error(`Failed to request Airtel payment: ${errorMessage}`);
    }
}

/**
 * Check payment status/Enquiry
 * @param {string} transactionId - Airtel transaction ID
 * @returns {Promise<object>} Payment status
 */
async function getPaymentStatus(transactionId) {
    if (!AIRTEL_CLIENT_ID || !AIRTEL_CLIENT_SECRET) {
        throw new Error('Airtel Money not configured');
    }

    try {
        const token = await getAccessToken();

        const response = await axios.get(
            `${BASE_URL}/standard/v1/payments/${transactionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Country': 'UG',
                    'X-Currency': 'UGX'
                }
            }
        );

        const data = response.data;
        const transaction = data.data?.transaction;

        return {
            success: true,
            transactionId: transactionId,
            status: transaction?.status?.toUpperCase(), // TS = SUCCESS, TF = FAILED, TP = PENDING
            statusCode: data.status?.code,
            statusMessage: data.status?.message,
            amount: transaction?.amount,
            currency: transaction?.currency,
            phoneNumber: transaction?.msisdn,
            airtelTransactionId: transaction?.airtel_money_id
        };
    } catch (error) {
        console.error('Airtel get status error:', error.response?.data || error.message);
        throw new Error(`Failed to get Airtel payment status: ${error.message}`);
    }
}

/**
 * Get account balance
 * @returns {Promise<object>} Account balance
 */
async function getAccountBalance() {
    if (!AIRTEL_CLIENT_ID || !AIRTEL_CLIENT_SECRET) {
        throw new Error('Airtel Money not configured');
    }

    try {
        const token = await getAccessToken();

        const response = await axios.get(
            `${BASE_URL}/standard/v1/users/balance`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Country': 'UG',
                    'X-Currency': 'UGX'
                }
            }
        );

        const data = response.data;

        return {
            success: true,
            balance: data.data?.balance,
            currency: data.data?.currency
        };
    } catch (error) {
        console.error('Airtel get balance error:', error.response?.data || error.message);
        throw new Error(`Failed to get Airtel account balance: ${error.message}`);
    }
}

/**
 * Refund a transaction
 * @param {string} airtelTransactionId - Original Airtel transaction ID
 * @param {string} reference - Refund reference
 * @returns {Promise<object>} Refund result
 */
async function refundPayment(airtelTransactionId, reference) {
    if (!AIRTEL_CLIENT_ID || !AIRTEL_CLIENT_SECRET) {
        throw new Error('Airtel Money not configured');
    }

    try {
        const token = await getAccessToken();

        const response = await axios.post(
            `${BASE_URL}/standard/v1/payments/refund`,
            {
                transaction: {
                    airtel_money_id: airtelTransactionId
                },
                reference: reference
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Country': 'UG',
                    'X-Currency': 'UGX'
                }
            }
        );

        const data = response.data;

        return {
            success: data.status?.code === '200',
            refundId: data.data?.transaction?.id,
            status: data.status?.message,
            airtelTransactionId: airtelTransactionId
        };
    } catch (error) {
        console.error('Airtel refund error:', error.response?.data || error.message);
        throw new Error(`Failed to refund Airtel payment: ${error.message}`);
    }
}

/**
 * Check if Airtel Money is available
 * @returns {boolean}
 */
function isAvailable() {
    return !!(AIRTEL_CLIENT_ID && AIRTEL_CLIENT_SECRET && AIRTEL_MERCHANT_ID);
}

module.exports = {
    requestPayment,
    getPaymentStatus,
    getAccountBalance,
    refundPayment,
    isAvailable
};
