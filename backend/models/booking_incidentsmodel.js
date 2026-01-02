import pool from "../db.js";
export const getIncidentsByRoom = async (room_id) => {
  const result = await pool.query(
    `SELECT bi.*, me.name as equipment_name, me.type as equipment_type
     FROM booking_incidents bi
     JOIN master_equipments me ON bi.equipment_id = me.id
     WHERE bi.room_id = $1 AND bi.deleted_at IS NULL
     ORDER BY bi.id`,
    [room_id]
  );
  return result.rows;
};

export const getIncidentsByBooking = async (
  booking_id,
  showDeleted = false
) => {
  let query = `SELECT bi.*, me.name as equipment_name, me.type as equipment_type
     FROM booking_incidents bi
     JOIN master_equipments me ON bi.equipment_id = me.id
     WHERE bi.booking_id = $1`;
  if (!showDeleted) {
    query += " AND bi.deleted_at IS NULL";
  }
  query += " ORDER BY bi.id";
  const result = await pool.query(query, [booking_id]);
  return result.rows;
};

export const createIncident = async (data) => {
  const { booking_id, room_id, equipment_id, quantity, reason } = data;
  // Validate trạng thái booking: chỉ cho phép báo hỏng khi booking đang ở (stay_status_id = 2)
  const bookingRes = await pool.query(
    `SELECT stay_status_id FROM bookings WHERE id = $1`,
    [booking_id]
  );
  if (!bookingRes.rows.length) {
    throw new Error("Booking không tồn tại");
  }
  if (bookingRes.rows[0].stay_status_id !== 2) {
    throw new Error("Chỉ có thể báo hỏng khi booking đang ở (Checked-in)");
  }
  // Lấy giá đền bù từ master_equipments
  const eqRes = await pool.query(
    `SELECT compensation_price FROM master_equipments WHERE id = $1`,
    [equipment_id]
  );
  const compensation_price = eqRes.rows[0]?.compensation_price || 0;
  const amount = compensation_price * quantity;
  // Kiểm tra thiết bị có trong phòng và trạng thái working
  const deviceRes = await pool.query(
    `SELECT * FROM room_devices WHERE room_id = $1 AND master_equipment_id = $2 AND status = 'working'`,
    [room_id, equipment_id]
  );
  if (!deviceRes.rows.length) {
    throw new Error(
      "Thiết bị không tồn tại trong phòng hoặc không ở trạng thái hoạt động"
    );
  }
  const device = deviceRes.rows[0];
  if (quantity > device.quantity) {
    throw new Error("Số lượng báo hỏng vượt quá số lượng thực tế trong phòng");
  }
  // Lưu thời điểm báo sự cố
  const now = new Date();
  const result = await pool.query(
    `INSERT INTO booking_incidents (booking_id, room_id, equipment_id, quantity, reason, amount, compensation_price, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      booking_id,
      room_id,
      equipment_id,
      quantity,
      reason,
      amount,
      compensation_price,
      now,
    ]
  );
  // Cộng amount vào total_price của booking
  await pool.query(
    `UPDATE bookings SET total_price = total_price + $1 WHERE id = $2`,
    [amount, booking_id]
  );
  // Lấy thông tin thiết bị trong phòng
  const roomDeviceRes = await pool.query(
    `SELECT * FROM room_devices WHERE room_id = $1 AND master_equipment_id = $2`,
    [room_id, equipment_id]
  );
  if (roomDeviceRes.rows.length) {
    const roomDevice = roomDeviceRes.rows[0];
    let newQuantity = roomDevice.quantity - quantity;
    if (newQuantity < 0) newQuantity = 0;
    const newStatus = newQuantity === 0 ? "broken" : roomDevice.status;
    await pool.query(
      `UPDATE room_devices SET quantity = $1, status = $2 WHERE id = $3`,
      [newQuantity, newStatus, roomDevice.id]
    );
  }
  return result.rows[0];
};

export const deleteIncident = async (
  id,
  deleted_by = null,
  deleted_reason = null
) => {
  const now = new Date();
  // Lấy incident để biết booking_id và amount
  const incidentRes = await pool.query(
    `SELECT booking_id, amount FROM booking_incidents WHERE id = $1`,
    [id]
  );
  const incident = incidentRes.rows[0];
  const result = await pool.query(
    `UPDATE booking_incidents SET deleted_at = $2, deleted_by = $3, deleted_reason = $4 WHERE id = $1 RETURNING *`,
    [id, now, deleted_by, deleted_reason]
  );
  // Trừ amount khỏi total_price của booking nếu incident tồn tại
  if (incident) {
    await pool.query(
      `UPDATE bookings SET total_price = total_price - $1 WHERE id = $2`,
      [incident.amount, incident.booking_id]
    );
  }
  return result.rows[0];
};
