const paypalService = require('../services/paypalService');
const mtnService = require('../services/mtnService');
const airtelService = require('../services/airtelService');
const Payment = require('../models/Payment');
const Pledge = require('../models/Pledge');

/**
 * Get available payment methods
 */
exports.getPaymentMethods = async (req, res) => {
    try {
        const methods = {
            paypal: paypalService.isAvailable(),
            mtn: mtnService.isAvailable(),
            airtel: airtelService.isAvailable()
        };

        res.json({
            success: true,
            data: methods,
            message: 'Available payment methods retrieved'
        });
    } catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment methods',
            error: error.message
        });
    }
};

/**
 * Create PayPal payment order
 */
exports.createPayPalOrder = async (req, res) => {
    try {
        const { pledgeId, amount, currency = 'UGX' } = req.body;

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

        // Create PayPal order
        const order = await paypalService.createOrder(
            amount,
            currency,
            `Pledge Payment - ${pledge.donor_name}`,
            pledgeId
        );

        res.json({
            success: true,
            data: order,
            message: 'PayPal order created successfully'
        });
    } catch (error) {
        console.error('Create PayPal order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create PayPal order',
            error: error.message
        });
    }
};

/**
 * Capture PayPal payment
 */
exports.capturePayPalPayment = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing order ID'
            });
        }

        // Capture PayPal payment
        const result = await paypalService.captureOrder(orderId);

        if (result.success) {
            // Create payment record
            const pledgeId = result.customId;
            
            await Payment.create({
                pledge_id: pledgeId,
                amount: result.amount,
                payment_method: 'paypal',
                transaction_id: result.paypalTransactionId,
                status: 'completed',
                payment_date: new Date()
            });

            // Update pledge status
            await Pledge.update(pledgeId, {
                payment_status: 'paid',
                amount_paid: result.amount
            });
        }

        res.json({
            success: result.success,
            data: result,
            message: result.success ? 'Payment captured successfully' : 'Payment capture failed'
        });
    } catch (error) {
        console.error('Capture PayPal payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to capture PayPal payment',
            error: error.message
        });
    }
};

/**
 * Initiate MTN Mobile Money payment
 */
exports.initiateMTNPayment = async (req, res) => {
    try {
        const { pledgeId, phoneNumber, amount } = req.body;

        if (!pledgeId || !phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: pledgeId, phoneNumber, amount'
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

        // Request MTN payment
        const reference = `PLEDGE-${pledgeId}-${Date.now()}`;
        const result = await mtnService.requestPayment(
            phoneNumber,
            amount,
            reference,
            `Pledge payment from ${pledge.donor_name}`
        );

        if (result.success) {
            // Create pending payment record
            await Payment.create({
                pledge_id: pledgeId,
                amount: amount,
                payment_method: 'mtn',
                transaction_id: result.referenceId,
                status: 'pending',
                payment_date: new Date()
            });
        }

        res.json({
            success: result.success,
            data: result,
            message: result.message
        });
    } catch (error) {
        console.error('Initiate MTN payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate MTN payment',
            error: error.message
        });
    }
};

/**
 * Check MTN payment status
 */
exports.checkMTNPaymentStatus = async (req, res) => {
    try {
        const { referenceId } = req.params;

        if (!referenceId) {
            return res.status(400).json({
                success: false,
                message: 'Missing reference ID'
            });
        }

        // Check MTN payment status
        const result = await mtnService.getPaymentStatus(referenceId);

        if (result.success && result.status === 'SUCCESSFUL') {
            // Find payment by transaction ID
            const payments = await Payment.list({ limit: 1000 });
            const payment = payments.find(p => p.transaction_id === referenceId);

            if (payment) {
                // Update payment status
                await Payment.update(payment.id, {
                    status: 'completed'
                });

                // Update pledge status
                await Pledge.update(payment.pledge_id, {
                    payment_status: 'paid',
                    amount_paid: payment.amount
                });
            }
        }

        res.json({
            success: result.success,
            data: result,
            message: result.success ? 'Payment status retrieved' : 'Failed to get payment status'
        });
    } catch (error) {
        console.error('Check MTN payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check MTN payment status',
            error: error.message
        });
    }
};

/**
 * Initiate Airtel Money payment
 */
exports.initiateAirtelPayment = async (req, res) => {
    try {
        const { pledgeId, phoneNumber, amount } = req.body;

        if (!pledgeId || !phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: pledgeId, phoneNumber, amount'
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

        // Request Airtel payment
        const reference = `PLEDGE-${pledgeId}-${Date.now()}`;
        const result = await airtelService.requestPayment(
            phoneNumber,
            amount,
            reference,
            `Pledge payment from ${pledge.donor_name}`
        );

        if (result.success) {
            // Create pending payment record
            await Payment.create({
                pledge_id: pledgeId,
                amount: amount,
                payment_method: 'airtel',
                transaction_id: result.transactionId,
                status: 'pending',
                payment_date: new Date()
            });
        }

        res.json({
            success: result.success,
            data: result,
            message: result.message
        });
    } catch (error) {
        console.error('Initiate Airtel payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate Airtel payment',
            error: error.message
        });
    }
};

/**
 * Check Airtel payment status
 */
exports.checkAirtelPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing transaction ID'
            });
        }

        // Check Airtel payment status
        const result = await airtelService.getPaymentStatus(transactionId);

        if (result.success && result.status === 'TS') { // TS = Transaction Successful
            // Find payment by transaction ID
            const payments = await Payment.list({ limit: 1000 });
            const payment = payments.find(p => p.transaction_id === transactionId);

            if (payment) {
                // Update payment status
                await Payment.update(payment.id, {
                    status: 'completed'
                });

                // Update pledge status
                await Pledge.update(payment.pledge_id, {
                    payment_status: 'paid',
                    amount_paid: payment.amount
                });
            }
        }

        res.json({
            success: result.success,
            data: result,
            message: result.success ? 'Payment status retrieved' : 'Failed to get payment status'
        });
    } catch (error) {
        console.error('Check Airtel payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check Airtel payment status',
            error: error.message
        });
    }
};

/**
 * Refund a payment
 */
exports.refundPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason } = req.body;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment ID'
            });
        }

        // Get payment details
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Only completed payments can be refunded'
            });
        }

        let result;

        // Process refund based on payment method
        switch (payment.payment_method) {
            case 'paypal':
                result = await paypalService.refundPayment(
                    payment.transaction_id,
                    payment.amount,
                    'UGX'
                );
                break;

            case 'mtn':
                return res.status(400).json({
                    success: false,
                    message: 'MTN refunds must be processed manually through MTN portal'
                });

            case 'airtel':
                result = await airtelService.refundPayment(
                    payment.transaction_id,
                    `REFUND-${payment.id}-${Date.now()}`
                );
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Unsupported payment method for refund'
                });
        }

        if (result.success) {
            // Update payment status
            await Payment.update(paymentId, {
                status: 'refunded',
                refund_date: new Date(),
                refund_reason: reason
            });

            // Update pledge status
            await Pledge.update(payment.pledge_id, {
                payment_status: 'refunded',
                amount_paid: 0
            });
        }

        res.json({
            success: result.success,
            data: result,
            message: result.success ? 'Payment refunded successfully' : 'Refund failed'
        });
    } catch (error) {
        console.error('Refund payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refund payment',
            error: error.message
        });
    }
};
