const axios = require('axios');
const crypto = require('crypto');

/**
 * Unified Mobile Money Payment Service
 * Supports: MTN Mobile Money Uganda, Airtel Money Uganda
 * 
 * Features:
 * - Simple API for elderly users (USSD/SMS integration ready)
 * - Automatic payment reconciliation
 * - Security features (encryption, validation)
 * - Fallback mechanisms
 */

// MTN Mobile Money API Configuration
const MTN_CONFIG = {
    baseURL: process.env.MTN_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
    subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY,
    apiUser: process.env.MTN_API_USER,
    apiKey: process.env.MTN_API_KEY,
    callbackUrl: process.env.MTN_CALLBACK_URL || 'http://localhost:5001/api/payments/mtn/callback',
    environment: process.env.MTN_ENVIRONMENT || 'sandbox', // sandbox or production
};

// Airtel Money API Configuration
const AIRTEL_CONFIG = {
    baseURL: process.env.AIRTEL_BASE_URL || 'https://openapi.airtel.africa',
    clientId: process.env.AIRTEL_CLIENT_ID,
    clientSecret: process.env.AIRTEL_CLIENT_SECRET,
    callbackUrl: process.env.AIRTEL_CALLBACK_URL || 'http://localhost:5001/api/payments/airtel/callback',
    environment: process.env.AIRTEL_ENVIRONMENT || 'sandbox',
};

/**
 * Generate UUID v4 for transaction reference
 */
function generateTransactionRef() {
    return crypto.randomUUID();
}

/**
 * Encrypt sensitive data
 */
function encryptData(data) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32));
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        encrypted,
        iv: iv.toString('hex')
    };
}

/**
 * Get MTN OAuth Token
 */
async function getMTNToken() {
    try {
        const auth = Buffer.from(`${MTN_CONFIG.apiUser}:${MTN_CONFIG.apiKey}`).toString('base64');
        
        const response = await axios.post(
            `${MTN_CONFIG.baseURL}/collection/token/`,
            {},
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
                }
            }
        );
        
        return response.data.access_token;
    } catch (error) {
        console.error('[ERROR] MTN token generation failed:', error.message);
        throw new Error('Failed to authenticate with MTN Mobile Money');
    }
}

/**
 * Get Airtel OAuth Token
 */
