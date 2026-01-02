import pool from "../db.js";

// Lấy tất cả thiết bị theo room_id (không còn room_type_id)
export const getDevices = async ({ room_id = null } = {}) => {
  let query = "SELECT * FROM room_devices WHERE 1=1";
  const params = [];
  if (room_id) {
    query += " AND room_id = $1";
    params.push(room_id);
  }
  const result = await pool.query(query, params);
  return result.rows;
};
export const getDeviceById = async (id) => {
  const result = await pool.query("SELECT * FROM room_devices WHERE id = $1", [
    id,
  ]);
  return result.rows[0];
};

export const createDevice = async (data) => {
  try {
    const {
      master_equipment_id,
      status = "working",
      room_id = null,
      note = null,
      images = null,
      quantity = 1,
    } = data;

    // Lấy thông tin thiết bị master
    const master = await pool.query(
      "SELECT * FROM master_equipments WHERE id = $1",
      [master_equipment_id]
    );
    if (!master.rows[0]) throw new Error("Thiết bị master không tồn tại");
    const device_name = master.rows[0].name;
    const device_type = master.rows[0].type;

    // Kiểm tra trùng thiết bị master trong phòng
    if (room_id && master_equipment_id) {
      const check = await pool.query(
        `SELECT * FROM room_devices WHERE room_id = $1 AND master_equipment_id = $2`,
        [room_id, master_equipment_id]
      );
      if (check.rows.length > 0) {
        throw new Error("Phòng đã có thiết bị này, chỉ được cập nhật số lượng");
      }
    }

    const result = await pool.query(
      `INSERT INTO room_devices (master_equipment_id, device_name, device_type, status, room_id, note, images, quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        master_equipment_id,
        device_name,
        device_type,
        status,
        room_id,
        note,
        images,
        quantity,
      ]
    );
    // Lấy tên phòng để ghi log rõ ràng
    let roomName = "";
    if (room_id) {
      const roomRes = await pool.query("SELECT name FROM rooms WHERE id = $1", [
        room_id,
      ]);
      roomName = roomRes.rows[0]?.name || String(room_id);
    }
    // Ghi log lịch sử tạo thiết bị
    const { createStockLog } = await import("./equipment_stock_logsmodel.js");
    await createStockLog({
      equipment_id: master_equipment_id,
      type: "device",
      action: "create",
      quantity: result.rows[0].quantity,
      note: `Thêm vào phòng ${roomName} (ID: ${room_id})`,
    });
    return result.rows[0];
  } catch (err) {
    console.error("[RoomDeviceCreate] Lỗi thêm thiết bị vào phòng:", err);
    throw err;
  }
};

export const updateDevice = async (id, data) => {
  console.log("[updateDevice] id:", id, "data:", data);
  // Luôn kiểm tra số lượng tiêu chuẩn nếu có truyền quantity
  if (data.quantity !== undefined) {
    // Lấy dữ liệu cũ
    const old = await pool.query(`SELECT * FROM room_devices WHERE id = $1`, [
      id,
    ]);
    const device = old.rows[0];
    // Lấy room_type_id
    const roomRes = await pool.query(
      `SELECT type_id FROM rooms WHERE id = $1`,
      [device.room_id]
    );
    const room_type_id = roomRes.rows[0]?.type_id;
    // Lấy số lượng tiêu chuẩn (min/max)
    let standard = null;
    if (room_type_id && device.master_equipment_id) {
      const { getStandardQuantity } = await import(
        "./room_type_equipmentsmodel.js"
      );
      standard = await getStandardQuantity(
        room_type_id,
        device.master_equipment_id
      );
    }
    console.log(
      "[updateDevice] room_type_id:",
      room_type_id,
      "master_equipment_id:",
      device.master_equipment_id,
      "standard:",
      standard
    );
    if (!standard) {
      throw new Error("Thiếu cấu hình tiêu chuẩn cho thiết bị này!");
    }
    if (data.quantity < standard.min_quantity) {
      throw new Error(
        `Số lượng không được nhỏ hơn tối thiểu (${standard.min_quantity})`
      );
    }
    if (data.quantity > standard.max_quantity) {
      throw new Error(
        `Số lượng không được vượt quá tối đa (${standard.max_quantity})`
      );
    }
  }
  // Nếu chỉ truyền quantity (sửa tồn kho), chỉ update quantity
  if (Object.keys(data).length === 1 && data.quantity !== undefined) {
    // Lấy dữ liệu cũ
    const old = await pool.query(`SELECT * FROM room_devices WHERE id = $1`, [
      id,
    ]);
    const result = await pool.query(
      `UPDATE room_devices SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [data.quantity, id]
    );
    // Ghi log lịch sử sửa thiết bị
    const { createStockLog } = await import("./equipment_stock_logsmodel.js");
    await createStockLog({
      equipment_id: id,
      type: "device",
      action: "update",
    });
    return result.rows[0];
  }
  // Nếu truyền nhiều trường, update đầy đủ
  const { device_name, device_type, status, room_id, note, images, quantity } =
    data;
  // Lấy dữ liệu cũ
  const old = await pool.query(`SELECT * FROM room_devices WHERE id = $1`, [
    id,
  ]);
  console.log("[updateDevice] old device:", old.rows[0]);
  const result = await pool.query(
    `UPDATE room_devices SET
      device_name = COALESCE($1, device_name),
      device_type = COALESCE($2, device_type),
      status = COALESCE($3, status),
      room_id = COALESCE($4, room_id),
      note = COALESCE($5, note),
      images = COALESCE($6, images),
      quantity = COALESCE($7, quantity),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $8 RETURNING *`,
    [device_name, device_type, status, room_id, note, images, quantity, id]
  );
  console.log("[updateDevice] update result:", result.rows[0]);
  // Ghi log lịch sử sửa thiết bị
  const { createStockLog } = await import("./equipment_stock_logsmodel.js");
  await createStockLog({
    equipment_id: old.rows[0]?.master_equipment_id, // dùng id master
    type: "device",
    action: "update",
    quantity: result.rows[0]?.quantity ?? old.rows[0]?.quantity ?? 1,
    note: "Cập nhật trạng thái thiết bị phòng",
  });
  return result.rows[0];
};

