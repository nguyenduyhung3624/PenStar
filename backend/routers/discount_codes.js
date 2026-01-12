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
  requireRole("admin"),
  DiscountCodesController.create
);
router.get(
  "/list",
  requireAuth,
  requireRole("admin"),
  DiscountCodesController.list
);
router.get(
  "/id/:id",
  requireAuth,
  requireRole("admin"),
  DiscountCodesController.findById
);
router.get(
  "/id/:id/usage-history",
  requireAuth,
  requireRole("admin"),
  DiscountCodesController.getUsageHistory
);
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  DiscountCodesController.updateById
);
router.post(
  "/delete-id",
  requireAuth,
  requireRole("admin"),
  DiscountCodesController.deleteById
);
export default router;
