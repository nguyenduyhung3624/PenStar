import express from "express";
import {
  getRooms,
  getRoomID,
  createRoom,
  updateRoom,
  deleteRoom,
  searchRooms,
  searchAllRooms,
  getOccupiedRoomsController,
  getRoomBookingHistoryController,
  getRoomStatsController,
} from "../controllers/roomscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  validateRoomCreate,
  validateRoomUpdate,
  validateRoomIdParam,
} from "../middlewares/roomvalidate.js";

const roomsRouter = express.Router();

// Public: tìm kiếm phòng trống (chỉ trả phòng available)
roomsRouter.get("/search", searchRooms);

// Public: tìm kiếm TẤT CẢ phòng với trạng thái availability
roomsRouter.get("/search-all", searchAllRooms);

// Admin: get occupied rooms (đang có khách)
roomsRouter.get(
  "/occupied",
  requireAuth,
  requireRole("staff"),
  getOccupiedRoomsController
);

// Admin: room statistics
roomsRouter.get(
  "/stats",
  requireAuth,
  requireRole("staff"),
  getRoomStatsController
);

// Public: list rooms for client pages
roomsRouter.get("/", getRooms);

// Check if a room name exists for a given type (query params: name, type_id, excludeId)
roomsRouter.get("/check-name", async (req, res) => {
  try {
    const { name, type_id, excludeId } = req.query;
    if (!name || !type_id)
      return res
        .status(400)
        .json({ success: false, message: "name and type_id required" });
    const exists = await (
      await import("../models/roomsmodel.js")
    ).existsRoomWithNameAndType(
      String(name),
      Number(type_id),
      excludeId ? Number(excludeId) : null
    );
    res.json({ success: true, exists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: get room booking history
roomsRouter.get(
  "/:id/bookings",
  requireAuth,
  requireRole("staff"),
  validateRoomIdParam,
  getRoomBookingHistoryController
);

// Public: get room details
roomsRouter.get("/:id", validateRoomIdParam, getRoomID);

roomsRouter.post(
  "/",
  requireAuth,
  requireRole("staff"),
  validateRoomCreate,
  createRoom
);
roomsRouter.put(
  "/:id",
  requireAuth,
  requireRole("staff"),
  validateRoomIdParam,
  validateRoomUpdate,
  updateRoom
);
roomsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("staff"),
  validateRoomIdParam,
  deleteRoom
);

export default roomsRouter;
