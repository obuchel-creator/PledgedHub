const qrCodeService = require('../services/qrCodeService');
const Pledge = require('../models/Pledge');
const QRCodeModel = require('../models/QRCode');

/**
 * Generate QR code for MTN payment
 */
exports.generateMTNQRCode = async (req, res) => {
    try {
        const { pledgeId, amount, donorPhone, donorName } = req.body;

        // Validate required fields
        if (!pledgeId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: pledgeId, amount'
            });
        }

        // Get pledge details (optional, for validation)
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({
                success: false,
                message: 'Pledge not found'
            });
        }

        // Generate QR code
        const result = await qrCodeService.generateMTNQRCode({
            pledgeId,
            amount,
            donorPhone: donorPhone || pledge.donor_phone || '',
            donorName: donorName || pledge.donor_name || 'Donor',
            merchantPhone: process.env.MTN_MERCHANT_PHONE || ''
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate QR code',
                error: result.error
            });
        }

        // Return QR code as base64 or buffer
        res.json({
            success: true,
            data: {
                qrCode: result.qrCode.toString('base64'),
                qrCodeId: result.qrCodeId || null,
                qrReference: result.qrReference || null,
                provider: 'mtn',
                format: result.format,
                mimeType: result.mimeType,
                paymentData: result.paymentData,
                pledgeId,
                amount
            },
            message: 'MTN QR code generated successfully'
        });
    } catch (error) {
        console.error('Generate MTN QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: error.message
        });
    }
};

/**
 * Generate QR code for Airtel payment
 */
exports.generateAirtelQRCode = async (req, res) => {
    try {
        const { pledgeId, amount, donorPhone, donorName } = req.body;

        // Validate required fields
        if (!pledgeId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: pledgeId, amount'
            });
        }

        // Get pledge details (optional, for validation)
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({
                success: false,
                message: 'Pledge not found'
            });
        }

        // Generate QR code
        const result = await qrCodeService.generateAirtelQRCode({
            pledgeId,
            amount,
            donorPhone: donorPhone || pledge.donor_phone || '',
            donorName: donorName || pledge.donor_name || 'Donor',
            merchantPhone: process.env.AIRTEL_MERCHANT_PHONE || ''
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate QR code',
                error: result.error
            });
        }

        // Return QR code as base64 or buffer
        res.json({
            success: true,
            data: {
                qrCode: result.qrCode.toString('base64'),
                qrCodeId: result.qrCodeId || null,
                qrReference: result.qrReference || null,
                provider: 'airtel',
                format: result.format,
                mimeType: result.mimeType,
                paymentData: result.paymentData,
                pledgeId,
                amount
            },
            message: 'Airtel QR code generated successfully'
        });
    } catch (error) {
        console.error('Generate Airtel QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: error.message
        });
    }
};

/**
 * Generate QR code (auto-detect provider)
 */
exports.generateQRCode = async (req, res) => {
    try {
        const { pledgeId, amount, phoneNumber, donorPhone, donorName } = req.body;

        // Validate required fields
        if (!pledgeId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: pledgeId, amount'
            });
        }

        // Get pledge details
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({
                success: false,
                message: 'Pledge not found'
            });
        }

        // Generate QR code (auto-detects provider)
        const result = await qrCodeService.generatePaymentQRCode({
            pledgeId,
            amount,
            phoneNumber: phoneNumber || donorPhone || pledge.donor_phone || '',
            donorName: donorName || pledge.donor_name || 'Donor',
            merchantPhone: process.env.MTN_MERCHANT_PHONE || ''
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate QR code',
                error: result.error
            });
        }

        // Return QR code as base64
        res.json({
            success: true,
            data: {
                qrCode: result.qrCode.toString('base64'),
                qrCodeId: result.qrCodeId || null,
                qrReference: result.qrReference || null,
                provider: result.provider,
                format: result.format,
                mimeType: result.mimeType,
                paymentData: result.paymentData,
                pledgeId,
                amount
            },
            message: 'QR code generated successfully'
        });
    } catch (error) {
        console.error('Generate QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: error.message
        });
    }
};

