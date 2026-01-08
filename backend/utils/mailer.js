import nodemailer from "nodemailer";
import { bookingConfirmationTemplate } from "../email_templates/bookingConfirmationTemplate.js";
import { bookingStatusUpdateTemplate } from "../email_templates/bookingStatusUpdateTemplate.js";
import { refundNotificationTemplate } from "../email_templates/refundNotificationTemplate.js";
import { adminCancellationNotificationTemplate } from "../email_templates/adminCancellationTemplate.js";
import pool from "../db.js";

// Read SMTP configuration from env variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "nguyenduyhung3624@gmail.com",
    pass: process.env.SMTP_PASS || "szcg bmqi ptaq npgk",
  },
});

export const sendBookingConfirmationEmail = async (
  to,
  bookingId,
  emailHtml = null
) => {
  if (!to) throw new Error("Missing recipient email");
  // fetch booking with items and services
  const bookingRes = await pool.query(
    "SELECT b.*, ss.name as stay_status_name, u.email, u.phone FROM bookings b LEFT JOIN stay_status ss ON ss.id = b.stay_status_id LEFT JOIN users u ON u.id = b.user_id WHERE b.id = $1",
    [bookingId]
  );
  const booking = bookingRes.rows[0];
  if (!booking || booking.payment_status !== "paid") {
    // Chỉ gửi mail khi đã thanh toán thành công
    return;
  }
  // Lấy đầy đủ thông tin items bao gồm giá, phụ thu, loại phòng
  const itemsRes = await pool.query(
    `SELECT bi.id, bi.check_in, bi.check_out, bi.room_type_price,
            bi.num_adults, bi.num_children, bi.extra_adult_fees, bi.extra_child_fees,
            r.name as room_name, rt.name as room_type_name
     FROM booking_items bi
     JOIN rooms r ON bi.room_id = r.id
     LEFT JOIN room_types rt ON bi.room_type_id = rt.id
     WHERE bi.booking_id = $1`,
    [bookingId]
  );
  // Lấy thông tin dịch vụ kèm tên
  const servicesRes = await pool.query(
    `SELECT bs.*, s.name as service_name
     FROM booking_services bs
     LEFT JOIN services s ON bs.service_id = s.id
     WHERE bs.booking_id = $1`,
    [bookingId]
  );
  booking.items = itemsRes.rows;
  booking.services = servicesRes.rows;

  // Ưu tiên dùng emailHtml từ frontend nếu có, nếu không thì dùng template cũ
  const html = emailHtml || bookingConfirmationTemplate(booking);

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `Xác nhận đặt phòng PenStar #${booking.id}`,
    html,
  });
};

/**
 * Send booking status update email
 * @param {string} to - Recipient email
 * @param {number} bookingId - Booking ID
 * @param {number} newStatusId - New status ID (1=confirmed, 2=checked-in, 3=checked-out, 4=cancelled, 5=no-show, 6=pending)
 */
export const sendBookingStatusEmail = async (to, bookingId, newStatusId) => {
  if (!to) {
    console.warn("[sendBookingStatusEmail] No recipient email provided");
    return;
  }

  try {
    // Fetch booking with items
    const bookingRes = await pool.query(
      `SELECT b.*, ss.name as stay_status_name, u.email, u.phone
       FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.id = $1`,
      [bookingId]
    );
    const booking = bookingRes.rows[0];
    if (!booking) {
      console.warn(`[sendBookingStatusEmail] Booking #${bookingId} not found`);
      return;
    }

    // Fetch booking items
    const itemsRes = await pool.query(
      `SELECT bi.id, bi.check_in, bi.check_out, bi.room_type_price,
              bi.num_adults, bi.num_children, r.name as room_name, rt.name as room_type_name
       FROM booking_items bi
       JOIN rooms r ON bi.room_id = r.id
       LEFT JOIN room_types rt ON bi.room_type_id = rt.id
       WHERE bi.booking_id = $1`,
      [bookingId]
    );
    booking.items = itemsRes.rows;

    const statusNames = {
      1: "Đã xác nhận",
      2: "Check-in",
      3: "Check-out",
      4: "Đã hủy",
      5: "Không đến",
      6: "Chờ xác nhận",
    };

    const html = bookingStatusUpdateTemplate(booking, newStatusId);

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `[PenStar] Cập nhật đặt phòng #${bookingId} - ${
        statusNames[newStatusId] || "Thay đổi trạng thái"
      }`,
      html,
    });

    console.log(
      `[sendBookingStatusEmail] Sent to ${to} for booking #${bookingId}, status: ${newStatusId}`
    );
  } catch (error) {
    console.error("[sendBookingStatusEmail] Error:", error.message);
  }
};

