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
export const getAllIncidents = async () => {
  const result = await pool.query(
    `SELECT bi.*,
            me.name as equipment_name,
            me.type as equipment_type,
            r.name as room_name,
            b.customer_name
     FROM booking_incidents bi
     JOIN master_equipments me ON bi.equipment_id = me.id
     JOIN rooms r ON bi.room_id = r.id
     JOIN bookings b ON bi.booking_id = b.id
     ORDER BY bi.created_at DESC`
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
  const bookingRes = await pool.query(
    `SELECT stay_status_id FROM bookings WHERE id = $1`,
    [booking_id]
  );
  if (!bookingRes.rows.length) {
    throw new Error("Booking không tồn tại");
  }
  if (![2, 3].includes(bookingRes.rows[0].stay_status_id)) {
    throw new Error(
      "Chỉ có thể báo hỏng khi booking đang ở (Checked-in) hoặc Checked-out"
    );
  }

  // Get room type to validate equipment authorization
  const roomTypeRes = await pool.query(
    `SELECT type_id FROM rooms WHERE id = $1`,
    [room_id]
  );
  if (!roomTypeRes.rows.length) {
    throw new Error("Phòng không tồn tại");
  }
  const room_type_id = roomTypeRes.rows[0].type_id;

  // Check if equipment is authorized for this room type
  const authorizedEquipmentRes = await pool.query(
    `SELECT quantity FROM room_type_equipments
     WHERE room_type_id = $1 AND equipment_type_id = $2`,
    [room_type_id, equipment_id]
  );

  if (authorizedEquipmentRes.rows.length === 0) {
    throw new Error(
      "Thiết bị này không nằm trong cấu hình tiêu chuẩn của loại phòng này"
    );
  }

  const standardQuantity = authorizedEquipmentRes.rows[0].quantity;

  const eqRes = await pool.query(
    `SELECT compensation_price FROM master_equipments WHERE id = $1`,
    [equipment_id]
  );
  const compensation_price = eqRes.rows[0]?.compensation_price || 0;
  const amount = compensation_price * quantity;

  console.log(
    `[createIncident] Checking device: room_id=${room_id}, equipment_id=${equipment_id}, standard_qty=${standardQuantity}`
  );

  const deviceRes = await pool.query(
    `SELECT * FROM room_devices WHERE room_id = $1 AND master_equipment_id = $2`,
    [room_id, equipment_id]
  );

  if (deviceRes.rows.length === 0) {
    console.log("[createIncident] Device NOT FOUND by ID");
    throw new Error(
      "Thiết bị không tồn tại trong phòng (Sai ID thiết bị hoặc phòng)"
    );
  }

  const device = deviceRes.rows[0];
  if (device.status !== "working") {
    console.log("[createIncident] Device status is", device.status);
    throw new Error(
      "Thiết bị không ở trạng thái hoạt động (Status: " + device.status + ")"
    );
  }
  if (quantity > device.quantity) {
    throw new Error("Số lượng báo hỏng vượt quá số lượng thực tế trong phòng");
  }

  // Validate against room type standard quantity
  if (quantity > standardQuantity) {
    throw new Error(
      `Số lượng báo hỏng vượt quá tiêu chuẩn loại phòng (tối đa ${standardQuantity})`
    );
  }
  const now = new Date();
  const result = await pool.query(
    `INSERT INTO booking_incidents (booking_id, room_id, equipment_id, quantity, reason, amount, compensation_price, created_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
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
  await pool.query(
    `UPDATE bookings SET total_price = total_price + $1 WHERE id = $2`,
    [amount, booking_id]
  );
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

  // Ensure room status is set to 'maintenance'
  await pool.query(
    `UPDATE rooms SET status = 'maintenance' WHERE id = $1 AND status != 'maintenance'`,
    [room_id]
  );

  return result.rows[0];
};
export const deleteIncident = async (
  id,
  deleted_by = null,
  deleted_reason = null
) => {
  const now = new Date();
  const incidentRes = await pool.query(
    `SELECT booking_id, amount FROM booking_incidents WHERE id = $1`,
    [id]
  );
  const incident = incidentRes.rows[0];
  const result = await pool.query(
    `UPDATE booking_incidents SET deleted_at = $2, deleted_by = $3, deleted_reason = $4 WHERE id = $1 RETURNING *`,
    [id, now, deleted_by, deleted_reason]
  );
  if (incident) {
    await pool.query(
      `UPDATE bookings SET total_price = total_price - $1 WHERE id = $2`,
      [incident.amount, incident.booking_id]
    );
  }
  return result.rows[0];
};

export const resolveIncident = async (id, resolved_by) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Mark incident as fixed
    const updateRes = await client.query(
      `UPDATE booking_incidents
       SET status = 'fixed'
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (updateRes.rowCount === 0) {
      throw new Error("Sự cố không tồn tại");
    }

    const incident = updateRes.rows[0];
    const roomId = incident.room_id;

    // 2. Check if there are any other PENDING incidents for this room
    const pendingRes = await client.query(
      `SELECT 1 FROM booking_incidents
       WHERE room_id = $1 AND status = 'pending' AND deleted_at IS NULL LIMIT 1`,
      [roomId]
    );

    // 3. If no pending incidents, set room to 'available' (if it was maintenance or cleaning)
    if (pendingRes.rowCount === 0) {
      await client.query(
        `UPDATE rooms SET status = 'available' WHERE id = $1 AND status IN ('maintenance', 'cleaning')`,
        [roomId]
      );
    }

    await client.query("COMMIT");
    return incident;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
