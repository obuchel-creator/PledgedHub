/**
 * QRCode Model
 * Handles all database operations for QR code tracking
 */

const { pool } = require('../config/db');

class QRCode {
  /**
   * Create and store a QR code record in database
   */
  static async create(qrData) {
    const {
      pledgeId,
      provider,
      qrReference,
      qrCodeImage,  // Base64 encoded image
      qrDataJson,   // Decoded payment data
      amount,
      donorPhone,
      donorName,
      expiresAt = null
    } = qrData;

    const [result] = await pool.execute(
      `INSERT INTO qr_codes 
       (pledge_id, provider, qr_reference, qr_data, qr_data_json, amount, donor_phone, donor_name, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated')`,
      [pledgeId, provider, qrReference, qrCodeImage, JSON.stringify(qrDataJson), amount, donorPhone, donorName, expiresAt]
    );

    return {
      id: result.insertId,
      pledgeId,
      provider,
      qrReference,
      status: 'generated',
      createdAt: new Date()
    };
  }

  /**
   * Find QR code by ID
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM qr_codes WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find QR code by reference
   */
  static async findByReference(qrReference) {
    const [rows] = await pool.execute(
      `SELECT * FROM qr_codes WHERE qr_reference = ? AND deleted_at IS NULL`,
      [qrReference]
    );
    return rows[0] || null;
  }

  /**
   * Find QR code by pledge ID
   */
  static async findByPledgeId(pledgeId) {
    const [rows] = await pool.execute(
      `SELECT * FROM qr_codes WHERE pledge_id = ? AND deleted_at IS NULL ORDER BY generated_at DESC`,
      [pledgeId]
    );
    return rows;
  }

