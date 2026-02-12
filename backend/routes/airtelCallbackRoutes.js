const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * Airtel Money Payment Webhook
 * Called by Airtel when a payment status changes
 * 
 * This endpoint is PUBLIC (no authentication required) because
 * it receives callbacks from Airtel servers, not from our frontend.
 * 
 * @route POST /api/payments/airtel/callback
 * @access Public (Airtel webhook only)
 */
router.post('/', async (req, res) => {
    try {
        const { transactionId, status, statusCode, amount, externalId, reason, merchantId } = req.body;

        console.log(`[AIRTEL WEBHOOK] Payment callback received:`, {
            transactionId,
            statusCode,
            status,
            amount,
            externalId
        });

        // Validate webhook
        if (!transactionId || !statusCode) {
            console.warn('[AIRTEL WEBHOOK] Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: transactionId, statusCode'
            });
        }

        // Airtel status codes:
        // 0 = Success, 1 = Failed, 2 = Pending
        if (statusCode === '0' || statusCode === 0) {
            // Payment succeeded
            await handleAirtelPaymentSuccess(externalId, amount, transactionId);
        } else if (statusCode === '1' || statusCode === 1) {
            // Payment failed
            await handleAirtelPaymentFailed(externalId, reason);
        } else if (statusCode === '2' || statusCode === 2) {
            // Payment pending
            console.log(`[AIRTEL WEBHOOK] Payment still pending: ${transactionId}`);
        }

        // Acknowledge webhook receipt
        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('[AIRTEL WEBHOOK] Error processing callback:', error);
        // Still send 200 to acknowledge receipt
        res.json({
            success: false,
            message: 'Webhook received but processing failed',
            error: error.message
        });
    }
});

/**
 * Handle successful Airtel payment
 * Updates payment record, pledge balance, and QR tracking
 */
async function handleAirtelPaymentSuccess(externalId, amount, transactionId) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Extract pledge ID from externalId (format: PLEDGE-{pledgeId}-{timestamp})
        const pledgeIdMatch = externalId.match(/PLEDGE-(\d+)-/);
        const pledgeId = pledgeIdMatch ? parseInt(pledgeIdMatch[1]) : null;

        if (!pledgeId) {
            console.warn(`[AIRTEL] Could not extract pledge ID from externalId: ${externalId}`);
            await connection.rollback();
            return;
        }

        // Verify pledge exists
        const [pledges] = await connection.execute(
            'SELECT id, donor_name FROM pledges WHERE id = ? AND deleted = 0',
            [pledgeId]
        );

        if (!pledges || pledges.length === 0) {
            console.warn(`[AIRTEL] Pledge not found: ${pledgeId}`);
            await connection.rollback();
            return;
        }

        // Check if payment with this reference already exists (idempotency)
        const [existingPayments] = await connection.execute(
            'SELECT id FROM payments WHERE payment_method = ? AND (payment_method_reference = ? OR notes LIKE ?)',
            ['airtel', transactionId, `%${transactionId}%`]
        );

        let paymentId;
        if (existingPayments && existingPayments.length > 0) {
            paymentId = existingPayments[0].id;
            console.log(`[AIRTEL] Payment already exists (idempotent): ${paymentId}`);
            // Update status just in case
            await connection.execute(
                'UPDATE payments SET status = ? WHERE id = ?',
                ['completed', paymentId]
            );
        } else {
            // Create new payment record
            const result = await connection.execute(
                `INSERT INTO payments (pledge_id, amount, payment_method, status, payment_method_reference, notes, created_at)
                 VALUES (?, ?, 'airtel', 'completed', ?, ?, NOW())`,
                [pledgeId, amount || 0, transactionId, `AIRTEL TXN: ${transactionId}`]
            );
            paymentId = result[0].insertId;
            console.log(`[AIRTEL] Payment created: ${paymentId}`);
        }

        // Update pledge balance
        console.log(`[AIRTEL] Recording payment: Pledge ${pledgeId}, Amount ${amount} UGX`);
        await connection.execute(
            `UPDATE pledges 
             SET amount_paid = COALESCE(amount_paid, 0) + ?,
                 balance = COALESCE(amount, 0) - (COALESCE(amount_paid, 0) + ?),
                 last_payment_date = NOW(),
                 status = CASE WHEN (COALESCE(amount, 0) - (COALESCE(amount_paid, 0) + ?)) <= 0 THEN 'paid' ELSE 'active' END
             WHERE id = ?`,
            [amount || 0, amount || 0, amount || 0, pledgeId]
        );

        // Link QR code if payment came from QR scan
        const [qrMatches] = await connection.execute(
            `SELECT id FROM qr_codes WHERE qr_reference = ? LIMIT 1`,
            [transactionId]
        );

        if (qrMatches && qrMatches.length > 0) {
            const qrCodeId = qrMatches[0].id;
            
            // Try to create QR code payment link (may already exist due to idempotency)
            try {
                await connection.execute(
                    `INSERT INTO qr_code_payments (qr_code_id, payment_id, pledge_id, amount, provider, status, completed_at)
                     VALUES (?, ?, ?, ?, 'airtel', 'completed', NOW())`,
                    [qrCodeId, paymentId, pledgeId, amount]
                );
                console.log(`[AIRTEL] QR code payment linked: QR ${qrCodeId} -> Payment ${paymentId}`);
            } catch (linkError) {
                // Already linked or constraint violation - that's OK
                if (!linkError.code || !linkError.code.includes('DUP')) {
                    throw linkError;
                }
                console.log(`[AIRTEL] QR payment link already exists`);
            }
        }

        await connection.commit();
        console.log(`[AIRTEL WEBHOOK] ✅ Payment processed successfully: ${externalId}`);

    } catch (error) {
        await connection.rollback();
        console.error('[AIRTEL] Error handling successful payment:', error);
        throw error;

    } finally {
        connection.release();
    }
}

/**
 * Handle failed Airtel payment
 * Marks payment as failed and logs the reason
 */
async function handleAirtelPaymentFailed(externalId, reason) {
    try {
        const connection = await pool.getConnection();

        // Extract pledge ID
        const pledgeIdMatch = externalId.match(/PLEDGE-(\d+)-/);
        const pledgeId = pledgeIdMatch ? parseInt(pledgeIdMatch[1]) : null;

        if (!pledgeId) {
            console.warn(`[AIRTEL] Could not extract pledge ID from externalId: ${externalId}`);
            connection.release();
            return;
        }

        // Mark related payments as failed
        await connection.execute(
            `UPDATE payments SET status = 'failed', notes = ? 
             WHERE pledge_id = ? AND status = 'pending'`,
            [`Airtel payment failed: ${reason}`, pledgeId]
        );

        console.log(`[AIRTEL WEBHOOK] ❌ Payment failed for pledge ${pledgeId}: ${reason}`);
        connection.release();

    } catch (error) {
        console.error('[AIRTEL] Error handling failed payment:', error);
    }
}

module.exports = router;
