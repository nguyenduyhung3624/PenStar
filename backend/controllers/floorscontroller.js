import {
  getFloors as modelGetFloors,
  getFloorID as modelGetFloorID,
  createFloor as modelCreateFloor,
  updateFloor as modelUpdateFloor,
  deleteFloor as modelDeleteFloor,
} from "../models/floorsmodel.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../utils/constants.js";

export const getFloors = async (req, res) => {
  try {
    const data = await modelGetFloors();
    res.success(data, "Lấy danh sách tầng thành công");
  } catch (error) {
    console.error("getFloors error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getFloorID = async (req, res) => {
  const { id } = req.params;
  try {
    const floor = await modelGetFloorID(id);
    if (!floor) {
      return res.error("Tầng không tồn tại", null, 404);
    }
    res.success(floor, "Lấy thông tin tầng thành công");
  } catch (error) {
    console.error("getFloorID error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createFloor = async (req, res) => {
  try {
    const { existsFloorWithName } = await import("../models/floorsmodel.js");
    const { name } = req.body;
    if (await existsFloorWithName(String(name))) {
      return res.error("Tên tầng đã tồn tại", null, 400);
    }
    const newFloor = await modelCreateFloor(req.body);
    res.success(newFloor, "Tạo tầng thành công", 201);
  } catch (error) {
    console.error("createFloor error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const updateFloor = async (req, res) => {
  const { id } = req.params;
  try {
    const { existsFloorWithName } = await import("../models/floorsmodel.js");
    const { name } = req.body;
    if (name && (await existsFloorWithName(String(name), Number(id)))) {
      return res.error("Tên tầng đã tồn tại", null, 400);
    }
    const updated = await modelUpdateFloor(id, req.body);
    res.success(updated, "Cập nhật tầng thành công");
  } catch (error) {
    console.error("updateFloor error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const deleteFloor = async (req, res) => {
  const { id } = req.params;
  try {
    const { countRoomsByFloorId } = await import("../models/roomsmodel.js");
    const count = await countRoomsByFloorId(id);
    if (count > 0) {
      return res.error(
        "Không thể xóa tầng: vẫn còn phòng thuộc tầng này",
        null,
        400
      );
    }

    const deleted = await modelDeleteFloor(id);
    if (!deleted) {
      return res.error("Tầng không tồn tại", null, 404);
    }
    res.success(deleted, "Xóa tầng thành công");
  } catch (error) {
    console.error("deleteFloor error:", error);
    if (error && error.code === "23503") {
      return res.error(
        "Không thể xóa: ràng buộc khóa ngoại",
        error.message,
        400
      );
    }
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
