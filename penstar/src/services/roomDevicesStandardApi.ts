import { instance } from "./api";
export const checkRoomDevicesStandardByType = async (roomTypeId: number) => {
  const res = await instance.get(
    `/room-devices/check-standard-by-type/${roomTypeId}`
  );
  return res.data;
};
