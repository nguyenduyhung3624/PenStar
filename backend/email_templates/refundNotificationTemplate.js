const REFUND_STATUS_CONFIG = {
  pending: {
    name: "Chờ xử lý",
    color: "#f59e0b",
    icon: "⏳",
    message: "Yêu cầu hoàn tiền của bạn đang được xử lý.",
  },
  approved: {
    name: "Đã duyệt",
    color: "#2563eb",
    icon: "✅",
    message:
      "Yêu cầu hoàn tiền của bạn đã được duyệt. Chúng tôi sẽ chuyển tiền trong thời gian sớm nhất.",
  },
  completed: {
    name: "Hoàn tất",
    color: "#16a34a",
    icon: "💰",
    message: "Tiền đã được chuyển vào tài khoản của bạn. Vui lòng kiểm tra.",
  },
  rejected: {
    name: "Từ chối",
    color: "#dc2626",
    icon: "❌",
    message: "Yêu cầu hoàn tiền của bạn đã bị từ chối.",
  },
};
export const refundNotificationTemplate = (refundRequest, booking = {}) => {
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(Number(price) || 0));
  const statusConfig =
    REFUND_STATUS_CONFIG[refundRequest.status] || REFUND_STATUS_CONFIG.pending;
  const receiptSection =
    refundRequest.status === "completed" && refundRequest.receipt_image
      ? `
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-weight: bold; color: #166534; margin-bottom: 8px;">🧾 Biên lai chuyển khoản</div>
        <p style="color: #15803d; font-size: 13px; margin: 0 0 12px 0;">
          Vui lòng kiểm tra tài khoản ngân hàng của bạn.
        </p>
        <img src="${process.env.BACKEND_URL || "http://localhost:5001"}${
          refundRequest.receipt_image
        }"
             alt="Biên lai chuyển khoản"
             style="max-width: 100%; border-radius: 4px; border: 1px solid #ddd;">
      </div>
    `
      : "";
  const adminNotesSection = refundRequest.admin_notes
    ? `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-weight: bold; color: #92400e; margin-bottom: 8px;">📝 Ghi chú từ Admin</div>
        <div style="color: #78350f; font-size: 13px;">${refundRequest.admin_notes}</div>
      </div>
    `
    : "";
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo hoàn tiền - PenStar Hotel</title>
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
      statusConfig.color
    }; padding: 20px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 10px;">${
        statusConfig.icon
      }</div>
      <div style="font-size: 18px; font-weight: bold; color: #fff;">Hoàn tiền: ${
        statusConfig.name
      }</div>
    </div>
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
        Kính gửi <strong>${
          refundRequest.user_name || booking.customer_name || "Quý khách"
        }</strong>,
      </p>
      <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
        ${statusConfig.message}
      </p>
      <!-- Refund Details Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="font-weight: bold; color: #1e293b; margin-bottom: 12px; font-size: 14px;">💳 Chi tiết hoàn tiền</div>
        <table width="100%" style="font-size: 14px; color: #475569;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Mã yêu cầu:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">#${
              refundRequest.id
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Mã đặt phòng:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">#${
              refundRequest.booking_id || booking.id || "—"
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Số tiền hoàn:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #16a34a;">${formatPrice(
              refundRequest.amount
            )} ₫</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Ngân hàng:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${
              refundRequest.bank_name
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Số tài khoản:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${
              refundRequest.account_number
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Chủ tài khoản:</td>
            <td style="padding: 8px 0; text-align: right;">${
              refundRequest.account_holder
            }</td>
          </tr>
        </table>
      </div>
      ${receiptSection}
      ${adminNotesSection}
      <!-- Contact Info -->
      <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-weight: bold; color: #1e40af; margin-bottom: 8px;">📞 Cần hỗ trợ?</div>
        <div style="color: #1d4ed8; font-size: 13px;">
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
export default refundNotificationTemplate;
