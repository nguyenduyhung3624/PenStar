import express from "express";
import * as controller from "../controllers/master_equipmentscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
const router = express.Router();
router.get("/", requireAuth, requireRole("staff"), controller.getAllEquipments);
router.get(
  "/:id",
  requireAuth,
  requireRole("staff"),
  controller.getEquipmentById
);
router.post(
  "/",
  requireAuth,
  requireRole("manager"),
  controller.createEquipment
);
router.put(
  "/:id",
  requireAuth,
  requireRole("manager"),
  controller.updateEquipment
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("manager"),
  controller.deleteEquipment
);
export default router;
