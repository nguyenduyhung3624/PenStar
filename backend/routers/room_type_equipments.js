import express from "express";
import {
  getStandard,
  createOrUpdateStandard,
  getAllStandards,
  getByRoomType,
} from "../controllers/room_type_equipmentscontroller.js";
const router = express.Router();
router.get("/", getAllStandards);
router.get("/:room_type_id", getByRoomType);
router.get("/standard", getStandard);
router.post("/standard", createOrUpdateStandard);
export default router;
