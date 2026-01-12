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
  Radio,
  InputNumber,
  Table,
  Space,
  Steps,
  Upload,
  Image,
  Empty,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  SolutionOutlined,
  CreditCardOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getRooms } from "@/services/roomsApi";
import { createBooking, uploadBookingReceipt } from "@/services/bookingsApi";
import type { RoomType } from "@/types/roomtypes";
import dayjs from "@/utils/dayjs";
import type { UploadFile } from "antd/es/upload/interface";

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
  id: string;
  roomId: number | null;
  roomTypeId: number;
  numAdults: number;
  numChildren: number;
  numBabies: number;
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
  const [currentStep, setCurrentStep] = useState(0);

  // Data States
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [immediateCheckin, setImmediateCheckin] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  const { data: roomTypes = [], isLoading: loadingTypes } = useQuery<
    RoomType[]
  >({
    queryKey: ["roomTypes"],
    queryFn: getRoomTypes,
  });

  const { data: allRooms = [], isLoading: loadingRooms } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const nights = useMemo(() => {
    if (!dateRange) return 0;
    return dateRange[1].diff(dateRange[0], "day");
  }, [dateRange]);

  const isCheckInToday = useMemo(() => {
    if (!dateRange) return false;
    return dateRange[0].isSame(dayjs(), "day");
  }, [dateRange]);

  useMemo(() => {
    if (!isCheckInToday && immediateCheckin) {
      setImmediateCheckin(false);
    }
  }, [isCheckInToday, immediateCheckin]);

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

  const calculateExtraFees = useCallback(
    (roomTypeId: number, numAdults: number, numChildren: number) => {
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
      const basePrice = Number(roomType.price) || 0;
      // Fallback: If base_adults is not set, use capacity or default to 2
      const baseAdults =
        roomType.base_adults !== undefined && roomType.base_adults !== null
          ? Number(roomType.base_adults)
          : Number(roomType.capacity) || 2;
      const baseChildren = Number(roomType.base_children) || 0;
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
        numBabies: 0,
        ...fees,
      },
    ]);
  };

  const handleRemoveRoom = (id: string) => {
    setSelectedRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRoom = (
    id: string,
    field: keyof SelectedRoom,
    value: any
  ) => {
    setSelectedRooms((prev) =>
      prev.map((room) => {
        if (room.id !== id) return room;
        const updated = { ...room, [field]: value };

        if (
          field === "roomTypeId" ||
          field === "numAdults" ||
          field === "numChildren"
        ) {
          const newTypeId = field === "roomTypeId" ? value : room.roomTypeId;
          const newAdults = field === "numAdults" ? value : room.numAdults;
          const newChildren =
            field === "numChildren" ? value : room.numChildren;

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

  const totalPrice = useMemo(() => {
    return selectedRooms.reduce(
      (sum, room) => sum + room.totalPrice * nights,
      0
    );
  }, [selectedRooms, nights]);

  // Steps Navigation
  const next = async () => {
    try {
      if (currentStep === 0) {
        // Validate Step 1: Date & Rooms
        await form.validateFields(["dateRange"]);
        if (selectedRooms.length === 0) {
          message.error("Vui lòng chọn ít nhất 1 phòng");
          return;
        }
        const unselected = selectedRooms.filter((r) => !r.roomId);
        if (unselected.length > 0) {
          message.error("Vui lòng chọn số phòng cụ thể cho tất cả các mục");
          return;
        }

        // Validate Capacity
        for (const room of selectedRooms) {
          const roomType = roomTypes.find((rt) => rt.id === room.roomTypeId);
          const rObj = allRooms.find((r) => r.id === room.roomId);
          const roomName = rObj ? rObj.name : roomType?.name || "Phòng";
          const capacity = roomType?.capacity || 2;
          const totalGuests = room.numAdults + room.numChildren;
          if (totalGuests > capacity) {
            message.error(
              `${roomName}: Tổng số khách (${totalGuests}) vượt quá sức chứa tối đa (${capacity})`
            );
            return;
          }
        }
      } else if (currentStep === 1) {
        // Validate Step 2: Customer Info
        await form.validateFields([
          "customer_name",
          "customer_phone",
          "customer_email",
        ]);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // Validation failed
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      if (paymentMethod === "transfer" && fileList.length === 0) {
        message.error("Vui lòng upload ảnh bill chuyển khoản");
        return;
      }

      setLoading(true);
      const values = form.getFieldsValue();
      const checkIn = dateRange![0].format("YYYY-MM-DD");
      const checkOut = dateRange![1].format("YYYY-MM-DD");

      // Upload Image if exists
      let paymentProofUrl = null;
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        if (file) {
          const uploadRes = await uploadBookingReceipt(file);
          paymentProofUrl = uploadRes.url;
        }
      }

      const bookingData = {
        customer_name: values.customer_name,
        customer_email: values.customer_email || null,
        customer_phone: values.customer_phone,
        notes: values.notes || null,
        total_price: totalPrice,
        payment_status: "paid", // Admin booking implies paid or verified
        payment_method: paymentMethod,
        booking_method: "offline",
        stay_status_id: immediateCheckin ? 2 : 1, // 2: Check-in, 1: Booked (Confirmed)
        payment_proof_image: paymentProofUrl,
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
          num_babies: room.numBabies || 0,
        })),
      };

      const booking = await createBooking(bookingData as any);
      message.success("Tạo booking thành công! Đơn hàng đã được xác nhận.");
      navigate(`/admin/bookings/${booking.id}`);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      message.error(error?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: any = {
    onRemove: (file: any) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file: any) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile = {
          ...file,
          thumbUrl: reader.result as string,
        };
        setFileList([newFile]);
      };
      reader.readAsDataURL(file);
      return false;
    },
    fileList,
  };

  const handlePreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as any);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    setPreviewImage(src);
    setPreviewOpen(true);
  };

  // Columns for Table (Step 1)
  const columns = [
    {
      title: "Loại phòng",
      dataIndex: "roomTypeId",
      key: "roomTypeId",
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
            status={!value ? "error" : ""}
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
      title: "Khách",
      key: "guests",
      render: (_: any, record: SelectedRoom) => (
        <Space>
          <InputNumber
            min={1}
            max={5}
            value={record.numAdults}
            onChange={(v) => handleUpdateRoom(record.id, "numAdults", v || 1)}
            addonBefore="Lớn"
            style={{ width: 100 }}
          />
          <InputNumber
            min={0}
            max={3}
            value={record.numChildren}
            onChange={(v) => handleUpdateRoom(record.id, "numChildren", v || 0)}
            addonBefore="Trẻ"
            style={{ width: 100 }}
          />
          <InputNumber
            min={0}
            max={3}
            value={record.numBabies}
            onChange={(v) => handleUpdateRoom(record.id, "numBabies", v || 0)}
            addonBefore="Bé"
            style={{ width: 100 }}
          />
        </Space>
      ),
    },
    {
      title: "Giá tạm tính",
      key: "total",
      align: "right" as const,
      render: (_: any, record: SelectedRoom) => {
        const total = Math.round(record.totalPrice * (nights || 1));
        const base = Math.round(record.basePrice * (nights || 1));
        const extraAdult = Math.round(record.extraAdultFees * (nights || 1));
        const extraChild = Math.round(record.extraChildFees * (nights || 1));
        const hasExtra = extraAdult > 0 || extraChild > 0;

        return (
          <div className="flex flex-col items-end">
            <Text strong style={{ color: "#d97706" }}>
              {total.toLocaleString("vi-VN")} ₫
            </Text>
            {hasExtra && (
              <div className="flex flex-col items-end text-[10px] text-gray-500">
                <span>Gốc: {base.toLocaleString("vi-VN")}</span>
                {extraAdult > 0 && (
                  <span>+ NL: {extraAdult.toLocaleString("vi-VN")}</span>
                )}
                {extraChild > 0 && (
                  <span>+ TE: {extraChild.toLocaleString("vi-VN")}</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
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

  const steps = [
    {
      title: "Chọn phòng",
      icon: <HomeOutlined />,
      content: (
        <Space direction="vertical" className="w-full" size="middle">
          <Card
            size="small"
            title="Thời gian lưu trú"
            bordered={false}
            className="shadow-sm"
          >
            <Form.Item
              name="dateRange"
              rules={[{ required: true, message: "Chọn ngày!" }]}
              style={{ marginBottom: 0 }}
            >
              <RangePicker
                size="large"
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                onChange={(dates) =>
                  dates
                    ? setDateRange([dates[0]!, dates[1]!])
                    : setDateRange(null)
                }
              />
            </Form.Item>
            {nights > 0 && (
              <Alert
                type="info"
                message={`Đã chọn ${nights} đêm`}
                showIcon
                className="mt-2"
              />
            )}
          </Card>

          <Card
            size="small"
            title="Danh sách phòng"
            bordered={false}
            className="shadow-sm"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRoom}
                disabled={!dateRange}
              >
                Thêm phòng
              </Button>
            }
          >
            {selectedRooms.length === 0 ? (
              <Empty description="Vui lòng chọn ngày và thêm phòng" />
            ) : (
              <Table
                dataSource={selectedRooms}
                columns={columns}
                pagination={false}
                rowKey="id"
                size="small"
                loading={loadingTypes || loadingRooms}
              />
            )}
            {selectedRooms.length > 0 && (
              <div className="flex justify-end mt-4">
                <Text className="text-lg">
                  Tổng cộng:{" "}
                  <strong className="text-orange-600">
                    {totalPrice.toLocaleString("vi-VN")} ₫
                  </strong>
                </Text>
              </div>
            )}
          </Card>
        </Space>
      ),
    },
    {
      title: "Thông tin khách",
      icon: <SolutionOutlined />,
      content: (
        <Card bordered={false} className="shadow-sm">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_name"
                label="Tên khách hàng"
                rules={[{ required: true, message: "Nhập tên khách" }]}
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
                rules={[{ required: true, message: "Nhập SĐT" }]}
              >
                <Input
                  size="large"
                  prefix={<PhoneOutlined />}
                  placeholder="Số điện thoại"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="customer_email" label="Email">
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="Email (tùy chọn)"
            />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm..." />
          </Form.Item>
        </Card>
      ),
    },
    {
      title: "Thanh toán",
      icon: <CreditCardOutlined />,
      content: (
        <Card bordered={false} className="shadow-sm">
          <Alert
            message="Booking của Admin sẽ được tự động xác nhận (Confirmed) hoặc Check-in ngay."
            type="success"
            showIcon
            className="mb-4"
          />

          <Form.Item label="Phương thức thanh toán" required>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              size="large"
              className="w-full"
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Radio.Button value="cash" className="w-full text-center">
                    Tiền mặt
                  </Radio.Button>
                </Col>
                <Col span={8}>
                  <Radio.Button value="card" className="w-full text-center">
                    Thẻ / POS
                  </Radio.Button>
                </Col>
                <Col span={8}>
                  <Radio.Button value="transfer" className="w-full text-center">
                    Chuyển khoản
                  </Radio.Button>
                </Col>
              </Row>
            </Radio.Group>
          </Form.Item>

          <Divider />

          <Form.Item
            label={
              paymentMethod === "transfer"
                ? "Ảnh Bill Chuyển Khoản (Bắt buộc)"
                : "Ảnh chứng từ thanh toán (Tùy chọn)"
            }
            required={paymentMethod === "transfer"}
            tooltip="Tải lên ảnh chụp màn hình chuyển khoản hoặc hóa đơn."
          >
            <Upload
              listType="picture-card"
              {...uploadProps}
              onPreview={handlePreview}
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: true,
              }}
            >
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
            {paymentMethod === "transfer" && fileList.length === 0 && (
              <Text type="danger">
                Vui lòng tải lên ảnh bill để xác nhận đơn.
              </Text>
            )}
          </Form.Item>

          <Divider />

          <Form.Item>
            <div
              className={`p-4 rounded border ${isCheckInToday ? "bg-emerald-50 border-emerald-200" : "bg-gray-100"}`}
            >
              <label
                className={`flex items-center gap-3 ${!isCheckInToday ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-emerald-600"
                  checked={immediateCheckin}
                  onChange={(e) => setImmediateCheckin(e.target.checked)}
                  disabled={!isCheckInToday}
                />
                <div>
                  <div className="font-bold text-gray-800">
                    Check-in ngay lập tức
                  </div>
                  <div className="text-sm text-gray-500">
                    {isCheckInToday
                      ? "Booking sẽ chuyển sang trạng thái 'Đang ở' (Occupied)"
                      : "Chỉ khả dụng khi ngày nhận phòng là hôm nay"}
                  </div>
                </div>
              </label>
            </div>
          </Form.Item>

          <div className="bg-orange-50 p-4 rounded mt-4">
            <Row>
              <Col span={12}>
                <Text className="text-gray-600">Tổng tiền:</Text>
              </Col>
              <Col span={12} className="text-right">
                <Text className="text-2xl font-bold text-orange-600">
                  {totalPrice.toLocaleString("vi-VN")} ₫
                </Text>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col span={12}>
                <Text className="text-gray-600">Trạng thái sau tạo:</Text>
              </Col>
              <Col span={12} className="text-right">
                <Text strong className="text-emerald-600">
                  {immediateCheckin ? "CHECKED-IN" : "CONFIRMED (Đã xác nhận)"}
                </Text>
              </Col>
            </Row>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Title level={2} className="text-center" style={{ marginBottom: 0 }}>
            Đặt Phòng Tại Quầy
          </Title>
          <Text className="block text-center text-gray-500">
            Tạo booking mới cho khách lẻ (Walk-in)
          </Text>
        </div>

        <Steps
          current={currentStep}
          items={steps.map((s) => ({ title: s.title, icon: s.icon }))}
          className="mb-8"
        />

        <Form form={form} layout="vertical">
          <div className="mb-8 min-h-[400px]">
            {steps.map((step, index) => (
              <div
                key={index}
                style={{ display: currentStep === index ? "block" : "none" }}
              >
                {step.content}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            {currentStep > 0 && (
              <Button size="large" onClick={prev}>
                Quay lại
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                onClick={next}
                className="ml-auto"
              >
                Tiếp theo
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={loading}
                className="ml-auto bg-emerald-600 hover:bg-emerald-500"
                icon={<CheckCircleOutlined />}
              >
                Hoàn tất đặt phòng
              </Button>
            )}
          </div>
        </Form>
      </div>

      {previewImage && (
        <Image
          wrapperStyle={{ display: "none" }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(""),
          }}
          src={previewImage}
        />
      )}
    </div>
  );
};

export default AdminWalkInBooking;