export const deleteDevice = async (id) => {
  // Lấy dữ liệu cũ
  const old = await pool.query(`SELECT * FROM room_devices WHERE id = $1`, [
    id,
  ]);
  const result = await pool.query(
    "DELETE FROM room_devices WHERE id = $1 RETURNING *",
    [id]
  );
  // Ghi log lịch sử xóa thiết bị
  const { createStockLog } = await import("./equipment_stock_logsmodel.js");
  await createStockLog({
    equipment_id: id,
    type: "device",
    action: "delete",
  });
  return result.rows[0];
};

// Điều chuyển thiết bị giữa 2 phòng
export const transferDevice = async ({
  equipment_id,
  quantity,
  from_room_id,
  to_room_id,
}) => {
  if (!equipment_id || !quantity || !from_room_id || !to_room_id)
    throw new Error("Thiếu thông tin điều chuyển");
  if (from_room_id === to_room_id)
    throw new Error("Không thể chuyển thiết bị sang chính phòng hiện tại");
  // Kiểm tra tồn kho phòng đi
  const fromRes = await pool.query(
    `SELECT * FROM room_devices WHERE room_id = $1 AND device_type = $2`,
    [from_room_id, equipment_id]
  );
  if (!fromRes.rows[0] || fromRes.rows[0].quantity < quantity)
    throw new Error("Không đủ tồn kho phòng đi");
  // Kiểm tra phòng đến đã có thiết bị cùng loại chưa (nếu nghiệp vụ yêu cầu, có thể bỏ qua nếu muốn cộng dồn)
  // Đã xử lý ở frontend, nhưng vẫn nên kiểm tra ở backend
  // Trừ tồn kho phòng đi
  await pool.query(
    `UPDATE room_devices SET quantity = quantity - $1 WHERE room_id = $2 AND device_type = $3`,
    [quantity, from_room_id, equipment_id]
  );
  // Cộng tồn kho phòng đến (nếu chưa có thì tạo mới)
  const toRes = await pool.query(
    `SELECT * FROM room_devices WHERE room_id = $1 AND device_type = $2`,
    [to_room_id, equipment_id]
  );
  if (toRes.rows[0]) {
    await pool.query(
      `UPDATE room_devices SET quantity = quantity + $1 WHERE room_id = $2 AND device_type = $3`,
      [quantity, to_room_id, equipment_id]
    );
  } else {
    // Lấy thông tin thiết bị từ phòng đi để clone sang phòng đến
    const {
      device_name,
      status = "working",
      note = null,
      images = null,
    } = fromRes.rows[0];
    await pool.query(
      `INSERT INTO room_devices (device_name, device_type, status, room_id, note, images, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [device_name, equipment_id, status, to_room_id, note, images, quantity]
    );
  }
  return true;
};
