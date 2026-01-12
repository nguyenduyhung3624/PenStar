import pool from "../db.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { sendEmailWithRetry } from "../utils/emailWithRetry.js";
import {
  sendBookingStatusEmail,
  sendAdminCancellationEmail,
} from "../utils/mailer.js";
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
export const getBookings = async (req, res) => {
  try {
    const data = await modelGetBookings();
    res.success(data, "Lấy danh sách booking thành công");
  } catch (error) {
    console.error("getBookings error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await modelGetBookingById(id);
    if (!booking) {
      return res.error(ERROR_MESSAGES.BOOKING_NOT_FOUND, null, 404);
    }
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
    booking.items = itemsRes.rows.map((item) => {
      const refund_policy =
        item.refundable !== null
          ? {
              refundable: item.refundable,
              refund_percent: item.refund_percent,
              refund_deadline_hours: item.refund_deadline_hours,
              non_refundable: item.non_refundable,
              notes: item.refund_notes,
              ...item,
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
    if (booking.items?.length > 0) {
      booking.check_in = booking.items[0].check_in;
      booking.check_out = booking.items[0].check_out;
    }
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
export const createBooking = async (req, res) => {
  try {
    console.log("=== CREATE BOOKING REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    const payload = req.body;
    if (req.user?.id) {
      payload.user_id = Number(req.user.id);
    }
    if (payload.check_in && payload.check_out) {
      const checkIn = new Date(payload.check_in);
      const checkOut = new Date(payload.check_out);
      const now = new Date();
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      if (nights > BOOKING.MAX_NIGHTS) {
        return res.error(
          `Không thể đặt phòng quá ${BOOKING.MAX_NIGHTS} đêm. Vui lòng liên hệ khách sạn để đặt dài hạn.`,
          null,
          400
        );
      }
      if (nights < BOOKING.MIN_NIGHTS) {
        return res.error(
          `Phải đặt tối thiểu ${BOOKING.MIN_NIGHTS} đêm.`,
          null,
          400
        );
      }
      const daysInAdvance = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));
      if (daysInAdvance > BOOKING.MAX_ADVANCE_DAYS) {
        return res.error(
          `Không thể đặt phòng trước quá ${BOOKING.MAX_ADVANCE_DAYS} ngày.`,
          null,
          400
        );
      }
      if (checkIn < now) {
        return res.error(
          "Ngày nhận phòng không thể là ngày trong quá khứ.",
          null,
          400
        );
      }
      const finalCheckIn = new Date(payload.check_in);
      finalCheckIn.setHours(14, 0, 0, 0);
      const finalCheckOut = new Date(payload.check_out);
      finalCheckOut.setHours(14, 0, 0, 0);
      payload.check_in = finalCheckIn;
      payload.check_out = finalCheckOut;
    }
    if (Array.isArray(payload.rooms_config)) {
      return res.error(
        "Vui lòng gửi trực tiếp mảng items từ frontend.",
        null,
        400
      );
    }
    const booking = await modelCreateBooking(payload);
    const itemsRes = await pool.query(
      "SELECT * FROM booking_items WHERE booking_id = $1",
      [booking.id]
    );
    booking.items = itemsRes.rows;
    res.success(booking, SUCCESS_MESSAGES.BOOKING_CREATED, 201);
  } catch (error) {
    console.error("=== CREATE BOOKING ERROR ===", error);
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
    if (error?.code === "23502") {
      return res.error(
        ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
        error.message,
        400
      );
    }
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
export const setBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
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
    if (
      fields.stay_status_id &&
      fields.stay_status_id !== STAY_STATUS.PENDING
    ) {
      const bookingRes = await pool.query(
        "SELECT user_id FROM bookings WHERE id = $1",
        [id]
      );
      const bookingData = bookingRes.rows[0];
      if (bookingData?.user_id) {
        const userRes = await pool.query(
          "SELECT email FROM users WHERE id = $1",
          [bookingData.user_id]
        );
        const userEmail = userRes.rows[0]?.email;
        if (userEmail) {
          sendBookingStatusEmail(userEmail, id, fields.stay_status_id);
        }
      }
    }
    res.success(updated, "Cập nhật trạng thái booking thành công");
  } catch (err) {
    console.error("setBookingStatus error:", err);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};
export const updateMyBookingStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }
    const { id } = req.params;
    const { stay_status_id, payment_method, payment_status } = req.body;
    const booking = await modelGetBookingById(id);
    if (!booking) {
      return res.error(ERROR_MESSAGES.BOOKING_NOT_FOUND, null, 404);
    }
    if (booking.user_id !== userId) {
      return res.error(ERROR_MESSAGES.BOOKING_BELONGS_TO_OTHER, null, 403);
    }
    if (stay_status_id !== undefined) {
      return res.error(
        "Chỉ admin hoặc nhân viên mới được phép check-in/check-out!",
        null,
        403
      );
    }
    if (payment_status) {
      const oldBookingRes = await pool.query(
        "SELECT payment_status FROM bookings WHERE id = $1",
        [id]
      );
      const oldPaymentStatus = oldBookingRes.rows[0]?.payment_status;
      const updated = await modelSetBookingStatus(id, { payment_status });
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
export const confirmCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }
    const result = await modelConfirmCheckin(id, userId);
    const bookingRes = await pool.query(
      "SELECT b.user_id, u.email FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = $1",
      [id]
    );
    const userEmail = bookingRes.rows[0]?.email;
    if (userEmail) {
      sendBookingStatusEmail(userEmail, id, STAY_STATUS.CHECKED_IN);
    }
    res.success(result, SUCCESS_MESSAGES.CHECKIN_SUCCESS);
  } catch (err) {
    console.error("confirmCheckin error:", err);
    res.error(err.message, null, 400);
  }
};
export const confirmCheckout = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }
    const updated = await modelConfirmCheckout(id, userId);
    const bookingRes = await pool.query(
      "SELECT b.user_id, u.email FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = $1",
      [id]
    );
    const userEmail = bookingRes.rows[0]?.email;
    if (userEmail) {
      sendBookingStatusEmail(userEmail, id, STAY_STATUS.CHECKED_OUT);
    }
    res.success(updated, SUCCESS_MESSAGES.CHECKOUT_SUCCESS);
  } catch (err) {
    console.error("confirmCheckout error:", err);
    res.error(err.message || ERROR_MESSAGES.INTERNAL_ERROR, null, 400);
  }
};
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRoleId = req.user?.role_id;
    const { cancel_reason } = req.body;
    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }
    const isStaffOrAbove = userRoleId === 1;
    const result = await modelCancelBooking(
      id,
      userId,
      isStaffOrAbove,
      cancel_reason
    );
    const bookingRes = await pool.query(
      "SELECT b.user_id, u.email FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = $1",
      [id]
    );
    const userEmail = bookingRes.rows[0]?.email;
    if (userEmail) {
      sendBookingStatusEmail(userEmail, id, STAY_STATUS.CANCELLED);
    }
    sendAdminCancellationEmail(id);
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
// Calculate Late Fee endpoint
export const calculateLateFee = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await modelGetBookingById(id);
    if (!booking) {
      return res.error(ERROR_MESSAGES.BOOKING_NOT_FOUND, null, 404);
    }

    // Check current time
    const now = new Date();

    // Get the actual checkout date/time from booking
    const itemsRes = await pool.query(
      "SELECT check_out FROM booking_items WHERE booking_id = $1 ORDER BY check_out DESC LIMIT 1",
      [id]
    );

    if (!itemsRes.rows[0]) {
      return res.error("Không tìm thấy thông tin checkout", null, 404);
    }

    const checkoutDate = new Date(itemsRes.rows[0].check_out);

    // Standard Checkout Time: 15:00 on checkout date
    const standardCheckoutTime = new Date(checkoutDate);
    standardCheckoutTime.setHours(15, 0, 0, 0);

    // If Now <= checkout date at 15:00, no fee
    if (now <= standardCheckoutTime) {
      return res.success({ lateFee: 0, hoursLate: 0 }, "Chưa quá giờ checkout");
    }

    // Calculate hours late from checkout date 15:00
    const diffMs = now - standardCheckoutTime;
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    // Find the Late Fee Service
    const serviceRes = await pool.query(
      "SELECT * FROM services WHERE name = $1 LIMIT 1",
      ["Phụ thu checkout muộn"]
    );
    const lateFeeService = serviceRes.rows[0];

    if (!lateFeeService) {
      return res.error(
        "Không tìm thấy dịch vụ 'Phụ thu checkout muộn' trong hệ thống",
        null,
        500
      );
    }

    const feeAmount = diffHours * 100000;

    const existingServiceRes = await pool.query(
      "SELECT * FROM booking_services WHERE booking_id = $1 AND service_id = $2",
      [id, lateFeeService.id]
    );

    let result;

    if (existingServiceRes.rows.length > 0) {
      const existing = existingServiceRes.rows[0];
      if (existing.quantity !== diffHours) {
        await pool.query(
          "UPDATE booking_services SET quantity = $1, total_service_price = $2 WHERE id = $3",
          [diffHours, feeAmount, existing.id]
        );
        result = {
          ...existing,
          quantity: diffHours,
          total_service_price: feeAmount,
          action: "updated",
        };
      } else {
        result = { ...existing, action: "no_change" };
      }
    } else {
      const insertRes = await pool.query(
        `INSERT INTO booking_services (booking_id, service_id, quantity, total_service_price, note)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          id,
          lateFeeService.id,
          diffHours,
          feeAmount,
          `Auto-added: ${diffHours} hours late`,
        ]
      );
      result = { ...insertRes.rows[0], action: "created" };
    }

    await pool.query(
      `
      UPDATE bookings
      SET total_service_price = (SELECT COALESCE(SUM(total_service_price), 0) FROM booking_services WHERE booking_id = $1),
          updated_at = NOW()
      WHERE id = $1
    `,
      [id]
    );

    res.success(
      { ...result, fee: feeAmount, hours: diffHours },
      "Đã tính toán và cập nhật phí checkout muộn"
    );
  } catch (err) {
    console.error("calculateLateFee error:", err);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "bookings",
      "receipts"
    );
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

export const uploadReceiptMiddleware = multer({ storage });

export const uploadReceipt = async (req, res) => {
  if (!req.file) {
    return res.error("Không có file được tải lên", null, 400);
  }
  const filename = req.file.filename;
  const imageUrl = `/uploads/bookings/receipts/${filename}`;
  res.success({ url: imageUrl }, "Tải ảnh lên thành công", 201);
};
