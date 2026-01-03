import {
  getRoomTypes as modelGetRooomTypes,
  createRoomType as modelCreateRoomType,
  getRoomTypeById as modelGetRoomTypeById,
  updateRoomType as modelUpdateRoomType,
  deleteRoomType as modelDeleteRoomType,
} from "../models/roomtypemodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

export const getRoomTypes = async (req, res) => {
  try {
    const data = await modelGetRooomTypes();
    res.success(data, "Lấy danh sách loại phòng thành công");
  } catch (error) {
    console.error("[getRoomTypes]", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createRoomType = async (req, res) => {
  try {
    const { existsRoomTypeWithName } = await import(
      "../models/roomtypemodel.js"
    );
    const {
      name,
      description,
      thumbnail,
      capacity,
      price,
      bed_type,
      view_direction,
      // amenities đã bị loại bỏ
      paid_amenities,
      // Đã loại bỏ free_amenities
      room_size,
      area,
      base_adults,
      base_children,
      extra_adult_fee,
      extra_child_fee,
      child_age_limit,
      policies,
    } = req.body;
    if (await existsRoomTypeWithName(String(name))) {
      return res.error("Tên loại phòng đã tồn tại", null, 400);
    }
    // Validate required fields (name, price, capacity, ...)
    if (!name || !price || !capacity) {
      return res.error(
        "Thiếu thông tin bắt buộc: tên, giá, sức chứa",
        null,
        400
      );
    }
    const newRoomType = await modelCreateRoomType({
      name,
      description,
      thumbnail,
      capacity,
      price,
      bed_type,
      view_direction,
      // amenities đã bị loại bỏ
      paid_amenities,
      // Đã loại bỏ free_amenities
      room_size,
      area,
      base_adults,
      base_children,
      extra_adult_fee,
      extra_child_fee,
      child_age_limit,
      policies,
    });
    res.success(newRoomType, "Tạo loại phòng thành công", 201);
  } catch (error) {
    console.error("[createRoomType]", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getRoomTypeById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetRoomTypeById(id);
    if (!item) {
      return res.error("Loại phòng không tồn tại", null, 404);
    }
    res.success(item, "Lấy thông tin loại phòng thành công");
  } catch (error) {
    console.error("[getRoomTypeById]", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const updateRoomType = async (req, res) => {
  const { id } = req.params;
  try {
    const { existsRoomTypeWithName } = await import(
      "../models/roomtypemodel.js"
    );
    const {
      name,
      description,
      thumbnail,
      capacity,
      price,
      bed_type,
      view_direction,
      // amenities đã bị loại bỏ
      paid_amenities,
      // Đã loại bỏ free_amenities
      room_size,
      area,
      base_adults,
      base_children,
      extra_adult_fee,
      extra_child_fee,
      child_age_limit,
      policies,
    } = req.body;
    if (name && (await existsRoomTypeWithName(String(name), Number(id)))) {
      return res.error("Tên loại phòng đã tồn tại", null, 400);
    }
    // Validate required fields (name, price, capacity)
    if (!name || !price || !capacity) {
      return res.error(
        "Thiếu thông tin bắt buộc: tên, giá, sức chứa",
        null,
        400
      );
    }
    const updated = await modelUpdateRoomType(id, {
      name,
      description,
      thumbnail,
      capacity,
      price,
      bed_type,
      view_direction,
      // amenities đã bị loại bỏ
      paid_amenities,
      // Đã loại bỏ free_amenities
      room_size,
      area,
      base_adults,
      base_children,
      extra_adult_fee,
      extra_child_fee,
      child_age_limit,
      policies,
    });
    if (!updated) {
      return res.error("Loại phòng không tồn tại", null, 404);
    }
    res.success(updated, "Cập nhật loại phòng thành công");
  } catch (error) {
    console.error("[updateRoomType]", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const deleteRoomType = async (req, res) => {
  const { id } = req.params;
  try {
    // check if any room uses this type
    const { countRoomsByTypeId } = await import("../models/roomsmodel.js");
    const count = await countRoomsByTypeId(id);
    if (count > 0) {
      return res.error(
        "Không thể xóa loại phòng: vẫn còn phòng thuộc loại này",
        null,
        400
      );
    }

    const deleted = await modelDeleteRoomType(id);
    if (!deleted) {
      return res.error("Loại phòng không tồn tại", null, 404);
    }
    res.success(deleted, "Xóa loại phòng thành công");
  } catch (error) {
    console.error("[deleteRoomType]", error);
    // handle FK violation
    if (error && error.code === "23503") {
      return res.error(
        "Không thể xóa loại phòng đang được sử dụng",
        error.message,
        400
      );
    }
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
