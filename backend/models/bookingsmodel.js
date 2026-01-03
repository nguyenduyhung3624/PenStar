import pool from "../db.js";
import moment from "moment-timezone";
import { BOOKING } from "../utils/constants.js";

const TIMEZONE = BOOKING.TIMEZONE;

export const getNow = () => new Date().toISOString();
// Check-in: cập nhật trạng thái và checked_in_by
export const confirmCheckin = async (id, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Lấy trạng thái hiện tại
    const checkBooking = await client.query(
      "SELECT stay_status_id, check_in FROM bookings b LEFT JOIN booking_items bi ON bi.booking_id = b.id WHERE b.id = $1 LIMIT 1",
      [id]
    );
    if (!checkBooking.rows[0]) {
      throw new Error("Booking không tồn tại");
    }
    const { stay_status_id, check_in } = checkBooking.rows[0];
    if (stay_status_id !== 1) {
      // 1 = reserved
      throw new Error(
        "Chỉ có thể check-in booking ở trạng thái Đã đặt (reserved)"
      );
    }
    // Kiểm tra ngày/giờ check-in hợp lệ (>= hôm nay, >= 14:00, chuẩn hóa Asia/Ho_Chi_Minh)
    const now = moment.tz(Date.now(), TIMEZONE);
    const checkInDate = moment.tz(check_in, TIMEZONE);
    // Giờ giới hạn check-in là 14:00
    const checkInLimit = checkInDate
      .clone()
      .set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    // Log thời gian thực tế để debug
    console.log(
      "[Checkin Debug] now:",
      now.format(),
      "checkInLimit:",
      checkInLimit.format(),
      "server timezone:",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      "TZ env:",
      process.env.TZ
    );
    if (now.isBefore(checkInLimit)) {
      throw new Error("Chỉ được check-in từ 14:00 ngày nhận phòng");
    }
    // Cập nhật trạng thái và checked_in_by
    await client.query(
      "UPDATE bookings SET stay_status_id = 2, checked_in_by = $1 WHERE id = $2",
      [userId, id]
    );
    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getBookings = async () => {
  const resuit = await pool.query(
    `SELECT b.*, ss.name as stay_status_name, u.email, u.phone, 
            checked_in_user.email as checked_in_by_email, checked_out_user.email as checked_out_by_email
     FROM bookings b
     LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
     LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN users checked_in_user ON checked_in_user.id = b.checked_in_by
    LEFT JOIN users checked_out_user ON checked_out_user.id = b.checked_out_by
     ORDER BY b.created_at DESC`
  );
  return resuit.rows;
};

export const getBookingById = async (id) => {
  const resuit = await pool.query(
    `SELECT b.*, ss.name as stay_status_name, u.email, u.phone, 
            checked_in_user.email as checked_in_by_email, checked_out_user.email as checked_out_by_email
     FROM bookings b
     LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
     LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN users checked_in_user ON checked_in_user.id = b.checked_in_by
    LEFT JOIN users checked_out_user ON checked_out_user.id = b.checked_out_by
     WHERE b.id = $1`,
    [id]
  );
  return resuit.rows[0];
};

export const getBookingsByUser = async (userId) => {
  const resuit = await pool.query(
    `SELECT b.*, ss.name as stay_status_name FROM bookings b
     LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
     WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
    [userId]
  );
  return resuit.rows;
};

/**
 * Auto-assign available rooms based on room type, quantity, dates, and capacity
 * @param {number} roomTypeId - ID of the room type
 * @param {number} quantity - Number of rooms needed
 * @param {string} checkIn - Check-in date
 * @param {string} checkOut - Check-out date
 * @param {number} numAdults - Number of adults
 * @param {number} numChildren - Number of children
 * @returns {Promise<Array>} Array of assigned room objects
 */
export const autoAssignRooms = async (
  roomTypeId,
  quantity,
  checkIn,
  checkOut,
  numAdults,
  numChildren,
  excludeRoomIds = [] // Danh sách phòng đã assign trong transaction
) => {
  const client = await pool.connect();
  try {
    // Validate guest numbers trước khi tìm phòng
    const typeCheck = await client.query(
      `SELECT base_adults, base_children, capacity, name FROM room_types WHERE id = $1`,
      [roomTypeId]
    );

    if (typeCheck.rows.length === 0) {
      throw new Error(`Loại phòng ID ${roomTypeId} không tồn tại.`);
    }

    const roomType = typeCheck.rows[0];
    const totalGuests = numAdults + numChildren;

    // Kiểm tra 1: Tổng số khách (người lớn + trẻ em, không tính em bé) <= 4 (mặc định)
    const MAX_GUESTS_DEFAULT = 4;
    if (totalGuests > MAX_GUESTS_DEFAULT) {
      throw new Error(
        `Tổng số người (${totalGuests}) vượt quá giới hạn tối đa ${MAX_GUESTS_DEFAULT} người (không bao gồm em bé).`
      );
    }

    // Kiểm tra 2: Tổng số khách <= capacity (nếu capacity < 4 thì dùng capacity)
    const maxCapacity = Math.min(
      roomType.capacity || MAX_GUESTS_DEFAULT,
      MAX_GUESTS_DEFAULT
    );
    if (totalGuests > maxCapacity) {
      throw new Error(
        `Tổng số khách (${totalGuests}) vượt quá sức chứa (${maxCapacity}) cho loại phòng "${roomType.name}".`
      );
    }

    // ✅ KHÔNG kiểm tra giới hạn người lớn/trẻ em - linh hoạt với phụ phí
    // ✅ Em bé (0-5 tuổi) không tính vào giới hạn số người

    // console.log(`[DEBUG autoAssignRooms] Excluding room IDs:`, excludeRoomIds);

    // Find available rooms of the specified type and capacity
    // Exclude rooms that have overlapping bookings AND rooms already assigned in this transaction
    // Lưu ý: Booking với stay_status_id IN (1, 2, 6) được coi là giữ phòng:
    // - 1: reserved (đã đặt, chưa check-in)
    // - 2: checked-in (đang ở)
    // - 6: pending (chờ thanh toán)
    // Các booking đã hủy (4: cancelled) hoặc đã checkout (3: checked-out) sẽ không giữ phòng
    const query = `
      SELECT DISTINCT r.*
      FROM rooms r
      JOIN room_types rt ON r.type_id = rt.id
      WHERE r.type_id = $1
        AND r.status = 'available'
        AND rt.capacity >= $2
        ${
          excludeRoomIds.length > 0
            ? `AND r.id NOT IN (${excludeRoomIds
                .map((_, i) => `$${6 + i}`)
                .join(",")})`
            : ""
        }
        AND NOT EXISTS (
          SELECT 1 FROM booking_items bi
          JOIN bookings b ON bi.booking_id = b.id
          WHERE bi.room_id = r.id
            AND b.stay_status_id IN (1, 2, 6) -- reserved, checked-in, pending
            AND (
              bi.check_in::date < $4::date 
              AND bi.check_out::date > $3::date
            )
        )
      ORDER BY r.name ASC
      LIMIT $5
    `;

    // Build params array
    const params = [
      roomTypeId,
      totalGuests,
      checkIn,
      checkOut,
      quantity,
      ...excludeRoomIds,
    ];

    // console.log(`[DEBUG autoAssignRooms] Query:`, query);
    // console.log(`[DEBUG autoAssignRooms] Params:`, params);

    const result = await client.query(query, params);

    // console.log(`[DEBUG autoAssignRooms] Found ${result.rows.length} rooms:`, result.rows.map((r) => `${r.name} (ID: ${r.id})`));

    // Nếu số phòng khả dụng < số phòng cần, báo lỗi rõ ràng
    if (result.rows.length < quantity) {
      throw new Error(
        `Không đủ phòng trống! Cần ${quantity} phòng nhưng chỉ có ${result.rows.length} phòng khả dụng cho loại phòng này trong khoảng thời gian đã chọn.`
      );
    }

    return result.rows;
  } finally {
    client.release();
  }
};

export const createBooking = async (data) => {
  // data: { customer_name, total_price, payment_status, booking_method, stay_status_id, user_id, items: [{room_id, check_in, check_out, room_type_price}], services: [{service_id, quantity, total_service_price}] }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // console.log("[DEBUG] createBooking received data.rooms_config:", data.rooms_config);
    // console.log("[DEBUG] createBooking received data.items:", data.items);
    // console.log("Creating booking with data:", JSON.stringify(data, null, 2));

    const {
      customer_name,
      total_price,
      payment_status,
      booking_method,
      stay_status_id,
      user_id,
      notes,
    } = data;

    // Validate required fields
    if (
      !customer_name ||
      !total_price ||
      !payment_status ||
      !booking_method ||
      !stay_status_id
    ) {
      const missing = [];
      if (!customer_name) missing.push("Tên khách hàng");
      if (!total_price) missing.push("Tổng giá");
      if (!payment_status) missing.push("Trạng thái thanh toán");
      if (!booking_method) missing.push("Phương thức đặt phòng");
      if (!stay_status_id) missing.push("Trạng thái booking");

      throw new Error(
        `Thiếu thông tin bắt buộc: ${missing.join(
          ", "
        )}. Vui lòng kiểm tra lại form.`
      );
    }

    // Check room availability & validate guest numbers
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        const {
          room_id,
          check_in,
          check_out,
          num_adults,
          num_children,
          room_type_price,
        } = item;
        // Validate room_type_price
        if (room_type_price === undefined || room_type_price === null) {
          throw new Error("Thiếu trường room_type_price cho từng phòng!");
        }

        // Check 1: Room must be available (not booked/occupied/unavailable/maintenance)
        const roomCheck = await client.query(
          `SELECT id, name, status, type_id FROM rooms WHERE id = $1`,
          [room_id]
        );

        if (roomCheck.rows.length === 0) {
          throw new Error(`Phòng ID ${room_id} không tồn tại.`);
        }

        const room = roomCheck.rows[0];
        if (room.status !== "available") {
          throw new Error(
            `Phòng \"${room.name}\" hiện đang ở trạng thái \"${room.status}\" và không thể đặt. Vui lòng chọn phòng khác.`
          );
        }

        // Check 2: Validate guest numbers against room type
        const typeRes = await client.query(
          `SELECT base_adults, base_children, name FROM room_types WHERE id = $1`,
          [room.type_id]
        );
        if (typeRes.rows.length === 0) {
          throw new Error(`Loại phòng cho phòng ${room.name} không tồn tại.`);
        }
        const type = typeRes.rows[0];
        const totalGuests = num_adults + num_children;

        // Kiểm tra 1: Tổng số khách (người lớn + trẻ em, không tính em bé) <= 4 (mặc định)
        const MAX_GUESTS_DEFAULT = 4;
        if (totalGuests > MAX_GUESTS_DEFAULT) {
          throw new Error(
            `Tổng số người (${totalGuests}) vượt quá giới hạn tối đa ${MAX_GUESTS_DEFAULT} người (không bao gồm em bé). Vui lòng chọn lại.`
          );
        }

        // Kiểm tra 2: Tổng số khách <= capacity (nếu capacity < 4 thì dùng capacity)
        const maxCapacity = Math.min(
          type.capacity || MAX_GUESTS_DEFAULT,
          MAX_GUESTS_DEFAULT
        );
        if (totalGuests > maxCapacity) {
          throw new Error(
            `Tổng số khách (${totalGuests}) vượt quá sức chứa (${maxCapacity}) cho loại phòng \"${type.name}\". Vui lòng chọn lại.`
          );
        }
        // Chỉ chặn nếu có booking khác đang ở (stay_status_id = 2)
        // Chỉ chặn nếu có booking khác ở trạng thái reserved, checked_in, pending (1,2,6)
        // Sử dụng FOR UPDATE để lock row và tránh race condition
        const availabilityCheck = await client.query(
          `SELECT bi.id, b.id as booking_id, b.customer_name, bi.check_in, bi.check_out
           FROM booking_items bi
           JOIN bookings b ON bi.booking_id = b.id
           WHERE bi.room_id = $1
             AND b.stay_status_id IN (1, 2, 6)
             AND NOT (
               bi.check_out::date <= $2::date 
               OR bi.check_in::date >= $3::date
             )
           FOR UPDATE`,
          [room_id, check_in, check_out]
        );

        // Nếu có booking trùng, throw error
        if (availabilityCheck.rows.length > 0) {
          const conflicting = availabilityCheck.rows[0];
          throw new Error(
            `Phòng đã được đặt bởi "${conflicting.customer_name}" từ ${conflicting.check_in} đến ${conflicting.check_out}. Vui lòng chọn phòng khác.`
          );
        }
      }
    }

    // Tính total_room_price và total_service_price
    const total_room_price = Array.isArray(data.items)
      ? data.items.reduce((sum, item) => sum + (item.room_type_price || 0), 0)
      : 0;

    const total_service_price = Array.isArray(data.services)
      ? data.services.reduce((sum, s) => sum + (s.total_service_price || 0), 0)
      : 0;
    567;
    const insertBookingText = `INSERT INTO bookings (
      customer_name, total_price, payment_status, booking_method, stay_status_id, user_id, notes, payment_method, discount_code, discount_amount, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *`;

    const bookingRes = await client.query(insertBookingText, [
      customer_name,
      total_price, // Giá sau giảm, lấy từ frontend
      payment_status,
      booking_method,
      stay_status_id,
      user_id,
      notes || null,
      data.payment_method || null,
      data.discount_code || null,
      data.discount_amount || 0,
    ]);
    const booking = bookingRes.rows[0];

    // fetch joined stay_status name
    const joined = await client.query(
      `SELECT b.*, ss.name as stay_status_name FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [booking.id]
    );
    const bookingWithStatus = joined.rows[0];

    // insert booking_items if provided
    if (Array.isArray(data.items)) {
      // console.log("[DEBUG] data.items:", JSON.stringify(data.items, null, 2));
      const insertItemText = `INSERT INTO booking_items (booking_id, room_id, room_type_id, check_in, check_out, room_type_price, num_adults, num_children, extra_adult_fees, extra_child_fees, extra_fees, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
      for (const item of data.items) {
        // console.log("[DEBUG] Processing item:", item);
        const {
          room_id,
          room_type_id,
          check_in,
          check_out,
          room_type_price,
          num_adults,
          num_children,
          extra_adult_fees = 0,
          extra_child_fees = 0,
          extra_fees = 0,
          quantity = 1,
        } = item;
        const itemResult = await client.query(insertItemText, [
          booking.id,
          room_id,
          room_type_id,
          check_in,
          check_out,
          room_type_price,
          num_adults || 1,
          num_children || 0,
          extra_adult_fees,
          extra_child_fees,
          extra_fees,
          quantity,
        ]);

        await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
          "pending",
          room_id,
        ]);
      }
    }

    // Insert booking_services chung (backward compatibility - nếu có)
    // Ưu tiên dùng services trong từng item thay vì services chung
    if (Array.isArray(data.services) && data.services.length > 0) {
      const insertServiceText = `INSERT INTO booking_services (booking_id, service_id, quantity, total_service_price) VALUES ($1, $2, $3, $4) RETURNING *`;
      for (const service of data.services) {
        const { service_id, quantity, total_service_price } = service;
        await client.query(insertServiceText, [
          booking.id,
          service_id,
          quantity,
          total_service_price,
        ]);
      }
    }

    await client.query("COMMIT");
    return bookingWithStatus;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const setBookingStatus = async (id, fields) => {
  // fields: { payment_status?, stay_status_id?, is_refunded? }
  const client = await pool.connect();
  console.log("[setBookingStatus] Called with:", { id, fields });
  try {
    await client.query("BEGIN");
    console.log("[setBookingStatus] Transaction started");

    // Check if booking is cancelled before allowing payment_status update
    if (fields.payment_status && fields.payment_status !== "refunded") {
      const checkResult = await client.query(
        "SELECT stay_status_id FROM bookings WHERE id = $1",
        [id]
      );
      console.log(
        "[setBookingStatus] stay_status_id for payment_status:",
        checkResult.rows[0]?.stay_status_id
      );
      if (checkResult.rows[0]?.stay_status_id === 4) {
        console.warn(
          "[setBookingStatus] Attempt to update payment_status for cancelled booking:",
          id
        );
        throw new Error(
          "Không thể cập nhật trạng thái thanh toán khi booking đã hủy. Chỉ có thể chọn 'Refunded' để hoàn tiền."
        );
      }
    }

    // Nếu chuyển sang canceled (4) hoặc no_show (5) thì chỉ cập nhật trạng thái booking và phòng, giữ nguyên payment_status
    let patchFields = { ...fields };
    console.log("[setBookingStatus] patchFields:", patchFields);
    // Không động chạm payment_status khi hủy hoặc no_show, chỉ cập nhật khi thao tác hoàn tiền riêng
    const keys = [];
    const vals = [];
    let idx = 1;
    for (const k of Object.keys(patchFields)) {
      keys.push(`${k} = $${idx++}`);
      vals.push(patchFields[k]);
    }
    if (!keys.length) {
      console.warn("[setBookingStatus] No fields to update for booking:", id);
      return null;
    }
    const q = `UPDATE bookings SET ${keys.join(
      ", "
    )} WHERE id = $${idx} RETURNING *`;
    vals.push(id);
    console.log("[setBookingStatus] Executing query:", q, vals);
    const res = await client.query(q, vals);
    const updated = res.rows[0];
    console.log("[setBookingStatus] Updated booking:", updated);

    // Auto update room status based on booking status
    if (fields.stay_status_id) {
      const items = await client.query(
        "SELECT room_id FROM booking_items WHERE booking_id = $1",
        [id]
      );
      console.log("[setBookingStatus] booking_items:", items.rows);

      let roomStatus = null;
      const statusId = Number(fields.stay_status_id);

      // Database mapping: 1=reserved, 2=checked_in, 3=checked_out, 4=canceled, 5=no_show, 6=pending
      if (statusId === 6) roomStatus = "pending"; // pending -> chờ duyệt
      else if (statusId === 1) roomStatus = "booked"; // reserved -> đã đặt
      else if (statusId === 2) roomStatus = "occupied"; // checked_in -> đang ở
      else if (statusId === 3)
        roomStatus = "checkout"; // checked_out -> chờ admin xác nhận
      else if (statusId === 4 || statusId === 5) roomStatus = "available"; // canceled/no_show -> trống

      if (roomStatus) {
        for (const item of items.rows) {
          console.log(
            "[setBookingStatus] Updating room",
            item.room_id,
            "to status",
            roomStatus
          );
          await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
            roomStatus,
            item.room_id,
          ]);
        }
      }
    }

    await client.query("COMMIT");
    console.log("[setBookingStatus] Transaction committed");

    // return joined row with stay_status_name
    const joined = await client.query(
      `SELECT b.*, ss.name as stay_status_name FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [id]
    );
    console.log("[setBookingStatus] Final joined row:", joined.rows[0]);
    return joined.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[setBookingStatus] Error:", err);
    throw err;
  } finally {
    client.release();
    console.log("[setBookingStatus] Connection released");
  }
};

// Check-out: cập nhật trạng thái và checked_out_by

export const confirmCheckout = async (id, userId) => {
  // Admin confirms checkout -> room status changes to "cleaning", booking stays at checked_out (3)
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if booking is at checked_out status
    const checkBooking = await client.query(
      `SELECT b.stay_status_id, bi.check_in, bi.check_out
       FROM bookings b
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       WHERE b.id = $1
       LIMIT 1`,
      [id]
    );
    if (
      !checkBooking.rows[0] ||
      ![2, 3].includes(checkBooking.rows[0].stay_status_id)
    ) {
      throw new Error("Booking không ở trạng thái đang thuê hoặc checked_out");
    }

    // Validate checkout time: chuẩn hóa về Asia/Ho_Chi_Minh
    const timeZone = "Asia/Ho_Chi_Minh";
    const now = moment.tz(Date.now(), timeZone);
    const checkOutDate = moment.tz(checkBooking.rows[0].check_out, timeZone);
    const checkInDate = moment.tz(checkBooking.rows[0].check_in, timeZone);
    // Giờ giới hạn checkout là 14:00 ngày checkout
    const checkOutLimit = checkOutDate
      .clone()
      .set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    // Giờ check-in là 14:00 ngày check-in
    const checkInLimit = checkInDate
      .clone()
      .set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    // Log thời gian thực tế để debug
    console.log(
      "[Checkout Debug] now:",
      now.format(),
      "checkInLimit:",
      checkInLimit.format(),
      "checkOutLimit:",
      checkOutLimit.format(),
      "server timezone:",
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    // Phải sau giờ check-in (14:00 ngày check-in) mới được checkout
    if (now.isBefore(checkInLimit)) {
      throw new Error(
        "Chưa đến thời gian check-in (14:00), không thể checkout!"
      );
    }
    // Cho phép checkout sau 14:00 ngày check-in đến trước 14:00 ngày checkout (early checkout ok)
    // Sau 14:00 ngày checkout là late checkout (vẫn cho phép nhưng có thể tính phụ phí ở logic khác)
    // Không chặn checkout trễ ở đây - chỉ cảnh báo nếu cần

    // Get rooms from this booking
    const items = await client.query(
      "SELECT room_id FROM booking_items WHERE booking_id = $1",
      [id]
    );

    // Update all rooms to "cleaning" status
    for (const item of items.rows) {
      await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
        "cleaning",
        item.room_id,
      ]);
    }

    // Update booking stay_status_id to checked_out (3)
    await client.query(
      "UPDATE bookings SET stay_status_id = $1, checked_out_by = $2 WHERE id = $3",
      [3, userId, id]
    );

    await client.query("COMMIT");

    // Return updated booking
    const booking = await client.query(
      `SELECT b.*, ss.name as stay_status_name FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [id]
    );
    return booking.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const cancelBooking = async (
  id,
  userId,
  isAdmin = false,
  cancelReason = ""
) => {
  // Cancel booking with business logic: check permissions, calculate refund
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get booking details
    const bookingRes = await client.query(
      `SELECT b.*, bi.check_in 
       FROM bookings b
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       WHERE b.id = $1
       LIMIT 1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      throw new Error("Booking không tồn tại");
    }

    const booking = bookingRes.rows[0];
    const currentStatus = booking.stay_status_id;
    // Check-in thực tế là 14:00 giờ VN của ngày check_in
    const checkInDate = new Date(booking.check_in);
    checkInDate.setUTCHours(7, 0, 0, 0); // 14:00 VN = 07:00 UTC
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

    // Debug log
    console.log("[cancelBooking Debug]", {
      bookingId: id,
      currentStatus,
      userId,
      isAdmin,
      hoursUntilCheckIn,
      checkInDate: checkInDate.toISOString(),
      now: now.toISOString(),
    });

    // Lấy refund_deadline_hours từ refund_policies của room_type đầu tiên
    const itemsForDeadline = await client.query(
      "SELECT room_type_id FROM booking_items WHERE booking_id = $1 LIMIT 1",
      [id]
    );
    let refundDeadlineHours = 24; // mặc định 24h
    if (itemsForDeadline.rows.length > 0) {
      const refundPolicyRes = await client.query(
        `SELECT refund_deadline_hours FROM refund_policies WHERE room_type_id = $1`,
        [itemsForDeadline.rows[0].room_type_id]
      );
      if (
        refundPolicyRes.rows.length > 0 &&
        refundPolicyRes.rows[0].refund_deadline_hours != null
      ) {
        refundDeadlineHours = refundPolicyRes.rows[0].refund_deadline_hours;
      }
    }

    // Permission check based on role and status
    if (!isAdmin) {
      // User cancellation rules
      if (currentStatus === 1) {
        // reserved (1) - can cancel, refund depends on deadline
        // Không chặn hủy nữa, chỉ tính refund dựa trên deadline
        // User vẫn được hủy, nhưng nếu < deadline thì refund = 0
      } else if (currentStatus === 6) {
        // pending (6) - can cancel freely (no confirmation yet)
        // Allow cancellation, no refund needed since not paid yet
      } else if (currentStatus === 2) {
        // checked_in (2) - cannot cancel, only checkout
        throw new Error(
          "Không thể hủy khi đã check-in. Vui lòng liên hệ admin."
        );
      } else if ([3, 4].includes(currentStatus)) {
        // checked_out/cancelled - already finished
        throw new Error("Booking đã hoàn tất hoặc đã bị hủy trước đó");
      } else if (currentStatus === 5) {
        // no_show - already marked
        throw new Error("Booking đã được đánh dấu No-show");
      } else {
        throw new Error("Không thể hủy booking ở trạng thái này");
      }

      // User can only cancel their own bookings
      if (booking.user_id !== userId) {
        throw new Error("Bạn không có quyền hủy booking này");
      }
    } else {
      // Admin/Staff/Manager cancellation rules - more permissive
      if (currentStatus === 6) {
        // pending (6) - staff can cancel freely
        // Allow
      } else if (currentStatus === 1) {
        // reserved (1) - staff can cancel
        // Allow
      } else if (currentStatus === 2) {
        // checked_in (2) - staff CAN cancel (force cancel)
        // Allow (staff has more power)
      } else if (currentStatus === 5) {
        // no_show - can still be cancelled by admin
        // Allow
      } else if ([3, 4].includes(currentStatus)) {
        // checked_out/cancelled
        throw new Error("Booking đã hoàn tất hoặc đã bị hủy trước đó");
      }
    }

    // Lấy thông tin các booking_items để xác định room_type_id
    const items = await client.query(
      "SELECT room_id, room_type_id, room_type_price FROM booking_items WHERE booking_id = $1",
      [id]
    );

    // Lấy refund_policy cho từng room_type từ bảng refund_policies
    let totalRefund = 0;

    // Nếu booking chưa được thanh toán (pending status 6 hoặc payment_status !== 'paid'),
    // thì không cần tính hoàn tiền
    const paymentStatus = booking.payment_status;
    const skipRefundCalculation =
      currentStatus === 6 || paymentStatus !== "paid";

    if (skipRefundCalculation) {
      console.log("[REFUND DEBUG] Skipping refund - not paid yet", {
        currentStatus,
        paymentStatus,
      });
      totalRefund = 0;
    } else {
      for (const item of items.rows) {
        const refundRes = await client.query(
          `SELECT refundable, refund_percent, refund_deadline_hours, non_refundable
           FROM refund_policies WHERE room_type_id = $1`,
          [item.room_type_id]
        );
        const refundPolicy = refundRes.rows[0] || {};
        // Mặc định: hoàn 0 nếu không có policy
        let refundPercent = 0;
        let refundable = false;
        let deadline = 24; // giờ trước check-in
        let nonRefundable = false;
        if (refundPolicy && Object.keys(refundPolicy).length > 0) {
          refundable = refundPolicy.refundable ?? false;
          refundPercent = refundPolicy.refund_percent ?? 0;
          deadline = refundPolicy.refund_deadline_hours ?? 24;
          nonRefundable = refundPolicy.non_refundable ?? false;
        }

        // Debug log
        console.log("[REFUND DEBUG]", {
          room_type_id: item.room_type_id,
          hasPolicy: !!refundRes.rows[0],
          refundable,
          refundPercent,
          deadline,
          nonRefundable,
          hoursUntilCheckIn,
          meetsDeadline: hoursUntilCheckIn >= deadline,
        });

        // Nếu là No Show (stay_status_id === 5) thì không hoàn tiền
        if (currentStatus === 5) {
          refundPercent = 0;
        } else if (nonRefundable) {
          refundPercent = 0;
        } else if (refundable && hoursUntilCheckIn >= deadline) {
          // Đủ điều kiện hoàn tiền
          refundPercent = refundPercent;
        } else {
          refundPercent = 0;
        }
        // Tính số tiền hoàn lại cho từng phòng
        const itemRefund = Math.round(
          (item.room_type_price || 0) * (refundPercent / 100)
        );
        totalRefund += itemRefund;
        // Lưu số tiền hoàn lại vào booking_items
        await client.query(
          `UPDATE booking_items SET refund_amount = $1 WHERE booking_id = $2 AND room_id = $3`,
          [itemRefund, id, item.room_id]
        );
      }
    }

    // Lấy trạng thái thanh toán hiện tại
    // Khi hủy chỉ cập nhật trạng thái booking, không cập nhật payment_status
    await client.query(
      `UPDATE bookings 
         SET stay_status_id = 4,
             cancel_reason = $2,
             canceled_by = $3,
             canceled_at = NOW(),
             refund_amount = $4,
             is_refunded = CASE WHEN $4 > 0 THEN false ELSE NULL END
         WHERE id = $1`,
      [id, cancelReason, userId, totalRefund]
    );

    // Cập nhật trạng thái phòng
    for (const item of items.rows) {
      await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
        "available",
        item.room_id,
      ]);
    }

    await client.query("COMMIT");

    // Trả về booking đã cập nhật
    const result = await client.query(
      `SELECT b.*, ss.name as stay_status_name 
       FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [id]
    );

    return {
      booking: result.rows[0],
      refund_amount: totalRefund,
      message:
        totalRefund > 0
          ? `Đã hủy booking. Số tiền hoàn lại: ${totalRefund} VND.`
          : `Đã hủy booking. Không đủ điều kiện hoàn tiền theo chính sách.`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const changeRoomInBooking = async (data) => {
  const { booking_id, booking_item_id, new_room_id, changed_by, reason } = data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get booking info
    const bookingRes = await client.query(
      "SELECT * FROM bookings WHERE id = $1",
      [booking_id]
    );
    if (!bookingRes.rows[0]) {
      throw new Error("Booking not found");
    }
    const booking = bookingRes.rows[0];

    // 2. Check change_count limit
    if (booking.change_count >= 1) {
      throw new Error("Bạn chỉ được đổi phòng 1 lần duy nhất");
    }

    // 3. Check booking status (only allow for reserved/pending)
    if (![1, 6].includes(booking.stay_status_id)) {
      throw new Error(
        "Chỉ có thể đổi phòng khi booking ở trạng thái Đã xác nhận hoặc Chờ xác nhận"
      );
    }

    // 4. Get booking_item info
    const itemRes = await client.query(
      "SELECT * FROM booking_items WHERE id = $1 AND booking_id = $2",
      [booking_item_id, booking_id]
    );
    if (!itemRes.rows[0]) {
      throw new Error("Booking item not found");
    }
    const bookingItem = itemRes.rows[0];
    const old_room_id = bookingItem.room_id;

    // 5. Get new room info
    const newRoomRes = await client.query("SELECT * FROM rooms WHERE id = $1", [
      new_room_id,
    ]);
    if (!newRoomRes.rows[0]) {
      throw new Error("New room not found");
    }
    const newRoom = newRoomRes.rows[0];

    // 6. Check if new room is available (status)
    if (newRoom.status !== "available") {
      throw new Error(
        "Phòng mới không khả dụng (đang được sử dụng hoặc bảo trì)"
      );
    }

    // 7. Check if new room conflicts with other bookings in the date range
    const conflictCheck = await client.query(
      `SELECT bi.id, b.customer_name, bi.check_in, bi.check_out
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       WHERE bi.room_id = $1
         AND b.stay_status_id IN (1, 2, 3)
         AND bi.id != $2
         AND NOT (
           bi.check_out::date <= $3::date 
           OR bi.check_in::date >= $4::date
         )`,
      [
        new_room_id,
        booking_item_id,
        bookingItem.check_in,
        bookingItem.check_out,
      ]
    );

    if (conflictCheck.rows.length > 0) {
      const conflict = conflictCheck.rows[0];
      throw new Error(
        `Phòng mới đã được đặt trong khoảng thời gian ${conflict.check_in} - ${conflict.check_out}. Vui lòng chọn phòng khác.`
      );
    }

    // 8. Calculate price difference
    const checkIn = new Date(bookingItem.check_in);
    const checkOut = new Date(bookingItem.check_out);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const new_price = newRoom.price * nights;
    const price_difference = new_price - bookingItem.room_type_price;

    // 8. Update booking_item
    await client.query(
      "UPDATE booking_items SET room_id = $1, room_type_price = $2 WHERE id = $3",
      [new_room_id, new_price, booking_item_id]
    );

    // 9. Update total price in booking
    await client.query(
      "UPDATE bookings SET total_price = total_price + $1 WHERE id = $2",
      [price_difference, booking_id]
    );

    // 10. Insert change log
    const logRes = await client.query(
      `INSERT INTO booking_change_logs 
       (booking_id, booking_item_id, changed_by, old_room_id, new_room_id, price_difference, reason) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        booking_id,
        booking_item_id,
        changed_by,
        old_room_id,
        new_room_id,
        price_difference,
        reason,
      ]
    );

    // 11. Increment change_count
    await client.query(
      "UPDATE bookings SET change_count = change_count + 1 WHERE id = $1",
      [booking_id]
    );

    // 12. Update room status
    await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
      "available",
      old_room_id,
    ]);
    await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
      "pending",
      new_room_id,
    ]);

    await client.query("COMMIT");

    return {
      success: true,
      old_room_id,
      new_room_id,
      price_difference,
      new_total_price: booking.total_price + price_difference,
      log: logRes.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
