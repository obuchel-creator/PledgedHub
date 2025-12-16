const axios = require('axios');
const crypto = require('crypto');

// MTN Mobile Money API Configuration
const MTN_COLLECTION_USER_ID = process.env.MTN_COLLECTION_USER_ID;
const MTN_COLLECTION_API_KEY = process.env.MTN_COLLECTION_API_KEY;
const MTN_SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const MTN_ENVIRONMENT = process.env.MTN_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'production'
const MTN_CALLBACK_URL = process.env.MTN_CALLBACK_URL || `${process.env.APP_URL}/api/payments/mtn/callback`;

const BASE_URL = MTN_ENVIRONMENT === 'production' 
    ? 'https://proxy.momoapi.mtn.com'
    : 'https://sandbox.momodeveloper.mtn.com';

let mtnToken = null;
let tokenExpiry = null;

if (MTN_COLLECTION_USER_ID && MTN_COLLECTION_API_KEY && MTN_SUBSCRIPTION_KEY) {
    console.log(`✓ MTN Mobile Money initialized (${MTN_ENVIRONMENT} mode)`);
} else {
    console.log('ℹ MTN Mobile Money credentials not configured. MTN payments disabled.');
}

/**
 * Get or refresh MTN API access token
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
    // Return cached token if still valid
    if (mtnToken && tokenExpiry && Date.now() < tokenExpiry) {
        return mtnToken;
    }

    try {
        const credentials = Buffer.from(`${MTN_COLLECTION_USER_ID}:${MTN_COLLECTION_API_KEY}`).toString('base64');
        
        const response = await axios.post(
            `${BASE_URL}/collection/token/`,
            {},
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY
                }
            }
        );

        mtnToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min before expiry
        
        return mtnToken;
    } catch (error) {
        console.error('MTN token error:', error.response?.data || error.message);
        throw new Error(`Failed to get MTN access token: ${error.message}`);
    }
}

/**
 * Request payment from MTN Mobile Money account
 * @param {string} phoneNumber - Phone number in format 256700123456 (without +)
 * @param {number} amount - Amount in UGX
 * @param {string} externalId - Your transaction reference ID
 * @param {string} payerMessage - Message to show payer
 * @param {string} payeeNote - Note for payee (merchant)
 * @returns {Promise<object>} Payment request result
 */
async function requestPayment(phoneNumber, amount, externalId, payerMessage = 'Pledge Payment', payeeNote = 'Omukwano Pledge Payment') {
    if (!MTN_COLLECTION_USER_ID || !MTN_COLLECTION_API_KEY || !MTN_SUBSCRIPTION_KEY) {
        throw new Error('MTN Mobile Money not configured. Please add credentials to .env');
    }

    // Normalize phone number (remove + if present, ensure 256 prefix)
    let normalizedPhone = phoneNumber.replace(/\+/g, '');
    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '256' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('256')) {
        normalizedPhone = '256' + normalizedPhone;
    }

    // Generate unique transaction reference (UUID v4)
    const referenceId = crypto.randomUUID();

    try {
        const token = await getAccessToken();

        const response = await axios.post(
            `${BASE_URL}/collection/v1_0/requesttopay`,
            {
                amount: amount.toString(),
                currency: 'UGX',
                externalId: externalId,
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: normalizedPhone
                },
                payerMessage: payerMessage,
                payeeNote: payeeNote
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': MTN_ENVIRONMENT,
                    'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY,
                    'X-Callback-Url': MTN_CALLBACK_URL,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[MTN] Payment request sent: ${referenceId}`);

        return {
            success: true,
            referenceId: referenceId,
            externalId: externalId,
            status: 'PENDING',
            phoneNumber: normalizedPhone,
            amount: amount,
            currency: 'UGX',
            message: 'Payment request sent. User will receive prompt on their phone.'
        };
    } catch (error) {
        console.error('MTN request payment error:', error.response?.data || error.message);
        throw new Error(`Failed to request MTN payment: ${error.response?.data?.message || error.message}`);
    }
}

/**
 * Check payment status
 * @param {string} referenceId - MTN transaction reference ID
 * @returns {Promise<object>} Payment status
 */
async function getPaymentStatus(referenceId) {
    if (!MTN_COLLECTION_USER_ID || !MTN_COLLECTION_API_KEY || !MTN_SUBSCRIPTION_KEY) {
        throw new Error('MTN Mobile Money not configured');
    }

    try {
        const token = await getAccessToken();

        const response = await axios.get(
            `${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Target-Environment': MTN_ENVIRONMENT,
                    'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY
                }
            }
        );

        const data = response.data;

        return {
            success: true,
            referenceId: referenceId,
            status: data.status, // PENDING, SUCCESSFUL, FAILED
            amount: data.amount,
            currency: data.currency,
            externalId: data.externalId,
            payer: data.payer?.partyId,
            reason: data.reason,
            financialTransactionId: data.financialTransactionId
        };
    } catch (error) {
        console.error('MTN get status error:', error.response?.data || error.message);
        throw new Error(`Failed to get MTN payment status: ${error.message}`);
    }
}

/**
 * Get account balance
 * @returns {Promise<object>} Account balance
 */
async function getAccountBalance() {
    if (!MTN_COLLECTION_USER_ID || !MTN_COLLECTION_API_KEY || !MTN_SUBSCRIPTION_KEY) {
        throw new Error('MTN Mobile Money not configured');
    }

    try {
        const token = await getAccessToken();

        const response = await axios.get(
            `${BASE_URL}/collection/v1_0/account/balance`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Target-Environment': MTN_ENVIRONMENT,
                    'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY
                }
            }
        );

        return {
            success: true,
            availableBalance: response.data.availableBalance,
            currency: response.data.currency
        };
    } catch (error) {
        console.error('MTN get balance error:', error.response?.data || error.message);
        throw new Error(`Failed to get MTN account balance: ${error.message}`);
    }
}

/**
 * Check if MTN Mobile Money is available
 * @returns {boolean}
 */
function isAvailable() {
    return !!(MTN_COLLECTION_USER_ID && MTN_COLLECTION_API_KEY && MTN_SUBSCRIPTION_KEY);
}

module.exports = {
    requestPayment,
    getPaymentStatus,
    getAccountBalance,
    isAvailable
};
