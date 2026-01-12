import express from "express";
import * as controller from "../controllers/master_equipmentscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
const router = express.Router();
router.get("/", requireAuth, requireRole("admin"), controller.getAllEquipments);
router.get(
  "/:id",
  requireAuth,
  requireRole("admin"),
  controller.getEquipmentById
);
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  controller.createEquipment
);
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  controller.updateEquipment
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  controller.deleteEquipment
);
export default router;
