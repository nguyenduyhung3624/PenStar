import pool from "../db.js";
import moment from "moment-timezone";
import { DiscountCodesModel } from "./discount_codesmodel.js";
export const getNow = () => new Date().toISOString();
export const confirmCheckin = async (id, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const itemsRes = await client.query(
      `SELECT bi.room_id, bi.check_in
       FROM booking_items bi
       WHERE bi.booking_id = $1`,
      [id]
    );
    if (itemsRes.rows.length === 0) {
      throw new Error("Booking không có phòng nào.");
    }
    const checkBooking = await client.query(
      "SELECT stay_status_id FROM bookings WHERE id = $1",
      [id]
    );
    if (checkBooking.rows[0].stay_status_id !== 1) {
      throw new Error("Chỉ có thể check-in booking ở trạng thái Đã đặt.");
    }
    const timeZone = "Asia/Ho_Chi_Minh";
    const now = moment.tz(Date.now(), timeZone);
    let hasReadyRoom = false;
    for (const item of itemsRes.rows) {
      const checkInDate = moment.tz(item.check_in, timeZone).startOf("day");
      const checkInLimit = checkInDate
        .clone()
        .set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      if (now.isSameOrAfter(checkInLimit)) {
        await client.query(
          "UPDATE rooms SET status = 'occupied' WHERE id = $1",
          [item.room_id]
        );
        hasReadyRoom = true;
      }
    }
    if (!hasReadyRoom) {
      const earliestCheckIn = itemsRes.rows.reduce(
        (min, curr) =>
          new Date(curr.check_in) < new Date(min) ? curr.check_in : min,
        itemsRes.rows[0].check_in
      );
      const limit = moment
        .tz(earliestCheckIn, timeZone)
        .startOf("day")
        .set({ hour: 14, minute: 0 });
      if (process.env.NODE_ENV === "development") {
        console.log(
          "⚠️ DEV MODE: Bypassing check-in time validation. Auto check-in enabled."
        );
        // Force set status occupied for all rooms
        for (const item of itemsRes.rows) {
          await client.query(
            "UPDATE rooms SET status = 'occupied' WHERE id = $1",
            [item.room_id]
          );
        }
      } else {
        throw new Error(
          `Chưa đến giờ nhận phòng nào! Sớm nhất là sau 14:00 ngày ${limit.format(
            "DD/MM/YYYY"
          )}`
        );
      }
    }
    await client.query(
      "UPDATE bookings SET stay_status_id = 2, checked_in_by = $1 WHERE id = $2",
      [userId, id]
    );
    await client.query("COMMIT");
    return (await client.query(`SELECT * FROM bookings WHERE id = $1`, [id]))
      .rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
export const confirmCheckout = async (id, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const checkBooking = await client.query(
      `SELECT b.stay_status_id, bi.check_out
       FROM bookings b
       JOIN booking_items bi ON bi.booking_id = b.id
       WHERE b.id = $1
       ORDER BY bi.check_out DESC
       LIMIT 1`,
      [id]
    );
    if (!checkBooking.rows[0]) throw new Error("Booking không tồn tại");
    const { stay_status_id, check_out } = checkBooking.rows[0];
    if (![2, 3].includes(stay_status_id)) {
      throw new Error("Booking không ở trạng thái hợp lệ để checkout");
    }
    const timeZone = "Asia/Ho_Chi_Minh";
    const now = moment.tz(Date.now(), timeZone);
    console.log("[CheckOut Security] Allowing checkout at any time.");
    const incidentsRes = await client.query(
      "SELECT 1 FROM booking_incidents WHERE booking_id = $1 AND deleted_at IS NULL AND status = 'pending' LIMIT 1",
      [id]
    );
    const hasIncidents = incidentsRes.rowCount > 0;
    const items = await client.query(
      "SELECT room_id FROM booking_items WHERE booking_id = $1",
      [id]
    );
    for (const item of items.rows) {
      const newStatus = hasIncidents ? "maintenance" : "cleaning";
      await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
        newStatus,
        item.room_id,
      ]);
    }
    await client.query(
      "UPDATE bookings SET stay_status_id = 3, checked_out_by = $1 WHERE id = $2",
      [userId, id]
    );
    await client.query("COMMIT");
    return (await client.query(`SELECT * FROM bookings WHERE id = $1`, [id]))
      .rows[0];
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
            checked_in_user.email as checked_in_by_email, checked_out_user.email as checked_out_by_email,
            dc.type as discount_type, dc.value as discount_value
     FROM bookings b
     LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
     LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN users checked_in_user ON checked_in_user.id = b.checked_in_by
    LEFT JOIN users checked_out_user ON checked_out_user.id = b.checked_out_by
    LEFT JOIN discount_codes dc ON dc.code = b.discount_code
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
<<<<<<< HEAD

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
      `SELECT max_adults, max_children, capacity, name FROM room_types WHERE id = $1`,
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
    const maxCapacity = Math.min(roomType.capacity || MAX_GUESTS_DEFAULT, MAX_GUESTS_DEFAULT);
    if (totalGuests > maxCapacity) {
      throw new Error(
        `Tổng số khách (${totalGuests}) vượt quá sức chứa (${maxCapacity}) cho loại phòng "${roomType.name}".`
      );
    }

    // Kiểm tra 3: Số người lớn có thể vượt quá tối đa 1 người (max_adults + 1)
    const maxAllowedAdults = roomType.max_adults + 1;
    if (numAdults > maxAllowedAdults) {
      throw new Error(
        `Số người lớn (${numAdults}) vượt quá giới hạn cho phép (tối đa ${maxAllowedAdults} người, trong đó ${roomType.max_adults} người tiêu chuẩn + 1 người vượt quá) cho loại phòng "${roomType.name}".`
      );
    }

    // ✅ KHÔNG kiểm tra max_children - linh hoạt cho gia đình có nhiều trẻ em
    // ✅ Em bé (0-5 tuổi) không tính vào giới hạn số người

    console.log(`[DEBUG autoAssignRooms] Excluding room IDs:`, excludeRoomIds);

    // Find available rooms of the specified type and capacity
    // Exclude rooms that have overlapping bookings AND rooms already assigned in this transaction
    const query = `
      SELECT DISTINCT r.*
      FROM rooms r
      JOIN room_types rt ON r.type_id = rt.id
      WHERE r.type_id = $1
        AND r.status = 'available'
        AND rt.capacity >= $2
        AND rt.max_adults >= $3
        ${
          excludeRoomIds.length > 0
            ? `AND r.id NOT IN (${excludeRoomIds
                .map((_, i) => `$${7 + i}`)
                .join(",")})`
            : ""
        }
        AND NOT EXISTS (
          SELECT 1 FROM booking_items bi
          JOIN bookings b ON bi.booking_id = b.id
          WHERE bi.room_id = r.id
            AND b.stay_status_id IN (1, 2, 3)
            AND NOT (
              bi.check_out::date <= $4::date 
              OR bi.check_in::date >= $5::date
            )
        )
      ORDER BY r.name ASC
      LIMIT $6
    `;

    // Build params array
    const params = [
      roomTypeId,
      totalGuests,
      numAdults,
      checkIn,
      checkOut,
      quantity,
      ...excludeRoomIds,
    ];

    console.log(`[DEBUG autoAssignRooms] Query:`, query);
    console.log(`[DEBUG autoAssignRooms] Params:`, params);

    const result = await client.query(query, params);

    console.log(
      `[DEBUG autoAssignRooms] Found ${result.rows.length} rooms:`,
      result.rows.map((r) => `${r.name} (ID: ${r.id})`)
    );

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

