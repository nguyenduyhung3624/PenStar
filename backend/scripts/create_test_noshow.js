import pool from "../db.js";

const createTestNoShow = async () => {
  try {
    console.log("🚀 Creating a test 'No-Show' Booking...");

    const insertBooking = `
      INSERT INTO bookings (
        customer_name, total_price, payment_status, booking_method, stay_status_id, created_at, notes, user_id
      )
      VALUES (
        'Test Auto-Cancel NoShow', 500000, 'pending', 'online', 1, NOW(), 'Created by script', NULL
      )
      RETURNING id;
    `;
    const res = await pool.query(insertBooking);
    const bookingId = res.rows[0].id;

    const roomRes = await pool.query(
      "SELECT id, type_id FROM rooms WHERE status = 'available' LIMIT 1"
    );

    let roomId, roomTypeId;

    if (roomRes.rows.length === 0) {
      console.warn("⚠️ No 'available' rooms found. Trying ANY room...");
      const anyRoom = await pool.query("SELECT id, type_id FROM rooms LIMIT 1");
      if (anyRoom.rows.length === 0)
        throw new Error("No rooms found in DB at all!");
      roomId = anyRoom.rows[0].id;
      roomTypeId = anyRoom.rows[0].type_id;
    } else {
      roomId = roomRes.rows[0].id;
      roomTypeId = roomRes.rows[0].type_id;
    }

    const insertItem = `
      INSERT INTO booking_items (
        booking_id, room_id, room_type_id, check_in, check_out, room_type_price, num_adults, quantity
      )
      VALUES (
        $1, $2, $3, NOW() - INTERVAL '3 hours', NOW() + INTERVAL '1 day', 500000, 1, 1
      )
    `;
    await pool.query(insertItem, [bookingId, roomId, roomTypeId]);

    console.log(`✅ Success! Created Booking ID: ${bookingId}`);
    console.log(`👉 Associated with Room ID: ${roomId}`);
    console.log(`👉 Check-in time set to 3 hours ago.`);
    console.log("👉 Run the cron job (or wait) to verify auto-cancellation.");
  } catch (err) {
    console.error("❌ Error creating test booking:", err);
  } finally {
    await pool.end();
  }
};

createTestNoShow();
