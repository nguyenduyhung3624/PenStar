import pool from "../db.js";

export const RefundRequestsModel = {
  /**
   * Create a new refund request
   */
  async create({
    booking_id,
    booking_item_id,
    user_id,
    amount,
    bank_name,
    account_number,
    account_holder,
  }) {
    const result = await pool.query(
      `INSERT INTO refund_requests
        (booking_id, booking_item_id, user_id, amount, bank_name, account_number, account_holder, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [
        booking_id || null,
        booking_item_id || null,
        user_id,
        amount,
        bank_name,
        account_number,
        account_holder,
      ]
    );
    return result.rows[0];
  },

  /**
   * Find refund request by ID
   */
  async findById(id) {
    const result = await pool.query(
      `SELECT rr.*,
              u.full_name as user_name, u.email as user_email, u.phone as user_phone,
              b.customer_name, b.total_price as booking_total,
              pu.full_name as processed_by_name
       FROM refund_requests rr
       LEFT JOIN users u ON rr.user_id = u.id
       LEFT JOIN bookings b ON rr.booking_id = b.id
       LEFT JOIN users pu ON rr.processed_by = pu.id
       WHERE rr.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  /**
   * Find all refund requests by user
   */
  async findByUserId(userId) {
    const result = await pool.query(
      `SELECT rr.*,
              b.customer_name, b.total_price as booking_total
       FROM refund_requests rr
       LEFT JOIN bookings b ON rr.booking_id = b.id
       WHERE rr.user_id = $1
       ORDER BY rr.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * List all refund requests with optional status filter
   */
  async list(status = null) {
    let query = `
      SELECT rr.*,
             u.full_name as user_name, u.email as user_email, u.phone as user_phone,
             b.customer_name, b.total_price as booking_total,
             pu.full_name as processed_by_name
      FROM refund_requests rr
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN bookings b ON rr.booking_id = b.id
      LEFT JOIN users pu ON rr.processed_by = pu.id
    `;

    const params = [];
    if (status) {
      query += ` WHERE rr.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY
      CASE rr.status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'completed' THEN 3
        WHEN 'rejected' THEN 4
      END,
      rr.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  /**
   * Find pending refund requests
   */
  async findPending() {
    return this.list("pending");
  },

  /**
   * Update refund request status (for admin)
   */
  async updateStatus(id, { status, admin_notes, processed_by, receipt_image }) {
    const result = await pool.query(
      `UPDATE refund_requests
       SET status = $2,
           admin_notes = COALESCE($3, admin_notes),
           processed_by = COALESCE($4, processed_by),
           receipt_image = COALESCE($5, receipt_image),
           processed_at = CASE WHEN $2 IN ('completed', 'rejected') THEN NOW() ELSE processed_at END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status, admin_notes, processed_by, receipt_image]
    );
    return result.rows[0];
  },

  /**
   * Upload receipt image
   */
  async uploadReceipt(id, receiptImage, processedBy) {
    const result = await pool.query(
      `UPDATE refund_requests
       SET receipt_image = $2,
           processed_by = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, receiptImage, processedBy]
    );
    return result.rows[0];
  },

  /**
   * Check if refund request exists for booking/item
   */
  async existsForBooking(bookingId) {
    const result = await pool.query(
      `SELECT id FROM refund_requests
       WHERE booking_id = $1 AND booking_item_id IS NULL AND status != 'rejected'`,
      [bookingId]
    );
    return result.rowCount > 0;
  },

  async existsForBookingItem(bookingItemId) {
    const result = await pool.query(
      `SELECT id FROM refund_requests
       WHERE booking_item_id = $1 AND status != 'rejected'`,
      [bookingItemId]
    );
    return result.rowCount > 0;
  },

  /**
   * Get statistics
   */
  async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_amount
      FROM refund_requests
    `);
    return result.rows[0];
  },
};

export default RefundRequestsModel;
