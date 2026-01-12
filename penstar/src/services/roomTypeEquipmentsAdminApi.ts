import { instance } from "./api";
export const getAllDeviceStandards = async () => {
  const res = await instance.get("/room-type-equipments");
  return res.data?.data ?? [];
};
export const upsertDeviceStandard = async (data: {
  room_type_id: number;
  master_equipment_id: number;
  quantity: number;
}) => {
  const res = await instance.post("/room-type-equipments/standard", data);
  return res.data;
};
