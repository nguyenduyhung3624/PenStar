import express from "express";
import { DiscountCodesController } from "../controllers/discount_codescontroller.js";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.js";

const router = express.Router();

// Public routes - cho phép khách check và xem gợi ý mã giảm giá
router.post("/check", optionalAuth, DiscountCodesController.checkCode);
router.get("/suggest", optionalAuth, DiscountCodesController.suggestForBooking);

// Protected routes - yêu cầu manager trở lên
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
