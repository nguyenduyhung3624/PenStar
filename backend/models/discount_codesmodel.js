import pool from "../db.js";
export const DiscountCodesModel = {
  async create({
    code,
    name,
    type,
    value,
    min_total,
    max_uses,
    max_uses_per_user,
    max_discount_amount,
    start_date,
    end_date,
    status,
    description,
  }) {
    const res = await pool.query(
      `INSERT INTO discount_codes (
        code, name, type, value, min_total, max_uses, max_uses_per_user,
        max_discount_amount, start_date, end_date, status, description
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        code,
        name || code,
        type,
        value,
        min_total || 0,
        max_uses || 1,
        max_uses_per_user || 1,
        max_discount_amount || 0,
        start_date,
        end_date,
        status || "active",
        description,
      ]
    );
    return res.rows[0];
  },
  async findById(id) {
    const res = await pool.query(`SELECT * FROM discount_codes WHERE id = $1`, [
      id,
    ]);
    return res.rows[0];
  },
  async findByCode(code) {
    const res = await pool.query(
      `SELECT * FROM discount_codes WHERE code = $1`,
      [code]
    );
    return res.rows[0];
  },
  async updateById(
    id,
    {
      code,
      name,
      type,
      value,
      min_total,
      max_uses,
      max_uses_per_user,
      max_discount_amount,
      start_date,
      end_date,
      status,
      description,
    }
  ) {
    const res = await pool.query(
      `UPDATE discount_codes SET
        code = $2,
        name = $3,
        type = $4,
        value = $5,
        min_total = $6,
        max_uses = $7,
        max_uses_per_user = $8,
        max_discount_amount = $9,
        start_date = $10,
        end_date = $11,
        status = $12,
        description = $13,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [
        id,
        code,
        name,
        type,
        value,
        min_total,
        max_uses,
        max_uses_per_user,
        max_discount_amount,
        start_date,
        end_date,
        status,
        description,
      ]
    );
    return res.rows[0];
  },
  async deleteById(id) {
    await pool.query(`DELETE FROM discount_codes WHERE id = $1`, [id]);
    return true;
  },
  async list() {
    const res = await pool.query(
      `SELECT * FROM discount_codes ORDER BY created_at DESC`
    );
    const now = new Date();
    for (const code of res.rows) {
      if (
        code.end_date &&
        new Date(code.end_date) < now &&
        code.status === "active"
      ) {
        await pool.query(
          `UPDATE discount_codes SET status = 'expired', updated_at = NOW() WHERE id = $1`,
          [code.id]
        );
        code.status = "expired";
      }
    }
    return res.rows;
  },
  async getUserUsageCount(codeId, userId) {
    if (!userId) return 0;
    const res = await pool.query(
      `SELECT usage_count FROM discount_code_usages
       WHERE discount_code_id = $1 AND user_id = $2`,
      [codeId, userId]
    );
    return res.rows[0]?.usage_count || 0;
  },
  async getTotalUsageCount(codeId) {
    const res = await pool.query(
      `SELECT COALESCE(SUM(usage_count), 0) as total FROM discount_code_usages
       WHERE discount_code_id = $1`,
      [codeId]
    );
    return parseInt(res.rows[0]?.total || 0);
  },
  async recordUsage(codeId, userId, bookingId = null) {
    if (!userId) return;
    await pool.query(
      `INSERT INTO discount_code_usages (discount_code_id, user_id, booking_id, usage_count, used_at)
       VALUES ($1, $2, $3, 1, NOW())
       ON CONFLICT (discount_code_id, user_id)
       DO UPDATE SET usage_count = discount_code_usages.usage_count + 1, used_at = NOW()`,
      [codeId, userId, bookingId]
    );
  },
  async removeUsage(codeId, userId, bookingId) {
    if (!userId || !codeId) return;
    // Decrement usage count
    await pool.query(
      `UPDATE discount_code_usages
       SET usage_count = usage_count - 1
       WHERE discount_code_id = $1 AND user_id = $2 AND usage_count > 0`,
      [codeId, userId]
    );
    // Optional: If specific booking tracking row exists (if schema supported it differently), delete it.
    // Since current schema is (discount_code_id, user_id) unique, we just decrement.
  },
  async getUsageHistory(codeId) {
    const res = await pool.query(
      `SELECT dcu.*, u.full_name, u.email, b.id as booking_id
       FROM discount_code_usages dcu
       LEFT JOIN users u ON u.id = dcu.user_id
       LEFT JOIN bookings b ON b.id = dcu.booking_id
       WHERE dcu.discount_code_id = $1
       ORDER BY dcu.used_at DESC`,
      [codeId]
    );
    return res.rows;
  },
};