async function getAirtelToken() {
    try {
        const response = await axios.post(
            `${AIRTEL_CONFIG.baseURL}/auth/oauth2/token`,
            {
                client_id: AIRTEL_CONFIG.clientId,
                client_secret: AIRTEL_CONFIG.clientSecret,
                grant_type: 'client_credentials'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return response.data.access_token;
    } catch (error) {
        console.error('[ERROR] Airtel token generation failed:', error.message);
        throw new Error('Failed to authenticate with Airtel Money');
    }
}

/**
 * Request payment from MTN Mobile Money
 * @param {Object} paymentData - Payment details
 * @returns {Object} Payment result
 */
async function requestMTNPayment(paymentData) {
    try {
        const { phoneNumber, amount, pledgeId, currency = 'UGX' } = paymentData;
        
        // Validate phone number (MTN Uganda format: 256XXXXXXXXX)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (!cleanPhone.startsWith('25677') && !cleanPhone.startsWith('25678')) {
            throw new Error('Invalid MTN phone number. Must start with 256-77 or 256-78');
        }
        
        const token = await getMTNToken();
        const referenceId = generateTransactionRef();
        
        const requestData = {
            amount: amount.toString(),
            currency: currency,
            externalId: `PLEDGE_${pledgeId}_${Date.now()}`,
            payer: {
                partyIdType: 'MSISDN',
                partyId: cleanPhone
            },
            payerMessage: `Payment for Pledge #${pledgeId}`,
            payeeNote: `PledgeHub Payment - Pledge ${pledgeId}`
        };
        
        console.log(`[INFO] Initiating MTN payment: UGX ${amount} from ${cleanPhone}`);
        
        const response = await axios.post(
            `${MTN_CONFIG.baseURL}/collection/v1_0/requesttopay`,
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': MTN_CONFIG.environment,
                    'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`[OK] MTN payment request sent. Reference: ${referenceId}`);
        
        return {
            success: true,
            provider: 'MTN',
            referenceId: referenceId,
            transactionId: requestData.externalId,
            status: 'PENDING',
            message: 'Payment request sent. Please approve on your phone.',
            data: {
                phoneNumber: cleanPhone,
                amount,
                currency
            }
        };
        
    } catch (error) {
        console.error('[ERROR] MTN payment failed:', error.message);
        return {
            success: false,
            provider: 'MTN',
            error: error.response?.data?.message || error.message,
            message: 'Failed to initiate MTN payment. Please try again.'
        };
    }
}

/**
 * Check MTN payment status
 */
async function checkMTNPaymentStatus(referenceId) {
    try {
        const token = await getMTNToken();
        
        const response = await axios.get(
            `${MTN_CONFIG.baseURL}/collection/v1_0/requesttopay/${referenceId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Target-Environment': MTN_CONFIG.environment,
                    'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey
                }
            }
        );
        
        const data = response.data;
        
        return {
            success: true,
            status: data.status, // PENDING, SUCCESSFUL, FAILED
            amount: data.amount,
            currency: data.currency,
            financialTransactionId: data.financialTransactionId,
            externalId: data.externalId,
            reason: data.reason
        };
        
    } catch (error) {
        console.error('[ERROR] MTN status check failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Request payment from Airtel Money
 */
async function requestAirtelPayment(paymentData) {
    try {
        const { phoneNumber, amount, pledgeId, currency = 'UGX' } = paymentData;
        
        // Validate phone number (Airtel Uganda format: 256XXXXXXXXX)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (!cleanPhone.startsWith('25670') && !cleanPhone.startsWith('25675')) {
            throw new Error('Invalid Airtel phone number. Must start with 256-70 or 256-75');
        }
        
        const token = await getAirtelToken();
        const transactionId = `PLEDGE_${pledgeId}_${Date.now()}`;
        
        const requestData = {
            reference: transactionId,
            subscriber: {
                country: 'UG',
                currency: currency,
                msisdn: cleanPhone
            },
            transaction: {
                amount: amount,
                country: 'UG',
                currency: currency,
                id: transactionId
            }
        };
        
        console.log(`[INFO] Initiating Airtel payment: UGX ${amount} from ${cleanPhone}`);
        
        const response = await axios.post(
            `${AIRTEL_CONFIG.baseURL}/merchant/v1/payments/`,
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Country': 'UG',
                    'X-Currency': currency
                }
            }
        );
        
        const data = response.data;
        
        console.log(`[OK] Airtel payment request sent. Transaction ID: ${transactionId}`);
        
        return {
            success: true,
            provider: 'AIRTEL',
            referenceId: transactionId,
            transactionId: data.data?.transaction?.id || transactionId,
            status: data.status?.code === '200' ? 'PENDING' : 'FAILED',
            message: data.status?.message || 'Payment request sent. Please approve on your phone.',
            data: {
                phoneNumber: cleanPhone,
                amount,
                currency
            }
        };
        
    } catch (error) {
        console.error('[ERROR] Airtel payment failed:', error.message);
        return {
            success: false,
            provider: 'AIRTEL',
            error: error.response?.data?.message || error.message,
            message: 'Failed to initiate Airtel payment. Please try again.'
        };
    }
}

/**
 * Check Airtel payment status
 */
async function checkAirtelPaymentStatus(transactionId) {
    try {
        const token = await getAirtelToken();
        
        const response = await axios.get(
            `${AIRTEL_CONFIG.baseURL}/standard/v1/payments/${transactionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Country': 'UG',
                    'X-Currency': 'UGX'
                }
            }
        );
        
        const data = response.data;
        
        return {
            success: true,
            status: data.status?.code === '200' ? 'SUCCESSFUL' : 'FAILED',
            transactionId: data.data?.transaction?.id,
            amount: data.data?.transaction?.amount,
            currency: data.data?.transaction?.currency,
            message: data.status?.message
        };
        
    } catch (error) {
        console.error('[ERROR] Airtel status check failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Unified payment method - auto-detects provider from phone number
 */
async function initiatePayment(paymentData) {
    const { phoneNumber } = paymentData;
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Auto-detect provider
    if (cleanPhone.startsWith('25677') || cleanPhone.startsWith('25678')) {
        console.log('[INFO] Detected MTN number, using MTN Mobile Money');
        return await requestMTNPayment(paymentData);
    } else if (cleanPhone.startsWith('25670') || cleanPhone.startsWith('25675')) {
        console.log('[INFO] Detected Airtel number, using Airtel Money');
        return await requestAirtelPayment(paymentData);
    } else {
        return {
            success: false,
            error: 'Unsupported phone number. Please use MTN (077/078) or Airtel (070/075)',
            message: 'Please provide a valid MTN or Airtel phone number'
        };
    }
}

/**
 * Check payment status - auto-detects provider
 */
async function checkPaymentStatus(referenceId, provider) {
    if (provider === 'MTN') {
        return await checkMTNPaymentStatus(referenceId);
    } else if (provider === 'AIRTEL') {
        return await checkAirtelPaymentStatus(referenceId);
    } else {
        return {
            success: false,
            error: 'Unknown provider'
        };
    }
}

/**
 * Generate USSD payment code for elderly users
 * Returns simple instructions for USSD dial
 */
function generateUSSDInstructions(provider, amount, pledgeId) {
    if (provider === 'MTN') {
        return {
            provider: 'MTN Mobile Money',
            steps: [
                'Dial *165# on your MTN phone',
                'Select option 1: Send Money',
                `Enter merchant code: ${process.env.MTN_MERCHANT_CODE || '12345'}`,
                `Enter amount: ${amount}`,
                `Enter reference: PLEDGE${pledgeId}`,
                'Enter your PIN to confirm'
            ],
            shortCode: '*165#',
            alternativeMethod: `Send SMS: PAY ${amount} ${pledgeId} to 165`
        };
    } else if (provider === 'AIRTEL') {
        return {
            provider: 'Airtel Money',
            steps: [
                'Dial *185# on your Airtel phone',
                'Select: Make Payment',
                `Enter merchant: ${process.env.AIRTEL_MERCHANT_CODE || '67890'}`,
                `Enter amount: ${amount}`,
                `Enter reference: PLEDGE${pledgeId}`,
                'Enter your PIN to confirm'
            ],
            shortCode: '*185#',
            alternativeMethod: `Send SMS: PAY ${amount} ${pledgeId} to 185`
        };
    }
}

module.exports = {
    initiatePayment,
    checkPaymentStatus,
    requestMTNPayment,
    requestAirtelPayment,
    checkMTNPaymentStatus,
    checkAirtelPaymentStatus,
    generateUSSDInstructions,
    generateTransactionRef
};
