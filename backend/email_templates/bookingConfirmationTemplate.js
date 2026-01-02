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
      <div style="background: #ffffff; border-radius: 16px; padding: 24px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <!-- Room Header -->
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 14px; text-align: center; line-height: 56px; margin-right: 16px;">
            <span style="font-size: 24px;">🛏️</span>
          </div>
          <div>
            <div style="font-weight: 700; font-size: 18px; color: #1e293b;">${
              i.room_type_name || i.room_name || `Phòng ${idx + 1}`
            }</div>
            <div style="color: #64748b; font-size: 14px;">${
              i.room_name ? `Phòng số: ${i.room_name}` : ""
            }</div>
          </div>
        </div>
        
        <!-- Check-in/out Cards -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
          <tr>
            <td width="48%" style="padding-right: 8px;">
              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 16px; border-radius: 12px;">
                <div style="font-size: 12px; color: #059669; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">📅 NHẬN PHÒNG</div>
                <div style="font-size: 15px; color: #065f46; font-weight: 600;">${formatDate(
                  i.check_in
                )}</div>
                <div style="font-size: 13px; color: #047857; margin-top: 4px;">Từ 14:00</div>
              </div>
            </td>
            <td width="48%" style="padding-left: 8px;">
              <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 16px; border-radius: 12px;">
                <div style="font-size: 12px; color: #dc2626; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">📅 TRẢ PHÒNG</div>
                <div style="font-size: 15px; color: #991b1b; font-weight: 600;">${formatDate(
                  i.check_out
                )}</div>
                <div style="font-size: 13px; color: #b91c1c; margin-top: 4px;">Trước 14:00</div>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Guests & Price -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 2px dashed #e2e8f0;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 18px; margin-right: 8px;">👥</span>
            <span style="color: #475569; font-size: 14px;">${
              i.num_adults || 0
            } người lớn${
        i.num_children ? `, ${i.num_children} trẻ em` : ""
      }</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 700; color: #1e293b;">${formatPrice(
              i.room_type_price || i.base_price
            )} ₫</div>
            ${
              i.extra_adult_fees
                ? `<div style="font-size: 12px; color: #f59e0b; margin-top: 2px;">+ Phụ thu NL: ${formatPrice(
                    i.extra_adult_fees
                  )} ₫</div>`
                : ""
            }
            ${
              i.extra_child_fees
                ? `<div style="font-size: 12px; color: #f59e0b;">+ Phụ thu TE: ${formatPrice(
                    i.extra_child_fees
                  )} ₫</div>`
                : ""
            }
          </div>
        </div>
      </div>`
    )
    .join("");

  const servicesHtml =
    (booking.services || []).length > 0
      ? `
      <div style="margin-top: 24px;">
        <div style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">🛎️ DỊCH VỤ BỔ SUNG</div>
        <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          ${(booking.services || [])
            .map(
              (s, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; ${
              idx > 0 ? "border-top: 1px solid #f1f5f9;" : ""
            }">
              <div>
                <span style="color: #1e293b; font-weight: 500;">${
                  s.service_name || `Dịch vụ #${s.service_id}`
                }</span>
                <span style="color: #94a3b8; font-size: 13px;"> × ${
                  s.quantity
                }</span>
              </div>
              <div style="font-weight: 600; color: #1e293b;">${formatPrice(
                s.total_service_price
              )} ₫</div>
            </div>`
            )
            .join("")}
        </div>
      </div>`
      : "";

  const discountHtml = booking.discount_amount
    ? `
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="color: #22c55e; font-weight: 500;">🎁 Giảm giá ${
          booking.promo_code ? `(${booking.promo_code})` : ""
        }</span>
        <span style="font-weight: 600; color: #22c55e;">-${formatPrice(
          booking.discount_amount
        )} ₫</span>
      </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đặt phòng - PenStar Hotel</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); border-radius: 24px 24px 0 0;">
          <tr>
            <td style="padding: 48px 32px; text-align: center;">
              <!-- Logo Circle -->
              <div style="width: 88px; height: 88px; background: rgba(255,255,255,0.2); border-radius: 22px; margin: 0 auto 24px; line-height: 88px;">
                <span style="font-size: 44px;">🏨</span>
              </div>
              
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">PenStar Hotel</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">Luxury • Comfort • Excellence</p>
              
              <!-- Booking Badge -->
              <div style="display: inline-block; background: rgba(255,255,255,0.25); padding: 10px 28px; border-radius: 50px; margin-top: 28px;">
                <span style="color: #ffffff; font-size: 15px; font-weight: 600;">🎫 Mã đặt phòng: #${
                  booking.id
                }</span>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Main Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 32px;">
              
              <!-- Success Banner -->
              <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 20px; padding: 28px; margin-bottom: 28px; text-align: center;">
                <div style="font-size: 40px; margin-bottom: 12px;">✅</div>
                <div style="font-size: 22px; font-weight: 700; color: #166534;">Đặt phòng thành công!</div>
                <div style="font-size: 15px; color: #15803d; margin-top: 6px;">Cảm ơn bạn đã tin tưởng PenStar Hotel</div>
              </div>
              
              <!-- Customer Card -->
              <div style="background: #ffffff; border-radius: 20px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                  <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 12px; text-align: center; line-height: 48px; margin-right: 14px;">
                    <span style="font-size: 22px;">👤</span>
                  </div>
                  <div>
                    <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Thông tin khách hàng</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1e293b;">${
                      booking.customer_name || "Quý khách"
                    }</div>
                  </div>
                </div>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="48%" style="padding-right: 8px;">
                      <div style="background: #f8fafc; padding: 14px; border-radius: 12px;">
                        <div style="font-size: 11px; color: #94a3b8; font-weight: 600; margin-bottom: 4px;">📧 EMAIL</div>
                        <div style="font-size: 14px; color: #1e293b; word-break: break-all;">${
                          booking.email || "Không có"
                        }</div>
                      </div>
                    </td>
                    <td width="48%" style="padding-left: 8px;">
                      <div style="background: #f8fafc; padding: 14px; border-radius: 12px;">
                        <div style="font-size: 11px; color: #94a3b8; font-weight: 600; margin-bottom: 4px;">📱 ĐIỆN THOẠI</div>
                        <div style="font-size: 14px; color: #1e293b;">${
                          booking.phone || "Không có"
                        }</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Rooms Section -->
              <div style="margin-bottom: 8px;">
                <div style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px;">🛏️ CHI TIẾT PHÒNG</div>
                ${itemsHtml}
              </div>
              
              ${servicesHtml}
              
              <!-- Price Summary -->
              <div style="background: #ffffff; border-radius: 20px; padding: 24px; margin-top: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <div style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px;">💰 TỔNG THANH TOÁN</div>
                
                ${discountHtml}
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; margin-top: 8px; border-top: 2px solid #e2e8f0;">
                  <span style="font-size: 20px; font-weight: 800; color: #1e293b;">Tổng cộng</span>
                  <span style="font-size: 28px; font-weight: 800; color: #7c3aed;">${formatPrice(
                    booking.total_price
                  )} ₫</span>
                </div>
                
                <!-- Payment Status -->
                <div style="margin-top: 20px; text-align: center;">
                  <span style="display: inline-block; padding: 12px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; ${
                    booking.payment_status === "paid"
                      ? "background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff;"
                      : "background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #ffffff;"
                  }">
                    ${
                      booking.payment_status === "paid"
                        ? "✓ ĐÃ THANH TOÁN"
                        : "⏳ CHỜ THANH TOÁN"
                    }
                  </span>
                </div>
              </div>
              
              <!-- Important Notes -->
              <div style="background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%); border-radius: 20px; padding: 24px; margin-top: 28px;">
                <div style="display: flex; align-items: center; margin-bottom: 14px;">
                  <span style="font-size: 24px; margin-right: 10px;">📌</span>
                  <span style="font-size: 16px; font-weight: 700; color: #854d0e;">Lưu ý quan trọng</span>
                </div>
                <ul style="margin: 0; padding-left: 24px; color: #713f12; font-size: 14px; line-height: 2;">
                  <li>Nhận phòng từ <strong>14:00</strong> ngày check-in</li>
                  <li>Trả phòng trước <strong>14:00</strong> ngày check-out</li>
                  <li>Vui lòng mang theo <strong>CCCD/CMND</strong> khi nhận phòng</li>
                  <li>Liên hệ lễ tân: <strong>1900-xxxx</strong></li>
                </ul>
              </div>
              
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 0 0 24px 24px;">
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              <div style="margin-bottom: 20px;">
                <span style="font-size: 32px;">🏨</span>
              </div>
              <div style="color: #ffffff; font-size: 20px; font-weight: 700; margin-bottom: 6px;">PenStar Hotel</div>
              <div style="color: #94a3b8; font-size: 14px;">Luxury • Comfort • Excellence</div>
              
              <div style="border-top: 1px solid #334155; margin-top: 24px; padding-top: 24px;">
                <div style="color: #94a3b8; font-size: 13px; line-height: 2;">
                  📍 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh<br/>
                  📞 Hotline: 1900-xxxx | ✉️ support@penstar.vn
                </div>
              </div>
              
              <!-- Social Icons -->
              <div style="margin-top: 24px;">
                <a href="#" style="display: inline-block; width: 40px; height: 40px; background: #334155; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px;">
                  <span style="font-size: 18px;">📘</span>
                </a>
                <a href="#" style="display: inline-block; width: 40px; height: 40px; background: #334155; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px;">
                  <span style="font-size: 18px;">📸</span>
                </a>
                <a href="#" style="display: inline-block; width: 40px; height: 40px; background: #334155; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px;">
                  <span style="font-size: 18px;">🐦</span>
                </a>
              </div>
              
              <div style="color: #64748b; font-size: 12px; margin-top: 24px;">
                © 2026 PenStar Hotel. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export default bookingConfirmationTemplate;
