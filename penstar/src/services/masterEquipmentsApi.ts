/* eslint-disable @typescript-eslint/no-explicit-any */
import { instance } from "./api";

export const getMasterEquipments = async () => {
  try {
    const res = await instance.get("/master-equipments");
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Error fetching master equipments:", error);
    return [];
  }
};

export const createMasterEquipment = async (data: any) => {
  try {
    const res = await instance.post("/master-equipments", data);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error creating master equipment:", error);
    throw error;
  }
};

export const updateMasterEquipment = async (id: number, data: any) => {
  try {
    const res = await instance.put(`/master-equipments/${id}`, data);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error updating master equipment:", error);
    throw error;
  }
};

export const deleteMasterEquipment = async (id: number) => {
  try {
    const res = await instance.delete(`/master-equipments/${id}`);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error deleting master equipment:", error);
    throw error;
  }
};

// Lấy thông tin thiết bị theo id
export const getMasterEquipmentById = async (id: number) => {
  try {
    const res = await instance.get(`/master-equipments/${id}`);
    return res.data?.data ?? null;
  } catch (error) {
    console.error(`Error fetching master equipment with ID ${id}:`, error);
    return null;
  }
};
