import * as model from "../models/room_devicesmodel.js";
import { validateRoomEquipments } from "../models/validateRoomEquipments.js";
import { ERROR_MESSAGES } from "../utils/constants.js";
export const restoreDeviceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[RESTORE DEVICE] id:", id);
    const device = await model.getDeviceById(Number(id));
    console.log("[RESTORE DEVICE] device:", device);
    if (!device) {
      console.log("[RESTORE DEVICE] Thiết bị không tồn tại");
      return res.error("Thiết bị không tồn tại", null, 404);
    }
    const pool = (await import("../db.js")).default;
    const bookingRes = await pool.query(
      `SELECT b.stay_status_id FROM bookings b
        JOIN booking_items bi ON bi.booking_id = b.id
        WHERE bi.room_id = $1 AND b.stay_status_id = 3 LIMIT 1`,
      [device.room_id]
    );
    console.log("[RESTORE DEVICE] bookingRes:", bookingRes.rows);
    if (!bookingRes.rows.length) {
      console.log(
        "[RESTORE DEVICE] Không tìm thấy booking đã checkout cho room_id:",
        device.room_id
      );
      return res.error(
        "Chỉ được khôi phục thiết bị sau khi checkout.",
        null,
        400
      );
    }
    const updatedDevice = await model.updateDevice(Number(id), {
      status: "working",
    });
    console.log("[RESTORE DEVICE] updatedDevice:", updatedDevice);
    res.success(updatedDevice, "Khôi phục thiết bị thành công");
  } catch (error) {
    console.error("[RESTORE DEVICE ERROR]", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
import { getRooms } from "../models/roomsmodel.js";
export const checkRoomDevicesStandardByType = async (req, res) => {
  const roomTypeId = req.params.roomTypeId;
  try {
    const rooms = await getRooms();
    const filteredRooms = rooms.filter(
      (r) => String(r.type_id) === String(roomTypeId)
    );
    const results = [];
    for (const room of filteredRooms) {
      const result = await validateRoomEquipments(room.id);
      results.push({ room_id: room.id, room_name: room.name, ...result });
    }
    res.success(results, "Kiểm tra tiêu chuẩn thiết bị thành công");
  } catch (error) {
    console.error("[checkRoomDevicesStandardByType] Error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
export const getDeviceById = async (req, res) => {
  try {
    const device = await model.getDeviceById(Number(req.params.id));
    if (!device) {
      return res.error("Thiết bị không tồn tại", null, 404);
    }
    res.success(device, "Lấy thông tin thiết bị thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
export const getDevices = async (req, res) => {
  try {
    const { room_id } = req.query;
    const devices = await model.getDevices({
      room_id: room_id ? Number(room_id) : null,
    });
    res.success(devices, "Lấy danh sách thiết bị thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
export const createDevice = async (req, res) => {
  try {
    const device = await model.createDevice(req.body);
    res.success(device, "Tạo thiết bị thành công", 201);
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
export const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await model.updateDevice(Number(id), req.body);
    res.success(device, "Cập nhật thiết bị thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await model.deleteDevice(Number(id));
    res.success(device, "Xóa thiết bị thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
import { createStockLog } from "../models/equipment_stock_logsmodel.js";
export const transferDevice = async (req, res) => {
  try {
    const {
      equipment_id,
      quantity,
      from_room_id,
      to_room_id,
      note,
      created_by,
    } = req.body;
    await model.transferDevice({
      equipment_id,
      quantity,
      from_room_id,
      to_room_id,
    });
    await createStockLog({
      equipment_id,
      type: "transfer",
      quantity,
      from_room_id,
      to_room_id,
      note,
      created_by,
    });
    res.success(null, "Điều chuyển thành công");
  } catch (error) {
    res.error(error.message, null, 400);
  }
};
export const checkRoomDevicesStandard = async (req, res) => {
  const roomId = req.params.id;
  console.log("[checkRoomDevicesStandard] Called with roomId:", roomId);
  try {
    const result = await validateRoomEquipments(roomId);
    console.log("[checkRoomDevicesStandard] Result:", result);
    res.success(result, "Kiểm tra thiết bị phòng thành công");
  } catch (error) {
    console.error("[checkRoomDevicesStandard] Error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
