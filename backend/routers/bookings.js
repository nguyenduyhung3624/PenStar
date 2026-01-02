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
// register specific routes before parameterized routes
router.get("/mine", requireAuth, getMyBookings);
router.get("/:id", getBookingById);
// POST /bookings - Require auth: customer or staff can create booking
router.post("/", requireAuth, validateBookingCreate, createBooking);
// Cancel booking - both user and admin can use this endpoint
router.post("/:id/cancel", requireAuth, cancelBooking);
// Client can update their own booking (check-in, check-out)
router.patch("/:id/my-status", requireAuth, updateMyBookingStatus);
// Admin updates booking status
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
// Đánh dấu no_show thủ công (admin)
router.post("/:id/no-show", requireAuth, requireRole("staff"), adminMarkNoShow);
// Đánh dấu đã hoàn tiền (admin)
router.patch(
  "/:id/mark-refunded",
  requireAuth,
  requireRole("staff"),
  adminMarkRefunded
);

export default router;
