/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Hàm sinh HTML hóa đơn in bill cho booking
export function generateBillHTML(
  booking: any,
  rooms: any[],
  services: any[],
  incidents: any[],
  formatDate: (d: any) => string,
  formatPrice: (p: any) => string
) {
  const groupedServices = booking.services?.reduce((acc: any[], curr: any) => {
    const existing = acc.find(
      (s) =>
        s.service_id === curr.service_id &&
        s.booking_item_id === curr.booking_item_id
    );
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (curr.quantity || 1);
      existing.total_service_price =
        (Number(existing.total_service_price) || 0) +
        (Number(curr.total_service_price) || 0);
    } else {
      acc.push({
        ...curr,
        quantity: curr.quantity || 1,
        total_service_price: Number(curr.total_service_price) || 0,
      });
    }
    return acc;
  }, []);

  let html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Hóa đơn #${booking.id}</title>
        <style>
          @media print { @page { margin: 1cm; } }
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #1890ff; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1890ff; margin: 0; font-size: 28px; }
          .header p { margin: 5px 0; color: #666; }
          .info-section { margin-bottom: 30px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-label { font-weight: bold; color: #666; }
          .info-value { color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          th { background-color: #f5f5f5; font-weight: bold; color: #333; }
          .text-right { text-align: right; }
          .total-section { margin-top: 30px; padding-top: 20px; border-top: 2px solid #1890ff; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; }
          .total-final { font-size: 20px; font-weight: bold; color: #ff4d4f; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PENSTAR HOTEL</h1>
          <p>Hóa đơn thanh toán</p>
          <p>Mã đơn: #${booking.id}</p>
        </div>
        <div class="info-section">
          <div class="info-row"><span class="info-label">Khách hàng:</span><span class="info-value">${booking.customer_name || "—"}</span></div>
          <div class="info-row"><span class="info-label">Ngày tạo:</span><span class="info-value">${booking.created_at ? formatDate(booking.created_at) : "—"}</span></div>
`;
  if (booking.items && booking.items.length > 0) {
    html += `<div class="info-row"><span class="info-label">Ngày nhận phòng:</span><span class="info-value">${formatDate(booking.items[0].check_in)}</span></div><div class="info-row"><span class="info-label">Ngày trả phòng:</span><span class="info-value">${formatDate(booking.items[0].check_out)}</span></div>`;
  }
  html += `<div class="info-row"><span class="info-label">Phương thức thanh toán:</span><span class="info-value">${booking.payment_method?.toUpperCase() || "—"}</span></div>
          <div class="info-row"><span class="info-label">Trạng thái:</span><span class="info-value">${booking.payment_status?.toUpperCase() || "—"}</span></div>
        </div>`;
  html += `<table><thead><tr><th>STT</th><th>Phòng</th><th class="text-right">Giá</th></tr></thead><tbody>`;
  html +=
    booking.items
      ?.map((item: any, idx: number) => {
        const room = rooms.find((r) => r.id === item.room_id);
        return `<tr><td>${idx + 1}</td><td>${room?.name || `Phòng ${item.room_id}`}</td><td class="text-right">${formatPrice(item.room_type_price || 0)}</td></tr>`;
      })
      .join("") || "";
  html += `</tbody></table>`;
  // Hiển thị dịch vụ theo từng phòng
  if (groupedServices && groupedServices.length > 0) {
    // Lấy danh sách phòng có dịch vụ
    const serviceRooms = Array.from(
      new Set(groupedServices.map((s: any) => s.booking_item_id))
    );
    html += `<h3 style="margin-top:32px; color:#1890ff;">Dịch vụ bổ sung</h3>`;
    serviceRooms.forEach((booking_item_id: any, ridx: number) => {
      const roomItem = booking.items?.find(
        (it: any) => it.id === booking_item_id
      );
      const roomName =
        rooms.find((r) => r.id === roomItem?.room_id)?.name ||
        `Phòng ${roomItem?.room_id}`;
      html += `<div style="margin:8px 0 4px 0;font-weight:bold;">${roomName}</div>`;
      html += `<table><thead><tr><th>STT</th><th>Dịch vụ</th><th class="text-right">Số lượng</th><th class="text-right">Thành tiền</th></tr></thead><tbody>`;
      groupedServices
        .filter((s: any) => s.booking_item_id === booking_item_id)
        .forEach((service: any, idx: number) => {
          const serviceInfo = services.find((s) => s.id === service.service_id);
          html += `<tr><td>${idx + 1}</td><td>${serviceInfo?.name || `Dịch vụ #${service.service_id}`}</td><td class="text-right">${service.quantity || 1}</td><td class="text-right">${formatPrice(service.total_service_price || 0)}</td></tr>`;
        });
      html += `</tbody></table>`;
    });
    // Dịch vụ không gán phòng
    const generalServices = groupedServices.filter(
      (s: any) => !s.booking_item_id
    );
    if (generalServices.length > 0) {
      html += `<div style="margin:8px 0 4px 0;font-weight:bold;">Dịch vụ chung</div>`;
      html += `<table><thead><tr><th>STT</th><th>Dịch vụ</th><th class="text-right">Số lượng</th><th class="text-right">Thành tiền</th></tr></thead><tbody>`;
      generalServices.forEach((service: any, idx: number) => {
        const serviceInfo = services.find((s) => s.id === service.service_id);
        html += `<tr><td>${idx + 1}</td><td>${serviceInfo?.name || `Dịch vụ #${service.service_id}`}</td><td class="text-right">${service.quantity || 1}</td><td class="text-right">${formatPrice(service.total_service_price || 0)}</td></tr>`;
      });
      html += `</tbody></table>`;
    }
  }
  // Bảng thiết bị đền bù: phân theo từng phòng
  if (Array.isArray(incidents) && incidents.length > 0) {
    const incidentRooms = Array.from(
      new Set(incidents.map((i: any) => i.room_id))
    );
    html += `<h3 style="margin-top:32px; color:#d4380d;">Thiết bị hỏng/đền bù</h3>`;
    incidentRooms.forEach((room_id: any) => {
      const roomName =
        rooms.find((r) => r.id === room_id)?.name || `Phòng ${room_id}`;
      html += `<div style="margin:8px 0 4px 0;font-weight:bold;">${roomName}</div>`;
      html += `<table><thead><tr><th>STT</th><th>Thiết bị</th><th class="text-right">Số lượng</th><th class="text-right">Đơn giá</th><th class="text-right">Thành tiền</th></tr></thead><tbody>`;
      incidents
        .filter((i: any) => i.room_id === room_id)
        .forEach((inc: any, idx: number) => {
          html += `<tr><td>${idx + 1}</td><td>${inc.equipment_name || `Thiết bị #${inc.equipment_id}`}</td><td class="text-right">${inc.quantity}</td><td class="text-right">${formatPrice(inc.compensation_price || 0)}</td><td class="text-right">${formatPrice(inc.amount || 0)}</td></tr>`;
        });
      html += `</tbody></table>`;
    });
  }
  html += `<div class="total-section">
          <div class="total-row"><span>Tiền phòng:</span><span>${formatPrice(booking.total_room_price || 0)}</span></div>`;
  if (booking.total_service_price) {
    html += `<div class="total-row"><span>Dịch vụ bổ sung:</span><span>${formatPrice(booking.total_service_price)}</span></div>`;
  }
  // Đền bù thiết bị
  if (Array.isArray(incidents) && incidents.length > 0) {
    const totalComp = incidents.reduce(
      (sum, i) => sum + (Number(i.amount) || 0),
      0
    );
    html += `<div class="total-row"><span>Đền bù thiết bị:</span><span>${formatPrice(totalComp)}</span></div>`;
  }
  html += `<div class="total-row total-final"><span>TỔNG CỘNG:</span><span>${formatPrice(booking.total_price || 0)}</span></div>
        </div>
        <div class="footer"><p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p><p>PenStar Hotel - Hotline: 1900-xxxx</p></div>
      </body>
    </html>`;
  return html;
}
