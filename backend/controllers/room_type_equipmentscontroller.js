import {
  getStandardQuantity,
  replaceAllForRoomType,
  getAllStandards as getAllStandardsModel,
  getEquipmentsByRoomType,
} from "../models/room_type_equipmentsmodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

export const getByRoomType = async (req, res) => {
  const { room_type_id } = req.params;
  if (!room_type_id) {
    return res.error("Thiếu room_type_id!", null, 400);
  }
  try {
    const data = await getEquipmentsByRoomType(Number(room_type_id));
    res.success(data, "Lấy danh sách thiết bị thành công");
  } catch (err) {
    res.error("Lỗi khi lấy danh sách thiết bị!", err.message, 500);
  }
};

export const getAllStandards = async (req, res) => {
  try {
    const data = await getAllStandardsModel();
    res.success(data, "Lấy tất cả tiêu chuẩn thành công");
  } catch (err) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};

export const updateStandardsForRoomType = async (req, res) => {
  const { room_type_id } = req.params;
  const { equipments } = req.body; // Expect array of { name, quantity, price }

  if (!room_type_id || !Array.isArray(equipments)) {
    return res.error("Dữ liệu không hợp lệ!", null, 400);
  }

  try {
    await replaceAllForRoomType(Number(room_type_id), equipments);
    res.success(null, "Cập nhật thiết bị thành công!");
  } catch (err) {
    console.error("updateStandardsForRoomType error:", err);
    res.error("Lỗi cập nhật thiết bị!", err.message, 500);
  }
};

export const getStandard = async (req, res) => {
  const { room_type_id, master_equipment_id } = req.query;
  if (!room_type_id || !master_equipment_id) {
    return res.error("Thiếu tham số!", null, 400);
  }

  try {
    const standard = await getStandardQuantity(
      Number(room_type_id),
      Number(master_equipment_id)
    );
    if (!standard) {
      return res.error("Không tìm thấy tiêu chuẩn thiết bị!", null, 404);
    }
    res.success(standard, "Lấy tiêu chuẩn thành công");
  } catch (err) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};
