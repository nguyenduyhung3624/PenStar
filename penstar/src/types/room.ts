export interface Room {
  id: number;
  name: string;
  type_id: number;
  status: string;
  image?: string;
  room_type_name?: string;
  room_type_price?: number;
  type_name?: string;
  capacity?: number;
  price?: number;
  floor_name?: string;
  floor_id?: number;
  is_available?: boolean;
  conflicting_bookings?: Array<{
    check_in: string;
    check_out: string;
    customer_name: string;
  }>;
}
export interface RoomSearchParams {
  check_in: string;
  check_out: string;
  num_rooms?: number;
  promo_code?: string;
  room_type_id?: number;
  floor_id?: number;
  num_adults?: number;
  num_children?: number;
  status?: string;
  booking_statuses?: number[];
}
export interface RoomSearchResponse {
  success: boolean;
  message: string;
  data: Room[];
  search_params: {
    check_in: string;
    check_out: string;
    room_type_id: number | null;
    floor_id: number | null;
    num_adults: number;
    num_children: number;
    total_guests: number;
  };
}
