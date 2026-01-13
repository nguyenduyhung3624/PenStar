import type { Room } from "./room";
import type { RoomType } from "./roomtypes";
export interface RoomBookingConfig {
  room_id: number;
  room_type_id: number;
  quantity: number; 
  num_adults: number;
  num_children: number;
  num_babies?: number; 
  special_requests?: string;
  price: number;
  base_price?: number; 
  extra_fees?: number; 
  extra_adult_fees?: number; 
  extra_child_fees?: number; 
  extra_adults_count?: number; 
  extra_children_count?: number; 
}
export interface RoomTypeCardProps {
  roomType: RoomType | undefined;
  roomsInType: Room[];
  numRooms: number;
  selectedRoomIds: number[];
  roomsConfig: RoomBookingConfig[];
  disabled?: boolean;
  onSelectRoomType: (
    rooms: Room[],
    roomsConfig: RoomBookingConfig[],
    useCapacity?: boolean
  ) => void;
  onRoomSelect: (room: Room) => void;
}
export interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  config: RoomBookingConfig | undefined;
  selectedRoomIds: number[];
  numRooms: number;
  onRoomSelect: (room: Room) => void;
  onGuestChange: (
    roomId: number,
    field: "num_adults" | "num_children" | "num_babies",
    value: number | null
  ) => void;
}
