import { instance } from "./api";

export const getRoomDeviceStandard = async (
  room_type_id: number,
  master_equipment_id: number
) => {
  const res = await instance.get("/room-type-equipments/standard", {
    params: { room_type_id, master_equipment_id },
  });
  return res.data?.data ?? null;
};
