const QRCode = require('qrcode');
const crypto = require('crypto');
const QRCodeModel = require('../models/QRCode');

/**
 * QR Code Payment Service
 * Generates QR codes for MTN and Airtel Money payments
 * QR codes can encode: payment links, USSD codes, or deep links
 */

/**
 * Generate QR code for MTN Mobile Money payment
 * QR encodes a payment link that can be scanned to initiate payment
 * 
 * @param {Object} options - QR generation options
 * @param {number} options.pledgeId - Pledge ID
 * @param {number} options.amount - Payment amount in UGX
 * @param {string} options.donorPhone - Donor's phone number (optional)
 * @param {string} options.donorName - Donor name (optional)
 * @param {string} options.merchantPhone - Merchant/Organization phone (optional)
 * @param {string} options.format - 'image' (default) or 'string' (return SVG string)
 * @param {boolean} options.saveToDatabase - Save QR code record to database (default: true)
 * @returns {Promise<Object>} QR code result with database ID if saved
 */
async function generateMTNQRCode(options = {}) {
    try {
        const {
            pledgeId,
            amount,
            donorPhone = '',
            donorName = 'Donor',
            merchantPhone = process.env.MTN_MERCHANT_PHONE || '',
            format = 'image',
            saveToDatabase = true
        } = options;

        // Validate required fields
        if (!pledgeId || !amount) {
            throw new Error('pledgeId and amount are required');
        }

        // Create payment data object with all relevant info
        const paymentData = {
            provider: 'mtn',
            pledgeId,
            amount,
            timestamp: Math.floor(Date.now() / 1000),
            reference: `PLG-${pledgeId}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            donorPhone,
            merchantPhone
        };

        // Encode as JSON and create deep link
        const encodedData = Buffer.from(JSON.stringify(paymentData)).toString('base64');
        const paymentLink = `pledgehub://pay/mtn?data=${encodedData}`;

        // Generate QR code
        const options_qr = {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 250,
            margin: 2,
            color: {
                dark: '#FFD700',  // MTN yellow
                light: '#FFFFFF'
            },
            rendererOpts: {
                quality: 0.95
            }
        };

        let qrCode;
        if (format === 'string') {
            qrCode = await QRCode.toString(paymentLink, { ...options_qr, type: 'image/svg+xml' });
        } else {
            qrCode = await QRCode.toBuffer(paymentLink, options_qr);
        }

        const result = {
            success: true,
            qrCode,
            format: format === 'string' ? 'svg' : 'png',
            paymentData,
            paymentLink,
            provider: 'mtn',
            mimeType: format === 'string' ? 'image/svg+xml' : 'image/png'
        };

        // Save to database if requested
        if (saveToDatabase) {
            const dbResult = await QRCodeModel.create({
                pledgeId,
                provider: 'mtn',
                qrReference: paymentData.reference,
                qrCodeImage: qrCode.toString('base64'),
                qrDataJson: paymentData,
                amount,
                donorPhone,
                donorName
            });
            result.qrCodeId = dbResult.id;
            result.qrReference = paymentData.reference;
        }

        return result;
    } catch (error) {
        console.error('MTN QR code generation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate QR code for Airtel Money payment
 * 
 * @param {Object} options - QR generation options
 * @param {number} options.pledgeId - Pledge ID
 * @param {number} options.amount - Payment amount in UGX
 * @param {string} options.donorPhone - Donor's phone number (optional)
 * @param {string} options.donorName - Donor name (optional)
 * @param {string} options.merchantPhone - Merchant/Organization phone (optional)
 * @param {string} options.format - 'image' (default) or 'string' (return SVG string)
 * @param {boolean} options.saveToDatabase - Save QR code record to database (default: true)
 * @returns {Promise<Object>} QR code result with database ID if saved
 */
async function generateAirtelQRCode(options = {}) {
    try {
        const {
            pledgeId,
            amount,
            donorPhone = '',
            donorName = 'Donor',
            merchantPhone = process.env.AIRTEL_MERCHANT_PHONE || '',
            format = 'image',
            saveToDatabase = true
        } = options;

        // Validate required fields
        if (!pledgeId || !amount) {
            throw new Error('pledgeId and amount are required');
        }

        // Create payment data object with all relevant info
        const paymentData = {
            provider: 'airtel',
            pledgeId,
            amount,
            timestamp: Math.floor(Date.now() / 1000),
            reference: `PLG-${pledgeId}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            donorPhone,
            merchantPhone
        };

        // Encode as JSON and create deep link
        const encodedData = Buffer.from(JSON.stringify(paymentData)).toString('base64');
        const paymentLink = `pledgehub://pay/airtel?data=${encodedData}`;

        // Alternative: USSD code format
        // const ussdCode = `*185*${amount}*${merchantPhone || 'PLEDGEHUB'}#`;

        // Generate QR code with Airtel red color
        const options_qr = {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 250,
            margin: 2,
            color: {
                dark: '#FF0000',   // Airtel red
                light: '#FFFFFF'
            },
            rendererOpts: {
                quality: 0.95
            }
        };

        let qrCode;
        if (format === 'string') {
            qrCode = await QRCode.toString(paymentLink, { ...options_qr, type: 'image/svg+xml' });
        } else {
            qrCode = await QRCode.toBuffer(paymentLink, options_qr);
        }

        const result = {
            success: true,
            qrCode,
            format: format === 'string' ? 'svg' : 'png',
            paymentData,
            paymentLink,
            provider: 'airtel',
            mimeType: format === 'string' ? 'image/svg+xml' : 'image/png'
        };

        // Save to database if requested
        if (saveToDatabase && result.success) {
            const dbResult = await QRCodeModel.create({
                pledgeId,
                provider: 'airtel',
                qrReference: paymentData.reference,
                qrCodeImage: typeof qrCode === 'string' ? qrCode : qrCode.toString('base64'),
                qrDataJson: paymentData,
                amount,
                donorPhone,
                donorName
            });
            result.qrCodeId = dbResult.id;
            result.qrReference = paymentData.reference;
        }

        return result;
    } catch (error) {
        console.error('Airtel QR code generation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate universal QR code (auto-detect provider from phone number)
 * 
 * @param {Object} options - QR generation options
 * @param {number} options.pledgeId - Pledge ID
 * @param {number} options.amount - Payment amount in UGX
 * @param {string} options.phoneNumber - Donor's phone number (determines provider)
 * @param {string} options.donorName - Donor name  
 * @param {string} options.format - 'image' or 'string'
 * @param {boolean} options.saveToDatabase - Save QR code record to database (default: true)
 * @returns {Promise<Object>} QR code result
 */
async function generatePaymentQRCode(options = {}) {
    try {
        const { phoneNumber = '', saveToDatabase = true } = options;
        
        // Auto-detect provider from phone number
        let provider = 'mtn'; // default
        if (phoneNumber) {
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            if (cleanPhone.startsWith('25675') || cleanPhone.startsWith('25670')) {
                provider = 'airtel';
            }
        }

        // Pass all options including saveToDatabase
        const qrOptions = { ...options, saveToDatabase };

        if (provider === 'airtel') {
            return await generateAirtelQRCode(qrOptions);
        } else {
            return await generateMTNQRCode(qrOptions);
        }
    } catch (error) {
        console.error('Payment QR code generation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate USSD code for manual payment
 * Users can dial this code to complete payment without QR scanning
 * 
 * @param {string} provider - 'mtn' or 'airtel'
 * @param {number} amount - Payment amount
 * @param {number} pledgeId - Pledge ID
 * @returns {Object} USSD instructions
 */
function generateUSSDCode(provider, amount, pledgeId) {
    if (provider.toLowerCase() === 'airtel') {
        return {
            provider: 'Airtel Money',
            code: `*185#`,
            manualSteps: [
                'Dial *185# on your Airtel phone',
                'Select: My Account',
                'Select: Send Money',
                `Enter merchant number or use shortcode`,
                `Enter amount: ${amount}`,
                `Reference: PLEDGE${pledgeId}`,
                'Enter your PIN to confirm'
            ],
            shortNote: 'Dial *185# and follow prompts',
            fullUSSD: `*185*${amount}*${pledgeId}#`
        };
    } else {
        // MTN
        return {
            provider: 'MTN Mobile Money',
            code: `*165#`,
            manualSteps: [
                'Dial *165# on your MTN phone',
                'Select: Send Money',
                `Enter merchant code`,
                `Enter amount: ${amount}`,
                `Reference: PLEDGE${pledgeId}`,
                'Enter your PIN to confirm'
            ],
            shortNote: 'Dial *165# and follow prompts',
            fullUSSD: `*165*${amount}*${pledgeId}#`
        };
    }
}

/**
 * Decode QR code data (parse the deep link)
 * 
 * @param {string} paymentLink - The payment link from QR code
 * @returns {Object} Decoded payment data
 */
function decodePaymentData(paymentLink) {
    try {
        const url = new URL(paymentLink);
        const encodedData = url.searchParams.get('data');
        
        if (!encodedData) {
            return { success: false, error: 'Invalid payment link format' };
        }

        const decodedString = Buffer.from(encodedData, 'base64').toString('utf8');
        const paymentData = JSON.parse(decodedString);

        return {
            success: true,
            data: paymentData
        };
    } catch (error) {
        return {
            success: false,
            error: 'Failed to decode payment data: ' + error.message
        };
    }
}

module.exports = {
    generateMTNQRCode,
    generateAirtelQRCode,
    generatePaymentQRCode,
    generateUSSDCode,
    decodePaymentData
};
