import { instance } from "./api";
import type {
  Booking,
  BookingUpdatePayload,
  BookingShort,
} from "@/types/bookings";
export interface ChangeRoomRequest {
  booking_item_id: number;
  new_room_id: number;
  reason?: string;
}
export interface ChangeRoomResponse {
  success: boolean;
  message: string;
  data: {
    booking: any;
    oldRoomId: number;
    newRoomId: number;
    priceDifference: number;
  };
}
export interface RoomChangeHistory {
  id: number;
  booking_id: number;
  booking_item_id: number;
  old_room_id: number;
  new_room_id: number;
  old_room_name: string;
  new_room_name: string;
  old_room_type_id: number;
  new_room_type_id: number;
  old_room_type_name: string;
  new_room_type_name: string;
  change_reason: string;
  price_difference: number;
  changed_by: number;
  changed_by_email: string;
  changed_at: string;
  status: string;
}
export const changeRoom = async (
  bookingId: number,
  data: ChangeRoomRequest
): Promise<ChangeRoomResponse> => {
  const response = await instance.post(
    `/bookings/${bookingId}/change-room`,
    data
  );
  return response.data;
};
export const getRoomChangeHistory = async (
  bookingId: number
): Promise<RoomChangeHistory[]> => {
  const response = await instance.get(
    `/bookings/${bookingId}/room-change-history`
  );
  return response.data.data;
};
export const createBooking = async (bookingData: Booking): Promise<Booking> => {
  const { data } = await instance.post("/bookings", bookingData);
  return data.data;
};
export const getBookings = async (): Promise<BookingShort[]> => {
  const { data } = await instance.get("/bookings");
  return data.data;
};
export const getMyBookings = async (): Promise<BookingShort[]> => {
  const { data } = await instance.get("/bookings/mine");
  return data.data;
};
export const getBookingById = async (id: number): Promise<Booking> => {
  const { data } = await instance.get(`/bookings/${id}`);
  return data.data;
};
export const setBookingStatus = async (
  id: number,
  payload: BookingUpdatePayload
): Promise<Booking> => {
  const { data } = await instance.patch(`/bookings/${id}/status`, payload);
  return data.data;
};
export const cancelBooking = async (
  id: number,
  cancel_reason?: string
): Promise<Booking> => {
  const { data } = await instance.post(`/bookings/${id}/cancel`, {
    cancel_reason,
  });
  return data.data;
};
export const updateMyBooking = async (
  id: number,
  payload: BookingUpdatePayload
): Promise<Booking> => {
  const { data } = await instance.patch(`/bookings/${id}/my-status`, payload);
  return data.data;
};
export const confirmCheckout = async (id: number): Promise<Booking> => {
  const { data } = await instance.post(`/bookings/${id}/confirm-checkout`);
  return data.data;
};
export const markNoShow = async (id: number): Promise<Booking> => {
  const { data } = await instance.post(`/bookings/${id}/no-show`);
  return data.data;
};
export const confirmCheckin = async (id: number): Promise<Booking> => {
  const { data } = await instance.post(`/bookings/${id}/confirm-checkin`);
  return data.data;
};
export const markBookingRefunded = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  const { data } = await instance.patch(`/bookings/${id}/mark-refunded`);
  return data;
};
export const calculateLateFee = async (
  id: number
): Promise<{
  lateFee: number;
  hours: number;
  action: string;
  success: boolean;
}> => {
  const { data } = await instance.post(`/bookings/${id}/calculate-late-fee`);
  return data.data;
};

export const uploadBookingReceipt = async (
  file: File
): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await instance.post("/bookings/upload-receipt", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
};
