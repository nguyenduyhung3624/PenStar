import express from "express";
import * as controller from "../controllers/booking_incidentscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Tất cả routes yêu cầu đăng nhập và role staff trở lên
router.use(requireAuth, requireRole("staff"));

router.get("/", controller.getIncidentsByBooking); // ?booking_id=xx
router.get("/room", controller.getIncidentsByRoom); // ?room_id=xx
router.post("/", controller.createIncident);
router.delete("/:id", controller.deleteIncident);

export default router;
