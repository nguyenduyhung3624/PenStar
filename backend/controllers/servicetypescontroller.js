import {
  getServiceTypes as modelGetServiceTypes,
  getServiceTypeByCode as modelGetServiceTypeByCode,
  createServiceType as modelCreateServiceType,
  updateServiceType as modelUpdateServiceType,
  deleteServiceType as modelDeleteServiceType,
} from "../models/servicetypesmodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

export const getServiceTypes = async (req, res) => {
  try {
    const data = await modelGetServiceTypes();
    res.success(data, "Lấy danh sách loại dịch vụ thành công");
  } catch (error) {
    console.error("servicetypescontroller.getServiceTypes error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getServiceTypeByCode = async (req, res) => {
  const { code } = req.params;
  try {
    const data = await modelGetServiceTypeByCode(code);
    if (!data) {
      return res.error("Loại dịch vụ không tồn tại", null, 404);
    }
    res.success(data, "Lấy thông tin loại dịch vụ thành công");
  } catch (error) {
    console.error("servicetypescontroller.getServiceTypeByCode error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createServiceType = async (req, res) => {
  try {
    const data = await modelCreateServiceType(req.body);
    res.success(data, "Tạo loại dịch vụ thành công", 201);
  } catch (error) {
    console.error("servicetypescontroller.createServiceType error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const updateServiceType = async (req, res) => {
  const { code } = req.params;
  try {
    const data = await modelUpdateServiceType(code, req.body);
    if (!data) {
      return res.error("Loại dịch vụ không tồn tại", null, 404);
    }
    res.success(data, "Cập nhật loại dịch vụ thành công");
  } catch (error) {
    console.error("servicetypescontroller.updateServiceType error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const deleteServiceType = async (req, res) => {
  const { code } = req.params;
  try {
    const data = await modelDeleteServiceType(code);
    if (!data) {
      return res.error("Loại dịch vụ không tồn tại", null, 404);
    }
    res.success(data, "Xóa loại dịch vụ thành công");
  } catch (error) {
    console.error("servicetypescontroller.deleteServiceType error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
