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
<<<<<<< HEAD
  changeRoomInBooking,
  updateBookingDamages,
=======
  confirmCheckin,
  adminMarkNoShow,
  adminMarkRefunded,
  calculateLateFee,
  uploadReceipt,
  uploadReceiptMiddleware,
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
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
<<<<<<< HEAD

// Change room in booking - both customer and staff can use
router.patch("/:id/change-room", requireAuth, changeRoomInBooking);
router.put(
  "/:id/damages",
  requireAuth,
  requireRole("staff"),
  updateBookingDamages
);

=======
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
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
export default router;
