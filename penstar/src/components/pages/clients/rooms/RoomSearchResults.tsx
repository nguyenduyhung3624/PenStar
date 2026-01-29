/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message, Spin, Empty, Button, Row, Col } from "antd";
import { searchAllRoomsWithAvailability } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import type { Room, RoomSearchParams } from "@/types/room";
import type { RoomType } from "@/types/roomtypes";
import type { RoomBookingConfig } from "@/types/roomBooking";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarOutlined } from "@ant-design/icons";
import RoomSearchBar from "@/components/common/RoomSearchBar";
import BookingSidebar from "@/components/common/BookingSidebar";
import RoomTypeCard from "./RoomTypeCard";
import dayjs from "@/utils/dayjs";
const RoomSearchResults = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<RoomSearchParams | null>(
    location.state?.searchParams || null,
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
        `Đã tự động chọn ${location.state.autoSelectedRoomIds.length} phòng từ catalog`,
      );
    }
  }, []);
  const handleSearch = async (params: RoomSearchParams) => {
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["roomtypes"] });
    }, 500);
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
        (r: Room) => r.is_available,
      ).length;
      message.success(
        `Tìm thấy ${response.data.length} phòng (${available} trống)`,
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
        {} as Record<number, Room[]>,
      ),
    [rooms],
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <RoomSearchBar
            onSearch={handleSearch}
            loading={loading}
            variant="inline"
            requireAuthForSearch={false}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb & Search Info */}
        <div className="mb-6">
          {searchParams && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                  <CalendarOutlined className="text-yellow-600" />
                  <span className="font-semibold text-gray-800">
                    {dayjs(searchParams.check_in).format("DD/MM/YYYY")}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="font-semibold text-gray-800">
                    {dayjs(searchParams.check_out).format("DD/MM/YYYY")}
                  </span>
                </div>
                {searchParams.num_rooms && (
                  <div className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-md font-medium text-sm">
                    {searchParams.num_rooms} Phòng
                  </div>
                )}
              </div>
              <div className="text-gray-500 text-sm">
                Tìm thấy{" "}
                <strong className="text-gray-800">
                  {Object.keys(roomsByType).length}
                </strong>{" "}
                loại phòng phù hợp
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12">
            <Row gutter={24}>
              <Col xs={24} lg={16}>
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                      <Spin size="large" />
                    </div>
                  ))}
                </div>
              </Col>
              <Col xs={24} lg={8}>
                <div className="bg-white p-6 rounded-xl shadow-sm h-64"></div>
              </Col>
            </Row>
          </div>
        ) : Object.keys(roomsByType).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Empty
              description={
                <span className="text-gray-500 text-lg">
                  Không tìm thấy phòng trống cho giai đoạn này
                </span>
              }
            >
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/")}
                className="mt-4"
              >
                Quay về trang chủ & Tìm ngày khác
              </Button>
            </Empty>
          </div>
        ) : (
          <Row gutter={24}>
            {/* Room List */}
            <Col xs={24} lg={16}>
              <div className="space-y-6">
                {Object.entries(roomsByType).map(([typeId, roomsInType]) => {
                  const roomType = roomTypes.find(
                    (rt) => rt.id === Number(typeId),
                  );
                  const currentBooking = confirmedBookings.find(
                    (b) => b.roomTypeId === Number(typeId),
                  );
                  const currentRoomsConfig = currentBooking?.roomsConfig || [];

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
                            (b) => b.roomTypeId === (roomType?.id || 0),
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

            {/* Sidebar */}
            <Col xs={24} lg={8}>
              <div className="sticky top-24">
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
                      }),
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
                              prev.filter((_, idx) => idx !== i),
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
                              cfg.price || booking.roomPrice || 0,
                            ),
                          })),
                      );
                      const nights = dayjs(searchParams.check_out).diff(
                        dayjs(searchParams.check_in),
                        "day",
                      );
                      const totalPrice = allRoomsConfig.reduce(
                        (sum, cfg) =>
                          sum +
                          (Number(cfg.base_price || cfg.price) +
                            Number(cfg.extra_fees || 0)) *
                            nights,
                        0,
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center sticky top-24">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarOutlined className="text-2xl text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      Giỏ hàng trống
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Chọn phòng và bấm "Xác nhận" để thêm vào giỏ hàng của bạn.
                    </p>
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
