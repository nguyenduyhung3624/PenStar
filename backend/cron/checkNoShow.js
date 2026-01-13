import cron from "node-cron";
import pool from "../db.js";

// Run every 30 minutes
const checkNoShow = () => {
  // Schedule task to run at minute 0 and 30
  cron.schedule("0,30 * * * *", async () => {
    console.log("[Cron] Checking for No-Show bookings...");
    try {
      // Find bookings that are:
      // 1. Pending (stay_status_id = 1) - Assuming 1 is 'Pending'
      // 2. Not Cancelled (not in cancelled history)
      // 3. Check-in time was more than 2 hours ago

      // First, find the IDs
      const query = `
                SELECT b.id
                FROM bookings b
                JOIN booking_items bi ON bi.booking_id = b.id
                WHERE b.stay_status_id = 1
                AND bi.check_in < NOW() - INTERVAL '2 hours'
                AND b.is_refunded = false
                AND b.payment_status != 'paid'
                GROUP BY b.id
            `;

      const res = await pool.query(query);

      if (res.rows.length > 0) {
        const ids = res.rows.map((r) => r.id);
        console.log(
          `[Cron] Found ${ids.length} no-show bookings: ${ids.join(", ")}`
        );

        // Update them to Cancelled (4)
        await pool.query(
          `
                    UPDATE bookings
                    SET stay_status_id = 4,
                        cancel_reason = 'System Auto-Cancel: No-Show (>2 hours late)',
                        canceled_at = NOW(),
                        canceled_by_name = 'System'
                    WHERE id = ANY($1)
                `,
          [ids]
        );

        console.log("[Cron] Auto-cancelled bookings successfully.");
      } else {
        console.log("[Cron] No expired bookings found.");
      }
    } catch (error) {
      console.error("[Cron] Error checking no-show:", error);
    }
  });
};

export default checkNoShow;
