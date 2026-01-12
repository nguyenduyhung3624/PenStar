export interface RoomDevice {
  id: number;
  master_equipment_id: number;
  device_id?: number;
  device_name: string;
  device_type: string;
  status?: string;
  room_id: number;
  note?: string;
  images?: string[];
  quantity: number;
}
