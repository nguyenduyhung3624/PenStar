import pool from "../db.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

export const createBillLog = async (req, res) => {
  try {
    const { booking_id, user_id, bill_number, note } = req.body;
    const result = await pool.query(
      `INSERT INTO booking_bill_logs (booking_id, user_id, bill_number, note) VALUES ($1, $2, $3, $4) RETURNING *`,
      [booking_id, user_id, bill_number, note]
    );
    res.success(result.rows[0], "Tạo bill log thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
