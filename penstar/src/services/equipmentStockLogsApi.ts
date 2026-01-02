import { instance } from "./api";

export const importEquipment = async (data: {
  equipment_id: number;
  quantity: number;
  note?: string;
}) => {
  try {
    const res = await instance.post("/equipment-stock-logs/import", data);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error importing equipment:", error);
    throw error;
  }
};

// Alias for compatibility with EquipmentImport.tsx
export const importEquipmentStock = importEquipment;

export const exportEquipment = async (data: {
  equipment_id: number;
  quantity: number;
  note?: string;
}) => {
  try {
    const res = await instance.post("/equipment-stock-logs/export", data);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error exporting equipment:", error);
    throw error;
  }
};

export const transferEquipment = async (data: {
  equipment_id: number;
  quantity: number;
  from_room_id: number;
  to_room_id: number;
  note?: string;
}) => {
  try {
    const res = await instance.post("/equipment-stock-logs/transfer", data);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error transferring equipment:", error);
    throw error;
  }
};

export const getAllStockLogs = async () => {
  try {
    const res = await instance.get("/equipment-stock-logs/logs/all");
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Error fetching all stock logs:", error);
    return [];
  }
};
