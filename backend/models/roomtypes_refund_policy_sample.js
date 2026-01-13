import pool from "../db.js";
export const getRoomTypes = async () => {
  let result;
  try {
    result = await pool.query(`
      SELECT 
        rt.id,
        rt.name,
        rt.description,
        rt.created_at,
        rt.capacity,
        rt.base_adults,
        rt.base_children,
        rt.extra_adult_fee,
        rt.extra_child_fee,
        rt.child_age_limit,
        rt.thumbnail,
        rt.price,
        rt.bed_type,
        rt.view_direction,
        rt.free_amenities,
        rt.paid_amenities,
        rt.room_size,
        rt.policies,
        rp.refundable,
        rp.refund_percent,
        rp.refund_deadline_hours,
        rp.non_refundable,
        rp.notes as refund_notes
      FROM room_types rt
      LEFT JOIN refund_policies rp ON rt.id = rp.room_type_id
    `);
  } catch (err) {
    console.error("Lỗi truy vấn room_types:", err);
    throw err;
  }
  const roomTypes = {};
  for (const row of result.rows) {
    if (!roomTypes[row.id]) {
      roomTypes[row.id] = {
        id: row.id,
        name: row.name,
        refund_policy:
          row.refundable !== null
            ? {
                refundable: row.refundable,
                refund_percent: row.refund_percent,
                refund_deadline_hours: row.refund_deadline_hours,
                non_refundable: row.non_refundable,
                notes: row.refund_notes,
              }
            : null,
      };
    }
  }
  return Object.values(roomTypes);
};
