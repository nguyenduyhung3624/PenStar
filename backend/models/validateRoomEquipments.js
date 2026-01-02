import pool from "../db.js";

// Kiểm tra tiêu chuẩn thiết bị phòng: đủ từng thiết bị master theo room_type_equipments
export const validateRoomEquipments = async (room_id) => {
  // Lấy type_id của phòng
  const roomRes = await pool.query("SELECT type_id FROM rooms WHERE id = $1", [
    room_id,
  ]);
  if (!roomRes.rows.length)
    return { ok: false, message: "Phòng không tồn tại" };
  const type_id = roomRes.rows[0].type_id;

  // Lấy tiêu chuẩn thiết bị cho loại phòng này
  const standardRes = await pool.query(
    `SELECT rte.equipment_type_id as master_equipment_id, me.name, rte.min_quantity
     FROM room_type_equipments rte
     JOIN master_equipments me ON me.id = rte.equipment_type_id
     WHERE rte.room_type_id = $1`,
    [type_id]
  );
  const standards = standardRes.rows;

  // Log tiêu chuẩn và thiết bị thực tế để debug
  console.log("[validateRoomEquipments] room_id:", room_id);
  console.log("[validateRoomEquipments] standards:", standards);

  // Lấy thiết bị thực tế trong phòng
  const deviceRes = await pool.query(
    `SELECT master_equipment_id, SUM(quantity) as total
     FROM room_devices WHERE room_id = $1
     GROUP BY master_equipment_id`,
    [room_id]
  );
  const actual = {};
  for (const row of deviceRes.rows) {
    actual[row.master_equipment_id] = Number(row.total);
  }

  console.log("[validateRoomEquipments] actual:", actual);

  // Kiểm tra từng thiết bị master: thiếu, thừa, đạt
  const details = [];
  let hasError = false;
  for (const std of standards) {
    const actualQty = actual[std.master_equipment_id] || 0;
    let status = "ok";
    let diff = actualQty - std.min_quantity;
    if (actualQty < std.min_quantity) {
      status = "missing";
      hasError = true;
    } else if (actualQty > std.min_quantity) {
      status = "exceed";
      hasError = true;
    }
    details.push({
      master_equipment_id: std.master_equipment_id,
      name: std.name,
      required: std.min_quantity,
      actual: actualQty,
      diff,
      status,
    });
  }

  if (!hasError) {
    return { ok: true, message: "Thiết bị phòng đạt tiêu chuẩn!", details };
  } else {
    return {
      ok: false,
      message: "Thiết bị phòng thiếu hoặc thừa!",
      details,
    };
  }
};
