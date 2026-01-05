import pool from "../db.js";

export const DiscountCodesModel = {
  async create({
    code,
    type,
    value,
    min_total,
    max_uses,
    max_uses_per_user,
    start_date,
    end_date,
    status,
    description,
  }) {
    const res = await pool.query(
      `INSERT INTO discount_codes (code, type, value, min_total, max_uses, max_uses_per_user, start_date, end_date, status, description)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        code,
        type,
        value,
        min_total,
        max_uses,
        max_uses_per_user,
        start_date,
        end_date,
        status,
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

  async updateById(
    id,
    {
      code,
      type,
      value,
      min_total,
      max_uses,
      max_uses_per_user,
      start_date,
      end_date,
      status,
      description,
    }
  ) {
    const res = await pool.query(
      `UPDATE discount_codes SET
				code = $2,
				type = $3,
				value = $4,
				min_total = $5,
				max_uses = $6,
				max_uses_per_user = $7,
				start_date = $8,
				end_date = $9,
				status = $10,
				description = $11
			WHERE id = $1 RETURNING *`,
      [
        id,
        code,
        type,
        value,
        min_total,
        max_uses,
        max_uses_per_user,
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
      `SELECT * FROM discount_codes ORDER BY start_date DESC`
    );
    const now = new Date();
    for (const code of res.rows) {
      if (
        code.end_date &&
        new Date(code.end_date) < now &&
        code.status === "active"
      ) {
        await pool.query(
          `UPDATE discount_codes SET status = 'expired' WHERE id = $1`,
          [code.id]
        );
        code.status = "expired";
      }
    }
    return res.rows;
  },
  async findByCode(code) {
    const res = await pool.query(
      `SELECT * FROM discount_codes WHERE code = $1`,
      [code]
    );
    return res.rows[0];
  },
};
