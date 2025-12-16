const express = require('express');
const router = express.Router();
const mobileMoneyService = require('../services/mobileMoneyService');
const { pool } = require('../config/db');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

/**
 * SIMPLIFIED PAYMENT ROUTES FOR ELDERLY USERS
 * 
 * Features:
 * - Simple USSD instructions
 * - SMS-based payment
 * - Voice-guided IVR support
 * - One-click payment links
 * - Large button interface support
 */

/**
 * GET /api/simple-payment/ussd-instructions
 * Get simple USSD dial instructions for elderly users
 * Public endpoint - no auth required
 */
router.get('/ussd-instructions', async (req, res) => {
    try {
        const { pledgeId, phoneNumber } = req.query;
        
        if (!pledgeId) {
            return res.status(400).json({
                error: 'Pledge ID is required',
                message: 'Please provide your pledge number'
            });
        }
        
        // Get pledge details
        const [pledges] = await pool.execute(
            'SELECT * FROM pledges WHERE id = ? AND deleted = 0',
            [pledgeId]
        );
        
        if (pledges.length === 0) {
            return res.status(404).json({
                error: 'Pledge not found',
                message: 'We could not find your pledge. Please check the pledge number.'
            });
        }
        
        const pledge = pledges[0];
        const balance = pledge.balance || pledge.amount;
        
        // Detect provider from phone number
        let provider = 'MTN';
        if (phoneNumber) {
            const clean = phoneNumber.replace(/\D/g, '');
            if (clean.startsWith('25670') || clean.startsWith('25675')) {
                provider = 'AIRTEL';
            }
        }
        
        const instructions = mobileMoneyService.generateUSSDInstructions(provider, balance, pledgeId);
        
        res.json({
            success: true,
            pledge: {
                id: pledge.id,
                donorName: pledge.donor_name,
                amount: balance,
                purpose: pledge.purpose
            },
            instructions: {
                ...instructions,
                simpleSteps: [
                    `Step 1: Get your ${provider === 'MTN' ? 'MTN' : 'Airtel'} phone`,
                    `Step 2: Dial ${instructions.shortCode}`,
                    'Step 3: Follow the prompts on your screen',
                    'Step 4: Enter your PIN when asked',
                    'Step 5: Done! You will receive a confirmation'
                ]
            }
        });
        
    } catch (error) {
        console.error('[ERROR] USSD instructions failed:', error);
        res.status(500).json({
            error: 'Failed to get instructions',
            message: 'Something went wrong. Please try again or call for help.'
        });
    }
});

/**
 * POST /api/simple-payment/start
 * Start a simple payment process
 * Returns clear next steps for elderly users
 */
router.post('/start', optionalAuth, async (req, res) => {
    try {
        const { pledgeId, phoneNumber, paymentMethod } = req.body;
        
        // Validate inputs
        if (!pledgeId || !phoneNumber) {
            return res.status(400).json({
                error: 'Missing information',
                message: 'Please provide your pledge number and phone number'
            });
        }
        
        // Get pledge
        const [pledges] = await pool.execute(
            'SELECT * FROM pledges WHERE id = ? AND deleted = 0',
            [pledgeId]
        );
        
        if (pledges.length === 0) {
            return res.status(404).json({
                error: 'Pledge not found',
                message: 'We could not find your pledge. Please check your pledge number.'
            });
        }
        
        const pledge = pledges[0];
        const balance = pledge.balance || pledge.amount;
        
        // Initiate payment
        const paymentResult = await mobileMoneyService.initiatePayment({
            phoneNumber,
            amount: balance,
            pledgeId: pledge.id,
            currency: 'UGX'
        });
        
        if (!paymentResult.success) {
            return res.status(400).json({
                error: 'Payment failed',
                message: paymentResult.message || 'Could not start payment. Please try again.',
                details: paymentResult.error
            });
        }
        
        // Save payment attempt to database
        await pool.execute(
            `INSERT INTO payments 
            (pledge_id, amount, payment_method, reference_number, payment_date, notes) 
            VALUES (?, ?, ?, ?, CURDATE(), ?)`,
            [
                pledge.id,
                balance,
                paymentResult.provider,
                paymentResult.referenceId,
                'Payment initiated - Pending confirmation'
            ]
        );
        
        // Simple response for elderly users
        res.json({
            success: true,
            message: 'Payment started successfully!',
            nextSteps: {
                step1: 'Check your phone',
                step2: 'You will see a popup asking to confirm payment',
                step3: 'Enter your Mobile Money PIN',
                step4: 'Press OK or Send',
                step5: 'Wait for confirmation SMS'
            },
            payment: {
                provider: paymentResult.provider,
                amount: `UGX ${balance.toLocaleString()}`,
                reference: paymentResult.referenceId,
                status: 'PENDING - Waiting for your approval'
            },
            helpline: 'If you need help, call: 0800-PLEDGE (0800-753343)'
        });
        
    } catch (error) {
        console.error('[ERROR] Simple payment start failed:', error);
        res.status(500).json({
            error: 'Something went wrong',
            message: 'We could not process your request. Please call us for help: 0800-753343'
        });
    }
});

/**
 * GET /api/simple-payment/status/:referenceId
 * Check payment status in simple terms
 */
