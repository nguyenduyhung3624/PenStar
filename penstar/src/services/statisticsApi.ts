import instance from "./api";
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
  paymentMethod: string;
  name?: string;
  count?: number;
  value?: number;
}
export interface RevenueBreakdown {
  room: number;
  service: number;
  incident: number;
}
export interface TopRoomType {
  name: string;
  bookings: number;
  revenue: number;
}
export interface TopService {
  name: string;
  usage: number;
  revenue: number;
}
export interface BottomRoomType {
  name: string;
  bookings: number;
}
export interface BottomService {
  name: string;
  usage: number;
}
export interface BookingStatusStat {
  name: string;
  value: number;
}
export interface KPI {
  cancelRate: number;
  avgStay: number;
}
export interface Statistics {
  period: string;
  totalUsers: number;
  totalBookings: number;
  availableRooms: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  revenueBreakdown?: RevenueBreakdown;
  topRoomTypes?: TopRoomType[];
  bottomRoomTypes?: BottomRoomType[];
  topServices?: TopService[];
  bottomServices?: BottomService[];
  bookingStatusStats?: BookingStatusStat[];
  kpi?: KPI;
  todayCheckins: number;
  todayCheckouts: number;
  countCheckins: number;
  countCheckouts: number;
  pendingBookings: number;
  roomStatusCount: RoomStatusCount;
  todayArrivals: ArrivalDepartureItem[];
  todayDepartures: ArrivalDepartureItem[];
  bookingsByPaymentMethod: PaymentMethodCount[];
  paymentMethods: Array<{ name: string; value: number }>;
  bookingsByRoomType: BookingByRoomType[];
  roomsByFloor: FloorRooms[];
  revenueChart: Array<{
    date: string;
    revenue: number;
  }>;
  revenueByMonth?: Array<{
    month: string;
    revenue: number;
  }>;
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
    payment_status: string;
  }>;
  recentDamage: Array<{
    id: number;
    room: string;
    item: string;
    amount: number;
  }>;
  deviceDamage?: {
    totalCases: number;
    bookingsWithDamage: number;
    totalAmount: number;
    details: DeviceDamageDetail[];
  };
}
export const getStatistics = async (
  startDate: string,
  endDate: string
): Promise<Statistics> => {
  const response = await instance.get("/statistics", {
    params: {
      startDate: startDate,
      endDate: endDate,
    },
  });
  return response.data.data;
};
