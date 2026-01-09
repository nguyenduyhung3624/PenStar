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
} from "../controllers/bookingscontroller.js";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.js";
import { validateBookingCreate } from "../middlewares/bookingvalidate.js";
const router = express.Router();
router.post(
  "/:id/confirm-checkin",
  requireAuth,
  requireRole("staff"),
  confirmCheckin
);
router.get("/", requireAuth, requireRole("staff"), getBookings);
router.get("/mine", requireAuth, getMyBookings);
router.get("/:id", getBookingById);
router.post("/", requireAuth, validateBookingCreate, createBooking);
router.post("/:id/cancel", requireAuth, cancelBooking);
router.patch("/:id/my-status", requireAuth, updateMyBookingStatus);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("staff"),
  setBookingStatus
);
router.post(
  "/:id/confirm-checkout",
  requireAuth,
  requireRole("staff"),
  confirmCheckout
);
router.post("/:id/no-show", requireAuth, requireRole("staff"), adminMarkNoShow);
router.patch(
  "/:id/mark-refunded",
  requireAuth,
  requireRole("staff"),
  adminMarkRefunded
);
export default router;
