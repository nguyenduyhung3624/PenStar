export interface BookingIncident {
  id: number;
  booking_id: number;
  room_id: number;
  equipment_id: number;
  equipment_name?: string;
  quantity: number;
  compensation_price?: number;
  amount?: number;
  note?: string;
  room_name?: string;
  created_at?: string;
  // Thêm các trường khác nếu cần
}
