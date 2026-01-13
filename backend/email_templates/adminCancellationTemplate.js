export const adminCancellationNotificationTemplate = (
  booking,
  refundRequest = null
) => {
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(price || 0));
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const refundSection = refundRequest
    ? `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-weight: bold; color: #92400e; margin-bottom: 8px;">💰 Yêu cầu hoàn tiền</div>
        <table width="100%" style="font-size: 13px; color: #78350f;">
          <tr><td>Số tiền:</td><td style="text-align: right; font-weight: 600;">${formatPrice(
            refundRequest.amount
          )} ₫</td></tr>
          <tr><td>Ngân hàng:</td><td style="text-align: right;">${
            refundRequest.bank_name
          }</td></tr>
          <tr><td>STK:</td><td style="text-align: right;">${
            refundRequest.account_number
          }</td></tr>
          <tr><td>Chủ TK:</td><td style="text-align: right;">${
            refundRequest.account_holder
          }</td></tr>
        </table>
      </div>
    `
    : booking.refund_amount > 0
    ? `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-weight: bold; color: #92400e; margin-bottom: 8px;">💰 Số tiền cần hoàn</div>
        <div style="color: #78350f; font-size: 18px; font-weight: 600;">${formatPrice(
          booking.refund_amount
        )} ₫</div>
        <div style="color: #78350f; font-size: 12px; margin-top: 4px;">Khách hàng có thể yêu cầu hoàn tiền từ trang My Bookings</div>
      </div>
    `
    : "";
  const checkIn = booking.items?.[0]?.check_in || booking.check_in;
  const checkOut = booking.items?.[0]?.check_out || booking.check_out;
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo hủy phòng - PenStar Admin</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 0;">
    <!-- Header -->
    <div style="background: #dc2626; padding: 20px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; color: #fff;">⚠️ THÔNG BÁO HỦY PHÒNG</div>
    </div>
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
        Khách hàng <strong>${booking.customer_name}</strong> vừa hủy đặt phòng.
      </p>
      <!-- Booking Details Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="font-weight: bold; color: #1e293b; margin-bottom: 12px; font-size: 14px;">📋 Chi tiết đặt phòng đã hủy</div>
        <table width="100%" style="font-size: 14px; color: #475569;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Mã đặt phòng:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">#${
              booking.id
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Khách hàng:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${
              booking.customer_name
            }</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Email:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${
              booking.email || "—"
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
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Tổng tiền:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatPrice(
              booking.total_price
            )} ₫</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Lý do hủy:</td>
            <td style="padding: 8px 0; text-align: right; color: #dc2626;">${
              booking.cancel_reason || "Không có"
            }</td>
          </tr>
        </table>
      </div>
      ${refundSection}
      <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-weight: bold; color: #1e40af; margin-bottom: 8px;">👉 Hành động cần làm</div>
        <div style="color: #1d4ed8; font-size: 13px;">
          ${
            refundRequest || booking.refund_amount > 0
              ? "Vui lòng xử lý hoàn tiền cho khách hàng qua trang Admin → Hoàn tiền"
              : "Không cần hoàn tiền theo chính sách."
          }
        </div>
      </div>
      <p style="font-size: 12px; color: #9ca3af; margin: 20px 0 0 0;">
        Email tự động từ hệ thống PenStar Hotel
      </p>
    </div>
  </div>
</body>
</html>`;
};
export default adminCancellationNotificationTemplate;