  /**
   * Record a QR code scan
   */
  static async recordScan(scanData) {
    const {
      qrCodeId,
      pledgeId,
      phoneNumber,
      paymentInitiated = false,
      ipAddress = null,
      userAgent = null
    } = scanData;

    // Insert scan record
    const [result] = await pool.execute(
      `INSERT INTO qr_code_scans 
       (qr_code_id, pledge_id, phone_number, payment_initiated, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [qrCodeId, pledgeId, phoneNumber, paymentInitiated, ipAddress, userAgent]
    );

    // Update QR code scan count and last scanned time
    await pool.execute(
      `UPDATE qr_codes 
       SET scan_count = scan_count + 1, 
           last_scanned_at = NOW(),
           status = 'scanned'
       WHERE id = ?`,
      [qrCodeId]
    );

    return {
      scanId: result.insertId,
      qrCodeId,
      scannedAt: new Date()
    };
  }

  /**
   * Link payment to QR code
   */
  static async linkPayment(qrPaymentData) {
    const {
      qrCodeId,
      paymentId,
      pledgeId,
      amount,
      provider,
      status = 'pending'
    } = qrPaymentData;

    const [result] = await pool.execute(
      `INSERT INTO qr_code_payments 
       (qr_code_id, payment_id, pledge_id, amount, provider, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [qrCodeId, paymentId, pledgeId, amount, provider, status]
    );

    // Update QR code status
    if (status === 'successful') {
      await pool.execute(
        `UPDATE qr_codes 
         SET payment_initiated = TRUE, status = 'paid', is_used = TRUE
         WHERE id = ?`,
        [qrCodeId]
      );
    } else if (status === 'pending') {
      await pool.execute(
        `UPDATE qr_codes 
         SET payment_initiated = TRUE
         WHERE id = ?`,
        [qrCodeId]
      );
    }

    // Also update payment record with QR code ID
    await pool.execute(
      `UPDATE payments SET qr_code_id = ? WHERE id = ?`,
      [qrCodeId, paymentId]
    );

    return {
      qrPaymentId: result.insertId,
      qrCodeId,
      paymentId,
      status
    };
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(qrPaymentId, status, completedAt = null) {
    const updateTime = completedAt || (status === 'successful' ? new Date() : null);

    const [result] = await pool.execute(
      `UPDATE qr_code_payments 
       SET status = ?, completed_at = ?
       WHERE id = ?`,
      [status, updateTime, qrPaymentId]
    );

    // If payment successful, update QR code status
    if (status === 'successful') {
      const [qrPayment] = await pool.execute(
        `SELECT qr_code_id FROM qr_code_payments WHERE id = ?`,
        [qrPaymentId]
      );
      if (qrPayment.length > 0) {
        await pool.execute(
          `UPDATE qr_codes SET status = 'paid', is_used = TRUE WHERE id = ?`,
          [qrPayment[0].qr_code_id]
        );
      }
    }

    return result.affectedRows > 0;
  }

  /**
   * Get QR code payment history
   */
  static async getPaymentHistory(qrCodeId) {
    const [rows] = await pool.execute(
      `SELECT 
        qrp.id,
        qrp.payment_id,
        qrp.status,
        qrp.created_at,
        qrp.completed_at,
        p.amount,
        p.payment_method,
        p.payment_date
      FROM qr_code_payments qrp
      LEFT JOIN payments p ON p.id = qrp.payment_id
      WHERE qrp.qr_code_id = ?
      ORDER BY qrp.created_at DESC`,
      [qrCodeId]
    );
    return rows;
  }

  /**
   * Get QR code analytics
   */
  static async getAnalytics(pledgeId = null, providerId = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        qr.provider,
        COUNT(DISTINCT qr.id) AS total_qr_generated,
        COUNT(DISTINCT scans.id) AS total_scans,
        AVG(qr.scan_count) AS avg_scans_per_qr,
        COUNT(DISTINCT CASE WHEN qr.status = 'paid' THEN qr.id END) AS qr_converted_to_paid,
        SUM(CASE WHEN qr.status = 'paid' THEN qr.amount ELSE 0 END) AS total_qr_revenue,
        COUNT(DISTINCT qrp.payment_id) AS total_payments,
        MAX(qr.generated_at) AS latest_qr_generated
      FROM qr_codes qr
      LEFT JOIN qr_code_scans scans ON scans.qr_code_id = qr.id
      LEFT JOIN qr_code_payments qrp ON qrp.qr_code_id = qr.id
      WHERE qr.deleted_at IS NULL
    `;

    const params = [];

    if (pledgeId) {
      query += ` AND qr.pledge_id = ?`;
      params.push(pledgeId);
    }

    if (providerId) {
      query += ` AND qr.provider = ?`;
      params.push(providerId);
    }

    if (startDate) {
      query += ` AND qr.generated_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND qr.generated_at <= ?`;
      params.push(endDate);
    }

    query += ` GROUP BY qr.provider`;

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /**
   * Get scan history
   */
  static async getScanHistory(qrCodeId, limit = 50) {
    const [rows] = await pool.execute(
      `SELECT * FROM qr_code_scans 
       WHERE qr_code_id = ? 
       ORDER BY scanned_at DESC 
       LIMIT ?`,
      [qrCodeId, limit]
    );
    return rows;
  }

  /**
   * Soft delete QR code
   */
  static async delete(qrCodeId) {
    const [result] = await pool.execute(
      `UPDATE qr_codes SET deleted_at = NOW() WHERE id = ?`,
      [qrCodeId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get QR code statistics for dashboard
   */
  static async getDashboardStats(pledgeId = null) {
    let query = `
      SELECT 
        COUNT(DISTINCT qr.id) AS total_qr_codes,
        COUNT(DISTINCT scans.id) AS total_scans,
        COUNT(DISTINCT CASE WHEN qr.status = 'paid' THEN qr.id END) AS paid_qr_codes,
        SUM(CASE WHEN qr.status = 'paid' THEN qr.amount ELSE 0 END) AS amount_from_qr,
        ROUND(100.0 * COUNT(DISTINCT CASE WHEN qr.status = 'paid' THEN qr.id END) / 
              COUNT(DISTINCT qr.id), 2) AS conversion_rate_percent
      FROM qr_codes qr
      LEFT JOIN qr_code_scans scans ON scans.qr_code_id = qr.id
      WHERE qr.deleted_at IS NULL
    `;

    const params = [];
    if (pledgeId) {
      query += ` AND qr.pledge_id = ?`;
      params.push(pledgeId);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0] || {
      total_qr_codes: 0,
      total_scans: 0,
      paid_qr_codes: 0,
      amount_from_qr: 0,
      conversion_rate_percent: 0
    };
  }

  /**
   * Verify QR code against pledge
   */
  static async verifyQRCode(qrReference, pledgeId, amount) {
    const [rows] = await pool.execute(
      `SELECT id FROM qr_codes 
       WHERE qr_reference = ? 
       AND pledge_id = ? 
       AND amount = ?
       AND deleted_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [qrReference, pledgeId, amount]
    );
    return rows.length > 0;
  }

  /**
   * Get active QR codes for pledge
   */
  static async getActiveQRCodes(pledgeId) {
    const [rows] = await pool.execute(
      `SELECT id, provider, qr_reference, status, scan_count, generated_at 
       FROM qr_codes 
       WHERE pledge_id = ? 
       AND deleted_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY generated_at DESC`,
      [pledgeId]
    );
    return rows;
  }
}

module.exports = QRCode;
