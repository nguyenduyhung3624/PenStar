import express from "express";
import * as controller from "../controllers/roomdevicescontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
const router = express.Router();
router.use(requireAuth, requireRole("staff"));
router.put("/:id/restore-status", controller.restoreDeviceStatus);
router.get("/", controller.getDevices); 
router.get("/:id", controller.getDeviceById); 
router.post("/", controller.createDevice); 
router.put("/:id", controller.updateDevice); 
router.delete("/:id", controller.deleteDevice); 
router.post("/transfer", controller.transferDevice);
router.get("/check-standard/:id", controller.checkRoomDevicesStandard);
router.get(
  "/check-standard-by-type/:roomTypeId",
  controller.checkRoomDevicesStandardByType
);
export default router;
