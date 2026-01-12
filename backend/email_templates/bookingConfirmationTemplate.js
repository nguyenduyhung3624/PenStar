export const bookingConfirmationTemplate = (booking) => {
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(Math.round(price || 0));

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const options = {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
    return date.toLocaleDateString("vi-VN", options);
  };

  const itemsHtml = (booking.items || [])
    .map(
      (i, idx) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #ddd; font-size: 13px;">
          <div style="font-weight: 600; color: #000; margin-bottom: 4px;">
            ${i.room_name ? `${i.room_name} - ` : ""}${
        i.room_type_name || `Phòng ${idx + 1}`
      }
          </div>
          <div style="color: #666; font-size: 12px;">
            ${formatDate(i.check_in)} - ${formatDate(i.check_out)}
          </div>
          <div style="color: #666; font-size: 12px; margin-top: 2px;">
            👥 ${i.num_adults || 0} người lớn${
        i.num_children ? `, ${i.num_children} trẻ em` : ""
      }
          </div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #ddd; text-align: right; font-weight: 600; font-size: 13px;">
          ${formatPrice(Number(i.room_type_price || i.base_price))} ₫
        </td>
      </tr>`
    )
    .join("");

  const servicesHtml =
    (booking.services || []).length > 0
      ? `
      <tr>
        <td colspan="2" style="padding-top: 12px; padding-bottom: 12px; font-size: 13px;">
          <strong>Dịch vụ bổ sung</strong>
          ${(booking.services || [])
            .map(
              (s) => `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #666;">
              <span>${s.service_name || `Dịch vụ #${s.service_id}`} × ${
                s.quantity
              }</span>
              <span style="color: #000; font-weight: 600;">+${formatPrice(
                s.total_service_price
              )} ₫</span>
            </div>`
            )
            .join("")}
        </td>
      </tr>`
      : "";

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đặt phòng - ${booking.hotel_name || "PenStar Hotel"}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #333;">

  <div style="max-width: 700px; margin: 0 auto; padding: 40px 30px;">

    <!-- Header with Logo and Contact -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #b8860b; padding-bottom: 20px;">
      <div>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #b8860b; margin-bottom: 5px;">PS</div>
        <div style="font-size: 12px; letter-spacing: 2px; color: #333;">PENSTAR HOTEL</div>
      </div>
      <div style="text-align: right; font-size: 12px; color: #333; line-height: 1.8;">
        <div>Ho Chi Minh, Vietnam</div>
        <div>info@penstar.vn</div>
        <div>1900-xxxx</div>
        <div>www.penstar.vn</div>
      </div>
    </div>

    <!-- Title -->
    <h1 style="font-size: 22px; font-weight: bold; text-align: center; margin: 30px 0 10px 0; color: #000;">Xác Nhận Đặt Phòng</h1>

    <!-- Date and Subject -->
    <div style="font-size: 12px; color: #666; margin-bottom: 30px; text-align: center;">
      <div style="margin-bottom: 8px;">${new Date().toLocaleDateString(
        "vi-VN"
      )}</div>
      <div style="font-weight: bold;">Chủ đề: Xác nhận đặt phòng tại PenStar Hotel</div>
    </div>

    <!-- Greeting -->
    <p style="font-size: 13px; margin-bottom: 20px; color: #333;">
      <strong>Kính gửi ${booking.customer_name || "Quý khách"},</strong><br/>
      Cảm ơn bạn đã lựa chọn PenStar Hotel. Chúng tôi rất vui được đón tiếp bạn. Dưới đây là chi tiết đặt phòng của bạn.
    </p>

    <!-- Reservation Details Section -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 12px 0; color: #000;">Chi Tiết Đặt Phòng</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; width: 160px; color: #666;"><strong>Mã đặt phòng:</strong></td>
          <td style="padding: 6px 0; color: #000;">#${booking.id}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;"><strong>Ngày nhận phòng:</strong></td>
          <td style="padding: 6px 0; color: #000;">${
            booking.items && booking.items[0]
              ? formatDate(booking.items[0].check_in)
              : "—"
          }</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;"><strong>Ngày trả phòng:</strong></td>
          <td style="padding: 6px 0; color: #000;">${
            booking.items && booking.items[0]
              ? formatDate(booking.items[0].check_out)
              : "—"
          }</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;"><strong>Loại phòng:</strong></td>
          <td style="padding: 6px 0; color: #000;">${
            booking.items && booking.items[0]
              ? booking.items[0].room_type_name || "Deluxe Room"
              : "—"
          }</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;"><strong>Số khách:</strong></td>
          <td style="padding: 6px 0; color: #000;">${
            booking.items && booking.items[0]
              ? `${booking.items[0].num_adults || 0} người lớn${
                  booking.items[0].num_children
                    ? `, ${booking.items[0].num_children} trẻ em`
                    : ""
                }`
              : "—"
          }</td>
        </tr>
      </table>
    </div>

    <!-- Guest Information -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 12px 0; color: #000;">Thông Tin Khách Hàng</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; width: 160px; color: #666;"><strong>Tên:</strong></td>
          <td style="padding: 6px 0; color: #000;">${
            booking.customer_name || "—"
          }</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;"><strong>Email:</strong></td>
          <td style="padding: 6px 0; color: #000;">${booking.email || "—"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;"><strong>Điện thoại:</strong></td>
          <td style="padding: 6px 0; color: #000;">${booking.phone || "—"}</td>
        </tr>
      </table>
    </div>

    <!-- Room Charges -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 12px 0; color: #000;">Chi Phí Phòng</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; border-collapse: collapse;">
        ${itemsHtml}
        ${servicesHtml}
        <tr style="border-top: 2px solid #000;">
          <td style="padding: 10px 0; font-weight: bold;">Tổng giá phòng:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold;">
            ${formatPrice(
              (booking.items || []).reduce(
                (sum, i) => sum + (Number(i.room_type_price) || 0),
                0
              )
            )} ₫
          </td>
        </tr>
        ${
          (booking.services || []).length > 0
            ? `
        <tr>
          <td style="padding: 6px 0;">Dịch vụ bổ sung:</td>
          <td style="padding: 6px 0; text-align: right;">
            +${formatPrice(
              (booking.services || []).reduce(
                (sum, s) => sum + (s.total_service_price || 0),
                0
              )
            )} ₫
          </td>
        </tr>
        `
            : ""
        }
        ${
          booking.discount_amount
            ? `
        <tr>
          <td style="padding: 6px 0;">Giảm giá ${
            booking.promo_code ? `(${booking.promo_code})` : ""
          }:</td>
          <td style="padding: 6px 0; text-align: right;">
            -${formatPrice(booking.discount_amount)} ₫
          </td>
        </tr>
        `
            : ""
        }
        <tr style="border-top: 2px solid #000; font-weight: bold; font-size: 14px;">
          <td style="padding: 10px 0;">TỔNG CỘNG</td>
          <td style="padding: 10px 0; text-align: right;">
            ${formatPrice(booking.total_price)} ₫
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #666; margin-top: 12px; margin-bottom: 0;">
        <strong>Trạng thái thanh toán:</strong> ${
          booking.payment_status === "paid"
            ? "✓ ĐÃ THANH TOÁN"
            : "⏳ CHỜ THANH TOÁN"
        }
      </p>
    </div>

    <!-- Check-in Information -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 12px 0; color: #000;">Thông Tin Nhận Phòng</h2>
      <p style="font-size: 13px; color: #333; line-height: 1.8; margin: 0;">
        Thời gian nhận phòng: <strong>14:00</strong>. Nếu bạn muốn nhận phòng sớm hơn, vui lòng liên hệ với chúng tôi. Lễ tân của chúng tôi mở cửa 24/24, vì vậy bạn có thể nhận phòng bất kỳ lúc nào.
      </p>
    </div>

    <!-- Important Notes -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 12px 0; color: #000;">Lưu Ý Quan Trọng</h2>
      <ul style="font-size: 13px; margin: 0; padding: 0 0 0 20px; color: #333; line-height: 1.8;">
        <li>Trả phòng trước <strong>14:00</strong></li>
        <li>Vui lòng mang theo <strong>CCCD/CMND</strong> khi nhận phòng</li>
        <li>WiFi miễn phí có sẵn trong toàn bộ khách sạn</li>
        <li>Liên hệ lễ tân: <strong>1900-xxxx</strong></li>
      </ul>
    </div>

    <!-- Amenities -->
    <div style="margin-bottom: 40px;">
      <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 12px 0; color: #000;">Tiện Ích Khách Sạn</h2>
      <p style="font-size: 13px; color: #333; margin: 0 0 10px 0;">
        Chúng tôi cung cấp các tiện ích sau để nâng cao trải nghiệm của bạn:
      </p>
      <ul style="font-size: 13px; margin: 0; padding: 0 0 0 20px; color: #333; line-height: 1.8;">
        <li><strong>WiFi miễn phí:</strong> Có sẵn trong toàn bộ khách sạn</li>
        <li><strong>Phòng tập gym:</strong> Mở cửa 24/7</li>
        <li><strong>Trung tâm kinh doanh:</strong> Có máy tính và máy in</li>
      </ul>
    </div>

    <!-- Closing -->
    <p style="font-size: 13px; color: #333; margin-bottom: 20px;">
      Chúng tôi chờ đợi sự đến của bạn và sẽ đảm bảo một kỳ nghỉ tuyệt vời. Nếu có bất kỳ câu hỏi hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi.
    </p>

    <p style="font-size: 13px; color: #333; margin-bottom: 30px;">
      Trân trọng,<br/>
      <strong>Đội ngũ PenStar Hotel</strong>
    </p>

    <!-- Footer -->
    <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 11px; color: #999; text-align: center;">
      <p style="margin: 0 0 5px 0;">PenStar Hotel | Luxury • Comfort • Excellence</p>
      <p style="margin: 0;">© 2026 PenStar Hotel. All rights reserved.</p>
    </div>

  </div>

</body>
</html>`;
};

export default bookingConfirmationTemplate;
