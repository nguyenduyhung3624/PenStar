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

export const replaceAllForRoomType = async (roomTypeId, items) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete existing
    await client.query(
      "DELETE FROM room_type_equipments WHERE room_type_id = $1",
      [roomTypeId]
    );

    // Insert new
    for (const item of items) {
      await client.query(
        `INSERT INTO room_type_equipments (room_type_id, name, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [roomTypeId, item.name, item.quantity, item.price || 0]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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
      rte.name,
      rte.quantity,
      rte.price
    FROM room_type_equipments rte
    WHERE rte.room_type_id = $1
    ORDER BY rte.name`,
    [room_type_id]
  );
  return result.rows;
};
