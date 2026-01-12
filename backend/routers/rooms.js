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
roomsRouter.get("/search", searchRooms);
roomsRouter.get("/search-all", searchAllRooms);
roomsRouter.get(
  "/occupied",
  requireAuth,
  requireRole("admin"),
  getOccupiedRoomsController
);
roomsRouter.get(
  "/stats",
  requireAuth,
  requireRole("admin"),
  getRoomStatsController
);
roomsRouter.get("/", getRooms);
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
roomsRouter.get(
  "/:id/bookings",
  requireAuth,
  requireRole("admin"),
  validateRoomIdParam,
  getRoomBookingHistoryController
);
roomsRouter.get("/:id", validateRoomIdParam, getRoomID);
roomsRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validateRoomCreate,
  createRoom
);
roomsRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validateRoomIdParam,
  validateRoomUpdate,
  updateRoom
);
roomsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validateRoomIdParam,
  deleteRoom
);
export default roomsRouter;