/**
 * Send refund notification email
 * @param {string} to - Recipient email
 * @param {object} refundRequest - Refund request object
 */
export const sendRefundNotificationEmail = async (to, refundRequest) => {
  if (!to) {
    console.warn("[sendRefundNotificationEmail] No recipient email provided");
    return;
  }

  try {
    // Fetch booking info if booking_id exists
    let booking = {};
    if (refundRequest.booking_id) {
      const bookingRes = await pool.query(
        "SELECT * FROM bookings WHERE id = $1",
        [refundRequest.booking_id]
      );
      booking = bookingRes.rows[0] || {};
    }

    const statusLabels = {
      pending: "Chờ xử lý",
      approved: "Đã duyệt",
      completed: "Hoàn tất",
      rejected: "Từ chối",
    };

    const html = refundNotificationTemplate(refundRequest, booking);

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: `[PenStar] Hoàn tiền #${refundRequest.id} - ${
        statusLabels[refundRequest.status] || "Cập nhật"
      }`,
      html,
    });

    console.log(
      `[sendRefundNotificationEmail] Sent to ${to} for refund #${refundRequest.id}, status: ${refundRequest.status}`
    );
  } catch (error) {
    console.error("[sendRefundNotificationEmail] Error:", error.message);
  }
};

/**
 * Send admin notification email when user cancels booking
 * @param {number} bookingId - Booking ID
 */
export const sendAdminCancellationEmail = async (bookingId) => {
  try {
    // Get admin emails (role_id >= 2 = staff, admin, manager)
    const adminRes = await pool.query(
      "SELECT email FROM users WHERE role_id >= 2 AND status = 'active' LIMIT 5"
    );
    const adminEmails = adminRes.rows.map((r) => r.email).filter(Boolean);

    if (adminEmails.length === 0) {
      console.warn("[sendAdminCancellationEmail] No admin emails found");
      return;
    }

    // Get booking details
    const bookingRes = await pool.query(
      `SELECT b.*, u.email, u.phone
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [bookingId]
    );
    const booking = bookingRes.rows[0];
    if (!booking) {
      console.warn(
        `[sendAdminCancellationEmail] Booking #${bookingId} not found`
      );
      return;
    }

    // Get booking items
    const itemsRes = await pool.query(
      `SELECT bi.check_in, bi.check_out, bi.room_type_price, r.name as room_name, rt.name as room_type_name
       FROM booking_items bi
       JOIN rooms r ON bi.room_id = r.id
       LEFT JOIN room_types rt ON bi.room_type_id = rt.id
       WHERE bi.booking_id = $1`,
      [bookingId]
    );
    booking.items = itemsRes.rows;

    const html = adminCancellationNotificationTemplate(booking);

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: adminEmails.join(", "),
      subject: `[⚠️ HỦY PHÒNG] Booking #${bookingId} - ${booking.customer_name}`,
      html,
    });

    console.log(
      `[sendAdminCancellationEmail] Sent to ${adminEmails.length} admins for booking #${bookingId}`
    );
  } catch (error) {
    console.error("[sendAdminCancellationEmail] Error:", error.message);
  }
};

export default transporter;
