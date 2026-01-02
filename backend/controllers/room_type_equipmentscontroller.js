import {
  getStandardQuantity,
  upsertStandard,
  getAllStandards as getAllStandardsModel,
  getEquipmentsByRoomType,
} from "../models/room_type_equipmentsmodel.js";

// Lấy danh sách thiết bị chuẩn của một loại phòng (cho frontend hiển thị)
export const getByRoomType = async (req, res) => {
  const { room_type_id } = req.params;
  if (!room_type_id) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu room_type_id!" });
  }
  try {
    const data = await getEquipmentsByRoomType(Number(room_type_id));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thiết bị!",
      error: err.message,
    });
  }
};

// Lấy tất cả tiêu chuẩn thiết bị theo loại phòng
export const getAllStandards = async (req, res) => {
  const data = await getAllStandardsModel();
  res.json({ success: true, data });
};

// Thêm hoặc cập nhật tiêu chuẩn thiết bị cho loại phòng
export const createOrUpdateStandard = async (req, res) => {
  const { room_type_id, master_equipment_id, min_quantity, max_quantity } =
    req.body;
  if (
    !room_type_id ||
    !master_equipment_id ||
    min_quantity == null ||
    max_quantity == null
  ) {
    return res.status(400).json({ success: false, message: "Thiếu tham số!" });
  }
  try {
    await upsertStandard(
      Number(room_type_id),
      Number(master_equipment_id),
      Number(min_quantity),
      Number(max_quantity)
    );
    res.json({ success: true, message: "Cập nhật tiêu chuẩn thành công!" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật tiêu chuẩn!",
      error: err.message,
    });
  }
};

export const getStandard = async (req, res) => {
  const { room_type_id, master_equipment_id } = req.query;
  if (!room_type_id || !master_equipment_id) {
    return res.status(400).json({ success: false, message: "Thiếu tham số!" });
  }
  const standard = await getStandardQuantity(
    Number(room_type_id),
    Number(master_equipment_id)
  );
  if (!standard) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy tiêu chuẩn thiết bị!" });
  }
  res.json({ success: true, data: standard });
};
