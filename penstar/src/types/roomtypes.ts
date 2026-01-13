export interface RoomTypePolicy {
  cancellation?: string;
  payment?: string;
  checkin?: string;
  checkout?: string;
  extra_fees?: string;
  other_policies?: string[];
}
export interface RoomType {
  id: number;
  name: string;
  description: string;
  capacity?: number;
  base_adults?: number;
  base_children?: number;
  extra_adult_fee?: number;
  extra_child_fee?: number;
  child_age_limit?: number;
  policies?: RoomTypePolicy;
  base_occupancy?: number;
  room_size?: number;
  thumbnail?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  price?: number;
<<<<<<< HEAD
  adult_surcharge?: number; // Phụ phí cho mỗi người lớn vượt quá max_adults
  child_surcharge?: number; // Phụ phí cho mỗi trẻ em
  devices_id?: number[];
  devices?: Array<{
    id: number;
    name: string;
    type?: string;
    fee?: number;
    description?: string;
  }>;
  amenities?: string[]; // Legacy field, keep for backward compatibility
=======
  bed_type?: string;
  view_direction?: string;
  free_amenities?: string[];
  paid_amenities?: string[];
  refund_policy?: {
    refundable?: boolean;
    refund_percent?: number;
    refund_deadline_hours?: number;
    non_refundable?: boolean;
    notes?: string;
  };
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
}
