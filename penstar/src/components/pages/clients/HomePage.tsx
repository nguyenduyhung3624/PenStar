import type { RoomSearchParams } from "@/types/room";
import RoomSearchBar from "@/components/common/RoomSearchBar";
import bannerImage from "@/assets/images/banner-tin-tuc-uu-dai_1686539225_1686815922.jpg";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getServices } from "@/services/servicesApi";
import { getAvailableVouchers } from "@/services/discountApi";
import { getImageUrl } from "@/utils/imageUtils";
import { Tag, Button, message, Modal, Descriptions } from "antd";
import { CopyOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { RoomType } from "@/types/roomtypes";

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const FREE_SERVICES = [
    "Bữa sáng miễn phí",
    "Truy cập Wifi tốc độ cao",
    "Sử dụng hồ bơi vô cực",
    "Phòng tập Gym hiện đại",
    "Nước uống chào mừng",
    "Dịch vụ dọn phòng 24/7",
  ];

  // Fetch Room Types
  const { data: roomTypes = [] } = useQuery({
    queryKey: ["roomTypes"],
    queryFn: getRoomTypes,
  });

  // Fetch Services
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });

  // Fetch Discount Codes
  const { data: discountResponse } = useQuery({
    queryKey: ["discountCodes"],
    queryFn: getAvailableVouchers,
  });

  const discountCodes = discountResponse?.data || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const activeDiscounts = Array.isArray(discountCodes)
    ? discountCodes.filter((code) => {
        const now = new Date();
        const start = new Date(code.start_date);
        const end = new Date(code.end_date);
        const isActive = code.status === "active" && now >= start && now <= end;
        return (
          isActive &&
          (code.max_uses > 0 ||
            code.max_uses === null ||
            code.max_uses === undefined)
        );
      })
    : [];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success(`Đã sao chép mã: ${code}`);
  };

  const showRoomDetail = (room: RoomType) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Hero Section */}
      <section className="relative flex flex-col items-stretch justify-end overflow-visible p-0">
        <div className="w-full relative h-[500px]">
          <img
            src={bannerImage}
            alt="PenStar Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
              Trải Nghiệm Đẳng Cấp
            </h1>
            <p className="text-xl md:text-2xl font-light drop-shadow-md">
              Tại PenStar Hotel
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div
          className="absolute left-1/2 bottom-0 w-full flex justify-center z-20"
          style={{ transform: "translate(-50%, 50%)" }}
        >
          <div className="w-full max-w-6xl px-4">
            <div>
              <RoomSearchBar
                onSearch={(params: RoomSearchParams) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { num_rooms, ...rest } = params as RoomSearchParams & {
                    num_rooms?: number;
                  };
                  navigate("/rooms/search-results", {
                    state: { searchParams: rest },
                  });
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Room Types */}
      <section className="pt-32 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-gray-800">
              HẠNG PHÒNG <span className="text-yellow-600">NỔI BẬT</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Khám phá không gian nghỉ dưỡng sang trọng và tiện nghi bậc nhất.
              Lựa chọn hạng phòng phù hợp nhất cho kỳ nghỉ của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomTypes?.slice(0, 6).map((roomType: RoomType) => (
              <div
                key={roomType.id}
                className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={getImageUrl(roomType.thumbnail)}
                    alt={roomType.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                    onClick={() => showRoomDetail(roomType)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/600x400?text=PenStar+Hotel";
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-yellow-600 shadow-sm">
                    {roomType.capacity} Người
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3
                    className="text-xl font-bold text-gray-800 mb-2 group-hover:text-yellow-600 transition-colors cursor-pointer"
                    onClick={() => showRoomDetail(roomType)}
                  >
                    {roomType.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
                    {roomType.description}
                  </p>
                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <div className="text-xs text-gray-400">Giá chỉ từ</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatPrice(roomType.price || 0)}
                        <span className="text-xs text-gray-400 font-normal">
                          /đêm
                        </span>
                      </div>
                    </div>
                    <Button
                      type="primary"
                      className="bg-yellow-600 hover:bg-yellow-500 border-none shadow-md font-semibold"
                      onClick={() => showRoomDetail(roomType)}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="large"
              onClick={() => {
                // Default search: Checkin tomorrow, Checkout day after tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dayAfterTomorrow = new Date(tomorrow);
                dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

                navigate("/rooms/search-results", {
                  state: {
                    searchParams: {
                      check_in: tomorrow.toISOString().split("T")[0],
                      check_out: dayAfterTomorrow.toISOString().split("T")[0],
                      status: "available",
                      booking_statuses: [1, 2, 6],
                    },
                  },
                });
              }}
              className="border-yellow-600 text-yellow-600 hover:text-yellow-700 hover:border-yellow-700 font-medium px-8"
            >
              Xem Tất Cả Phòng
            </Button>
          </div>
        </div>
      </section>

      {/* Hotel Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-gray-800">
              DỊCH VỤ & <span className="text-yellow-600">TIỆN NGHI</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Tận hưởng trọn vẹn kỳ nghỉ với các dịch vụ đẳng cấp 5 sao.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {services.slice(0, 8).map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-center group border border-gray-100"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-100 transition-colors overflow-hidden">
                  {service.thumbnail ? (
                    <img
                      src={getImageUrl(service.thumbnail)}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Tag className="text-2xl text-yellow-500 border-none bg-transparent">
                      ★
                    </Tag>
                  )}
                </div>
                <h4 className="font-bold text-gray-800 mb-1 group-hover:text-yellow-600 transition-colors">
                  {service.name}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {service.description}
                </p>
                <div className="text-yellow-600 font-semibold text-sm">
                  {formatPrice(service.price)}
                  {service.unit && (
                    <span className="text-gray-400 font-normal text-xs">
                      /{service.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive Offers / Vouchers */}
      {activeDiscounts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3 text-gray-800">
                ƯU ĐÃI <span className="text-red-500">ĐỘC QUYỀN</span>
              </h2>
              <p className="text-gray-500">
                Nhận ngay mã giảm giá hấp dẫn cho kỳ nghỉ của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeDiscounts.map((code) => (
                <div
                  key={code.id}
                  className="relative bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-1 shadow-lg text-white transform hover:-translate-y-1 transition-transform"
                >
                  <div className="bg-white h-full rounded-lg p-5 flex flex-col justify-between relative overflow-hidden">
                    {/* Decorative Circles */}
                    <div className="absolute -left-3 top-1/2 w-6 h-6 bg-gray-100 rounded-full transform -translate-y-1/2"></div>
                    <div className="absolute -right-3 top-1/2 w-6 h-6 bg-gray-100 rounded-full transform -translate-y-1/2"></div>

                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Tag color="red" className="m-0 font-bold">
                          GIẢM GIÁ
                        </Tag>
                        <div className="text-gray-400 text-xs">
                          HSD:{" "}
                          {new Date(code.end_date).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                      <h3 className="text-gray-800 font-bold text-lg mb-1">
                        {code.code}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        Giảm{" "}
                        {code.type === "percent"
                          ? `${code.value}%`
                          : formatPrice(code.value)}
                        {code.min_total > 0 &&
                          ` cho đơn từ ${formatPrice(code.min_total)}`}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                      <span className="text-red-500 font-bold text-xl">
                        {code.type === "percent"
                          ? `${code.value}% OFF`
                          : `-${formatPrice(code.value)}`}
                      </span>
                      <Button
                        icon={<CopyOutlined />}
                        size="small"
                        type="dashed"
                        danger
                        onClick={() => handleCopyCode(code.code)}
                      >
                        Sao chép
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Room Detail Modal */}
      <Modal
        title={
          <span className="text-xl font-bold text-yellow-600">
            {selectedRoom?.name}
          </span>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Đóng
          </Button>,
        ]}
        width={800}
        centered
      >
        {selectedRoom && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <img
                src={getImageUrl(selectedRoom.thumbnail)}
                alt={selectedRoom.name}
                className="w-full h-64 object-cover rounded-lg shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/600x400?text=PenStar+Hotel";
                }}
              />
              <div className="mt-4">
                <h4 className="font-bold text-gray-800 mb-2">
                  Tiện ích đi kèm miễn phí:
                </h4>
                <ul className="grid grid-cols-1 gap-2">
                  {FREE_SERVICES.map((service, index) => (
                    <li
                      key={index}
                      className="flex items-center text-gray-600 text-sm"
                    >
                      <CheckCircleOutlined className="text-yellow-600 mr-2" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Sức chứa">
                  {selectedRoom.capacity} Người
                </Descriptions.Item>
                <Descriptions.Item label="Giá phòng">
                  <span className="text-lg font-bold text-red-600">
                    {formatPrice(selectedRoom.price || 0)}
                  </span>{" "}
                  / đêm
                </Descriptions.Item>
                {selectedRoom.bed_type && (
                  <Descriptions.Item label="Loại giường">
                    {selectedRoom.bed_type}
                  </Descriptions.Item>
                )}
                {selectedRoom.view_direction && (
                  <Descriptions.Item label="Hướng nhìn">
                    {selectedRoom.view_direction}
                  </Descriptions.Item>
                )}
                {selectedRoom.room_size && (
                  <Descriptions.Item label="Diện tích">
                    {selectedRoom.room_size} m²
                  </Descriptions.Item>
                )}
              </Descriptions>
              <div className="mt-4">
                <h4 className="font-bold text-gray-800 mb-2">Mô tả:</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {selectedRoom.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HomePage;
