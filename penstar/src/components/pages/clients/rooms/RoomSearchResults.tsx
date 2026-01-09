import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message, Spin, Empty, Button, Row, Col } from "antd";
import { searchAllRoomsWithAvailability } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import type { Room, RoomSearchParams } from "@/types/room";
import type { RoomType } from "@/types/roomtypes";
import type { RoomBookingConfig } from "@/types/roomBooking";
import { useQuery } from "@tanstack/react-query";
import { CalendarOutlined } from "@ant-design/icons";
import RoomSearchBar from "@/components/common/RoomSearchBar";
import BookingSidebar from "@/components/common/BookingSidebar";
import RoomTypeCard from "./RoomTypeCard";
import dayjs from "@/utils/dayjs";
const RoomSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<RoomSearchParams | null>(
    location.state?.searchParams || null
  );
  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ["roomtypes"],
    queryFn: getRoomTypes,
  });
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [numRooms, setNumRooms] = useState(1);
  const [confirmedBookings, setConfirmedBookings] = useState<
    Array<{
      roomTypeId: number;
      roomTypeName: string;
      roomPrice: number;
      roomsConfig: RoomBookingConfig[];
      numRooms: number;
    }>
  >([]);
  useEffect(() => {
    if (searchParams) {
      handleSearch(searchParams);
      if (searchParams.num_rooms) {
        setNumRooms(searchParams.num_rooms);
      }
    }
    if (
      location.state?.autoSelectedRoomIds &&
      location.state?.autoSelectedConfigs
    ) {
      setSelectedRoomIds(location.state.autoSelectedRoomIds);
      message.success(
        `Đã tự động chọn ${location.state.autoSelectedRoomIds.length} phòng từ catalog`
      );
    }
  }, []);
  const handleSearch = async (params: RoomSearchParams) => {
    setLoading(true);
    setSelectedRoomIds([]);
    try {
      console.log("🔍 Searching with params:", params);
      const response = await searchAllRoomsWithAvailability(params);
      console.log("📦 Search response:", response);
      setRooms(response.data);
      setSearchParams(params);
      if (params.num_rooms) {
        setNumRooms(params.num_rooms);
      }
      const available = response.data.filter(
        (r: Room) => r.is_available
      ).length;
      message.success(
        `Tìm thấy ${response.data.length} phòng (${available} trống)`
      );
    } catch (error) {
      console.error("Error searching rooms:", error);
      message.error("Lỗi tìm kiếm phòng");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };
  const roomsByType = useMemo(
    () =>
      rooms.reduce(
        (acc, room) => {
          if (!acc[room.type_id]) {
            acc[room.type_id] = [];
          }
          acc[room.type_id].push(room);
          return acc;
        },
        {} as Record<number, Room[]>
      ),
    [rooms]
  );
  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5" }}>
      {}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <RoomSearchBar onSearch={handleSearch} loading={loading} />
        </div>
      </div>
      {}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {searchParams && (
          <div
            className="bg-white p-4 mb-6"
            style={{
              border: "1px solid #e0e0e0",
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-blue-600" />
                <span className="font-medium">
                  {dayjs(searchParams.check_in).format("DD/MM/YYYY")} -{" "}
                  {dayjs(searchParams.check_out).format("DD/MM/YYYY")}
                </span>
                {}
              </div>
              {}
            </div>
          </div>
        )}
        {}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Vui lòng chọn phòng ({Object.keys(roomsByType).length} loại phòng
            tìm thấy)
          </h2>
        </div>
        {loading ? (
          <div className="text-center py-20">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Đang tìm kiếm phòng...</p>
          </div>
        ) : Object.keys(roomsByType).length === 0 ? (
          <Empty
            description="Không tìm thấy phòng trống"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate("/")}>
              Quay về trang chủ
            </Button>
          </Empty>
        ) : (
          <Row gutter={24}>
            {}
            <Col xs={24} lg={16}>
              <div className="space-y-3">
                {Object.entries(roomsByType).map(([typeId, roomsInType]) => {
                  const roomType = roomTypes.find(
                    (rt) => rt.id === Number(typeId)
                  );
                  const currentBooking = confirmedBookings.find(
                    (b) => b.roomTypeId === Number(typeId)
                  );
                  const currentRoomsConfig = currentBooking?.roomsConfig || [];
                  console.log("📦 RoomTypeCard config:", roomType?.name, {
                    typeId,
                    currentRoomsConfig,
                    allBookings: confirmedBookings.map((b) => ({
                      id: b.roomTypeId,
                      name: b.roomTypeName,
                      count: b.roomsConfig.length,
                    })),
                  });
                  return (
                    <RoomTypeCard
                      key={typeId}
                      roomType={roomType}
                      roomsInType={roomsInType}
                      numRooms={numRooms}
                      selectedRoomIds={selectedRoomIds}
                      roomsConfig={currentRoomsConfig}
                      disabled={roomsInType.length < numRooms}
                      onSelectRoomType={(selectedRooms, newRoomsConfig) => {
                        setSelectedRoomIds(selectedRooms.map((r) => r.id));
                        setConfirmedBookings((prev) => {
                          const idx = prev.findIndex(
                            (b) => b.roomTypeId === (roomType?.id || 0)
                          );
                          const newBooking = {
                            roomTypeId: roomType?.id || 0,
                            roomTypeName: roomType?.name || "",
                            roomPrice: roomType?.price || 0,
                            numRooms,
                            roomsConfig: newRoomsConfig,
                          };
                          if (idx >= 0) {
                            const updated = [...prev];
                            updated[idx] = newBooking;
                            return updated;
                          } else {
                            return [...prev, newBooking];
                          }
                        });
                      }}
                      onRoomSelect={() => {}}
                    />
                  );
                })}
              </div>
            </Col>
            {}
            <Col xs={24} lg={8}>
              <div className="sticky top-0">
                {confirmedBookings.length > 0 && searchParams ? (
                  <BookingSidebar
                    checkIn={searchParams.check_in}
                    checkOut={searchParams.check_out}
                    rooms={confirmedBookings.flatMap((booking) =>
                      booking.roomsConfig.map((config, idx) => {
                        const room = rooms.find((r) => r.id === config.room_id);
                        return {
                          id: room?.id || 0,
                          name: room?.name || `Phòng ${idx + 1}`,
                          type_name: booking.roomTypeName,
                          price: config.price || booking.roomPrice,
                          num_adults: config.num_adults,
                          num_children: config.num_children,
                          num_babies: config.num_babies || 0,
                          extra_fees: config.extra_fees || 0,
                          base_price: config.base_price,
                          extra_adult_fees: config.extra_adult_fees || 0,
                          extra_child_fees: config.extra_child_fees || 0,
                          extra_adults_count: config.extra_adults_count || 0,
                          extra_children_count:
                            config.extra_children_count || 0,
                        };
                      })
                    )}
                    onRemoveRoom={(index) => {
                      let currentIndex = 0;
                      for (let i = 0; i < confirmedBookings.length; i++) {
                        const booking = confirmedBookings[i];
                        if (currentIndex + booking.roomsConfig.length > index) {
                          const roomIndexInBooking = index - currentIndex;
                          const updatedRoomsConfig = [...booking.roomsConfig];
                          updatedRoomsConfig.splice(roomIndexInBooking, 1);
                          if (updatedRoomsConfig.length === 0) {
                            setConfirmedBookings((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            );
                          } else {
                            setConfirmedBookings((prev) => {
                              const newBookings = [...prev];
                              newBookings[i] = {
                                ...newBookings[i],
                                roomsConfig: updatedRoomsConfig,
                              };
                              return newBookings;
                            });
                          }
                          break;
                        }
                        currentIndex += booking.roomsConfig.length;
                      }
                    }}
                    onCheckout={() => {
                      const allRoomsConfig = confirmedBookings.flatMap(
                        (booking) =>
                          booking.roomsConfig.map((cfg) => ({
                            ...cfg,
                            room_type_id: booking.roomTypeId,
                            room_type_name: booking.roomTypeName,
                            room_type_price: Number(
                              cfg.price || booking.roomPrice || 0
                            ),
                          }))
                      );
                      const nights = dayjs(searchParams.check_out).diff(
                        dayjs(searchParams.check_in),
                        "day"
                      );
                      const totalPrice = allRoomsConfig.reduce(
                        (sum, cfg) =>
                          sum +
                          (Number(cfg.base_price || cfg.price) +
                            Number(cfg.extra_fees || 0)) *
                            nights,
                        0
                      );
                      const items = allRoomsConfig.map((cfg) => ({
                        room_id: cfg.room_id,
                        num_adults: cfg.num_adults ?? 1,
                        num_children: cfg.num_children ?? 0,
                        num_babies: cfg.num_babies ?? 0,
                        room_type_id: cfg.room_type_id,
                        room_type_name: cfg.room_type_name,
                        room_type_price: Number(cfg.room_type_price || 0), 
                        base_price: Number(cfg.base_price || cfg.price || 0), 
                        extra_fees: Number(cfg.extra_fees || 0), 
                        extra_adult_fees: Number(cfg.extra_adult_fees || 0), 
                        extra_child_fees: Number(cfg.extra_child_fees || 0), 
                        extra_adults_count: cfg.extra_adults_count ?? 0, 
                        extra_children_count: cfg.extra_children_count ?? 0, 
                        check_in: searchParams.check_in,
                        check_out: searchParams.check_out,
                      }));
                      navigate("/bookings/confirm", {
                        state: {
                          searchParams,
                          items,
                          totalPrice, 
                        },
                      });
                    }}
                    loading={loading}
                  />
                ) : (
                  <div
                    className="bg-white p-6"
                    style={{
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <div className="text-center text-gray-500">
                      <div className="mb-4">
                        <svg
                          className="w-16 h-16 mx-auto text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Chưa chọn phòng nào
                      </h3>
                      <p className="text-sm">
                        Nhấn "Xác nhận" trên loại phòng để hệ thống tự động chọn
                        phòng phù hợp
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
};
export default RoomSearchResults;
