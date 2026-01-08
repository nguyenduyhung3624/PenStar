/**
 * Email template for booking status updates
 * Used when booking status changes: confirmed, checked-in, checked-out, cancelled
 */

const STATUS_CONFIG = {
  1: {
    name: "Đã xác nhận",
    color: "#2563eb",
    icon: "✅",
    message: "Đặt phòng của bạn đã được xác nhận thành công.",
    actionText: "Vui lòng đến đúng giờ để nhận phòng.",
  },
  2: {
    name: "Đã check-in",
    color: "#16a34a",
    icon: "🏨",
    message: "Chúc mừng! Bạn đã check-in thành công.",
    actionText: "Chúc bạn có kỳ nghỉ tuyệt vời tại PenStar Hotel.",
  },
  3: {
    name: "Đã check-out",
    color: "#0891b2",
    icon: "👋",
    message: "Cảm ơn bạn đã lưu trú tại PenStar Hotel.",
    actionText: "Hy vọng sớm được đón tiếp bạn lần nữa!",
  },
  4: {
    name: "Đã hủy",
    color: "#dc2626",
    icon: "❌",
    message: "Đặt phòng của bạn đã bị hủy.",
    actionText: "Nếu có thắc mắc, vui lòng liên hệ với chúng tôi.",
  },
  5: {
    name: "Không đến",
    color: "#9333ea",
    icon: "⚠️",
    message: "Đặt phòng được đánh dấu là không đến (No-show).",
    actionText: "Vui lòng liên hệ nếu có sự nhầm lẫn.",
  },
  6: {
    name: "Chờ xác nhận",
    color: "#f59e0b",
    icon: "⏳",
    message: "Đặt phòng của bạn đang chờ xác nhận.",
    actionText: "Chúng tôi sẽ xác nhận sớm nhất có thể.",
  },
};

export const bookingStatusUpdateTemplate = (booking, newStatusId) => {
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(price || 0));

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const status = STATUS_CONFIG[newStatusId] || STATUS_CONFIG[6];
  const checkIn = booking.items?.[0]?.check_in;
  const checkOut = booking.items?.[0]?.check_out;

  const refundInfo =
    newStatusId === 4 && booking.refund_amount > 0
      ? `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-weight: bold; color: #92400e; margin-bottom: 8px;">💰 Thông tin hoàn tiền</div>
        <div style="color: #78350f;">Số tiền hoàn: <strong>${formatPrice(
          booking.refund_amount
        )} ₫</strong></div>
        <div style="color: #78350f; font-size: 12px; margin-top: 4px;">Bạn có thể yêu cầu hoàn tiền từ trang "Booking của tôi"</div>
      </div>
    `
      : "";

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cập nhật đặt phòng - PenStar Hotel</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 0;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center;">
      <div style="font-size: 28px; font-weight: bold; color: #b8860b; margin-bottom: 5px;">PENSTAR</div>
      <div style="font-size: 12px; color: #94a3b8; letter-spacing: 2px;">HOTEL & RESORT</div>
    </div>

    <!-- Status Banner -->
    <div style="background: ${
      status.color
    }; padding: 20px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 10px;">${status.icon}</div>
      <div style="font-size: 20px; font-weight: bold; color: #fff;">${
        status.name
      }</div>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">

      <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
        Kính gửi <strong>${booking.customer_name || "Quý khách"}</strong>,
      </p>

      <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
        ${status.message}
      </p>

      <!-- Booking Details Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="font-weight: bold; color: #1e293b; margin-bottom: 12px; font-size: 14px;">📋 Chi tiết đặt phòng</div>

        <table width="100%" style="font-size: 14px; color: #475569;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Mã đặt phòng:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">#${
              booking.id
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Ngày nhận phòng:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatDate(
              checkIn
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Ngày trả phòng:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatDate(
              checkOut
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Tổng tiền:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #b8860b;">${formatPrice(
              booking.total_price
            )} ₫</td>
          </tr>
        </table>
      </div>

      ${refundInfo}

      <p style="font-size: 14px; color: #6b7280; margin: 20px 0;">
        ${status.actionText}
      </p>

      <!-- Contact Info -->
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-weight: bold; color: #166534; margin-bottom: 8px;">📞 Liên hệ hỗ trợ</div>
        <div style="color: #15803d; font-size: 13px;">
          Hotline: <strong>0123 456 789</strong><br>
          Email: <strong>info@penstar.example</strong>
        </div>
      </div>

      <p style="font-size: 14px; color: #374151; margin: 20px 0 0 0;">
        Trân trọng,<br>
        <strong>Đội ngũ PenStar Hotel</strong>
      </p>

    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <div style="font-size: 11px; color: #9ca3af;">
        © 2026 PenStar Hotel. All rights reserved.<br>
        Số 1, Đường Chính, Quận Trung tâm
      </div>
    </div>

  </div>

</body>
</html>`;
};

export default bookingStatusUpdateTemplate;
