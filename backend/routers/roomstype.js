import express from "express";
import {
  getRoomTypes,
  createRoomType,
} from "../controllers/roomtypescontroller.js";
import {
  getRoomTypeById,
  updateRoomType,
  deleteRoomType,
} from "../controllers/roomtypescontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
const roomTypeRouter = express.Router();
roomTypeRouter.get("/", getRoomTypes);
roomTypeRouter.post("/", requireAuth, requireRole("admin"), createRoomType);
roomTypeRouter.get("/check-name", async (req, res) => {
  try {
    const { name, excludeId } = req.query;
    if (!name)
      return res.status(400).json({ success: false, message: "name required" });
    const { existsRoomTypeWithName } = await import(
      "../models/roomtypemodel.js"
    );
    const exists = await existsRoomTypeWithName(
      String(name),
      excludeId ? Number(excludeId) : null
    );
    return res.json({ success: true, exists });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
roomTypeRouter.get("/:id", getRoomTypeById);
roomTypeRouter.put("/:id", requireAuth, requireRole("admin"), updateRoomType);
roomTypeRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  deleteRoomType
);
export default roomTypeRouter;
