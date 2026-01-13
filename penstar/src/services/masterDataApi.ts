import { instance } from "./api";

export const getRoomTypes = async () => {
  const res = await instance.get("/roomtypes");
  return res.data?.data ?? [];
};

export const getEquipments = async () => {
  const res = await instance.get("/master-equipments");
  return res.data?.data ?? [];
};
