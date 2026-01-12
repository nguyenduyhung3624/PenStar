import express from "express";
import {
  getBookingItems,
  getBookingItemById,
  createBookingItem,
  deleteBookingItem,
  cancelBookingItemController,
  getItemsByBookingId,
  getItemsWithRefundInfoController,
} from "../controllers/booking_itemscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBookingItemCreate } from "../middlewares/bookingvalidate.js";
const router = express.Router();
router.get("/", getBookingItems);
router.get("/:id", getBookingItemById);
router.get("/booking/:bookingId", requireAuth, getItemsByBookingId);
router.get(
  "/booking/:bookingId/with-refund",
  requireAuth,
  getItemsWithRefundInfoController
);
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validateBookingItemCreate,
  createBookingItem
);
router.delete("/:id", requireAuth, requireRole("admin"), deleteBookingItem);
router.patch("/:id/cancel", requireAuth, cancelBookingItemController);
export default router;
