import {
  getBookingItems as modelGetBookingItems,
  getBookingItemById as modelGetBookingItemById,
  createBookingItem as modelCreateBookingItem,
  deleteBookingItem as modelDeleteBookingItem,
  cancelBookingItem as modelCancelBookingItem,
  getByBookingId as modelGetByBookingId,
  getItemsWithRefundInfo as modelGetItemsWithRefundInfo,
} from "../models/booking_itemsmodel.js";
import pool from "../db.js";
import { ERROR_MESSAGES, STAY_STATUS } from "../utils/constants.js";

export const getBookingItems = async (req, res) => {
  try {
    const data = await modelGetBookingItems();
    res.success(data, "Lấy danh sách booking items thành công");
  } catch (error) {
    console.error("booking_items.getBookingItems error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getBookingItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetBookingItemById(id);
    if (!item) {
      return res.error("Không tìm thấy booking item", null, 404);
    }
    res.success(item, "Lấy booking item thành công");
  } catch (error) {
    console.error("booking_items.getBookingItemById error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createBookingItem = async (req, res) => {
  try {
    const payload = req.body;
    const item = await modelCreateBookingItem(payload);
    res.success(item, "Tạo booking item thành công", 201);
  } catch (error) {
    console.error("booking_items.createBookingItem error:", error);
    if (error && error.code === "23503") {
      return res.error("Foreign key constraint failed", error.message, 400);
    }
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const deleteBookingItem = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await modelDeleteBookingItem(id);
    if (!deleted) {
      return res.error("Không tìm thấy booking item", null, 404);
    }
    res.success(deleted, "Xóa booking item thành công");
  } catch (error) {
    console.error("booking_items.deleteBookingItem error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Cancel a single booking item (room) within a booking
 * Only allowed when booking status is pending
 */
export const cancelBookingItemController = async (req, res) => {
  const { id } = req.params;
  const { cancel_reason } = req.body;
  const userId = req.user?.id;

  try {
    // Get the booking item
    const item = await modelGetBookingItemById(id);
    if (!item) {
      return res.error("Không tìm thấy phòng trong đơn đặt", null, 404);
    }

    // Check if item is already cancelled
    if (item.status === "cancelled") {
      return res.error("Phòng này đã bị huỷ trước đó", null, 400);
    }

    // Get booking to check status
    const bookingResult = await pool.query(
      "SELECT * FROM bookings WHERE id = $1",
      [item.booking_id]
    );
    const booking = bookingResult.rows[0];

    if (!booking) {
      return res.error("Không tìm thấy đơn đặt phòng", null, 404);
    }

    // Check if user owns this booking (or is staff)
    const userRole = req.user?.role_id;
    if (booking.user_id !== userId && userRole >= 3) {
      return res.error("Bạn không có quyền huỷ phòng này", null, 403);
    }

    // Only allow cancel when booking is pending (stay_status_id = STAY_STATUS.PENDING)
    if (booking.stay_status_id !== STAY_STATUS.PENDING) {
      return res.error(
        "Chỉ có thể huỷ phòng khi đơn đang ở trạng thái chờ xác nhận",
        null,
        400
      );
    }

    // Cancel the item
    const cancelled = await modelCancelBookingItem(id, cancel_reason);

    // Calculate refund amount for this item (Policy: 80% refund)
    const itemTotal =
      ((Number(item.room_type_price) || 0) +
        (Number(item.extra_adult_fees) || 0) +
        (Number(item.extra_child_fees) || 0) +
        (Number(item.extra_fees) || 0)) *
      0.8;

    // Update the item refund_amount
    await pool.query(
      "UPDATE booking_items SET refund_amount = $2 WHERE id = $1",
      [id, Math.floor(itemTotal)]
    );

    res.success(
      { ...cancelled, refund_amount: itemTotal },
      "Đã huỷ phòng thành công. Bạn có thể yêu cầu hoàn tiền."
    );

    // Check if any active items remain for this booking
    const itemsResult = await pool.query(
      "SELECT id FROM booking_items WHERE booking_id = $1 AND status != 'cancelled'",
      [booking.id]
    );

    if (itemsResult.rows.length === 0) {
      // Auto-cancel the booking if no items left
      const { cancelBooking } = await import("../models/bookingsmodel.js");
      try {
        await cancelBooking(
          booking.id,
          userId,
          false,
          "Auto-cancelled: All rooms cancelled"
        );
        console.log(
          `[Auto-Cancel] Booking #${booking.id} cancelled as all rooms are cancelled.`
        );
      } catch (cancelErr) {
        console.error(
          `[Auto-Cancel] Failed to cancel booking #${booking.id}:`,
          cancelErr
        );
      }
    }
  } catch (error) {
    console.error("cancelBookingItemController error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Get all items for a specific booking
 */
export const getItemsByBookingId = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const items = await modelGetByBookingId(bookingId);
    res.success(items, "Lấy danh sách phòng trong đơn thành công");
  } catch (error) {
    console.error("getItemsByBookingId error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Get all items for a booking WITH refund request info
 */
export const getItemsWithRefundInfoController = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const items = await modelGetItemsWithRefundInfo(bookingId);
    res.success(
      items,
      "Lấy danh sách phòng với thông tin hoàn tiền thành công"
    );
  } catch (error) {
    console.error("getItemsWithRefundInfoController error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
