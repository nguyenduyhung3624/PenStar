import pool from "../db.js";
export const getRoomTypes = async () => {
<<<<<<< HEAD
  const result = await pool.query(`
    SELECT 
      rt.id,
      rt.name,
      rt.description,
      rt.created_at,
      rt.max_adults,
      rt.max_children,
      rt.capacity,
      (SELECT image_url FROM room_type_images WHERE room_type_id = rt.id AND is_thumbnail = true LIMIT 1) as thumbnail,
      rt.price,
      rt.adult_surcharge,
      rt.child_surcharge,
      rt.devices_id,
      d.id as device_id,
      d.name as device_name,
      d.type as device_type,
      d.fee as device_fee,
      d.description as device_description
    FROM room_types rt
    LEFT JOIN LATERAL (
      SELECT * FROM devices WHERE id = ANY(rt.devices_id)
    ) d ON TRUE
=======
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
      ORDER BY rt.created_at DESC
    `);
  } catch (err) {
    console.error("Lỗi truy vấn room_types:", err);
    throw err;
  }
  const imagesResult = await pool.query(`
    SELECT room_type_id, image_url, is_thumbnail
    FROM room_type_images
    ORDER BY room_type_id, is_thumbnail DESC, id ASC
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
  `);
  const imagesByRoomType = {};
  for (const img of imagesResult.rows) {
    if (!imagesByRoomType[img.room_type_id]) {
      imagesByRoomType[img.room_type_id] = [];
    }
    imagesByRoomType[img.room_type_id].push(img.image_url);
  }
  const roomTypes = {};
  for (const row of result.rows) {
    if (!roomTypes[row.id]) {
      roomTypes[row.id] = {
        id: row.id,
        name: row.name,
        description: row.description,
        created_at: row.created_at,
        capacity: row.capacity,
        room_size: row.room_size,
        thumbnail: row.thumbnail,
        images: imagesByRoomType[row.id] || [],
        price: row.price,
<<<<<<< HEAD
        adult_surcharge: row.adult_surcharge,
        child_surcharge: row.child_surcharge,
        devices_id: row.devices_id,
        devices: [],
=======
        bed_type: row.bed_type,
        view_direction: row.view_direction,
        free_amenities: row.free_amenities,
        paid_amenities: row.paid_amenities,
        base_adults: row.base_adults,
        base_children: row.base_children,
        extra_adult_fee: row.extra_adult_fee,
        extra_child_fee: row.extra_child_fee,
        child_age_limit: row.child_age_limit,
        policies: row.policies,
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
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
      };
    }
  }
  return Object.values(roomTypes);
};
export const createRoomType = async (data) => {
  const {
    name,
    description,
    thumbnail,
    capacity,
    base_adults,
    base_children,
    extra_adult_fee,
    extra_child_fee,
    child_age_limit,
    price,
<<<<<<< HEAD
    adult_surcharge,
    child_surcharge,
    devices_id,
  } = data;
  const result = await pool.query(
    "INSERT INTO room_types (name, description, thumbnail, images, capacity, max_adults, max_children, price, adult_surcharge, child_surcharge, devices_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
=======
    bed_type,
    view_direction,
    free_amenities,
    paid_amenities,
    room_size,
    policies,
  } = data;
  const result = await pool.query(
    `INSERT INTO room_types (
      name, description, capacity, base_adults, base_children, extra_adult_fee, extra_child_fee, child_age_limit, thumbnail, price, bed_type, view_direction, free_amenities, paid_amenities, room_size, policies
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    ) RETURNING *`,
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
    [
      name,
      description,
      capacity,
      base_adults,
      base_children,
      extra_adult_fee,
      extra_child_fee,
      child_age_limit,
      thumbnail || null,
      price,
<<<<<<< HEAD
      adult_surcharge || 0,
      child_surcharge || 0,
      devices_id || [],
=======
      bed_type,
      view_direction,
      free_amenities || null,
      paid_amenities || null,
      room_size,
      policies ? JSON.stringify(policies) : null,
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
    ]
  );
  return result.rows[0];
};
export const getRoomTypeById = async (id) => {
  const result = await pool.query(
    `SELECT
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
<<<<<<< HEAD
      rt.adult_surcharge,
      rt.child_surcharge,
      rt.devices_id,
      d.id as device_id,
      d.name as device_name,
      d.type as device_type,
      d.fee as device_fee,
      d.description as device_description
=======
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
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
    FROM room_types rt
    LEFT JOIN refund_policies rp ON rt.id = rp.room_type_id
    WHERE rt.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (row) {
    if (row.policies && typeof row.policies === "string")
      row.policies = JSON.parse(row.policies);
    row.refund_policy =
      row.refundable !== null
        ? {
            refundable: row.refundable,
            refund_percent: row.refund_percent,
            refund_deadline_hours: row.refund_deadline_hours,
            non_refundable: row.non_refundable,
            notes: row.refund_notes,
          }
        : null;
  }
  return row;
};
export const updateRoomType = async (id, data) => {
  let {
    name,
    description,
    capacity,
    base_adults,
    base_children,
    extra_adult_fee,
    extra_child_fee,
    child_age_limit,
    thumbnail,
    price,
<<<<<<< HEAD
    adult_surcharge,
    child_surcharge,
    devices_id,
=======
    bed_type,
    view_direction,
    free_amenities,
    paid_amenities,
    room_size,
    policies,
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
  } = data;
  if (typeof thumbnail === "undefined") {
    const old = await pool.query(
      "SELECT thumbnail FROM room_types WHERE id = $1",
      [id]
    );
    thumbnail = old.rows[0]?.thumbnail || null;
  }
  const result = await pool.query(
<<<<<<< HEAD
    "UPDATE room_types SET name = $1, description = $2, capacity = $3, max_adults = $4, max_children = $5, price = $6, adult_surcharge = $7, child_surcharge = $8, devices_id = $9 WHERE id = $10 RETURNING *",
=======
    `UPDATE room_types SET
      name = $1,
      description = $2,
      capacity = $3,
      base_adults = $4,
      base_children = $5,
      extra_adult_fee = $6,
      extra_child_fee = $7,
      child_age_limit = $8,
      thumbnail = $9,
      price = $10,
      bed_type = $11,
      view_direction = $12,
      free_amenities = $13,
      paid_amenities = $14,
      room_size = $15,
      policies = $16
    WHERE id = $17 RETURNING *`,
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
    [
      name,
      description,
      capacity,
      base_adults,
      base_children,
      extra_adult_fee,
      extra_child_fee,
      child_age_limit,
      thumbnail || null,
      price,
<<<<<<< HEAD
      adult_surcharge !== undefined ? adult_surcharge : null,
      child_surcharge !== undefined ? child_surcharge : null,
      devices_id || [],
      id,
    ]
  );

  // Get thumbnail and devices
  const withDevices = await pool.query(
    `SELECT 
      rt.id,
      rt.name,
      rt.description,
      rt.created_at,
      rt.max_adults,
      rt.max_children,
      rt.capacity,
      (SELECT image_url FROM room_type_images WHERE room_type_id = rt.id AND is_thumbnail = true LIMIT 1) as thumbnail,
      rt.price,
      rt.adult_surcharge,
      rt.child_surcharge,
      rt.devices_id,
      d.id as device_id,
      d.name as device_name,
      d.type as device_type,
      d.fee as device_fee,
      d.description as device_description
    FROM room_types rt
    LEFT JOIN LATERAL (
      SELECT * FROM devices WHERE id = ANY(rt.devices_id)
    ) d ON TRUE
    WHERE rt.id = $1`,
    [id]
  );
  const row = withDevices.rows[0];
  if (row) {
    const devices = [];
    for (const r of withDevices.rows) {
      if (r.device_id) {
        devices.push({
          id: r.device_id,
          name: r.device_name,
          type: r.device_type,
          fee: r.device_fee,
          description: r.device_description,
        });
      }
    }
    row.devices = devices;
  }
  return row;
=======
      bed_type,
      view_direction,
      free_amenities || null,
      paid_amenities || null,
      room_size,
      policies ? JSON.stringify(policies) : null,
      id,
    ]
  );
  return result.rows[0];
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
};
export const deleteRoomType = async (id) => {
  const resuit = await pool.query(
    "DELETE FROM room_types WHERE id = $1 RETURNING *",
    [id]
  );
  return resuit.rows[0];
};
export const existsRoomTypeWithName = async (name, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM room_types WHERE name = $1 AND id <> $2 LIMIT 1",
      [name, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query(
    "SELECT 1 FROM room_types WHERE name = $1 LIMIT 1",
    [name]
  );
  return res.rowCount > 0;
};
