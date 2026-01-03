import instance from "./api";

// --- Sub-Interfaces ---

export interface RoomStatus {
  id: number;
  name: string;
  status: string;
  room_type: string;
}

export interface FloorRooms {
  floor_id: number;
  floor_name: string;
  rooms: RoomStatus[];
}

export interface BookingByRoomType {
  roomTypeId: number;
  roomTypeName: string;
  count: number;
}

export interface DeviceDamageDetail {
  id: number;
  booking_id: number;
  customer_name: string;
  equipment_name: string;
  room_name: string;
  quantity: number;
  amount: number;
  reason: string;
  created_at: string;
}

export interface RoomStatusCount {
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
}

export interface ArrivalDepartureItem {
  bookingId: number;
  customerName: string;
  customerPhone: string;
  paymentStatus: string;
  stayStatusId: number;
  stayStatusName: string;
  checkIn?: string;
  checkOut?: string;
  roomName: string;
  roomTypeName: string;
}

export interface PaymentMethodCount {
  paymentMethod: string; // Tên phương thức (dùng cho API cũ)
  name?: string; // Tên hiển thị (dùng cho biểu đồ)
  count?: number; // Số lượng
  value?: number; // Giá trị (dùng cho biểu đồ tròn)
}

// --- Main Statistics Interface ---

export interface Statistics {
  // 1. General Stats
  period: string;
  totalUsers: number;
  totalBookings: number;
  availableRooms: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalRevenue: number;

  // 2. Counts (Check-in/out)
  todayCheckins: number; // API gốc
  todayCheckouts: number; // API gốc
  countCheckins: number; // Alias cho Dashboard (nếu cần mapping từ BE)
  countCheckouts: number; // Alias cho Dashboard (nếu cần mapping từ BE)
  pendingBookings: number;

  // 3. Room Status
  roomStatusCount: RoomStatusCount;

  // 4. Arrivals / Departures
  todayArrivals: ArrivalDepartureItem[];
  todayDepartures: ArrivalDepartureItem[];

  // 5. Payment Methods (Dữ liệu cho PieChart)
  // Dashboard dùng cả 'bookingsByPaymentMethod' và 'paymentMethods'
  bookingsByPaymentMethod: PaymentMethodCount[];
  paymentMethods: Array<{ name: string; value: number }>;

  // 6. Room Type & Floor
  bookingsByRoomType: BookingByRoomType[];
  roomsByFloor: FloorRooms[];

  // 7. Revenue Chart (Dữ liệu cho LineChart)
  // Dashboard cần mảng có { date, revenue }
  revenueChart: Array<{
    date: string;
    revenue: number;
  }>;
  // Giữ lại cái cũ nếu backend trả về cả 2
  revenueByMonth?: Array<{
    month: string;
    revenue: number;
  }>;

  // 8. Recent Bookings (Dữ liệu cho Table)
  bookingsByStatus: Array<{
    statusId: number;
    statusName: string;
    count: number;
  }>;
  recentBookings: Array<{
    id: number;
    customer_name: string;
    total_price: number;
    created_at: string;
    stay_status_name: string;
    email: string;
    payment_status: string; // 'paid' | 'pending' | ...
  }>;

  // 9. Damage (Dữ liệu cho Table sự cố)
  // Dashboard cần mảng phẳng 'recentDamage'
  recentDamage: Array<{
    id: number;
    room: string;
    item: string;
    amount: number;
  }>;
  // Cấu trúc cũ (nếu backend trả về dạng lồng nhau)
  deviceDamage?: {
    totalCases: number;
    bookingsWithDamage: number;
    totalAmount: number;
    details: DeviceDamageDetail[];
  };
}

// --- API Function ---

export const getStatistics = async (
  startDate: string,
  endDate: string
): Promise<Statistics> => {
  // Dashboard truyền 2 tham số ngày (YYYY-MM-DD), nên ta gửi params tương ứng
  const response = await instance.get("/statistics", {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  });
  return response.data.data; // Đảm bảo cấu trúc trả về từ BE khớp với Interface này
};
