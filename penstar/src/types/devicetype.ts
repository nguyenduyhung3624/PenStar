export interface RoomType {
  id: number;
  name: string;
}

export interface Equipment {
  id: number;
  name: string;
}

export interface AddDeviceStandardFormProps {
  roomTypes: RoomType[];
  equipments: Equipment[];
}
