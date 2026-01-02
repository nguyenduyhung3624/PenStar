import express from "express";
import {
  getStandard,
  createOrUpdateStandard,
  getAllStandards,
  getByRoomType,
} from "../controllers/room_type_equipmentscontroller.js";
const router = express.Router();

// Lấy tất cả tiêu chuẩn thiết bị theo loại phòng
router.get("/", getAllStandards);
// Lấy danh sách thiết bị chuẩn của một loại phòng (cho frontend hiển thị)
router.get("/:room_type_id", getByRoomType);
// Lấy tiêu chuẩn cụ thể
router.get("/standard", getStandard);
// Thêm hoặc cập nhật tiêu chuẩn thiết bị cho loại phòng
router.post("/standard", createOrUpdateStandard);

export default router;
