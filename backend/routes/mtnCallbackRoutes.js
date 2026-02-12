const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * MTN Mobile Money Payment Webhook
 * Called by MTN when a payment status changes
 * 
 * This endpoint is PUBLIC (no authentication required) because
 * it receives callbacks from MTN servers, not from our frontend.
 * 
 * @route POST /api/payments/mtn/callback
 * @access Public (MTN webhook only)
 */
router.post('/', async (req, res) => {
    try {
        const { referenceId, status, amount, externalId, reason, financialTransactionId } = req.body;

        console.log(`[MTN WEBHOOK] Payment callback received:`, {
            referenceId,
            status,
            amount,
            externalId
        });

        // Validate webhook (in production, verify MTN signature)
        if (!referenceId || !status) {
            console.warn('[MTN WEBHOOK] Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: referenceId, status'
            });
        }

        // Handle different payment statuses
        if (status === 'SUCCESSFUL') {
            // Payment succeeded - update payment and pledge records
            await handleMTNPaymentSuccess(externalId, amount, referenceId, financialTransactionId);
        } else if (status === 'FAILED') {
            // Payment failed - mark as failed
            await handleMTNPaymentFailed(externalId, reason);
        } else if (status === 'PENDING') {
            // Payment still pending - acknowledge webhook
            console.log(`[MTN WEBHOOK] Payment still pending: ${referenceId}`);
        }

        // Acknowledge webhook receipt (MTN requires 200 response)
        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('[MTN WEBHOOK] Error processing callback:', error);
        // Still send 200 to acknowledge receipt
        res.json({
            success: false,
            message: 'Webhook received but processing failed',
            error: error.message
        });
    }
});

/**
 * Handle successful MTN payment
 * Updates payment record, pledge balance, and QR tracking
 */
async function handleMTNPaymentSuccess(externalId, amount, referenceId, financialTransactionId) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Extract pledge ID from externalId (format: PLEDGE-{pledgeId}-{timestamp})
        const pledgeIdMatch = externalId.match(/PLEDGE-(\d+)-/);
        const pledgeId = pledgeIdMatch ? parseInt(pledgeIdMatch[1]) : null;

        if (!pledgeId) {
            console.warn(`[MTN] Could not extract pledge ID from externalId: ${externalId}`);
            await connection.rollback();
            return;
        }

        // Verify pledge exists
        const [pledges] = await connection.execute(
            'SELECT id, donor_name FROM pledges WHERE id = ? AND deleted = 0',
            [pledgeId]
        );

        if (!pledges || pledges.length === 0) {
            console.warn(`[MTN] Pledge not found: ${pledgeId}`);
            await connection.rollback();
            return;
        }

        // Check if payment with this reference already exists (idempotency)
        const [existingPayments] = await connection.execute(
            'SELECT id FROM payments WHERE payment_method = ? AND (payment_method_reference = ? OR notes LIKE ?)',
            ['mtn', referenceId, `%${referenceId}%`]
        );

        let paymentId;
        if (existingPayments && existingPayments.length > 0) {
            paymentId = existingPayments[0].id;
            console.log(`[MTN] Payment already exists (idempotent): ${paymentId}`);
            // Update status just in case
            await connection.execute(
                'UPDATE payments SET status = ? WHERE id = ?',
                ['completed', paymentId]
            );
        } else {
            // Create new payment record
            // Note: Using amount = 0 for system payments, set actual amount in payment tracking
            const result = await connection.execute(
                `INSERT INTO payments (pledge_id, amount, payment_method, status, payment_method_reference, notes, created_at)
                 VALUES (?, ?, 'mtn', 'completed', ?, ?, NOW())`,
                [pledgeId, amount || 0, referenceId, `MTN TXN: ${financialTransactionId || 'unknown'}`]
            );
            paymentId = result[0].insertId;
            console.log(`[MTN] Payment created: ${paymentId}`);
        }

        // Update pledge balance (amount_paid, balance_remaining)
        console.log(`[MTN] Recording payment: Pledge ${pledgeId}, Amount ${amount} UGX`);
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
        // Try to find QR code by reference
        const [qrMatches] = await connection.execute(
            `SELECT id FROM qr_codes WHERE qr_reference = ? LIMIT 1`,
            [referenceId]
        );

        if (qrMatches && qrMatches.length > 0) {
            const qrCodeId = qrMatches[0].id;
            
            // Try to create QR code payment link (may already exist due to idempotency)
            try {
                await connection.execute(
                    `INSERT INTO qr_code_payments (qr_code_id, payment_id, pledge_id, amount, provider, status, completed_at)
                     VALUES (?, ?, ?, ?, 'mtn', 'completed', NOW())`,
                    [qrCodeId, paymentId, pledgeId, amount]
                );
                console.log(`[MTN] QR code payment linked: QR ${qrCodeId} -> Payment ${paymentId}`);
            } catch (linkError) {
                // Already linked or constraint violation - that's OK
                if (!linkError.code || !linkError.code.includes('DUP')) {
                    throw linkError;
                }
                console.log(`[MTN] QR payment link already exists`);
            }
        }

        await connection.commit();
        console.log(`[MTN WEBHOOK] ✅ Payment processed successfully: ${externalId}`);

    } catch (error) {
        await connection.rollback();
        console.error('[MTN] Error handling successful payment:', error);
        throw error;

    } finally {
        connection.release();
    }
}

/**
 * Handle failed MTN payment
 * Marks payment as failed and logs the reason
 */
async function handleMTNPaymentFailed(externalId, reason) {
    try {
        const connection = await pool.getConnection();

        // Extract pledge ID
        const pledgeIdMatch = externalId.match(/PLEDGE-(\d+)-/);
        const pledgeId = pledgeIdMatch ? parseInt(pledgeIdMatch[1]) : null;

        if (!pledgeId) {
            console.warn(`[MTN] Could not extract pledge ID from externalId: ${externalId}`);
            connection.release();
            return;
        }

        // Mark related payments as failed
        await connection.execute(
            `UPDATE payments SET status = 'failed', notes = ? 
             WHERE pledge_id = ? AND status = 'pending'`,
            [`MTN payment failed: ${reason}`, pledgeId]
        );

        console.log(`[MTN WEBHOOK] ❌ Payment failed for pledge ${pledgeId}: ${reason}`);
        connection.release();

    } catch (error) {
        console.error('[MTN] Error handling failed payment:', error);
    }
}

module.exports = router;
