import cron from "node-cron";
import pool from "../db.js";
import { STAY_STATUS } from "../utils/constants.js";

const checkNoShow = () => {
  // Chạy mỗi 15 phút để đảm bảo quét đơn 2 tiếng chính xác
  cron.schedule("*/15 * * * *", async () => {
    console.log("[Cron] Đang quét các đơn đến hạn...");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1️⃣ CASE: QUÁ 2 TIẾNG CHƯA THANH TOÁN
      // (Dành cho đơn vừa đặt nhưng không thanh toán ngay để giữ phòng)
      const timeoutRes = await client.query(
        `
        UPDATE bookings
        SET stay_status_id = $1,
            cancel_reason = 'Hệ thống tự động hủy: Quá 2 giờ chưa hoàn tất thanh toán',
            canceled_at = NOW(),
            canceled_by_name = 'System'
        WHERE stay_status_id = $2
        AND created_at < NOW() - INTERVAL '2 hours'
        RETURNING id;
      `,
        [STAY_STATUS.CANCELLED, STAY_STATUS.PENDING],
      );

      // 2️⃣ CASE: NO-SHOW (Sau 21:00 ngày check-in vẫn chưa đến)
      // Nếu khách đặt cho hôm nay, nhưng đến 21:00 tối vẫn chưa check-in -> Hủy
      const noshowRes = await client.query(
        `
        UPDATE bookings
        SET stay_status_id = $1,
            cancel_reason = 'Hệ thống tự động hủy: No-show (Quá 21h ngày check-in)',
            canceled_at = NOW(),
            canceled_by_name = 'System'
        WHERE stay_status_id IN ($2, $3)
        AND id IN (
            SELECT b.id FROM bookings b
            JOIN booking_items bi ON bi.booking_id = b.id
            WHERE (DATE(bi.check_in) + TIME '21:00:00') < NOW()
        )
        RETURNING id;
      `,
        [STAY_STATUS.CANCELLED, STAY_STATUS.PENDING, STAY_STATUS.RESERVED],
      );

      // 3️⃣ CASE: AUTO-CHECKOUT (Sau 15:00 + 4 tiếng buffer = 19:00)
      // Nếu đến 19:00 vẫn chưa nhấn checkout trên hệ thống -> Tự động checkout
      const checkoutRes = await client.query(
        `
        UPDATE bookings
        SET stay_status_id = $1,
            checked_out_at = NOW()
        WHERE stay_status_id = $2
        AND id IN (
            SELECT b.id FROM bookings b
            JOIN booking_items bi ON bi.booking_id = b.id
            WHERE (DATE(bi.check_out) + TIME '15:00:00') < NOW() - INTERVAL '4 hours'
        )
        RETURNING id;
      `,
        [STAY_STATUS.CHECKED_OUT, STAY_STATUS.CHECKED_IN],
      );

      await client.query("COMMIT");

      if (timeoutRes.rowCount > 0)
        console.log(`[Cron] Hủy ${timeoutRes.rowCount} đơn chưa thanh toán.`);
      if (noshowRes.rowCount > 0)
        console.log(`[Cron] Hủy ${noshowRes.rowCount} đơn No-show.`);
      if (checkoutRes.rowCount > 0)
        console.log(`[Cron] Auto-checkout ${checkoutRes.rowCount} đơn.`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("[Cron] Error:", error);
    } finally {
      client.release();
    }
  });
};

export default checkNoShow;
