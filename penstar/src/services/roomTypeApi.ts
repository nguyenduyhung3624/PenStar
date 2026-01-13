import { instance } from "./api";
import type { RoomType } from "@/types/roomtypes";
export const getRoomTypes = async (): Promise<RoomType[]> => {
  try {
    const response = await instance.get("/roomtypes");
    console.log("📦 Response from /roomtypes API:", response.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching room types:", error);
    throw error;
  }
};
export const getRoomTypeById = async (
  id: number | string
): Promise<RoomType | null> => {
  try {
    const response = await instance.get(`/roomtypes/${id}`);
    return response.data?.data ?? null;
  } catch (error) {
    console.error(`Error fetching room type ${id}:`, error);
    throw error;
  }
};
export const createRoomType = async (roomTypeData: {
  name: string;
  description: string;
  thumbnail?: string;
<<<<<<< HEAD
  amenities?: string[];
  devices_id?: number[];
=======
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
  capacity?: number;
  max_adults?: number;
  max_children?: number;
  base_occupancy?: number;
  price?: number;
}): Promise<RoomType | null> => {
  try {
    const response = await instance.post("/roomtypes", roomTypeData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error creating room type:", error);
    throw error;
  }
};
export const updateRoomType = async (
  id: number | string,
  roomTypeData: {
    name: string;
    description: string;
<<<<<<< HEAD
    amenities?: string[];
    devices_id?: number[];
=======
    free_amenities?: string[];
    paid_amenities?: string[];
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
    capacity?: number;
    base_adults?: number;
    base_children?: number;
    extra_adult_fee?: number;
    extra_child_fee?: number;
    child_age_limit?: number;
    price?: number;
<<<<<<< HEAD
    adult_surcharge?: number;
    child_surcharge?: number;
=======
    bed_type?: string;
    view_direction?: string;
    room_size?: number;
    policies?: any;
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
  }
) => {
  try {
    const response = await instance.put(`/roomtypes/${id}`, roomTypeData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error updating room type:", error);
    throw error;
  }
};
export const deleteRoomType = async (id: number | string) => {
  try {
    const response = await instance.delete(`/roomtypes/${id}`);
    return response.data ?? null;
  } catch (error) {
    console.error("Error deleting room type:", error);
    throw error;
  }
};
export const checkRoomTypeNameExists = async (
  name: string,
  excludeId?: number | string
) => {
  try {
    const params: Record<string, string | number> = { name };
    if (excludeId) params.excludeId = excludeId;
    const response = await instance.get(`/roomtypes/check-name`, { params });
    return response.data?.exists ?? false;
  } catch (error) {
    console.error("Error checking room type name exists:", error);
    throw error;
  }
};
export interface RoomTypeEquipment {
  id: number;
  name: string;
  quantity: number;
  price: number;
}
export const getRoomTypeEquipments = async (
  roomTypeId: number | string
): Promise<RoomTypeEquipment[]> => {
  try {
    const response = await instance.get(`/room-type-equipments/${roomTypeId}`);
    return response.data?.data ?? [];
  } catch (error) {
    console.error(
      `Error fetching equipments for room type ${roomTypeId}:`,
      error
    );
    return [];
  }
};
