// Thêm hoặc cập nhật tiêu chuẩn thiết bị cho loại phòng

import pool from "../db.js";

// Lấy min/max số lượng tiêu chuẩn của thiết bị theo loại phòng
export const getStandardQuantity = async (
  room_type_id,
  master_equipment_id
) => {
  const result = await pool.query(
    `SELECT min_quantity, max_quantity FROM room_type_equipments WHERE room_type_id = $1 AND equipment_type_id = $2`,
    [room_type_id, master_equipment_id]
  );
  return result.rows[0] || null;
};
export const upsertStandard = async (
  room_type_id,
  master_equipment_id,
  min_quantity,
  max_quantity
) => {
  // Nếu đã có thì update, chưa có thì insert
  await pool.query(
    `INSERT INTO room_type_equipments (room_type_id, equipment_type_id, min_quantity, max_quantity)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (room_type_id, equipment_type_id)
     DO UPDATE SET min_quantity = $3, max_quantity = $4`,
    [room_type_id, master_equipment_id, min_quantity, max_quantity]
  );
};

// Lấy tất cả tiêu chuẩn thiết bị theo loại phòng
export const getAllStandards = async () => {
  const result = await pool.query(
    `SELECT room_type_id, equipment_type_id as master_equipment_id, min_quantity, max_quantity FROM room_type_equipments`
  );
  return result.rows;
};

// Lấy danh sách thiết bị chuẩn của một loại phòng kèm tên thiết bị
export const getEquipmentsByRoomType = async (room_type_id) => {
  const result = await pool.query(
    `SELECT 
      rte.id,
      rte.equipment_type_id as equipment_id,
      me.name as equipment_name,
      me.type as equipment_type,
      rte.min_quantity,
      rte.max_quantity
    FROM room_type_equipments rte
    JOIN master_equipments me ON me.id = rte.equipment_type_id
    WHERE rte.room_type_id = $1
    ORDER BY me.name`,
    [room_type_id]
  );
  return result.rows;
};
