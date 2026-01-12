import { instance } from "./api";
export const checkRoomDevicesStandardByType = async (roomTypeId) => {
  const res = await instance.get(
    `/room-devices/check-standard-by-type/${roomTypeId}`
  );
  return res.data;
};
