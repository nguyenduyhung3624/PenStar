import express from "express";
import {
  getStandard,
  updateStandardsForRoomType,
  getAllStandards,
  getByRoomType,
} from "../controllers/room_type_equipmentscontroller.js";
const router = express.Router();
router.get("/", getAllStandards);
router.get("/:room_type_id", getByRoomType);
router.get("/standard", getStandard);
router.put("/:room_type_id", updateStandardsForRoomType);
export default router;
