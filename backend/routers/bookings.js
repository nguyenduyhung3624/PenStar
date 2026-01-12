import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  getMyBookings,
  setBookingStatus,
  updateMyBookingStatus,
  confirmCheckout,
  cancelBooking,
  confirmCheckin,
  adminMarkNoShow,
  adminMarkRefunded,
  calculateLateFee,
  uploadReceipt,
  uploadReceiptMiddleware,
} from "../controllers/bookingscontroller.js";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.js";
import { validateBookingCreate } from "../middlewares/bookingvalidate.js";
const router = express.Router();
router.post(
  "/:id/confirm-checkin",
  requireAuth,
  requireRole("admin"),
  confirmCheckin
);
router.get("/", requireAuth, requireRole("admin"), getBookings);
router.get("/mine", requireAuth, getMyBookings);
router.get("/:id", getBookingById);
router.post("/", requireAuth, validateBookingCreate, createBooking);
router.post("/:id/cancel", requireAuth, cancelBooking);
router.patch("/:id/my-status", requireAuth, updateMyBookingStatus);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  setBookingStatus
);
router.post(
  "/:id/confirm-checkout",
  requireAuth,
  requireRole("admin"),
  confirmCheckout
);
router.post("/:id/no-show", requireAuth, requireRole("admin"), adminMarkNoShow);
router.post(
  "/:id/calculate-late-fee",
  requireAuth,
  requireRole("admin"),
  calculateLateFee
);
router.patch(
  "/:id/mark-refunded",
  requireAuth,
  requireRole("admin"),
  adminMarkRefunded
);
router.post(
  "/upload-receipt",
  requireAuth,
  requireRole("admin"),
  uploadReceiptMiddleware.single("file"),
  uploadReceipt
);
export default router;
