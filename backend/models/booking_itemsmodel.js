import pool from "../db.js";

export const getBookingItems = async () => {
  const res = await pool.query("SELECT * FROM booking_items ORDER BY id DESC");
  return res.rows;
};

export const getBookingItemById = async (id) => {
  const res = await pool.query("SELECT * FROM booking_items WHERE id = $1", [
    id,
  ]);
  return res.rows[0];
};

export const createBookingItem = async (data) => {
  const {
    booking_id,
    room_id,
    room_type_id,
    check_in,
    check_out,
    room_type_price,
    extra_adult_fees = 0,
    extra_child_fees = 0,
    extra_fees = 0,
    quantity = 1,
    num_adults = 0,
    num_children = 0,
    num_babies = 0,
  } = data;
  const res = await pool.query(
    `INSERT INTO booking_items (
      booking_id, room_id, room_type_id, check_in, check_out, room_type_price,
      extra_adult_fees, extra_child_fees, extra_fees, quantity,
      num_adults, num_children, num_babies
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13
    ) RETURNING *`,
    [
      booking_id,
      room_id,
      room_type_id,
      check_in,
      check_out,
      room_type_price,
      extra_adult_fees,
      extra_child_fees,
      extra_fees,
      quantity,
      num_adults,
      num_children,
      num_babies,
    ]
  );
  return res.rows[0];
};

export const deleteBookingItem = async (id) => {
  const res = await pool.query(
    "DELETE FROM booking_items WHERE id = $1 RETURNING *",
    [id]
  );
  return res.rows[0];
};

/**
 * Get all booking items for a booking
 */
export const getByBookingId = async (bookingId) => {
  const res = await pool.query(
    `SELECT bi.*,
            r.name as room_name,
            rt.name as room_type_name,
            rt.price as room_type_price_base
     FROM booking_items bi
     LEFT JOIN rooms r ON bi.room_id = r.id
     LEFT JOIN room_types rt ON bi.room_type_id = rt.id
     WHERE bi.booking_id = $1
     ORDER BY bi.id`,
    [bookingId]
  );
  return res.rows;
};

/**
 * Cancel a booking item (room)
 */
export const cancelBookingItem = async (id, cancelReason = null) => {
  const res = await pool.query(
    `UPDATE booking_items
     SET status = 'cancelled',
         cancelled_at = NOW(),
         cancel_reason = $2
     WHERE id = $1
     RETURNING *`,
    [id, cancelReason]
  );
  return res.rows[0];
};

/**
 * Update booking item status
 */
export const updateItemStatus = async (id, status) => {
  const res = await pool.query(
    `UPDATE booking_items SET status = $2 WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return res.rows[0];
};

/**
 * Check if booking has any active items
 */
export const hasActiveItems = async (bookingId) => {
  const res = await pool.query(
    `SELECT COUNT(*) as count FROM booking_items
     WHERE booking_id = $1 AND status = 'active'`,
    [bookingId]
  );
  return parseInt(res.rows[0].count) > 0;
};

/**
 * Get booking items with refund request info
 */
export const getItemsWithRefundInfo = async (bookingId) => {
  const res = await pool.query(
    `SELECT bi.*,
            r.name as room_name,
            rt.name as room_type_name,
            rt.price as room_type_price_base,
            rr.id as refund_request_id,
            rr.status as refund_status,
            rr.amount as refund_amount_requested,
            rr.receipt_image,
            rr.admin_notes as refund_notes,
            rr.processed_at as refund_processed_at
     FROM booking_items bi
     LEFT JOIN rooms r ON bi.room_id = r.id
     LEFT JOIN room_types rt ON bi.room_type_id = rt.id
     LEFT JOIN refund_requests rr ON rr.booking_item_id = bi.id
     WHERE bi.booking_id = $1
     ORDER BY bi.id`,
    [bookingId]
  );
  return res.rows;
};