router.get('/status/:referenceId', async (req, res) => {
    try {
        const { referenceId } = req.params;
        
        // Get payment from database
        const [payments] = await pool.execute(
            'SELECT * FROM payments WHERE reference_number = ?',
            [referenceId]
        );
        
        if (payments.length === 0) {
            return res.status(404).json({
                error: 'Payment not found',
                message: 'We could not find this payment. Please check your reference number.'
            });
        }
        
        const payment = payments[0];
        const provider = payment.payment_method;
        
        // Check status with provider
        const statusResult = await mobileMoneyService.checkPaymentStatus(referenceId, provider);
        
        let simpleStatus, simpleMessage, nextStep;
        
        if (statusResult.status === 'SUCCESSFUL') {
            simpleStatus = 'SUCCESS';
            simpleMessage = '✓ Payment Complete! Thank you!';
            nextStep = 'Your pledge has been paid. You will receive a receipt via SMS.';
            
            // Update pledge status
            await pool.execute(
                `UPDATE pledges 
                SET status = 'paid', amount_paid = amount, balance = 0 
                WHERE id = ?`,
                [payment.pledge_id]
            );
            
        } else if (statusResult.status === 'PENDING') {
            simpleStatus = 'WAITING';
            simpleMessage = 'Waiting for your confirmation...';
            nextStep = 'Please check your phone and enter your PIN to complete payment.';
            
        } else if (statusResult.status === 'FAILED') {
            simpleStatus = 'FAILED';
            simpleMessage = 'Payment did not go through';
            nextStep = 'Please try again or call us for help: 0800-753343';
        }
        
        res.json({
            success: true,
            status: simpleStatus,
            message: simpleMessage,
            nextStep,
            payment: {
                reference: referenceId,
                amount: `UGX ${payment.amount.toLocaleString()}`,
                provider: provider
            }
        });
        
    } catch (error) {
        console.error('[ERROR] Status check failed:', error);
        res.status(500).json({
            error: 'Could not check status',
            message: 'Please try again or call: 0800-753343'
        });
    }
});

/**
 * POST /api/simple-payment/sms-pay
 * Process SMS-based payment request
 * Format: "PAY [PLEDGE_ID] [PHONE_NUMBER]"
 */
router.post('/sms-pay', async (req, res) => {
    try {
        const { from, text } = req.body; // SMS gateway format
        
        // Parse SMS: "PAY 123 0771234567"
        const parts = text.toUpperCase().split(' ');
        
        if (parts[0] !== 'PAY' || parts.length < 2) {
            return res.json({
                success: false,
                reply: 'Invalid format. Send: PAY [PLEDGE_ID] [PHONE_NUMBER]\nExample: PAY 123 0771234567'
            });
        }
        
        const pledgeId = parts[1];
        const phoneNumber = parts[2] || from;
        
        // Get pledge
        const [pledges] = await pool.execute(
            'SELECT * FROM pledges WHERE id = ? AND deleted = 0',
            [pledgeId]
        );
        
        if (pledges.length === 0) {
            return res.json({
                success: false,
                reply: `Pledge #${pledgeId} not found. Please check your pledge number.`
            });
        }
        
        const pledge = pledges[0];
        const balance = pledge.balance || pledge.amount;
        
        // Initiate payment
        const paymentResult = await mobileMoneyService.initiatePayment({
            phoneNumber,
            amount: balance,
            pledgeId: pledge.id
        });
        
        if (paymentResult.success) {
            return res.json({
                success: true,
                reply: `Payment request sent!\n\nAmount: UGX ${balance.toLocaleString()}\nCheck your phone and enter PIN to confirm.\n\nRef: ${paymentResult.referenceId}`
            });
        } else {
            return res.json({
                success: false,
                reply: `Payment failed: ${paymentResult.message}\n\nCall 0800-753343 for help.`
            });
        }
        
    } catch (error) {
        console.error('[ERROR] SMS payment failed:', error);
        res.json({
            success: false,
            reply: 'Error processing payment. Please call 0800-753343 for help.'
        });
    }
});

/**
 * GET /api/simple-payment/help
 * Get help information in simple language
 */
router.get('/help', (req, res) => {
    res.json({
        success: true,
        help: {
            title: 'How to Pay Your Pledge',
            methods: [
                {
                    name: 'Method 1: Mobile Money (Easiest)',
                    steps: [
                        '1. Have your phone ready',
                        '2. Know your pledge number',
                        '3. Dial *165# for MTN or *185# for Airtel',
                        '4. Follow the steps shown on your phone',
                        '5. Enter your PIN when asked'
                    ]
                },
                {
                    name: 'Method 2: SMS Payment',
                    steps: [
                        '1. Open your SMS/Messages',
                        '2. Send: PAY [YOUR_PLEDGE_NUMBER]',
                        '3. Send to: 0800-753343',
                        '4. Wait for confirmation'
                    ]
                },
                {
                    name: 'Method 3: Call for Help',
                    steps: [
                        '1. Call: 0800-753343',
                        '2. Tell them your pledge number',
                        '3. They will help you complete payment'
                    ]
                }
            ],
            needHelp: 'Call 0800-PLEDGE (0800-753343) - Free helpline',
            languages: 'We speak: English, Luganda, Runyankole, Ateso'
        }
    });
});

module.exports = router;
