import pool from "../db.js";
import { sendEmailWithRetry } from "../utils/emailWithRetry.js";
import {
  getBookings as modelGetBookings,
  getBookingById as modelGetBookingById,
  createBooking as modelCreateBooking,
  setBookingStatus as modelSetBookingStatus,
  getBookingsByUser as modelGetBookingsByUser,
  confirmCheckout as modelConfirmCheckout,
  cancelBooking as modelCancelBooking,
  confirmCheckin as modelConfirmCheckin,
} from "../models/bookingsmodel.js";
import {
  STAY_STATUS,
  PAYMENT_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  BOOKING,
} from "../utils/constants.js";

/**
 * Get all bookings
 */
export const getBookings = async (req, res) => {
  try {
    const data = await modelGetBookings();
    res.success(data, "Lấy danh sách booking thành công");
  } catch (error) {
    console.error("getBookings error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Get booking by ID with items and services
 */
export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await modelGetBookingById(id);
    if (!booking) {
      return res.error(ERROR_MESSAGES.BOOKING_NOT_FOUND, null, 404);
    }

    // Fetch items and services
    const itemsRes = await pool.query(
      `SELECT bi.*, 
              rp.refundable, rp.refund_percent, rp.refund_deadline_hours, rp.non_refundable, rp.notes as refund_notes
       FROM booking_items bi
       LEFT JOIN room_types rt ON bi.room_type_id = rt.id
       LEFT JOIN refund_policies rp ON bi.room_type_id = rp.room_type_id
       WHERE bi.booking_id = $1`,
      [id]
    );
    const servicesRes = await pool.query(
      "SELECT * FROM booking_services WHERE booking_id = $1",
      [id]
    );

    // Map refund_policy fields
    booking.items = itemsRes.rows.map((item) => {
      const refund_policy =
        item.refundable !== null
          ? {
              refundable: item.refundable,
              refund_percent: item.refund_percent,
              refund_deadline_hours: item.refund_deadline_hours,
              non_refundable: item.non_refundable,
              notes: item.refund_notes,
            }
          : null;
      const {
        refundable,
        refund_percent,
        refund_deadline_hours,
        non_refundable,
        refund_notes,
        ...rest
      } = item;
      return { ...rest, refund_policy };
    });
    booking.services = servicesRes.rows;

    // Add check_in/out from first item
    if (booking.items?.length > 0) {
      booking.check_in = booking.items[0].check_in;
      booking.check_out = booking.items[0].check_out;
    }

    // Calculate totals if missing
    if (!booking.total_room_price) {
      booking.total_room_price = booking.items.reduce(
        (sum, item) => sum + Number(item.room_type_price || 0),
        0
      );
    }
    if (!booking.total_service_price) {
      booking.total_service_price = booking.services.reduce(
        (sum, service) => sum + Number(service.total_service_price || 0),
        0
      );
    }

    // Get cancellation info if exists
    if (booking.canceled_by) {
      const userRes = await pool.query(
        "SELECT full_name, email FROM users WHERE id = $1",
        [booking.canceled_by]
      );
      if (userRes.rows[0]) {
        booking.canceled_by_name =
          userRes.rows[0].email || userRes.rows[0].full_name;
      }
    }

    res.success(booking);
  } catch (error) {
    console.error("getBookingById error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Create new booking
 */
export const createBooking = async (req, res) => {
  try {
    console.log("=== CREATE BOOKING REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const payload = req.body;
    if (req.user?.id) {
      payload.user_id = Number(req.user.id);
    }

    // Validate booking duration
    if (payload.check_in && payload.check_out) {
      const checkIn = new Date(payload.check_in);
      const checkOut = new Date(payload.check_out);
      const now = new Date();

      // Reset time to compare dates only
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);

      // Calculate nights
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

      // Validate max nights
      if (nights > BOOKING.MAX_NIGHTS) {
        return res.error(
          `Không thể đặt phòng quá ${BOOKING.MAX_NIGHTS} đêm. Vui lòng liên hệ khách sạn để đặt dài hạn.`,
          null,
          400
        );
      }

      // Validate min nights
      if (nights < BOOKING.MIN_NIGHTS) {
        return res.error(
          `Phải đặt tối thiểu ${BOOKING.MIN_NIGHTS} đêm.`,
          null,
          400
        );
      }

      // Validate advance booking
      const daysInAdvance = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));
      if (daysInAdvance > BOOKING.MAX_ADVANCE_DAYS) {
        return res.error(
          `Không thể đặt phòng trước quá ${BOOKING.MAX_ADVANCE_DAYS} ngày.`,
          null,
          400
        );
      }

      // Check if check_in is not in the past
      if (checkIn < now) {
        return res.error(
          "Ngày nhận phòng không thể là ngày trong quá khứ.",
          null,
          400
        );
      }
    }

    // Reject rooms_config - must send items
    if (Array.isArray(payload.rooms_config)) {
      return res.error(
        "Vui lòng gửi trực tiếp mảng items từ frontend.",
        null,
        400
      );
    }

    const booking = await modelCreateBooking(payload);

    // Fetch created items
    const itemsRes = await pool.query(
      "SELECT * FROM booking_items WHERE booking_id = $1",
      [booking.id]
    );
    booking.items = itemsRes.rows;

    res.success(booking, SUCCESS_MESSAGES.BOOKING_CREATED, 201);
  } catch (error) {
    console.error("=== CREATE BOOKING ERROR ===", error);

    // Handle FK constraint
    if (error?.code === "23503") {
      const fieldMap = {
        user_id: "Người dùng không tồn tại",
        stay_status_id: "Trạng thái booking không hợp lệ",
        room_id: "Phòng không tồn tại",
        service_id: "Dịch vụ không tồn tại",
      };

      let friendlyMsg = "Dữ liệu liên quan không tồn tại";
      const detail = error.detail || "";
      for (const [field, msg] of Object.entries(fieldMap)) {
        if (detail.includes(field)) {
          friendlyMsg = msg;
          break;
        }
      }

      return res.error(friendlyMsg, error.message, 400);
    }

    // Handle NOT NULL constraint
    if (error?.code === "23502") {
      return res.error(
        ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        error.message,
        400
      );
    }

    // Handle CHECK constraint
    if (error?.code === "23514") {
      return res.error(ERROR_MESSAGES.INVALID_INPUT, error.message, 400);
    }

    res.error(
      error.message || ERROR_MESSAGES.INTERNAL_ERROR,
      error.message,
      500
    );
  }
};

/**
 * Get user's own bookings
 */
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }
    const data = await modelGetBookingsByUser(userId);
    res.success(data);
  } catch (err) {
    console.error("getMyBookings error:", err);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};