/**
 * Generate QR code as image endpoint (stream the image directly)
 * Example: GET /api/qr/mtn?pledgeId=1&amount=50000
 */
exports.getQRCodeImage = async (req, res) => {
    try {
        const { provider, pledgeId, amount, donorPhone, donorName } = req.query;

        // Validate required fields
        if (!pledgeId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: pledgeId, amount'
            });
        }

        // Get pledge details
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({
                success: false,
                message: 'Pledge not found'
            });
        }

        let result;
        if (provider === 'airtel') {
            result = await qrCodeService.generateAirtelQRCode({
                pledgeId: parseInt(pledgeId),
                amount: parseInt(amount),
                donorPhone: donorPhone || pledge.donor_phone || '',
                donorName: donorName || pledge.donor_name || 'Donor'
            });
        } else {
            result = await qrCodeService.generateMTNQRCode({
                pledgeId: parseInt(pledgeId),
                amount: parseInt(amount),
                donorPhone: donorPhone || pledge.donor_phone || '',
                donorName: donorName || pledge.donor_name || 'Donor'
            });
        }

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate QR code',
                error: result.error
            });
        }

        // Stream the image directly
        res.contentType('image/png');
        res.send(result.qrCode);
    } catch (error) {
        console.error('Get QR code image error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code image',
            error: error.message
        });
    }
};

/**
 * Get USSD payment instructions
 */
exports.getUSSDInstructions = async (req, res) => {
    try {
        const { provider, pledgeId, amount } = req.query;

        // Validate required fields
        if (!provider || !pledgeId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: provider, pledgeId, amount'
            });
        }

        // Get USSD instructions
        const ussdCode = qrCodeService.generateUSSDCode(provider, parseInt(amount), parseInt(pledgeId));

        res.json({
            success: true,
            data: ussdCode,
            message: 'USSD instructions retrieved successfully'
        });
    } catch (error) {
        console.error('Get USSD instructions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get USSD instructions',
            error: error.message
        });
    }
};

/**
 * Decode payment data from QR code
 */
exports.decodePaymentData = async (req, res) => {
    try {
        const { paymentLink } = req.body;

        if (!paymentLink) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: paymentLink'
            });
        }

        // Decode payment data
        const result = qrCodeService.decodePaymentData(paymentLink);

        res.json({
            success: result.success,
            data: result.data || null,
            message: result.success ? 'Payment data decoded successfully' : result.error
        });
    } catch (error) {
        console.error('Decode payment data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decode payment data',
            error: error.message
        });
    }
};

/**
 * Initiate payment from decoded QR code
 * User scans QR code, we decode it and initiate the payment
 */
exports.initiatePaymentFromQR = async (req, res) => {
    try {
        const { paymentLink, phoneNumber } = req.body;

        if (!paymentLink || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: paymentLink, phoneNumber'
            });
        }

        // Decode payment data
        const decoded = qrCodeService.decodePaymentData(paymentLink);
        if (!decoded.success) {
            return res.status(400).json({
                success: false,
                message: decoded.error
            });
        }

        const { pledgeId, amount, provider, reference } = decoded.data;
        const mobileMoneyService = require('../services/mobileMoneyService');

        // Record scan for QR analytics if reference exists
        let qrCodeRecord = null;
        if (reference) {
            qrCodeRecord = await QRCodeModel.findByReference(reference);
            if (qrCodeRecord) {
                await QRCodeModel.recordScan({
                    qrCodeId: qrCodeRecord.id,
                    pledgeId: qrCodeRecord.pledge_id || pledgeId,
                    phoneNumber,
                    paymentInitiated: true,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                });
            }
        }

        // Initiate the actual payment using the decoded data
        const paymentResult = await mobileMoneyService.initiatePayment({
            pledgeId,
            phoneNumber,
            amount,
            reference: decoded.data.reference
        });

        res.json({
            success: paymentResult.success,
            data: {
                ...paymentResult,
                qrCodeId: qrCodeRecord ? qrCodeRecord.id : null,
                qrReference: reference || null
            },
            message: paymentResult.success ? 'Payment initiated from QR code' : 'Failed to initiate payment'
        });
    } catch (error) {
        console.error('Initiate payment from QR error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate payment from QR code',
            error: error.message
        });
    }
};

