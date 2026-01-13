import express from "express";
import {
  getAllRoomTypeImages,
  getRoomTypeImage,
  getImagesByRoomType,
  createImage,
  updateImage,
  deleteImage,
  uploadImageForRoomType,
  uploadMiddleware,
} from "../controllers/roomtypeimagescontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
const router = express.Router();
router.post(
  "/roomtype/:roomTypeId/upload",
  requireAuth,
  requireRole("admin"),
  uploadMiddleware.single("file"),
  uploadImageForRoomType
);
router.get("/", getAllRoomTypeImages);
router.get("/roomtype/:roomTypeId", getImagesByRoomType); 
router.get("/:id", getRoomTypeImage);
router.post("/", requireAuth, requireRole("admin"), createImage);
router.put("/:id", requireAuth, requireRole("admin"), updateImage);
router.delete("/:id", requireAuth, requireRole("admin"), deleteImage);
export default router;