/**
 * Admin sets booking status
 */
export const setBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    // If marking as cancelled, release rooms
    if (fields.stay_status_id === STAY_STATUS.CANCELLED) {
      const itemsRes = await pool.query(
        "SELECT room_id FROM booking_items WHERE booking_id = $1",
        [id]
      );

      for (const item of itemsRes.rows) {
        if (item.room_id) {
          await pool.query("UPDATE rooms SET status = $1 WHERE id = $2", [
            "available",
            item.room_id,
          ]);
        }
      }
      console.log(
        `✅ Released ${itemsRes.rows.length} rooms for cancelled booking #${id}`
      );
    }

    // Get old payment status
    let oldPaymentStatus = null;
    if (
      fields.payment_status &&
      fields.payment_status === PAYMENT_STATUS.PAID
    ) {
      const oldBookingRes = await pool.query(
        "SELECT payment_status, user_id FROM bookings WHERE id = $1",
        [id]
      );
      const oldBooking = oldBookingRes.rows[0];
      oldPaymentStatus = oldBooking?.payment_status;
    }

    const updated = await modelSetBookingStatus(id, fields);

    // Send confirmation email on payment
    if (
      fields.payment_status === PAYMENT_STATUS.PAID &&
      oldPaymentStatus !== PAYMENT_STATUS.PAID
    ) {
      const bookingRes = await pool.query(
        "SELECT user_id FROM bookings WHERE id = $1",
        [id]
      );
      const booking = bookingRes.rows[0];

      if (booking?.user_id) {
        const userRes = await pool.query(
          "SELECT email FROM users WHERE id = $1",
          [booking.user_id]
        );
        const user = userRes.rows[0];

        if (user?.email) {
          const emailResult = await sendEmailWithRetry(user.email, id);
          if (!emailResult.success) {
            console.warn(
              `[EMAIL] Failed to send confirmation for booking #${id}`
            );
          }
        }
      }
    }

    res.success(updated, "Cập nhật trạng thái booking thành công");
  } catch (err) {
    console.error("setBookingStatus error:", err);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};

/**
 * ✅ FIXED: Client updates their own booking status (payment only)
 */