=======
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
export const createBooking = async (data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      customer_name,
      total_price,
      payment_status,
      booking_method,
      stay_status_id,
      user_id,
      notes,
    } = data;
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
        )}. Vui lòng điền đầy đủ form.`
      );
    }
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
        if (room_type_price === undefined || room_type_price === null) {
          throw new Error("Thiếu trường room_type_price cho từng phòng!");
        }
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
            `Phòng "${room.name}" hiện đang ở trạng thái "${room.status}" và không thể đặt. Vui lòng chọn phòng khác.`
          );
        }
        const typeRes = await client.query(
<<<<<<< HEAD
          `SELECT max_adults, max_children, capacity, name, adult_surcharge, child_surcharge FROM room_types WHERE id = $1`,
=======
          `SELECT base_adults, base_children, name FROM room_types WHERE id = $1`,
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
          [room.type_id]
        );
        if (typeRes.rows.length === 0) {
          throw new Error(`Loại phòng cho phòng ${room.name} không tồn tại.`);
        }
        const type = typeRes.rows[0];
        const totalGuests = num_adults + num_children;
        const MAX_GUESTS_DEFAULT = 4;
        if (totalGuests > MAX_GUESTS_DEFAULT) {
          throw new Error(
            `Tổng số người (${totalGuests}) vượt quá giới hạn tối đa ${MAX_GUESTS_DEFAULT} người (không bao gồm em bé). Vui lòng chọn lại.`
          );
        }
        const maxCapacity = Math.min(
          type.capacity || MAX_GUESTS_DEFAULT,
          MAX_GUESTS_DEFAULT
        );
        if (totalGuests > maxCapacity) {
          throw new Error(
            `Tổng số người (${totalGuests}) vượt quá sức chứa (${maxCapacity}) cho loại phòng "${type.name}". Vui lòng chọn lại.`
          );
        }
<<<<<<< HEAD

        // Kiểm tra 3: Số người lớn có thể vượt quá tối đa 1 người (max_adults + 1)
        const maxAllowedAdults = type.max_adults + 1;
        if (num_adults > maxAllowedAdults) {
          throw new Error(
            `Số người lớn (${num_adults}) vượt quá giới hạn cho phép (tối đa ${maxAllowedAdults} người, trong đó ${type.max_adults} người tiêu chuẩn + 1 người vượt quá) cho loại phòng "${type.name}". Vui lòng chọn lại.`
          );
        }

        // ✅ KHÔNG kiểm tra max_children - linh hoạt cho gia đình
        // ✅ Em bé (0-5 tuổi) không tính vào giới hạn số người

        // Tính phụ phí nếu vượt quá
        let adultSurchargeTotal = 0;
        let childSurchargeTotal = 0;
        
        // Tính phụ phí người lớn vượt quá (nếu có)
        if (num_adults > type.max_adults) {
          const excessAdults = num_adults - type.max_adults;
          adultSurchargeTotal = (type.adult_surcharge || 0) * excessAdults;
        }
        
        // Tính phụ phí trẻ em chỉ khi vượt quá max_children
        const excessChildren = Math.max(0, num_children - (type.max_children || 0));
        if (excessChildren > 0 && type.child_surcharge) {
          childSurchargeTotal = (type.child_surcharge || 0) * excessChildren;
        }
        
        // Lưu phụ phí vào item để insert sau
        item.adult_surcharge_total = adultSurchargeTotal;
        item.child_surcharge_total = childSurchargeTotal;

        // Check 3: Room availability in booking time range
        // Logic: Conflict khi khoảng thời gian CHỒNG LẤN
        // Sử dụng ::date để so sánh chính xác ngày, tránh vấn đề timezone/time
=======
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
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
        if (availabilityCheck.rows.length > 0) {
          const conflicting = availabilityCheck.rows[0];
          throw new Error(
            `Phòng đã được đặt bởi "${conflicting.customer_name}" từ ${conflicting.check_in} đến ${conflicting.check_out}. Vui lòng chọn phòng khác.`
          );
        }
      }
    }
    const insertBookingText = `INSERT INTO bookings (
      customer_name, total_price, payment_status, booking_method, stay_status_id, user_id, notes, payment_method, discount_code, discount_amount, payment_proof_image, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`;
    const bookingRes = await client.query(insertBookingText, [
      customer_name,
      total_price,
      payment_status,
      booking_method,
      stay_status_id,
      user_id,
      notes || null,
      data.payment_method || null,
      data.discount_code || null,
      data.discount_amount || 0,
      data.payment_proof_image || null,
    ]);
    const booking = bookingRes.rows[0];
    const joined = await client.query(
      `SELECT b.*, ss.name as stay_status_name FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [booking.id]
    );
    const bookingWithStatus = joined.rows[0];
    if (Array.isArray(data.items)) {
<<<<<<< HEAD
      console.log("[DEBUG] data.items:", JSON.stringify(data.items, null, 2));
      const insertItemText = `INSERT INTO booking_items (booking_id, room_id, room_type_id, check_in, check_out, room_type_price, num_adults, num_children, adult_surcharge_total, child_surcharge_total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
=======
      const insertItemText = `INSERT INTO booking_items (booking_id, room_id, room_type_id, check_in, check_out, room_type_price, num_adults, num_children, extra_adult_fees, extra_child_fees, extra_fees, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
      for (const item of data.items) {
        let {
          room_id,
          room_type_id,
          check_in,
          check_out,
          room_type_price,
          num_adults,
          num_children,
<<<<<<< HEAD
          services,
          adult_surcharge_total = 0,
          child_surcharge_total = 0,
        } = item;
        console.log("[DEBUG] Extracted services from item:", services);
        console.log("[DEBUG] Surcharges - Adult:", adult_surcharge_total, "Child:", child_surcharge_total);
        // Không validate hay insert room_price nữa
        const itemResult = await client.query(insertItemText, [
=======
          extra_adult_fees = 0,
          extra_child_fees = 0,
          extra_fees = 0,
          quantity = 1,
        } = item;
        if (!num_children || num_children === 0) {
          extra_child_fees = 0;
        }
        await client.query(insertItemText, [
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
          booking.id,
          room_id,
          room_type_id,
          check_in,
          check_out,
          room_type_price,
          num_adults || 1,
          num_children || 0,
<<<<<<< HEAD
          adult_surcharge_total,
          child_surcharge_total,
=======
          extra_adult_fees,
          extra_child_fees,
          extra_fees,
          quantity,
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
        ]);
        await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
          "pending",
          room_id,
        ]);
      }
      
      // Tính lại total_price bao gồm phụ phí
      const surchargeSumRes = await client.query(
        `SELECT 
          COALESCE(SUM(adult_surcharge_total), 0) as total_adult_surcharge,
          COALESCE(SUM(child_surcharge_total), 0) as total_child_surcharge
         FROM booking_items 
         WHERE booking_id = $1`,
        [booking.id]
      );
      const totalSurcharge = 
        Number(surchargeSumRes.rows[0]?.total_adult_surcharge || 0) +
        Number(surchargeSumRes.rows[0]?.total_child_surcharge || 0);
      
      // Cập nhật total_price của booking để bao gồm phụ phí
      if (totalSurcharge > 0) {
        await client.query(
          "UPDATE bookings SET total_price = total_price + $1 WHERE id = $2",
          [totalSurcharge, booking.id]
        );
        console.log(`[DEBUG] Added surcharge ${totalSurcharge} to booking ${booking.id}`);
      }
    }
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
    // Record voucher usage if voucher code exists
    if (data.discount_code && data.discount_code.trim()) {
      const codeRes = await client.query(
        "SELECT id FROM discount_codes WHERE code = $1",
        [data.discount_code]
      );
      if (codeRes.rows[0]) {
        await client.query(
          `INSERT INTO discount_code_usages (discount_code_id, user_id, booking_id, usage_count, used_at)
           VALUES ($1, $2, $3, 1, NOW())
           ON CONFLICT (discount_code_id, user_id)
           DO UPDATE SET usage_count = discount_code_usages.usage_count + 1, used_at = NOW()`,
          [codeRes.rows[0].id, user_id, booking.id]
        );
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
  const client = await pool.connect();
  console.log("[setBookingStatus] Called with:", { id, fields });
  try {
    await client.query("BEGIN");
    if (fields.payment_status && fields.payment_status !== "refunded") {
      const checkResult = await client.query(
        "SELECT stay_status_id, total_price FROM bookings WHERE id = $1",
        [id]
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
      // Auto-set amount_paid if marking as paid and amount_paid not provided
      if (
        fields.payment_status === "paid" &&
        fields.amount_paid === undefined
      ) {
        fields.amount_paid = checkResult.rows[0]?.total_price || 0;
      }
    }
    const keys = [];
    const vals = [];
    let idx = 1;
    for (const k of Object.keys(fields)) {
      keys.push(`${k} = $${idx++}`);
      vals.push(fields[k]);
    }
    if (!keys.length) {
      return null;
    }
    const q = `UPDATE bookings SET ${keys.join(
      ", "
    )} WHERE id = $${idx} RETURNING *`;
    vals.push(id);
    const res = await client.query(q, vals);
    const updated = res.rows[0];
    if (fields.stay_status_id) {
      const items = await client.query(
        "SELECT room_id FROM booking_items WHERE booking_id = $1",
        [id]
      );
      let roomStatus = null;
      const statusId = Number(fields.stay_status_id);
      if (statusId === 6) roomStatus = "pending";
      else if (statusId === 1) roomStatus = "booked";
      else if (statusId === 2) roomStatus = "occupied";
      else if (statusId === 3) roomStatus = "checkout";
      else if (statusId === 4 || statusId === 5) roomStatus = "available";
      if (roomStatus) {
        for (const item of items.rows) {
          await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
            roomStatus,
            item.room_id,
          ]);
        }
      }
    }
    await client.query("COMMIT");
    const joined = await client.query(
      `SELECT b.*, ss.name as stay_status_name FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [id]
    );
    return joined.rows[0];
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
    const checkInDate = new Date(booking.check_in);
    checkInDate.setUTCHours(7, 0, 0, 0);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
    if (!isAdmin) {
      if (currentStatus === 6) {
      } else if (currentStatus === 1) {
        throw new Error(
          "Không thể hủy booking đã được xác nhận. Vui lòng liên hệ admin."
        );
      } else if (currentStatus === 2) {
        throw new Error(
          "Không thể hủy khi đã check-in. Vui lòng liên hệ admin."
        );
      } else if ([3, 4].includes(currentStatus)) {
        throw new Error("Booking đã hoàn tất hoặc đã bị hủy trước đó");
      } else {
        throw new Error("Không thể hủy booking ở trạng thái này");
      }
      if (booking.user_id !== userId) {
        throw new Error("Bạn không có quyền hủy booking này");
      }
    } else {
      if (currentStatus === 6 || currentStatus === 1) {
      } else if (currentStatus === 2) {
        throw new Error("Không thể hủy booking đã check-in");
      } else if ([3, 4].includes(currentStatus)) {
        throw new Error("Booking đã hoàn tất hoặc đã bị hủy trước đó");
      } else {
        throw new Error("Không thể hủy booking ở trạng thái này");
      }
    }
    const items = await client.query(
      "SELECT room_id, room_type_id, room_type_price FROM booking_items WHERE booking_id = $1",
      [id]
    );
    let totalRefund = 0;
    for (const item of items.rows) {
      const refundRes = await client.query(
        `SELECT refundable, refund_percent, refund_deadline_hours, non_refundable
         FROM refund_policies WHERE room_type_id = $1`,
        [item.room_type_id]
      );
      const refundPolicy = refundRes.rows[0] || {};
      let refundPercent = 0;
      let refundable = false;
      let deadline = 24;
      let nonRefundable = false;
      if (refundPolicy && Object.keys(refundPolicy).length > 0) {
        refundable = refundPolicy.refundable ?? false;
        refundPercent = 80; // Enforce 80% refund policy
        deadline = refundPolicy.refund_deadline_hours ?? 24;
        nonRefundable = refundPolicy.non_refundable ?? false;
      }
      if (currentStatus === 5) {
        refundPercent = 0;
      } else if (nonRefundable) {
        refundPercent = 0;
      } else if (refundable && hoursUntilCheckIn >= deadline) {
        refundPercent = refundPercent;
      } else {
        refundPercent = 0;
      }
      const itemRefund = Math.round(
        (item.room_type_price || 0) * (refundPercent / 100)
      );
      totalRefund += itemRefund;
      await client.query(
        `UPDATE booking_items
         SET refund_amount = $1,
             status = 'cancelled',
             cancelled_at = NOW(),
             cancel_reason = $4
         WHERE booking_id = $2 AND room_id = $3`,
        [itemRefund, id, item.room_id, cancelReason]
      );
    }
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
    for (const item of items.rows) {
      await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
        "available",
        item.room_id,
      ]);
    }
    // Remove usage if voucher was used
    if (booking.discount_code) {
      const codeRes = await client.query(
        "SELECT id FROM discount_codes WHERE code = $1",
        [booking.discount_code]
      );
      if (codeRes.rows[0]) {
        await client.query(
          `UPDATE discount_code_usages
           SET usage_count = usage_count - 1
           WHERE discount_code_id = $1 AND user_id = $2 AND usage_count > 0`,
          [codeRes.rows[0].id, userId] // Use booking user_id, which is passed as userId arg (verified in controller)
        );
      }
    }
    await client.query("COMMIT");
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
