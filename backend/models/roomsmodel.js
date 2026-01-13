import pool from "../db.js";
import { STAY_STATUS } from "../utils/constants.js";
export const CHILD_AGE_LIMIT = 8;
export const getRooms = async () => {
  const resuit = await pool.query(`
    SELECT r.*, r.floor_id,
           rt.name as type_name,
           rt.thumbnail as image,
           f.name as floor_name
    FROM rooms r
    LEFT JOIN room_types rt ON r.type_id = rt.id
    LEFT JOIN floors f ON r.floor_id = f.id
    ORDER BY r.created_at DESC
  `);
  return resuit.rows;
};
export const getRoomID = async (id) => {
  const resuit = await pool.query(
    `
    SELECT r.*,
           rt.name as type_name,
           rt.thumbnail as image,
           f.name as floor_name
    FROM rooms r
    LEFT JOIN room_types rt ON r.type_id = rt.id
    LEFT JOIN floors f ON r.floor_id = f.id
    WHERE r.id = $1
  `,
    [id]
  );
  console.log(resuit);
  return resuit.rows[0];
};
export const createRoom = async (data) => {
  const { name, type_id, short_desc, long_desc, status, floor_id } = data;
  const resuit = await pool.query(
    `INSERT INTO rooms (name, type_id, short_desc, long_desc, status, floor_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, type_id, short_desc, long_desc, status, floor_id]
  );
  console.log(resuit);
  return resuit.rows[0];
};
export const updateRoom = async (id, data) => {
  const { name, type_id, short_desc, long_desc, status, floor_id } = data;
  const result = await pool.query(
    `UPDATE rooms SET name = $1, type_id = $2, short_desc = $3, long_desc = $4, status = $5, floor_id = $6
     WHERE id = $7 RETURNING *`,
    [name, type_id, short_desc, long_desc, status, floor_id, id]
  );
  console.log(result);
  return result.rows[0];
};
export const hasActiveBookings = async (roomId) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count
     FROM booking_items bi
     JOIN bookings b ON bi.booking_id = b.id
     WHERE bi.room_id = $1
       AND b.stay_status_id IN (${STAY_STATUS.PENDING}, ${STAY_STATUS.RESERVED}, ${STAY_STATUS.CHECKED_IN})`,
    [roomId]
  );
  return parseInt(result.rows[0].count) > 0;
};
export const deleteRoom = async (id) => {
  const resuit = await pool.query(
    "DELETE FROM rooms WHERE id = $1 RETURNING *",
    [id]
  );
  return resuit.rows[0];
};
export const countRoomsByTypeId = async (typeId) => {
  return countRoomsBy_type_id(typeId);
};
export const countRoomsByFloorId = async (floorId) => {
  return countRoomsBy_floor_id(floorId);
};
export const countRoomsBy_type_id = async (type_id) => {
  const resuit = await pool.query(
    "SELECT COUNT(*)::int AS count FROM rooms WHERE type_id = $1",
    [type_id]
  );
  return resuit.rows[0]?.count ?? 0;
};
export const countRoomsBy_floor_id = async (floor_id) => {
  const resuit = await pool.query(
    "SELECT COUNT(*)::int AS count FROM rooms WHERE floor_id = $1",
    [floor_id]
  );
  return resuit.rows[0]?.count ?? 0;
};
export const existsRoomWithNameAndType = async (
  name,
  type_id,
  excludeId = null
) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM rooms WHERE name = $1 AND type_id = $2 AND id <> $3 LIMIT 1",
      [name, type_id, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query(
    "SELECT 1 FROM rooms WHERE name = $1 AND type_id = $2 LIMIT 1",
    [name, type_id]
  );
  return res.rowCount > 0;
};
export const existsRoomWithName = async (name, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM rooms WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND id <> $2 LIMIT 1",
      [name, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query(
    "SELECT 1 FROM rooms WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1",
    [name]
  );
  return res.rowCount > 0;
};
export const searchAvailableRooms = async ({
  check_in,
  check_out,
  room_type_id = null,
  floor_id = null,
  num_adults = 1,
  num_children = 0,
  status = null,
}) => {
  console.log("🔍 Search params:", {
    check_in,
    check_out,
    room_type_id,
    floor_id,
    num_adults,
    num_children,
  });
  const totalGuests = num_adults + num_children;
  const statusList = Array.isArray(status)
    ? status
    : status
    ? [status]
    : ["available"];
  try {
    const conflictQuery = `
      SELECT DISTINCT r.id as room_id, r.name as room_name, bi.check_in, bi.check_out, b.stay_status_id
      FROM rooms r
      JOIN booking_items bi ON bi.room_id = r.id
      JOIN bookings b ON bi.booking_id = b.id
      WHERE r.status = ANY($1)
        AND NOT (
          bi.check_out::date <= $2::date
          OR bi.check_in::date >= $3::date
        )
        AND b.stay_status_id IN (${STAY_STATUS.PENDING}, ${STAY_STATUS.RESERVED}, ${STAY_STATUS.CHECKED_IN})
    `;
    const debugParams = [statusList, check_in, check_out];
    const res = await pool.query(conflictQuery, debugParams);
    if (res.rows.length) {
      console.log("[DEBUG] Các phòng bị loại do booking overlap:");
      res.rows.forEach((row) => {
        console.log(
          `Room #${row.room_id} (${row.room_name}) | Booking: ${row.check_in} - ${row.check_out} | Status: ${row.stay_status_id}`
        );
      });
    } else {
      console.log("[DEBUG] Không có phòng nào bị loại do booking overlap.");
    }
  } catch (err) {
    console.error("[DEBUG] Lỗi khi log conflictQuery:", err);
  }
  let query = `
    SELECT DISTINCT r.*, rt.name as type_name, rt.capacity, rt.thumbnail as image
    FROM rooms r
    LEFT JOIN room_types rt ON r.type_id = rt.id
    WHERE r.status = ANY($1)
      AND rt.capacity >= $2
      AND EXISTS (
        SELECT 1 FROM room_devices rd
        WHERE rd.room_id = r.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM room_devices rd
        WHERE rd.room_id = r.id AND rd.status != 'working'
      )
  `;
  const params = [statusList, totalGuests];
  console.log("📦 Initial params:", params);
  let paramIndex = 3;
  if (room_type_id) {
    query += ` AND r.type_id = $${paramIndex}`;
    params.push(room_type_id);
    paramIndex++;
  }
  if (floor_id) {
    query += ` AND r.floor_id = $${paramIndex}`;
    params.push(floor_id);
    paramIndex++;
  }
  query += `
    AND NOT EXISTS (
      SELECT 1 FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.room_id = r.id
        AND b.stay_status_id IN (${STAY_STATUS.PENDING}, ${
    STAY_STATUS.RESERVED
  }, ${STAY_STATUS.CHECKED_IN}) -- reserved, checked_in, pending
        AND NOT (
          bi.check_out::date <= $${paramIndex}::date
          OR bi.check_in::date >= $${paramIndex + 1}::date
        )
    )
  `;
  params.push(check_in, check_out);
  query += ` ORDER BY r.floor_id ASC, r.name ASC`;
  console.log("📝 Final query:", query);
  console.log("📦 Final params:", params);
  const result = await pool.query(query, params);
  console.log(`✅ Found ${result.rows.length} rooms`);
  return result.rows;
};
export const searchAllRoomsWithAvailability = async ({
  check_in,
  check_out,
  room_type_id = null,
  floor_id = null,
  num_adults = 1,
  num_children = 0,
}) => {
  console.log("🔍 searchAllRoomsWithAvailability:", {
    check_in,
    check_out,
    room_type_id,
    floor_id,
  });
  const totalGuests = num_adults + num_children;
  let query = `
    SELECT
      r.*,
      rt.name as type_name,
      rt.capacity,
      rt.price,
      rt.thumbnail as image,
      f.name as floor_name,
      CASE
        WHEN r.status != 'available' THEN false
        WHEN rt.capacity < $1 THEN false
        WHEN EXISTS (
          SELECT 1 FROM booking_items bi
          JOIN bookings b ON bi.booking_id = b.id
          WHERE bi.room_id = r.id
            AND b.stay_status_id IN (${STAY_STATUS.PENDING}, ${STAY_STATUS.RESERVED}, ${STAY_STATUS.CHECKED_IN})
            AND bi.status = 'active'
            AND NOT (
              bi.check_out::date <= $2::date
              OR bi.check_in::date >= $3::date
            )
        ) THEN false
        ELSE true
      END as is_available,
      (
        SELECT json_agg(json_build_object(
          'check_in', bi.check_in,
          'check_out', bi.check_out,
          'customer_name', bk.customer_name
        ))
        FROM booking_items bi
        JOIN bookings bk ON bi.booking_id = bk.id
        WHERE bi.room_id = r.id
          AND bk.stay_status_id IN (${STAY_STATUS.PENDING}, ${STAY_STATUS.RESERVED}, ${STAY_STATUS.CHECKED_IN})
          AND bi.status = 'active'
          AND NOT (
            bi.check_out::date <= $2::date
            OR bi.check_in::date >= $3::date
          )
      ) as conflicting_bookings
    FROM rooms r
    LEFT JOIN room_types rt ON r.type_id = rt.id
    LEFT JOIN floors f ON r.floor_id = f.id
    WHERE 1=1
  `;
  const params = [totalGuests, check_in, check_out];
  let paramIndex = 4;
  if (room_type_id) {
    query += ` AND r.type_id = $${paramIndex}`;
    params.push(room_type_id);
    paramIndex++;
  }
  if (floor_id) {
    query += ` AND r.floor_id = $${paramIndex}`;
    params.push(floor_id);
    paramIndex++;
  }
  query += ` ORDER BY r.floor_id ASC, r.name ASC`;
  const result = await pool.query(query, params);
  console.log(
    `✅ Found ${result.rows.length} rooms total, ${
      result.rows.filter((r) => r.is_available).length
    } available`
  );
  return result.rows;
};
export const getOccupiedRooms = async () => {
  const query = `
    SELECT
      r.*,
      rt.name as type_name,
      f.name as floor_name,
      b.id as booking_id,
      b.customer_name,
      b.customer_phone,
      b.stay_status_id,
      ss.name as stay_status_name,
      bi.check_in,
      bi.check_out,
      bi.id as booking_item_id
    FROM rooms r
    LEFT JOIN room_types rt ON r.type_id = rt.id
    LEFT JOIN floors f ON r.floor_id = f.id
    JOIN booking_items bi ON bi.room_id = r.id AND bi.status = 'active'
    JOIN bookings b ON bi.booking_id = b.id
    LEFT JOIN stay_status ss ON b.stay_status_id = ss.id
    WHERE b.stay_status_id IN (${STAY_STATUS.PENDING}, ${STAY_STATUS.RESERVED}, ${STAY_STATUS.CHECKED_IN})
      AND bi.check_in::date <= CURRENT_DATE
      AND bi.check_out::date >= CURRENT_DATE
    ORDER BY r.floor_id ASC, r.name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};
export const getRoomBookingHistory = async (roomId, limit = 20) => {
  const query = `
    SELECT
      bi.*,
      b.id as booking_id,
      b.customer_name,
      b.customer_email,
      b.customer_phone,
      b.total_price as booking_total,
      b.payment_status,
      b.stay_status_id,
      ss.name as stay_status_name,
      b.created_at as booking_created_at
    FROM booking_items bi
    JOIN bookings b ON bi.booking_id = b.id
    LEFT JOIN stay_status ss ON b.stay_status_id = ss.id
    WHERE bi.room_id = $1
    ORDER BY bi.check_in DESC
    LIMIT $2
  `;
  const result = await pool.query(query, [roomId, limit]);
  return result.rows;
};
export const getRoomStats = async () => {
  const query = `
    SELECT
      COUNT(*) as total_rooms,
      COUNT(*) FILTER (WHERE status = 'available') as available_rooms,
      COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_rooms,
      COUNT(*) FILTER (WHERE status = 'cleaning') as cleaning_rooms,
      (
        SELECT COUNT(DISTINCT bi.room_id)
        FROM booking_items bi
        JOIN bookings b ON bi.booking_id = b.id
        WHERE b.stay_status_id IN (${STAY_STATUS.PENDING}, ${STAY_STATUS.RESERVED}, ${STAY_STATUS.CHECKED_IN})
          AND bi.status = 'active'
          AND bi.check_in::date <= CURRENT_DATE
          AND bi.check_out::date >= CURRENT_DATE
      ) as occupied_rooms
    FROM rooms
  `;
  const result = await pool.query(query);
  return result.rows[0];
};
