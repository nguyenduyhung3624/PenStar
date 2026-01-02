import nodemailer from "nodemailer";
import { bookingConfirmationTemplate } from "../email_templates/bookingConfirmationTemplate.js";
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

export default transporter;
