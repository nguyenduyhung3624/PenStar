import pool from "../db.js";
export const getStatistics = async (req, res) => {
  try {
    const { startDate: qStart, endDate: qEnd } = req.query;
    console.log(`--- Lấy thống kê từ ${qStart} đến ${qEnd} ---`);
    let startDate, endDate;
    if (qStart && qEnd) {
      startDate = new Date(qStart);
      endDate = new Date(qEnd);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    const params = [startDate, endDate];
    const safeQuery = async (query, queryParams, defaultValue) => {
      try {
        const result = await pool.query(query, queryParams);
        return result;
      } catch (err) {
        console.error(`[SQL ERROR] ${err.message}`);
        return { rows: defaultValue };
      }
    };
    const usersRes = await safeQuery(
      `SELECT COUNT(*) as count FROM users`,
      [],
      [{ count: 0 }]
    );
    const totalUsers = parseInt(usersRes.rows[0].count);
    const bookingsRes = await safeQuery(
      `SELECT COUNT(*) as count FROM bookings b WHERE b.created_at >= $1 AND b.created_at <= $2`,
      params,
      [{ count: 0 }]
    );
    const totalBookings = parseInt(bookingsRes.rows[0].count);
    const revenueRes = await safeQuery(
      `SELECT COALESCE(SUM(total_price), 0) as total
       FROM bookings b
       WHERE b.created_at >= $1 AND b.created_at <= $2
       AND b.payment_status = 'paid'`,
      params,
      [{ total: 0 }]
    );
    const totalRevenue = parseFloat(revenueRes.rows[0].total) || 0;
    const pendingBookingsRes = await safeQuery(
      `SELECT COUNT(*) as count FROM bookings WHERE stay_status_id = 6`,
      [],
      [{ count: 0 }]
    );
    const pendingBookings = parseInt(pendingBookingsRes.rows[0].count) || 0;
    const checkinsRes = await safeQuery(
      `SELECT COUNT(DISTINCT b.id) as count
       FROM bookings b
       JOIN booking_items bi ON bi.booking_id = b.id
       WHERE bi.check_in >= $1 AND bi.check_in <= $2
       AND b.stay_status_id IN (1, 2, 3)`,
      params,
      [{ count: 0 }]
    );
    const countCheckins = parseInt(checkinsRes.rows[0].count) || 0;
    const checkoutsRes = await safeQuery(
      `SELECT COUNT(DISTINCT b.id) as count
       FROM bookings b
       JOIN booking_items bi ON bi.booking_id = b.id
       WHERE bi.check_out >= $1 AND bi.check_out <= $2
       AND b.stay_status_id = 3`,
      params,
      [{ count: 0 }]
    );
    const countCheckouts = parseInt(checkoutsRes.rows[0].count) || 0;
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
    const roomStatusCountRes = await safeQuery(
      `SELECT
        SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN r.status = 'booked' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN r.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
       FROM rooms r`,
      [],
      [{ available: 0, occupied: 0, reserved: 0, maintenance: 0 }]
    );
    const totalRoomsRes = await safeQuery(
      "SELECT COUNT(*) as count FROM rooms",
      [],
      [{ count: 0 }]
    );
    const totalRooms = parseInt(totalRoomsRes.rows[0].count);
    const occupiedRooms = parseInt(roomStatusCountRes.rows[0].occupied) || 0;
    const occupancyRate =
      totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;
<<<<<<< HEAD

    // Device Damage Statistics - Query from booking_device_damages table
    const deviceDamageParams = dateFilter ? [...params] : [];
    // Fix dateFilter to use booking alias 'b'
    const deviceDamageDateFilter = dateFilter ? dateFilter.replace("created_at", "b.created_at") : "";
    const deviceDamageWhereClause = deviceDamageDateFilter 
      ? `${deviceDamageDateFilter} AND b.stay_status_id = 3`
      : `WHERE b.stay_status_id = 3`;
    
    const deviceDamageRes = await pool.query(
      `SELECT 
        COUNT(*) as total_damage_cases,
        COUNT(DISTINCT bdd.booking_id) as bookings_with_damage
       FROM booking_device_damages bdd
       JOIN bookings b ON bdd.booking_id = b.id
       ${deviceDamageWhereClause}`,
      deviceDamageParams
    );

    // Extract device damage details from booking_device_damages table
    const deviceDamageDetailsParams = dateFilter ? [...params] : [];
    const deviceDamageDetailsDateFilter = dateFilter ? dateFilter.replace("created_at", "b.created_at") : "";
    const deviceDamageDetailsWhereClause = deviceDamageDetailsDateFilter
      ? `${deviceDamageDetailsDateFilter} AND b.stay_status_id = 3`
      : `WHERE b.stay_status_id = 3`;
    
    const deviceDamageDetailsRes = await pool.query(
      `SELECT 
        bdd.booking_id,
        b.customer_name,
        bdd.created_at,
        bdd.device_name,
        bdd.description,
        bdd.amount
       FROM booking_device_damages bdd
       JOIN bookings b ON bdd.booking_id = b.id
       ${deviceDamageDetailsWhereClause}
       ORDER BY bdd.created_at DESC
       LIMIT 50`,
      deviceDamageDetailsParams
    );

    // Group damages by booking_id
    const damagesByBooking = {};
    deviceDamageDetailsRes.rows.forEach((row) => {
      if (!damagesByBooking[row.booking_id]) {
        damagesByBooking[row.booking_id] = {
          booking_id: row.booking_id,
          customer_name: row.customer_name,
          created_at: row.created_at,
          damage_items: [],
        };
      }
      const amountStr = row.amount 
        ? ` (${Number(row.amount).toLocaleString('vi-VN')} ₫)` 
        : "";
      damagesByBooking[row.booking_id].damage_items.push(
        `${row.device_name}${row.description ? ` - ${row.description}` : ""}${amountStr}`
      );
    });

    const deviceDamageDetails = Object.values(damagesByBooking).map((item) => ({
      booking_id: item.booking_id,
      customer_name: item.customer_name,
      created_at: item.created_at,
      damage_count: item.damage_items.length,
      damage_items: item.damage_items,
    }));

    res.json({
      success: true,
      message: "✅ Get statistics successfully",
      data: {
        period,
=======
    const deviceDamageRes = await safeQuery(
      `SELECT
        COUNT(*) as total_damage_cases,
        COALESCE(SUM(amount), 0) as total_damage_amount
       FROM booking_incidents
       WHERE deleted_at IS NULL AND created_at >= $1 AND created_at <= $2`,
      params,
      [{ total_damage_cases: 0, total_damage_amount: 0 }]
    );
    const deviceDamageDetailsRes = await safeQuery(
      `SELECT
        bi.id, bi.booking_id, bi.amount,
        COALESCE(me.name, 'Thiết bị đã xóa') as equipment_name,
        COALESCE(r.name, 'Phòng đã xóa') as room_name
       FROM booking_incidents bi
       LEFT JOIN master_equipments me ON bi.equipment_id = me.id
       LEFT JOIN rooms r ON bi.room_id = r.id
       WHERE bi.deleted_at IS NULL
       ORDER BY bi.created_at DESC LIMIT 5`,
      [],
      []
    );
    const serviceRevenueRes = await safeQuery(
      `SELECT COALESCE(SUM(bs.total_service_price), 0) as total
       FROM booking_services bs
       JOIN bookings b ON bs.booking_id = b.id
       WHERE b.created_at >= $1 AND b.created_at <= $2
       AND b.payment_status = 'paid'`,
      params,
      [{ total: 0 }]
    );
    const serviceRevenue = parseFloat(serviceRevenueRes.rows[0].total) || 0;

    const incidentRevenueRes = await safeQuery(
      `SELECT COALESCE(SUM(bi.amount), 0) as total
       FROM booking_incidents bi
       JOIN bookings b ON bi.booking_id = b.id
       WHERE bi.created_at >= $1 AND bi.created_at <= $2
       AND b.payment_status = 'paid'`,
      params,
      [{ total: 0 }]
    );
    const incidentRevenue = parseFloat(incidentRevenueRes.rows[0].total) || 0;

    // Room Revenue is Total - Service - Incident (Approx)
    // Or we can query booking_items directly if we have room_price there
    const roomRevenue = Math.max(
      0,
      totalRevenue - serviceRevenue - incidentRevenue
    );

    const topRoomTypesRes = await safeQuery(
      `SELECT rt.name, COUNT(b.id) as booking_count, SUM(b.total_price) as revenue
       FROM bookings b
       JOIN booking_items bi ON bi.booking_id = b.id
       JOIN rooms r ON bi.room_id = r.id
       JOIN room_types rt ON r.type_id = rt.id
       WHERE b.created_at >= $1 AND b.created_at <= $2
       AND b.payment_status = 'paid'
       GROUP BY rt.id, rt.name
       ORDER BY revenue DESC
       LIMIT 5`,
      params,
      []
    );

    const topServicesRes = await safeQuery(
      `SELECT s.name, SUM(bs.quantity) as usage_count, SUM(bs.total_service_price) as revenue
       FROM booking_services bs
       JOIN services s ON bs.service_id = s.id
       JOIN bookings b ON bs.booking_id = b.id
       WHERE b.created_at >= $1 AND b.created_at <= $2
       AND b.payment_status = 'paid'
       GROUP BY s.id, s.name
       ORDER BY revenue DESC
       LIMIT 5`,
      params,
      []
    );

    const bottomRoomTypesRes = await safeQuery(
      `SELECT rt.name, COUNT(b.id) as booking_count
       FROM room_types rt
       LEFT JOIN rooms r ON r.type_id = rt.id
       LEFT JOIN booking_items bi ON bi.room_id = r.id
       LEFT JOIN bookings b ON bi.booking_id = b.id AND b.created_at >= $1 AND b.created_at <= $2 AND b.payment_status = 'paid'
       GROUP BY rt.id, rt.name
       ORDER BY booking_count ASC
       LIMIT 5`,
      params,
      []
    );

    const bottomServicesRes = await safeQuery(
      `SELECT s.name, COALESCE(SUM(bs.quantity), 0) as usage_count
       FROM services s
       LEFT JOIN booking_services bs ON bs.service_id = s.id
       LEFT JOIN bookings b ON bs.booking_id = b.id AND b.created_at >= $1 AND b.created_at <= $2 AND b.payment_status = 'paid'
       GROUP BY s.id, s.name
       ORDER BY usage_count ASC
       LIMIT 5`,
      params,
      []
    );

    const bookingStatusRes = await safeQuery(
      `SELECT ss.name, COUNT(b.id) as count
       FROM bookings b
       JOIN stay_status ss ON b.stay_status_id = ss.id
       WHERE b.created_at >= $1 AND b.created_at <= $2
       GROUP BY ss.id, ss.name`,
      params,
      []
    );

    const dailyOperationsRes = await safeQuery(
      `SELECT
        DATE(check_in) as date,
        COUNT(CASE WHEN check_in >= $1 AND check_in <= $2 THEN 1 END) as checkins,
        COUNT(CASE WHEN check_out >= $1 AND check_out <= $2 THEN 1 END) as checkouts
       FROM booking_items
       GROUP BY DATE(check_in)
       ORDER BY date ASC`,
      params,
      []
    );
    // Note: Simplified query for demo. Ideally join checkin/checkout dates separately or union.
    // For accuracy let's stick to simple aggregate stats for now or separate LineCharts if needed.
    // Let's refine "dailyOperations" to just return raw checkin/checkout dates to process or separate queries.
    // Actually, let's calculate simpler KPIs first.

    const cancellationStatsRes = await safeQuery(
      `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN stay_status_id = 5 THEN 1 ELSE 0 END) as cancelled
         FROM bookings
         WHERE created_at >= $1 AND created_at <= $2`,
      params,
      [{ total: 0, cancelled: 0 }]
    );
    const totalForCancel = parseInt(cancellationStatsRes.rows[0].total) || 1;
    const cancelledCount =
      parseInt(cancellationStatsRes.rows[0].cancelled) || 0;
    const cancelRate = ((cancelledCount / totalForCancel) * 100).toFixed(1);

    const stayDurationRes = await safeQuery(
      `SELECT AVG(check_out::date - check_in::date) as avg_stay
         FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         WHERE b.created_at >= $1 AND b.created_at <= $2`,
      params,
      [{ avg_stay: 0 }]
    );
    const avgStay = parseFloat(stayDurationRes.rows[0].avg_stay || 0).toFixed(
      1
    );

    const formattedPaymentMethods = bookingByPaymentMethodRes.rows.map((r) => ({
      name: r.payment_method,
      value: parseInt(r.count),
    }));
    const formattedRecentDamage = deviceDamageDetailsRes.rows.map((d) => ({
      id: d.id,
      room: d.room_name,
      item: d.equipment_name,
      amount: parseFloat(d.amount),
    }));
    res.success(
      {
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
        totalUsers,
        totalBookings,
        totalRevenue,
        pendingBookings,
        countCheckins,
        countCheckouts,
        occupancyRate: parseFloat(occupancyRate),
        revenueChart: revenueByTimeRes.rows.map((r) => ({
          date: r.date,
          revenue: parseFloat(r.revenue),
        })),
        revenueBreakdown: {
          room: roomRevenue,
          service: serviceRevenue,
          incident: incidentRevenue,
        },
        topRoomTypes: topRoomTypesRes.rows.map((r) => ({
          name: r.name,
          bookings: parseInt(r.booking_count),
          revenue: parseFloat(r.revenue),
        })),
        bottomRoomTypes: bottomRoomTypesRes.rows.map((r) => ({
          name: r.name,
          bookings: parseInt(r.booking_count),
        })),
        topServices: topServicesRes.rows.map((r) => ({
          name: r.name,
          usage: parseInt(r.usage_count),
          revenue: parseFloat(r.revenue),
        })),
        bottomServices: bottomServicesRes.rows.map((r) => ({
          name: r.name,
          usage: parseInt(r.usage_count),
        })),
        bookingStatusStats: bookingStatusRes.rows.map((r) => ({
          name: r.name,
          value: parseInt(r.count),
        })),
        kpi: {
          cancelRate: parseFloat(cancelRate),
          avgStay: parseFloat(avgStay),
        },
        bookingsByPaymentMethod: formattedPaymentMethods,
        paymentMethods: formattedPaymentMethods,
        roomStatusCount: {
          available: parseInt(roomStatusCountRes.rows[0]?.available) || 0,
          occupied: parseInt(roomStatusCountRes.rows[0]?.occupied) || 0,
          reserved: parseInt(roomStatusCountRes.rows[0]?.reserved) || 0,
          maintenance: parseInt(roomStatusCountRes.rows[0]?.maintenance) || 0,
        },
        recentBookings: recentBookingsRes.rows,
        deviceDamage: {
          totalCases: parseInt(deviceDamageRes.rows[0].total_damage_cases),
          totalAmount: parseFloat(deviceDamageRes.rows[0].total_damage_amount),
          details: deviceDamageDetailsRes.rows,
        },
        recentDamage: formattedRecentDamage,
      },
      "Lấy thống kê thành công"
    );
  } catch (error) {
    console.error("statistics.getStatistics error:", error);
    res.error("Lỗi lấy thống kê", error.message, 500);
  }
};
