import pool from "../db.js";
import { STAY_STATUS } from "./constants.js";

export const markNoShow = async (bookingId) => {
  const bookingRes = await pool.query(
    `SELECT b.stay_status_id, b.checked_in_by, bi.check_in
     FROM bookings b
     LEFT JOIN booking_items bi ON bi.booking_id = b.id
     WHERE b.id = $1
     LIMIT 1`,
    [bookingId]
  );
  if (!bookingRes.rows[0]) throw new Error("Booking không tồn tại");
  const { stay_status_id, checked_in_by, check_in } = bookingRes.rows[0];
  if (stay_status_id === STAY_STATUS.CANCELLED)
    throw new Error("Booking đã bị hủy, không thể no show");
  if (stay_status_id === STAY_STATUS.NO_SHOW)
    throw new Error("Booking đã bị no show");
  if (checked_in_by) throw new Error("Booking đã check-in, không thể no show");
  if (!check_in) throw new Error("Không tìm thấy thời gian check-in");
  const now = new Date();
  const checkInDate = new Date(check_in);
  checkInDate.setHours(14, 0, 0, 0);
  if (now < checkInDate)
    throw new Error("Chỉ được đánh dấu No Show sau 14:00 ngày nhận phòng.");
  const res = await pool.query(
    `SELECT bi.room_id FROM booking_items bi WHERE bi.booking_id = $1`,
    [bookingId]
  );
  await pool.query("UPDATE bookings SET stay_status_id = $2 WHERE id = $1", [
    bookingId,
    STAY_STATUS.NO_SHOW,
  ]);
  for (const row of res.rows) {
    await pool.query("UPDATE rooms SET status = 'available' WHERE id = $1", [
      row.room_id,
    ]);
  }
  console.log(
    `[NO_SHOW] Booking #${bookingId} đã được admin chuyển sang no_show.`
  );
};
