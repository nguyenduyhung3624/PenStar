import pool from "../db.js";

/**
 * Kiểm tra thiết bị trong phòng có vượt quá tiêu chuẩn room_type
 * @param {number} roomId - id phòng
 * @returns {Promise<{ok: boolean, errors: Array}>}
 */
export async function validateRoomEquipments(roomId) {
  try {
    // Lấy thông tin phòng
    const roomRes = await pool.query(
      "SELECT type_id FROM rooms WHERE id = $1",
      [roomId]
    );
    if (!roomRes.rows.length)
      return { ok: false, errors: ["Không tìm thấy phòng"] };
    const typeId = roomRes.rows[0].type_id;

    // Lấy tiêu chuẩn thiết bị cho loại phòng
    const standardRes = await pool.query(
      `SELECT equipment_type_id, min_quantity, max_quantity FROM room_type_equipments WHERE room_type_id = $1`,
      [typeId]
    );
    const standards = standardRes.rows;

    // Lấy danh sách thiết bị thực tế trong phòng
    const actualRes = await pool.query(
      `SELECT master_equipment_id, SUM(quantity) as quantity FROM room_devices WHERE room_id = $1 GROUP BY master_equipment_id`,
      [roomId]
    );
    const actuals = actualRes.rows;
    console.log("[validateRoomEquipments] actuals (room_devices):", actuals);
    console.log(
      "[validateRoomEquipments] standards (room_type_equipments):",
      standards
    );

    // Đối chiếu
    const errors = [];
    // Lấy map tên thiết bị
    const equipRes = await pool.query("SELECT id, name FROM master_equipments");
    const equipMap = {};
    for (const eq of equipRes.rows) {
      equipMap[eq.id] = eq.name;
    }
    for (const std of standards) {
      const actual = actuals.find(
        (a) => a.master_equipment_id === std.equipment_type_id
      );
      const qty = actual ? Number(actual.quantity) : 0;
      const equipName =
        equipMap[std.equipment_type_id] || `ID ${std.equipment_type_id}`;
      if (qty < Number(std.min_quantity)) {
        errors.push(`Thiết bị ${equipName} thiếu (${qty}/${std.min_quantity})`);
      }
      if (qty > Number(std.max_quantity)) {
        errors.push(`Thiết bị ${equipName} thừa (${qty}/${std.max_quantity})`);
      }
    }
    console.log("[validateRoomEquipments] errors:", errors);
    return { ok: errors.length === 0, errors };
  } catch (err) {
    console.error("[validateRoomEquipments] Lỗi:", err);
    throw err;
  }
}
