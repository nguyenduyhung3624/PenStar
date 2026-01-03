import pool from "../db.js";

export const getStatistics = async (req, res) => {
  try {
    // 1. Nhận ngày bắt đầu và kết thúc từ Client gửi lên
    const { startDate: qStart, endDate: qEnd } = req.query;
    console.log(`--- Lấy thống kê từ ${qStart} đến ${qEnd} ---`);

    let startDate, endDate;

    if (qStart && qEnd) {
      startDate = new Date(qStart);
      endDate = new Date(qEnd);
    } else {
      // Mặc định: Lấy tháng hiện tại nếu không chọn
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Quan trọng: Set giờ để bao trọn vẹn khoảng thời gian
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const params = [startDate, endDate];

    // Helper: Hàm chạy query an toàn
    const safeQuery = async (query, queryParams, defaultValue) => {
      try {
        const result = await pool.query(query, queryParams);
        return result;
      } catch (err) {
        console.error(`[SQL ERROR] ${err.message}`);
        return { rows: defaultValue };
      }
    };

    // --- CÁC QUERY THỐNG KÊ (KPIs) ---

    // 1. Total Users
    const usersRes = await safeQuery(
      `SELECT COUNT(*) as count FROM users`,
      [],
      [{ count: 0 }]
    );
    const totalUsers = parseInt(usersRes.rows[0].count);

    // 2. Total Bookings
    const bookingsRes = await safeQuery(
      `SELECT COUNT(*) as count FROM bookings b WHERE b.created_at >= $1 AND b.created_at <= $2`,
      params,
      [{ count: 0 }]
    );
    const totalBookings = parseInt(bookingsRes.rows[0].count);

    // 3. Total Revenue
    const revenueRes = await safeQuery(
      `SELECT COALESCE(SUM(total_price), 0) as total 
       FROM bookings b
       WHERE b.created_at >= $1 AND b.created_at <= $2
       AND b.payment_status = 'paid'`,
      params,
      [{ total: 0 }]
    );
    const totalRevenue = parseFloat(revenueRes.rows[0].total) || 0;

    // 4. Pending Bookings
    const pendingBookingsRes = await safeQuery(
      `SELECT COUNT(*) as count FROM bookings WHERE stay_status_id = 6`,
      [],
      [{ count: 0 }]
    );
    const pendingBookings = parseInt(pendingBookingsRes.rows[0].count) || 0;

    // 5. Check-in / Check-out
    const checkinsRes = await safeQuery(
      `SELECT COUNT(DISTINCT b.id) as count
       FROM bookings b
       JOIN booking_items bi ON bi.booking_id = b.id
       WHERE bi.check_in >= $1 AND bi.check_in <= $2
       AND b.stay_status_id IN (1, 2)`,
      params,
      [{ count: 0 }]
    );
    const countCheckins = parseInt(checkinsRes.rows[0].count) || 0;

    const checkoutsRes = await safeQuery(
      `SELECT COUNT(DISTINCT b.id) as count
       FROM bookings b
       JOIN booking_items bi ON bi.booking_id = b.id
       WHERE bi.check_out >= $1 AND bi.check_out <= $2
       AND b.stay_status_id IN (2, 3)`,
      params,
      [{ count: 0 }]
    );
    const countCheckouts = parseInt(checkoutsRes.rows[0].count) || 0;

    // --- BIỂU ĐỒ & DANH SÁCH ---

    // 6. Doanh thu theo thời gian (Biểu đồ đường)
    const revenueByTimeRes = await safeQuery(
      `SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_price), 0) as revenue
       FROM bookings
       WHERE payment_status = 'paid'
         AND created_at >= $1 AND created_at <= $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      params,
      []
    );

    // 7. Phương thức thanh toán (Biểu đồ tròn)
    const bookingByPaymentMethodRes = await safeQuery(
      `SELECT 
        COALESCE(payment_method, 'unknown') as payment_method,
        COUNT(*) as count
       FROM bookings b
       WHERE b.created_at >= $1 AND b.created_at <= $2
       GROUP BY COALESCE(payment_method, 'unknown')
       ORDER BY count DESC`,
      params,
      []
    );

    // 8. Booking gần đây
    const recentBookingsRes = await safeQuery(
      `SELECT 
        b.id,
        b.customer_name,
        b.total_price,
        b.created_at,
        b.payment_status,
        ss.name as stay_status_name
       FROM bookings b
       LEFT JOIN stay_status ss ON b.stay_status_id = ss.id
       ORDER BY b.created_at DESC
       LIMIT 10`,
      [],
      []
    );

    // 9. Trạng thái phòng hiện tại
    const roomStatusCountRes = await safeQuery(
      `SELECT 
        SUM(CASE WHEN r.status = 'available' AND NOT EXISTS (
          SELECT 1 FROM booking_items bi JOIN bookings b ON bi.booking_id = b.id 
          WHERE bi.room_id = r.id AND b.stay_status_id IN (1,2) 
          AND bi.check_in <= NOW() AND bi.check_out > NOW()
        ) THEN 1 ELSE 0 END) as available,
        
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM booking_items bi JOIN bookings b ON bi.booking_id = b.id 
          WHERE bi.room_id = r.id AND b.stay_status_id = 2 
          AND bi.check_in <= NOW() AND bi.check_out > NOW()
        ) THEN 1 ELSE 0 END) as occupied,
        
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM booking_items bi JOIN bookings b ON bi.booking_id = b.id 
          WHERE bi.room_id = r.id AND b.stay_status_id = 1 
          AND bi.check_in <= NOW() + INTERVAL '1 day'
        ) THEN 1 ELSE 0 END) as reserved,
        
        SUM(CASE WHEN r.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
       FROM rooms r`,
      [],
      [{ available: 0, occupied: 0, reserved: 0, maintenance: 0 }]
    );

    // 10. Tỷ lệ lấp đầy
    const totalRoomsRes = await safeQuery(
      "SELECT COUNT(*) as count FROM rooms",
      [],
      [{ count: 0 }]
    );
    const totalRooms = parseInt(totalRoomsRes.rows[0].count);
    const occupiedRooms = parseInt(roomStatusCountRes.rows[0].occupied) || 0;
    const occupancyRate =
      totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;

    // 11. Thiết bị hỏng (Sự cố)
    // Query tổng quát
    const deviceDamageRes = await safeQuery(
      `SELECT 
        COUNT(*) as total_damage_cases,
        COALESCE(SUM(amount), 0) as total_damage_amount
       FROM booking_incidents
       WHERE deleted_at IS NULL AND created_at >= $1 AND created_at <= $2`,
      params,
      [{ total_damage_cases: 0, total_damage_amount: 0 }]
    );

    // Query chi tiết (để hiển thị bảng)
    const deviceDamageDetailsRes = await safeQuery(
      `SELECT 
        bi.id, bi.booking_id, bi.amount, me.name as equipment_name, r.name as room_name
       FROM booking_incidents bi
       JOIN master_equipments me ON bi.equipment_id = me.id
       JOIN rooms r ON bi.room_id = r.id
       WHERE bi.deleted_at IS NULL
       ORDER BY bi.created_at DESC LIMIT 5`,
      [],
      []
    );

    // --- CHUẨN BỊ DATA TRẢ VỀ (Mapping) ---
    // Xử lý Payment Methods cho đúng chuẩn PieChart
    const formattedPaymentMethods = bookingByPaymentMethodRes.rows.map((r) => ({
      name: r.payment_method, // Frontend cần 'name'
      value: parseInt(r.count), // Frontend cần 'value'
    }));

    // Xử lý Sự cố cho đúng chuẩn Table ở Frontend
    const formattedRecentDamage = deviceDamageDetailsRes.rows.map((d) => ({
      id: d.id,
      room: d.room_name, // Map từ room_name -> room
      item: d.equipment_name, // Map từ equipment_name -> item
      amount: parseFloat(d.amount),
    }));

    res.success(
      {
        // KPI Cards
        totalUsers,
        totalBookings,
        totalRevenue,
        pendingBookings,
        countCheckins,
        countCheckouts,
        occupancyRate: parseFloat(occupancyRate),

        // Charts & Tables
        revenueChart: revenueByTimeRes.rows.map((r) => ({
          date: r.date,
          revenue: parseFloat(r.revenue),
        })),

        // Cả 2 key để đảm bảo Frontend dùng cái nào cũng chạy
        bookingsByPaymentMethod: formattedPaymentMethods,
        paymentMethods: formattedPaymentMethods,

        // Realtime Status
        roomStatusCount: {
          available: parseInt(roomStatusCountRes.rows[0]?.available) || 0,
          occupied: parseInt(roomStatusCountRes.rows[0]?.occupied) || 0,
          reserved: parseInt(roomStatusCountRes.rows[0]?.reserved) || 0,
          maintenance: parseInt(roomStatusCountRes.rows[0]?.maintenance) || 0,
        },

        recentBookings: recentBookingsRes.rows,

        // SỰ CỐ THIẾT BỊ (Đã fix)
        // 1. Trả về dạng object tổng quan (nếu cần dùng ở chỗ khác)
        deviceDamage: {
          totalCases: parseInt(deviceDamageRes.rows[0].total_damage_cases),
          totalAmount: parseFloat(deviceDamageRes.rows[0].total_damage_amount),
          details: deviceDamageDetailsRes.rows,
        },
        // 2. Trả về dạng mảng phẳng (recentDamage) để khớp với Table Dashboard
        recentDamage: formattedRecentDamage,
      },
      "Lấy thống kê thành công"
    );
  } catch (error) {
    console.error("statistics.getStatistics error:", error);
    res.error("Lỗi lấy thống kê", error.message, 500);
  }
};
