export interface CurrentRoomInfo {
  id: number;
  name: string;
  price: number;
  type_id: number;
}
export interface RoomItemState {
  bookingItemId: number;
  currentRoom: CurrentRoomInfo;
  checkIn: string;
  checkOut: string;
  numAdults: number;
  numChildren: number;
}
export interface LocationState {
  bookingId?: number;
  bookingItemId?: number;
  currentRoom?: CurrentRoomInfo;
  checkIn?: string;
  checkOut?: string;
  numAdults?: number;
  numChildren?: number;
  items?: RoomItemState[];
}
export interface ChangeRoomModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: number;
  bookingItemId: number;
  currentRoom: CurrentRoomInfo;
  checkIn: string;
  checkOut: string;
  numAdults: number;
  numChildren: number;
}
