import {
  getRoles as modelGetRoles,
  getRoleById as modelGetRoleById,
  createRole as modelCreateRole,
  updateRole as modelUpdateRole,
  deleteRole as modelDeleteRole,
} from "../models/rolesmodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

export const getRoles = async (req, res) => {
  try {
    const data = await modelGetRoles();
    res.success(data, "Lấy danh sách vai trò thành công");
  } catch (error) {
    console.error("getRoles error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createRole = async (req, res) => {
  try {
    const { existsRoleWithName } = await import("../models/rolesmodel.js");
    const { name } = req.body;
    if (!name) {
      return res.error("Tên vai trò là bắt buộc", null, 400);
    }
    if (await existsRoleWithName(String(name))) {
      return res.error("Tên vai trò đã tồn tại", null, 400);
    }
    const created = await modelCreateRole(req.body);
    res.success(created, "Tạo vai trò thành công", 201);
  } catch (error) {
    console.error("createRole error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getRoleById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetRoleById(id);
    if (!item) {
      return res.error("Vai trò không tồn tại", null, 404);
    }
    res.success(item, "Lấy thông tin vai trò thành công");
  } catch (error) {
    console.error("getRoleById error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const updateRole = async (req, res) => {
  const { id } = req.params;
  try {
    const { existsRoleWithName } = await import("../models/rolesmodel.js");
    const { name } = req.body;
    if (name && (await existsRoleWithName(String(name), Number(id)))) {
      return res.error("Tên vai trò đã tồn tại", null, 400);
    }
    const updated = await modelUpdateRole(id, req.body);
    if (!updated) {
      return res.error("Vai trò không tồn tại", null, 404);
    }
    res.success(updated, "Cập nhật vai trò thành công");
  } catch (error) {
    console.error("updateRole error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    // optionally check references (users.role_id)
    const deleted = await modelDeleteRole(id);
    if (!deleted) {
      return res.error("Vai trò không tồn tại", null, 404);
    }
    res.success(deleted, "Xóa vai trò thành công");
  } catch (error) {
    console.error("deleteRole error:", error);
    if (error && error.code === "23503") {
      return res.error(
        "Không thể xóa vai trò đang được sử dụng",
        error.message,
        400
      );
    }
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