export const updateMyBookingStatus = async (req, res) => {
  try {
    // ✅ Early authentication check
    const userId = req.user?.id;
    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }

    const { id } = req.params;
    const { stay_status_id, payment_method, payment_status } = req.body;

    // ✅ Verify booking exists
    const booking = await modelGetBookingById(id);
    if (!booking) {
      return res.error(ERROR_MESSAGES.BOOKING_NOT_FOUND, null, 404);
    }

    // ✅ Verify booking belongs to user
    if (booking.user_id !== userId) {
      return res.error(ERROR_MESSAGES.BOOKING_BELONGS_TO_OTHER, null, 403);
    }

    // ✅ Prevent user from changing stay_status_id
    if (stay_status_id !== undefined) {
      return res.error(
        "Chỉ admin hoặc nhân viên mới được phép check-in/check-out!",
        null,
        403
      );
    }

    // ✅ Handle payment_status update
    if (payment_status) {
      const oldBookingRes = await pool.query(
        "SELECT payment_status FROM bookings WHERE id = $1",
        [id]
      );
      const oldPaymentStatus = oldBookingRes.rows[0]?.payment_status;

      const updated = await modelSetBookingStatus(id, { payment_status });

      // Send email if transitioning to paid
      if (
        payment_status === PAYMENT_STATUS.PAID &&
        oldPaymentStatus !== PAYMENT_STATUS.PAID
      ) {
        const userRes = await pool.query(
          "SELECT email FROM users WHERE id = $1",
          [booking.user_id]
        );
        const user = userRes.rows[0];

        if (user?.email) {
          const emailResult = await sendEmailWithRetry(user.email, id);
          if (!emailResult.success) {
            console.warn(`[EMAIL] Failed for booking #${id}`);
          }
        }
      }

      return res.success(updated, "Cập nhật trạng thái thanh toán thành công!");
    }

    // ✅ Handle payment_method update
    if (payment_method) {
      const updated = await modelSetBookingStatus(id, { payment_method });
      return res.success(
        updated,
        "Cập nhật phương thức thanh toán thành công!"
      );
    }

    return res.error(
      "Vui lòng cung cấp payment_status hoặc payment_method",
      null,
      400
    );
  } catch (err) {
    console.error("updateMyBookingStatus error:", err);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};

/**
 * Confirm check-in
 */
export const confirmCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }

    const result = await modelConfirmCheckin(id, userId);
    res.success(result, SUCCESS_MESSAGES.CHECKIN_SUCCESS);
  } catch (err) {
    res.error(err.message, null, 400);
  }
};

/**
 * Confirm check-out
 */
export const confirmCheckout = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }

    const updated = await modelConfirmCheckout(id, userId);
    res.success(updated, SUCCESS_MESSAGES.CHECKOUT_SUCCESS);
  } catch (err) {
    console.error("confirmCheckout error:", err);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRoleId = req.user?.role_id;
    const { cancel_reason } = req.body;

    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }

    // Staff and above can cancel any booking
    const isStaffOrAbove = userRoleId && userRoleId >= 2;

    const result = await modelCancelBooking(
      id,
      userId,
      isStaffOrAbove,
      cancel_reason
    );

    const refundMsg =
      result.refund_amount > 0
        ? `Số tiền hoàn lại: ${result.refund_amount} VND.`
        : "Không đủ điều kiện hoàn tiền theo chính sách.";

    res.success(
      { booking: result.booking, refund_amount: result.refund_amount },
      `${SUCCESS_MESSAGES.BOOKING_CANCELLED} ${refundMsg}`
    );
  } catch (err) {
    console.error("cancelBooking error:", err);
    res.error(err.message || "Không thể hủy booking", err.message, 400);
  }
};

/**
 * Admin marks booking as no-show
 */
export const adminMarkNoShow = async (req, res) => {
  const { id } = req.params;
  try {
    const { markNoShow } = await import("../utils/markNoShow.js");
    await markNoShow(Number(id));
    res.success(null, "Booking đã chuyển sang no_show.");
  } catch (err) {
    res.error(err.message, null, 500);
  }
};

/**
 * Admin marks booking as refunded
 */
export const adminMarkRefunded = async (req, res) => {
  const { id } = req.params;
  try {
    const { setBookingStatus } = await import("../models/bookingsmodel.js");
    await setBookingStatus(id, { is_refunded: true });
    res.success(null, SUCCESS_MESSAGES.REFUND_PROCESSED);
  } catch (err) {
    res.error(err.message, null, 500);
  }
};
