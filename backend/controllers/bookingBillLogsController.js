import pool from "../db.js";

export const createBillLog = async (req, res) => {
  try {
    const { booking_id, user_id, bill_number, note } = req.body;
    const result = await pool.query(
      `INSERT INTO booking_bill_logs (booking_id, user_id, bill_number, note) VALUES ($1, $2, $3, $4) RETURNING *`,
      [booking_id, user_id, bill_number, note]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
