// Khôi phục trạng thái thiết bị về 'Bình thường'
export const restoreRoomDeviceStatus = async (id: number) => {
  try {
    const res = await instance.put(`/room-devices/${id}/restore-status`);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error restoring room device status:", error);
    throw error;
  }
};
/* eslint-disable @typescript-eslint/no-explicit-any */
import { instance } from "./api";
import type { RoomDevice } from "@/types/roomDevices";

export const getRoomDevices = async (params?: {
  room_type_id?: number;
  room_id?: number;
}): Promise<RoomDevice[]> => {
  try {
    const res = await instance.get("/room-devices", { params });
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data)) return res.data;
    return [];
  } catch (error) {
    console.error("Error fetching room devices:", error);
    return [];
  }
};

export const createRoomDevice = async (data: any) => {
  try {
    const res = await instance.post("/room-devices", data);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error creating room device:", error);
    throw error;
  }
};

export const updateRoomDevice = async (id: number, data: any) => {
  try {
    const res = await instance.put(`/room-devices/${id}`, data);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error updating room device:", error);
    throw error;
  }
};

export const deleteRoomDevice = async (id: number) => {
  try {
    const res = await instance.delete(`/room-devices/${id}`);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error deleting room device:", error);
    throw error;
  }
};

export const transferRoomDevice = async (data: {
  equipment_id: string;
  quantity: number;
  from_room_id: number;
  to_room_id: number;
  note?: string;
  created_by?: string;
}) => {
  try {
    const res = await instance.post("/room-devices/transfer", data);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error transferring room device:", error);
    throw error;
  }
};

export const checkRoomDevicesStandard = async (roomId: number | string) => {
  try {
    const res = await instance.get(`/room-devices/check-standard/${roomId}`);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error("Error checking room devices standard:", error);
    return null;
  }
};
