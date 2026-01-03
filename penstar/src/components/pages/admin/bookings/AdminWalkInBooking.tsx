/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  DatePicker,
  Select,
  Typography,
  Divider,
  Row,
  Col,
  Alert,
  Spin,
  Radio,
  InputNumber,
  Table,
  Space,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getRooms } from "@/services/roomsApi";
import { createBooking } from "@/services/bookingsApi";
import type { RoomType } from "@/types/roomtypes";
import dayjs from "@/utils/dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Room {
  id: number;
  name: string;
  type_id: number;
  status: string;
  floor_id?: number;
  floor_name?: string;
}

interface SelectedRoom {
  id: string; // unique key for the row
  roomId: number | null;
  roomTypeId: number;
  numAdults: number;
  numChildren: number;
  // Calculated
  basePrice: number;
  extraAdultFees: number;
  extraChildFees: number;
  totalPrice: number;
  extraAdultsCount: number;
  extraChildrenCount: number;
}

const AdminWalkInBooking = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [immediateCheckin, setImmediateCheckin] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);

  // Load room types
  const { data: roomTypes = [], isLoading: loadingTypes } = useQuery<
    RoomType[]
  >({
    queryKey: ["roomTypes"],
    queryFn: getRoomTypes,
  });

  // Load all rooms
  const { data: allRooms = [], isLoading: loadingRooms } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  // Calculate nights
  const nights = useMemo(() => {
    if (!dateRange) return 0;
    return dateRange[1].diff(dateRange[0], "day");
  }, [dateRange]);

  // Check if check-in date is today (can only check-in immediately if today)
  const isCheckInToday = useMemo(() => {
    if (!dateRange) return false;
    return dateRange[0].isSame(dayjs(), "day");
  }, [dateRange]);

  // Auto-disable immediate checkin if not today
  useMemo(() => {
    if (!isCheckInToday && immediateCheckin) {
      setImmediateCheckin(false);
    }
  }, [isCheckInToday, immediateCheckin]);

  // Get available rooms by room type (excluding already selected)
  const getAvailableRooms = useCallback(
    (roomTypeId: number, excludeRoomId?: number) => {
      const selectedRoomIds = selectedRooms
        .filter((r) => r.roomId !== excludeRoomId)
        .map((r) => r.roomId);
      return allRooms.filter(
        (room) =>
          room.type_id === roomTypeId &&
          room.status === "available" &&
          !selectedRoomIds.includes(room.id)
      );
    },
    [allRooms, selectedRooms]
  );

  // Calculate extra fees for a room
  const calculateExtraFees = useCallback(
    (
      roomTypeId: number,
      numAdults: number,
      numChildren: number
    ): {
      basePrice: number;
      extraAdultFees: number;
      extraChildFees: number;
      totalPrice: number;
      extraAdultsCount: number;
      extraChildrenCount: number;
    } => {
      const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
      if (!roomType) {
        return {
          basePrice: 0,
          extraAdultFees: 0,
          extraChildFees: 0,
          totalPrice: 0,
          extraAdultsCount: 0,
          extraChildrenCount: 0,
        };
      }

      const basePrice = roomType.price || 0;
      const baseAdults = roomType.base_adults || 2;
      const baseChildren = roomType.base_children || 0;
      const extraAdultFee = Number(roomType.extra_adult_fee) || 0;
      const extraChildFee = Number(roomType.extra_child_fee) || 0;

      const extraAdultsCount = Math.max(0, numAdults - baseAdults);
      const extraChildrenCount = Math.max(0, numChildren - baseChildren);

      const extraAdultFees = extraAdultsCount * extraAdultFee;
      const extraChildFees = extraChildrenCount * extraChildFee;
      const totalPrice = basePrice + extraAdultFees + extraChildFees;

      return {
        basePrice,
        extraAdultFees,
        extraChildFees,
        totalPrice,
        extraAdultsCount,
        extraChildrenCount,
      };
    },
    [roomTypes]
  );

  // Add new room
  const handleAddRoom = () => {
    if (roomTypes.length === 0) {
      message.warning("Chưa có loại phòng nào");
      return;
    }
    const defaultRoomType = roomTypes[0];
    const fees = calculateExtraFees(defaultRoomType.id, 1, 0);
    setSelectedRooms((prev) => [
      ...prev,
      {
        id: `room-${Date.now()}`,
        roomId: null,
        roomTypeId: defaultRoomType.id,
        numAdults: 1,
        numChildren: 0,
        ...fees,
      },
    ]);
  };

  // Remove room
  const handleRemoveRoom = (id: string) => {
    setSelectedRooms((prev) => prev.filter((r) => r.id !== id));
  };

  // Update room
  const handleUpdateRoom = (
    id: string,
    field: keyof SelectedRoom,
    value: any
  ) => {
    setSelectedRooms((prev) =>
      prev.map((room) => {
        if (room.id !== id) return room;

        const updated = { ...room, [field]: value };

        // Recalculate fees when room type or guests change
        if (
          field === "roomTypeId" ||
          field === "numAdults" ||
          field === "numChildren"
        ) {
          const newTypeId = field === "roomTypeId" ? value : room.roomTypeId;
          const newAdults = field === "numAdults" ? value : room.numAdults;
          const newChildren =
            field === "numChildren" ? value : room.numChildren;

          // Reset room selection if type changes
          if (field === "roomTypeId") {
            updated.roomId = null;
          }

          const fees = calculateExtraFees(newTypeId, newAdults, newChildren);
          return { ...updated, ...fees };
        }

        return updated;
      })
    );
  };

  // Calculate total
  const totalPrice = useMemo(() => {
    return selectedRooms.reduce(
      (sum, room) => sum + room.totalPrice * nights,
      0
    );
  }, [selectedRooms, nights]);

  const totalExtraFees = useMemo(() => {
    return selectedRooms.reduce(
      (sum, room) => sum + (room.extraAdultFees + room.extraChildFees) * nights,
      0
    );
  }, [selectedRooms, nights]);

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      if (!dateRange) {
        message.error("Vui lòng chọn ngày nhận và trả phòng");
        return;
      }

      if (selectedRooms.length === 0) {
        message.error("Vui lòng thêm ít nhất 1 phòng");
        return;
      }

      // Check all rooms have been selected
      const unselectedRooms = selectedRooms.filter((r) => !r.roomId);
      if (unselectedRooms.length > 0) {
        message.error("Vui lòng chọn phòng cụ thể cho tất cả các mục");
        return;
      }

      if (nights > 30) {
        message.error("Không thể đặt phòng quá 30 đêm");
        return;
      }

      setLoading(true);

      const checkIn = dateRange[0].format("YYYY-MM-DD");
      const checkOut = dateRange[1].format("YYYY-MM-DD");

      const bookingData = {
        customer_name: values.customer_name,
        customer_email: values.customer_email || null,
        customer_phone: values.customer_phone,
        notes: values.notes || null,
        total_price: totalPrice,
        // Check-in ngay = đã thanh toán, không thì = chờ thanh toán
        payment_status: immediateCheckin ? "paid" : "pending",
        payment_method: paymentMethod,
        booking_method: "offline",
        // Check-in ngay = checked_in (2), không thì = reserved (1) - hold phòng
        stay_status_id: immediateCheckin ? 2 : 1,
        items: selectedRooms.map((room) => ({
          room_id: room.roomId,
          room_type_id: room.roomTypeId,
          check_in: checkIn,
          check_out: checkOut,
          room_type_price: room.totalPrice * nights,
          base_price: room.basePrice,
          extra_fees: room.extraAdultFees + room.extraChildFees,
          extra_adult_fees: room.extraAdultFees,
          extra_child_fees: room.extraChildFees,
          extra_adults_count: room.extraAdultsCount,
          extra_children_count: room.extraChildrenCount,
          num_adults: room.numAdults,
          num_children: room.numChildren,
        })),
      };

      const booking = await createBooking(bookingData as any);
      message.success(
        immediateCheckin
          ? "Đã tạo booking và check-in thành công!"
          : "Đã tạo booking thành công! Phòng đã được hold cho khách."
      );
      navigate(`/admin/bookings/${booking.id}`);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      message.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo booking"
      );
    } finally {
      setLoading(false);
    }
  };

  // Table columns for rooms
  const columns = [
    {
      title: "Loại phòng",
      dataIndex: "roomTypeId",
      key: "roomTypeId",
      width: 200,
      render: (value: number, record: SelectedRoom) => (
        <Select
          value={value}
          onChange={(v) => handleUpdateRoom(record.id, "roomTypeId", v)}
          style={{ width: "100%" }}
        >
          {roomTypes.map((rt) => (
            <Select.Option key={rt.id} value={rt.id}>
              {rt.name}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Phòng",
      dataIndex: "roomId",
      key: "roomId",
      width: 150,
      render: (value: number | null, record: SelectedRoom) => {
        const available = getAvailableRooms(
          record.roomTypeId,
          value || undefined
        );
        return (
          <Select
            value={value}
            onChange={(v) => handleUpdateRoom(record.id, "roomId", v)}
            style={{ width: "100%" }}
            placeholder="Chọn phòng"
          >
            {available.map((room) => (
              <Select.Option key={room.id} value={room.id}>
                {room.name}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Người lớn",
      dataIndex: "numAdults",
      key: "numAdults",
      width: 100,
      render: (value: number, record: SelectedRoom) => (
        <InputNumber
          min={1}
          max={5}
          value={value}
          onChange={(v) => handleUpdateRoom(record.id, "numAdults", v || 1)}
        />
      ),
    },
    {
      title: "Trẻ em",
      dataIndex: "numChildren",
      key: "numChildren",
      width: 100,
      render: (value: number, record: SelectedRoom) => (
        <InputNumber
          min={0}
          max={3}
          value={value}
          onChange={(v) => handleUpdateRoom(record.id, "numChildren", v || 0)}
        />
      ),
    },
    {
      title: "Giá/đêm",
      key: "price",
      width: 180,
      render: (_: any, record: SelectedRoom) => (
        <div>
          <div>{record.basePrice.toLocaleString("vi-VN")} ₫</div>
          {(record.extraAdultFees > 0 || record.extraChildFees > 0) && (
            <div className="text-xs text-orange-500">
              +
              {(record.extraAdultFees + record.extraChildFees).toLocaleString(
                "vi-VN"
              )}{" "}
              ₫ phụ phí
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Thành tiền",
      key: "total",
      width: 150,
      render: (_: any, record: SelectedRoom) => (
        <Text strong style={{ color: "#d97706" }}>
          {(record.totalPrice * nights).toLocaleString("vi-VN")} ₫
        </Text>
      ),
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_: any, record: SelectedRoom) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveRoom(record.id)}
        />
      ),
    },
  ];

  return (
    <div className="bg-gray-50 py-6 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <Card>
          <Title level={3} className="mb-6">
            <CalendarOutlined className="mr-2" />
            Đặt phòng trực tiếp
          </Title>

          <Form form={form} layout="vertical">
            {/* Date Range */}
            <Card size="small" className="mb-4" title="1. Chọn ngày">
              <Form.Item
                name="dateRange"
                rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
              >
                <RangePicker
                  size="large"
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder={["Ngày nhận phòng", "Ngày trả phòng"]}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setDateRange([dates[0], dates[1]]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                />
              </Form.Item>
              {dateRange && (
                <Text type="secondary">
                  Số đêm: <strong>{nights}</strong>
                </Text>
              )}
            </Card>

            {/* Room Selection */}
            <Card
              size="small"
              className="mb-4"
              title="2. Chọn phòng"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddRoom}
                  disabled={loadingTypes || loadingRooms}
                >
                  Thêm phòng
                </Button>
              }
            >
              {loadingTypes || loadingRooms ? (
                <Spin />
              ) : selectedRooms.length === 0 ? (
                <Alert
                  type="info"
                  message="Chưa có phòng nào. Nhấn 'Thêm phòng' để bắt đầu."
                  showIcon
                />
              ) : (
                <>
                  <Table
                    dataSource={selectedRooms}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />

                  {/* Extra fees info */}
                  {totalExtraFees > 0 && (
                    <Alert
                      type="warning"
                      className="mt-3"
                      message={
                        <span>
                          Tổng phụ phí (người lớn/trẻ em thêm):{" "}
                          <strong>
                            {totalExtraFees.toLocaleString("vi-VN")} ₫
                          </strong>
                        </span>
                      }
                      showIcon
                    />
                  )}
                </>
              )}
            </Card>

            {/* Customer Info */}
            <Card size="small" className="mb-4" title="3. Thông tin khách hàng">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="customer_name"
                    label="Tên khách hàng"
                    rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                  >
                    <Input
                      size="large"
                      prefix={<UserOutlined />}
                      placeholder="Họ và tên"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="customer_phone"
                    label="Số điện thoại"
                    rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
                  >
                    <Input
                      size="large"
                      prefix={<PhoneOutlined />}
                      placeholder="Số điện thoại"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="customer_email" label="Email (tùy chọn)">
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="Email"
                />
              </Form.Item>
              <Form.Item name="notes" label="Ghi chú">
                <Input.TextArea rows={2} placeholder="Ghi chú (tùy chọn)" />
              </Form.Item>
            </Card>

            {/* Payment & Confirm */}
            <Card
              size="small"
              className="mb-4"
              title="4. Thanh toán & Xác nhận"
            >
              <Form.Item label="Phương thức thanh toán">
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  size="large"
                >
                  <Radio.Button value="cash">Tiền mặt</Radio.Button>
                  <Radio.Button value="card">Thẻ</Radio.Button>
                  <Radio.Button value="transfer">Chuyển khoản</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item>
                <label
                  className={`flex items-center gap-2 ${isCheckInToday ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={immediateCheckin}
                    onChange={(e) => setImmediateCheckin(e.target.checked)}
                    disabled={!isCheckInToday}
                    className="w-4 h-4"
                  />
                  <span>
                    <CheckCircleOutlined className="text-green-500 mr-1" />
                    Check-in ngay lập tức
                  </span>
                </label>
                <div className="text-xs text-gray-500 mt-1">
                  {!isCheckInToday ? (
                    <span className="text-orange-500">
                      Chỉ có thể check-in ngay khi đặt phòng cho hôm nay
                    </span>
                  ) : immediateCheckin ? (
                    "Khách check-in ngay + Đã thanh toán"
                  ) : (
                    "Phòng được hold (giữ chỗ), khách thanh toán khi đến"
                  )}
                </div>
              </Form.Item>

              <Divider />

              {/* Summary */}
              {selectedRooms.length > 0 && dateRange && (
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <Row justify="space-between" className="mb-2">
                    <Col>
                      <Text>Số phòng:</Text>
                    </Col>
                    <Col>
                      <Text strong>{selectedRooms.length} phòng</Text>
                    </Col>
                  </Row>
                  <Row justify="space-between" className="mb-2">
                    <Col>
                      <Text>Số đêm:</Text>
                    </Col>
                    <Col>
                      <Text strong>{nights} đêm</Text>
                    </Col>
                  </Row>
                  {totalExtraFees > 0 && (
                    <Row justify="space-between" className="mb-2">
                      <Col>
                        <Text>Phụ phí:</Text>
                      </Col>
                      <Col>
                        <Text type="warning">
                          +{totalExtraFees.toLocaleString("vi-VN")} ₫
                        </Text>
                      </Col>
                    </Row>
                  )}
                  <Divider className="my-2" />
                  <Row justify="space-between">
                    <Col>
                      <Text strong style={{ fontSize: 16 }}>
                        Tổng cộng:
                      </Text>
                    </Col>
                    <Col>
                      <Text strong style={{ fontSize: 20, color: "#d97706" }}>
                        {totalPrice.toLocaleString("vi-VN")} ₫
                      </Text>
                    </Col>
                  </Row>
                </div>
              )}

              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  onClick={handleSubmit}
                  disabled={selectedRooms.length === 0 || !dateRange}
                  icon={<CheckCircleOutlined />}
                >
                  {immediateCheckin
                    ? "Xác nhận & Check-in"
                    : "Xác nhận đặt phòng"}
                </Button>
                <div className="text-center text-xs text-gray-500">
                  Booking admin luôn được xác nhận ngay (không cần duyệt)
                </div>
              </Space>
            </Card>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default AdminWalkInBooking;
