import pool from "../db.js";

export const getStandardQuantity = async (
  room_type_id,
  master_equipment_id
) => {
  const result = await pool.query(
    `SELECT quantity FROM room_type_equipments WHERE room_type_id = $1 AND equipment_type_id = $2`,
    [room_type_id, master_equipment_id]
  );
  return result.rows[0] || null;
};

export const upsertStandard = async (
  room_type_id,
  master_equipment_id,
  quantity
) => {
  await pool.query(
    `INSERT INTO room_type_equipments (room_type_id, equipment_type_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (room_type_id, equipment_type_id)
     DO UPDATE SET quantity = $3`,
    [room_type_id, master_equipment_id, quantity]
  );
};

export const getAllStandards = async () => {
  const result = await pool.query(
    `SELECT room_type_id, equipment_type_id as master_equipment_id, quantity FROM room_type_equipments`
  );
  return result.rows;
};

export const getEquipmentsByRoomType = async (room_type_id) => {
  const result = await pool.query(
    `SELECT
      rte.id,
      rte.equipment_type_id as equipment_id,
      me.name as equipment_name,
      me.type as equipment_type,
      rte.quantity
    FROM room_type_equipments rte
    JOIN master_equipments me ON me.id = rte.equipment_type_id
    WHERE rte.room_type_id = $1
    ORDER BY me.name`,
    [room_type_id]
  );
  return result.rows;
};
