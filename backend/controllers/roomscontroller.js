import {
  getRooms as modelGetRooms,
  getRoomID as modelGetRoomById,
  createRoom as modelCreateRoom,
  updateRoom as modelUpdateRoom,
  deleteRoom as modelDeleteRoom,
  existsRoomWithName,
  searchAvailableRooms as modelSearchAvailableRooms,
  hasActiveBookings,
} from "../models/roomsmodel.js";
import {
  ROOM_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "../utils/constants.js";

/**
 * Get all rooms
 */
export const getRooms = async (req, res) => {
  try {
    const data = await modelGetRooms();
    res.success(data, "Lấy danh sách phòng thành công");
  } catch (error) {
    console.error("getRooms error:", error);
    if (error?.code === "23503") {
      return res.error(
        "Foreign key constraint failed: related record not found",
        error.message,
        400
      );
    }
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Get room by ID
 */
export const getRoomID = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);

  try {
    const room = await modelGetRoomById(numericId);
    if (!room) {
      return res.error(ERROR_MESSAGES.ROOM_NOT_FOUND, null, 404);
    }

    res.success(room, "Lấy thông tin phòng thành công");
  } catch (error) {
    console.error("getRoomID error:", error);
    if (error?.code === "23503") {
      return res.error("Foreign key constraint failed", error.message, 400);
    }
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Create room
 */
export const createRoom = async (req, res) => {
  try {
    const { name, type_id } = req.body;
    const numericTypeId = type_id !== undefined ? Number(type_id) : undefined;

    // Check for duplicate name
    if (name) {
      const exists = await existsRoomWithName(name);
      if (exists) {
        return res.error(
          "Tên phòng đã tồn tại. Vui lòng chọn tên khác.",
          null,
          400
        );
      }
    }

    const payload = { ...req.body, type_id: numericTypeId };
    const newRoom = await modelCreateRoom(payload);

    res.success(newRoom, SUCCESS_MESSAGES.ROOM_CREATED, 201);
  } catch (error) {
    console.error("createRoom error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Update room
 */
export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);

  try {
    // Check if room has active bookings
    const isBooked = await hasActiveBookings(numericId);

    if (isBooked) {
      const allowedFields = [
        "status",
        "description",
        "long_description",
        "thumbnail",
      ];
      const requestedFields = Object.keys(req.body);
      const hasRestrictedField = requestedFields.some(
        (field) => !allowedFields.includes(field)
      );

      if (hasRestrictedField) {
        return res.error(
          "Phòng đang có booking active. Chỉ có thể sửa: trạng thái, mô tả, hình ảnh",
          null,
          400
        );
      }
    }

    const { name, type_id } = req.body;
    const numericTypeId = type_id !== undefined ? Number(type_id) : undefined;

    // Check for duplicate name (exclude current room)
    if (name) {
      const exists = await existsRoomWithName(name, numericId);
      if (exists) {
        return res.error(
          "Tên phòng đã tồn tại. Vui lòng chọn tên khác.",
          null,
          400
        );
      }
    }

    const payload = { ...req.body };
    if (numericTypeId !== undefined) payload.type_id = numericTypeId;

    const updated = await modelUpdateRoom(numericId, payload);
    res.success(updated, SUCCESS_MESSAGES.ROOM_UPDATED);
  } catch (error) {
    console.error("updateRoom error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Delete room
 */
export const deleteRoom = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);

  try {
    // Check if room has active bookings
    const isBooked = await hasActiveBookings(numericId);
    if (isBooked) {
      return res.error("Không thể xóa phòng đang có booking active", null, 400);
    }

    const deleted = await modelDeleteRoom(numericId);
    if (!deleted) {
      return res.error(ERROR_MESSAGES.ROOM_NOT_FOUND, null, 404);
    }

    res.success(deleted, SUCCESS_MESSAGES.ROOM_DELETED);
  } catch (error) {
    console.error("deleteRoom error:", error);
    if (error?.code === "23503") {
      return res.error(
        "Foreign key constraint failed: cannot delete",
        error.message,
        400
      );
    }
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Search available rooms
 */
export const searchRooms = async (req, res) => {
  try {
    const {
      check_in,
      check_out,
      room_type_id,
      floor_id,
      num_adults,
      num_children,
    } = req.query;

    if (!check_in || !check_out) {
      return res.error("Vui lòng nhập ngày check-in và check-out", null, 400);
    }

    const numAdults = num_adults ? Number(num_adults) : 1;
    const numChildren = num_children ? Number(num_children) : 0;
    const roomTypeId = room_type_id ? Number(room_type_id) : null;
    const floorId = floor_id ? Number(floor_id) : null;

    const rooms = await modelSearchAvailableRooms({
      check_in,
      check_out,
      room_type_id: roomTypeId,
      floor_id: floorId,
      num_adults: numAdults,
      num_children: numChildren,
    });

    res.success(rooms, `Tìm thấy ${rooms.length} phòng trống`);
  } catch (error) {
    console.error("searchRooms error:", error);
    res.error("Lỗi tìm kiếm phòng", error.message, 500);
  }
};
