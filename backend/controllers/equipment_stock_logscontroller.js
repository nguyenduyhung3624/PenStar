import {
  createStockLog,
  getStockLogsByEquipment,
  getAllStockLogs,
} from "../models/equipment_stock_logsmodel.js";
import pool from "../db.js";
import { ERROR_MESSAGES } from "../utils/constants.js";
export const importEquipment = async (req, res) => {
  try {
    const { equipment_id, quantity, note, created_by } = req.body;
    if (!equipment_id || !quantity || quantity <= 0) {
      return res.error("Thiếu thông tin hoặc số lượng không hợp lệ", null, 400);
    }
    await pool.query(
      `UPDATE master_equipments SET total_stock = total_stock + $1 WHERE id = $2`,
      [quantity, equipment_id]
    );
    await createStockLog({
      equipment_id,
      type: "import",
      action: "import",
      quantity,
      from_room_id: null,
      to_room_id: null,
      note,
      created_by,
    });
    res.success(null, "Nhập kho thành công");
  } catch (error) {
    res.error("Lỗi nhập kho", error.message, 500);
  }
};
export const exportEquipment = async (req, res) => {
  try {
    const { equipment_id, quantity, note, created_by } = req.body;
    if (!equipment_id || !quantity || quantity <= 0) {
      return res.error("Thiếu thông tin hoặc số lượng không hợp lệ", null, 400);
    }
    const check = await pool.query(
      `SELECT total_stock FROM master_equipments WHERE id = $1`,
      [equipment_id]
    );
    if (!check.rows[0] || check.rows[0].total_stock < quantity) {
      return res.error("Không đủ tồn kho để xuất", null, 400);
    }
    await pool.query(
      `UPDATE master_equipments SET total_stock = total_stock - $1 WHERE id = $2`,
      [quantity, equipment_id]
    );
    await createStockLog({
      equipment_id,
      type: "export",
      action: "export",
      quantity,
      from_room_id: null,
      to_room_id: null,
      note,
      created_by,
    });
    res.success(null, "Xuất kho thành công");
  } catch (error) {
    res.error("Lỗi xuất kho", error.message, 500);
  }
};
export const transferEquipment = async (req, res) => {
  try {
    const {
      equipment_id,
      quantity,
      from_room_id,
      to_room_id,
      note,
      created_by,
    } = req.body;
    if (
      !equipment_id ||
      !quantity ||
      quantity <= 0 ||
      !from_room_id ||
      !to_room_id
    ) {
      return res.error(
        "Thiếu thông tin hoặc số lượng/phòng không hợp lệ",
        null,
        400
      );
    }
    await createStockLog({
      equipment_id,
      type: "transfer",
      action: "transfer",
      quantity,
      from_room_id,
      to_room_id,
      note,
      created_by,
    });
    res.success(null, "Điều chuyển thành công");
  } catch (error) {
    res.error("Lỗi điều chuyển", error.message, 500);
  }
};
export const getEquipmentLogs = async (req, res) => {
  try {
    const { equipment_id } = req.query;
    if (!equipment_id) {
      return res.error("Thiếu equipment_id", null, 400);
    }
    const logs = await getStockLogsByEquipment(equipment_id);
    res.success(logs, "Lấy lịch sử thiết bị thành công");
  } catch (error) {
    res.error("Lỗi lấy log", error.message, 500);
  }
};
export const getAllLogs = async (req, res) => {
  try {
    const logs = await getAllStockLogs();
    res.success(logs, "Lấy toàn bộ log thành công");
  } catch (error) {
    res.error("Lỗi lấy log", error.message, 500);
  }
};
