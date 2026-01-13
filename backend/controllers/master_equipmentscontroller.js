import * as model from "../models/master_equipmentsmodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

export const getAllEquipments = async (req, res) => {
  try {
    const equipments = await model.getAllEquipments();
    res.success(equipments, "Lấy danh sách thiết bị thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getEquipmentById = async (req, res) => {
  try {
    const equipment = await model.getEquipmentById(Number(req.params.id));
    if (!equipment) {
      return res.error("Thiết bị không tồn tại", null, 404);
    }
    res.success(equipment, "Lấy thông tin thiết bị thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createEquipment = async (req, res) => {
  try {
    const equipment = await model.createEquipment(req.body);
    res.success(equipment, "Tạo thiết bị thành công", 201);
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const updateEquipment = async (req, res) => {
  try {
    const equipment = await model.updateEquipment(
      Number(req.params.id),
      req.body
    );
    res.success(equipment, "Cập nhật thiết bị thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const deleteEquipment = async (req, res) => {
  try {
    const equipment = await model.deleteEquipment(Number(req.params.id));
    res.success(equipment, "Xóa thiết bị thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
