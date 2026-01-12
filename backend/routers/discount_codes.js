import express from "express";
import { DiscountCodesController } from "../controllers/discount_codescontroller.js";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.js";
const router = express.Router();
router.post("/check", optionalAuth, DiscountCodesController.checkCode);
router.get("/suggest", optionalAuth, DiscountCodesController.suggestForBooking);
router.get("/available", DiscountCodesController.getAvailableVouchers);
router.post("/apply", requireAuth, DiscountCodesController.applyCode);
router.post(
  "/add",
  requireAuth,
  requireRole("manager"),
  DiscountCodesController.create
);
router.get(
  "/list",
  requireAuth,
  requireRole("staff"),
  DiscountCodesController.list
);
router.get(
  "/id/:id",
  requireAuth,
  requireRole("staff"),
  DiscountCodesController.findById
);
router.get(
  "/id/:id/usage-history",
  requireAuth,
  requireRole("staff"),
  DiscountCodesController.getUsageHistory
);
router.put(
  "/:id",
  requireAuth,
  requireRole("manager"),
  DiscountCodesController.updateById
);
router.post(
  "/delete-id",
  requireAuth,
  requireRole("manager"),
  DiscountCodesController.deleteById
);
export default router;
