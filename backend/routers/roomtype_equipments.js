import express from "express";
import { getRoomTypeEquipments } from "../controllers/roomtype_equipmentscontroller.js";
const router = express.Router();
router.get("/:id", getRoomTypeEquipments);
export default router;
