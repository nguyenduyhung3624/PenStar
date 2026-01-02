import { instance } from "./api";

// Lấy tất cả tiêu chuẩn thiết bị theo loại phòng
export const getAllDeviceStandards = async () => {
  const res = await instance.get("/room-type-equipments");
  return res.data?.data ?? [];
};

// Thêm hoặc cập nhật tiêu chuẩn thiết bị cho loại phòng
export const upsertDeviceStandard = async (data: {
  room_type_id: number;
  master_equipment_id: number;
  min_quantity: number;
  max_quantity: number;
}) => {
  const res = await instance.post("/room-type-equipments/standard", data);
  return res.data;
};
