import { instance } from "./api";
export const getAllDeviceStandards = async () => {
  const res = await instance.get("/room-type-equipments");
  return res.data?.data ?? [];
};
export const updateDeviceStandards = async (
  roomTypeId: number,
  equipments: { name: string; quantity: number; price: number }[]
) => {
  const res = await instance.put(`/room-type-equipments/${roomTypeId}`, {
    equipments,
  });
  return res.data;
};