/**
 * Get QR dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const { pledgeId } = req.query;
        const parsedPledgeId = pledgeId ? parseInt(pledgeId, 10) : null;

        if (pledgeId && Number.isNaN(parsedPledgeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pledgeId'
            });
        }

        const stats = await QRCodeModel.getDashboardStats(parsedPledgeId);

        res.json({
            success: true,
            data: stats,
            message: 'QR dashboard stats retrieved successfully'
        });
    } catch (error) {
        console.error('Get QR dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve QR dashboard stats',
            error: error.message
        });
    }
};

/**
 * Get QR analytics
 */
exports.getAnalytics = async (req, res) => {
    try {
        const { pledgeId, provider, startDate, endDate } = req.query;
        const parsedPledgeId = pledgeId ? parseInt(pledgeId, 10) : null;

        if (pledgeId && Number.isNaN(parsedPledgeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pledgeId'
            });
        }

        const analytics = await QRCodeModel.getAnalytics(
            parsedPledgeId,
            provider || null,
            startDate || null,
            endDate || null
        );

        res.json({
            success: true,
            data: analytics,
            message: 'QR analytics retrieved successfully'
        });
    } catch (error) {
        console.error('Get QR analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve QR analytics',
            error: error.message
        });
    }
};

/**
 * Get active QR codes for a pledge
 */
exports.getActiveQRCodes = async (req, res) => {
    try {
        const { pledgeId } = req.params;
        const parsedPledgeId = parseInt(pledgeId, 10);

        if (Number.isNaN(parsedPledgeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pledgeId'
            });
        }

        const qrCodes = await QRCodeModel.getActiveQRCodes(parsedPledgeId);

        res.json({
            success: true,
            data: qrCodes,
            message: 'Active QR codes retrieved successfully'
        });
    } catch (error) {
        console.error('Get active QR codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve active QR codes',
            error: error.message
        });
    }
};

/**
 * Get scan history for a QR code
 */
exports.getScanHistory = async (req, res) => {
    try {
        const { qrCodeId } = req.params;
        const { limit } = req.query;
        const parsedQrCodeId = parseInt(qrCodeId, 10);
        const parsedLimit = limit ? parseInt(limit, 10) : 50;

        if (Number.isNaN(parsedQrCodeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid qrCodeId'
            });
        }

        if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid limit value'
            });
        }

        const scans = await QRCodeModel.getScanHistory(parsedQrCodeId, parsedLimit);

        res.json({
            success: true,
            data: scans,
            message: 'QR scan history retrieved successfully'
        });
    } catch (error) {
        console.error('Get QR scan history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve QR scan history',
            error: error.message
        });
    }
};

/**
 * Get payment history for a QR code
 */
exports.getPaymentHistory = async (req, res) => {
    try {
        const { qrCodeId } = req.params;
        const parsedQrCodeId = parseInt(qrCodeId, 10);

        if (Number.isNaN(parsedQrCodeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid qrCodeId'
            });
        }

        const payments = await QRCodeModel.getPaymentHistory(parsedQrCodeId);

        res.json({
            success: true,
            data: payments,
            message: 'QR payment history retrieved successfully'
        });
    } catch (error) {
        console.error('Get QR payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve QR payment history',
            error: error.message
        });
    }
};
