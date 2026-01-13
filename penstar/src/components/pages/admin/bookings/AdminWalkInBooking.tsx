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
<<<<<<< HEAD
  Modal,
=======
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
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
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
<<<<<<< HEAD
import { createBooking } from "@/services/bookingsApi";
import { searchAvailableRooms } from "@/services/roomsApi";
import type { Services } from "@/types/services";
import type { RoomType } from "@/types/roomtypes";
import type { Room } from "@/types/room";
import dayjs from "dayjs";
=======
import { getRooms } from "@/services/roomsApi";
import { createBooking, uploadBookingReceipt } from "@/services/bookingsApi";
import type { RoomType } from "@/types/roomtypes";
import dayjs from "@/utils/dayjs";
import type { UploadFile } from "antd/es/upload/interface";
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b

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

<<<<<<< HEAD
  const [selectedRooms, setSelectedRooms] = useState<
    Array<{
      room_id?: number; // Thêm room_id để chọn phòng cụ thể
      room_type_id: number;
      quantity: number;
      num_adults: number;
      num_children: number;
      services: Array<{ service_id: number; quantity: number }>;
    }>
  >([]);
  
  // State để lưu danh sách phòng available khi chọn loại phòng
  const [availableRoomsForType, setAvailableRoomsForType] = useState<Room[]>([]);
  const [loadingAvailableRooms, setLoadingAvailableRooms] = useState(false);

  // Tìm kiếm phòng available khi chọn loại phòng
  const handleRoomTypeChange = async (roomTypeId: number) => {
    setSelectedRoomTypeId(roomTypeId);
    form.validateFields(["num_adults", "num_children"]);
    
    // Tìm kiếm phòng available
    const currentDateRange = dateRange || form.getFieldValue("dateRange");
    if (!currentDateRange || (Array.isArray(currentDateRange) && currentDateRange.length !== 2)) {
      setAvailableRoomsForType([]);
      return;
    }
    
    const checkIn = dayjs(Array.isArray(currentDateRange) ? currentDateRange[0] : currentDateRange).format("YYYY-MM-DD");
    const checkOut = dayjs(Array.isArray(currentDateRange) ? currentDateRange[1] : currentDateRange).format("YYYY-MM-DD");
    
    setLoadingAvailableRooms(true);
    try {
      const response = await searchAvailableRooms({
        check_in: checkIn,
        check_out: checkOut,
        room_type_id: roomTypeId,
        num_adults: form.getFieldValue("num_adults") || 1,
        num_children: form.getFieldValue("num_children") || 0,
      });
      setAvailableRoomsForType(response.data || []);
    } catch (error) {
      console.error("Error searching available rooms:", error);
      setAvailableRoomsForType([]);
    } finally {
      setLoadingAvailableRooms(false);
    }
  };
=======
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
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b

  const handleAddRoom = () => {
    if (roomTypes.length === 0) {
      message.warning("Chưa có loại phòng nào");
      return;
    }
<<<<<<< HEAD
    
    // Kiểm tra dateRange từ state hoặc form
    const currentDateRange = dateRange || values.dateRange;
    if (!currentDateRange || (Array.isArray(currentDateRange) && currentDateRange.length !== 2)) {
      message.error("Vui lòng chọn ngày nhận và trả phòng ở bước 1");
      return;
    }

    const roomType = roomTypes.find((rt) => rt.id === values.room_type_id);
    if (!roomType) {
      message.error("Không tìm thấy loại phòng");
      return;
    }

    // Validation số lượng người
    const numAdults = values.num_adults || 1;
    const numChildren = values.num_children || 0;
    const totalGuests = numAdults + numChildren;

    // Cho phép vượt quá max_adults 1 người (tính phụ phí)
    const maxAllowedAdults = (roomType.max_adults || 0) + 1;
    if (numAdults > maxAllowedAdults) {
      message.error(
        `Số người lớn không được vượt quá ${maxAllowedAdults} người (${roomType.max_adults} tiêu chuẩn + 1 phụ phí) cho loại phòng ${roomType.name}`
      );
      return;
    }

    // Không giới hạn số trẻ em (chỉ tính phụ phí nếu vượt quá max_children)
    // Kiểm tra tổng số người (capacity) - vẫn giữ giới hạn này
    const maxCapacity = Math.min(roomType.capacity || 4, 4);
    if (totalGuests > maxCapacity) {
      message.error(
        `Tổng số người (${totalGuests}) không được vượt quá sức chứa của phòng (${maxCapacity} người) cho loại phòng ${roomType.name}`
      );
      return;
    }

    // Kiểm tra số người lớn tối thiểu
    if (numAdults < 1) {
      message.error("Phải có ít nhất 1 người lớn");
      return;
    }

    // Chọn phòng cụ thể nếu có available rooms
    let selectedRoomId: number | undefined = undefined;
    if (values.selected_room_id) {
      selectedRoomId = values.selected_room_id;
    } else if (availableRoomsForType.length > 0) {
      // Tự động chọn phòng đầu tiên nếu không chọn
      selectedRoomId = availableRoomsForType[0].id;
    }

    const newRoom = {
      room_id: selectedRoomId, // Thêm room_id nếu có
      room_type_id: values.room_type_id,
      quantity: 1, // Mặc định 1 phòng
      num_adults: numAdults,
      num_children: numChildren,
      services: [],
    };

    setSelectedRooms([...selectedRooms, newRoom]);
    form.setFieldsValue({
      room_type_id: undefined,
      selected_room_id: undefined,
      num_adults: 1,
      num_children: 0,
    });
    setAvailableRoomsForType([]);
    message.success("Đã thêm phòng vào danh sách");
=======
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
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
  };

  const handleRemoveRoom = (id: string) => {
    setSelectedRooms((prev) => prev.filter((r) => r.id !== id));
  };

<<<<<<< HEAD
  const handlePrev = () => {
    if (currentStep === 0) {
      // Ở bước 1 (điền thông tin), hỏi xác nhận trước khi quay lại và xóa dữ liệu
      Modal.confirm({
        title: "Xác nhận hủy đặt phòng",
        content: "Bạn có chắc muốn quay lại? Dữ liệu phòng đã chọn sẽ bị xóa.",
        okText: "Xác nhận",
        cancelText: "Hủy",
        onOk: () => {
          // Xóa dữ liệu phòng đã chọn
          setSelectedRooms([]);
          setSelectedRoomTypeId(undefined);
          setDateRange(null);
          form.resetFields();
          // Quay về trang trước hoặc trang danh sách booking
          navigate("/admin/bookings");
        },
      });
    } else {
      // Ở các bước khác, chỉ quay lại bước trước
      setCurrentStep((s) => s - 1);
    }
  };

  const handleCancelBooking = () => {
    Modal.confirm({
      title: "Xác nhận hủy đặt phòng",
      content: "Bạn có chắc muốn hủy đặt phòng? Tất cả dữ liệu đã nhập sẽ bị xóa.",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => {
        // Xóa tất cả dữ liệu
        setSelectedRooms([]);
        setSelectedRoomTypeId(undefined);
        setDateRange(null);
        form.resetFields();
        // Quay về trang danh sách booking
        navigate("/admin/bookings");
      },
    });
  };

  const calculateTotal = () => {
    const values = form.getFieldsValue();
    const currentDateRange = dateRange || values.dateRange;
    if (!currentDateRange || (Array.isArray(currentDateRange) && currentDateRange.length !== 2)) return 0;
=======
  const handleUpdateRoom = (
    id: string,
    field: keyof SelectedRoom,
    value: any
  ) => {
    setSelectedRooms((prev) =>
      prev.map((room) => {
        if (room.id !== id) return room;
        const updated = { ...room, [field]: value };
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b

        if (
          field === "roomTypeId" ||
          field === "numAdults" ||
          field === "numChildren"
        ) {
          const newTypeId = field === "roomTypeId" ? value : room.roomTypeId;
          const newAdults = field === "numAdults" ? value : room.numAdults;
          const newChildren =
            field === "numChildren" ? value : room.numChildren;

<<<<<<< HEAD
    let total = 0;
    selectedRooms.forEach((room) => {
      const roomType = roomTypes.find((rt) => rt.id === room.room_type_id);
      if (roomType && roomType.price) {
        // Giá phòng cơ bản
        const basePrice = roomType.price * nights * room.quantity;
        total += basePrice;

        // Tính phụ phí người lớn (nếu vượt quá max_adults)
        if (room.num_adults > (roomType.max_adults || 0)) {
          const excessAdults = room.num_adults - (roomType.max_adults || 0);
          const adultSurcharge = excessAdults * (roomType.adult_surcharge || 0) * nights * room.quantity;
          total += adultSurcharge;
        }

        // Tính phụ phí trẻ em (chỉ khi vượt quá max_children)
        const excessChildren = Math.max(0, room.num_children - (roomType.max_children || 0));
        if (excessChildren > 0 && roomType.child_surcharge) {
          const childSurcharge = excessChildren * (roomType.child_surcharge || 0) * nights * room.quantity;
          total += childSurcharge;
        }
      }
      room.services.forEach((service) => {
        const serviceInfo = services.find((s) => s.id === service.service_id);
        if (serviceInfo) {
          total += serviceInfo.price * service.quantity;
=======
          if (field === "roomTypeId") {
            updated.roomId = null;
          }
          const fees = calculateExtraFees(newTypeId, newAdults, newChildren);
          return { ...updated, ...fees };
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
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

<<<<<<< HEAD
      const dateArray = Array.isArray(currentDateRange) ? currentDateRange : [currentDateRange, currentDateRange];
      const checkIn = dayjs(dateArray[0]).format("YYYY-MM-DD");
      const checkOut = dayjs(dateArray[1]).format("YYYY-MM-DD");
      const nights = dayjs(dateArray[1]).diff(
        dayjs(dateArray[0]),
        "day"
      );

      // Nếu có room_id cụ thể, gửi items thay vì rooms_config
      const hasSpecificRooms = selectedRooms.some((room) => room.room_id);
      
      if (hasSpecificRooms) {
        // Gửi items với room_id cụ thể
        const items = selectedRooms.map((room) => {
          const roomType = roomTypes.find((rt) => rt.id === room.room_type_id);
          const servicesArray = room.services.map((s) => {
            const serviceInfo = services.find((sv) => sv.id === s.service_id);
            return {
              service_id: s.service_id,
              quantity: s.quantity,
              total_service_price: serviceInfo
                ? serviceInfo.price * s.quantity
                : 0,
            };
          });

          // Tính giá cơ bản (trừ phụ phí) để backend tính lại phụ phí
          const basePrice = roomType && roomType.price ? roomType.price * nights : 0;

          return {
            room_id: room.room_id!,
            room_type_id: room.room_type_id,
            check_in: checkIn,
            check_out: checkOut,
            room_type_price: basePrice, // Giá cơ bản, backend sẽ tính lại phụ phí
            num_adults: room.num_adults,
            num_children: room.num_children,
            services: servicesArray,
          };
        });

        const bookingData = {
          customer_name: allFormValues.customer_name,
          customer_email: allFormValues.customer_email || null,
          customer_phone: allFormValues.customer_phone,
          notes: allFormValues.notes || null,
          total_price: calculateTotal(),
          payment_status: "pending",
          payment_method: allFormValues.payment_method || null,
          booking_method: "offline",
          stay_status_id: 6,
          items: items, // Gửi items với room_id cụ thể
        };

        const booking = await createBooking(bookingData as any);
        message.success("Đã tạo booking thành công!");
        navigate(`/admin/bookings/${booking.id}`);
      } else {
        // Nếu không có room_id, vẫn dùng rooms_config (auto-assign)
        const roomsConfig = selectedRooms.map((room) => {
          const roomType = roomTypes.find((rt) => rt.id === room.room_type_id);
          const servicesArray = room.services.map((s) => {
            const serviceInfo = services.find((sv) => sv.id === s.service_id);
            return {
              service_id: s.service_id,
              quantity: s.quantity,
              total_service_price: serviceInfo
                ? serviceInfo.price * s.quantity
                : 0,
            };
          });

          return {
            room_type_id: room.room_type_id,
            quantity: room.quantity,
            check_in: checkIn,
            check_out: checkOut,
            room_type_price: roomType && roomType.price ? roomType.price * nights : 0,
            num_adults: room.num_adults,
            num_children: room.num_children,
            services: servicesArray,
          };
        });

        const bookingData = {
          customer_name: allFormValues.customer_name,
          customer_email: allFormValues.customer_email || null,
          customer_phone: allFormValues.customer_phone,
          notes: allFormValues.notes || null,
          total_price: calculateTotal(),
          payment_status: "pending",
          payment_method: allFormValues.payment_method || null,
          booking_method: "offline",
          stay_status_id: 6,
          rooms_config: roomsConfig,
        };

        const booking = await createBooking(bookingData as any);
        message.success("Đã tạo booking thành công!");
        navigate(`/admin/bookings/${booking.id}`);
      }
=======
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
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
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
<<<<<<< HEAD

            {/* Step 2: Select Rooms */}
            {currentStep === 1 && (
              <div>
                <Title level={4}>Chọn phòng</Title>
                <Card>
                  <Form.Item 
                    name="room_type_id" 
                    label="Loại phòng"
                    dependencies={["num_adults", "num_children"]}
                  >
                    <Select 
                      placeholder="Chọn loại phòng"
                      onChange={(value) => {
                        handleRoomTypeChange(value);
                      }}
                    >
                      {roomTypes.map((rt) => (
                        <Select.Option key={rt.id} value={rt.id}>
                          {rt.name} - {rt.price ? rt.price.toLocaleString("vi-VN") : 0} VND/đêm
                          {rt.capacity && ` (Tối đa ${rt.capacity} người)`}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  
                  {/* Hiển thị thông tin giới hạn của loại phòng đã chọn */}
                  {selectedRoomTypeId && (() => {
                    const selectedRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId);
                    if (selectedRoomType) {
                      return (
                        <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f0f2f5", borderRadius: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <strong>Thông tin loại phòng:</strong>
                            {selectedRoomType.max_adults && (
                              <> Tối đa {selectedRoomType.max_adults} người lớn</>
                            )}
                            {selectedRoomType.max_children && (
                              <> • Tối đa {selectedRoomType.max_children} trẻ em</>
                            )}
                            {selectedRoomType.capacity && (
                              <> • Sức chứa: {selectedRoomType.capacity} người</>
                            )}
                          </Text>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Chọn phòng cụ thể nếu có available rooms */}
                  {selectedRoomTypeId && availableRoomsForType.length > 0 && (
                    <Form.Item
                      name="selected_room_id"
                      label="Chọn phòng cụ thể"
                      dependencies={["room_type_id", "num_adults", "num_children"]}
                    >
                      <Select 
                        placeholder="Chọn phòng (tùy chọn - để trống sẽ tự động chọn phòng đầu tiên)"
                        loading={loadingAvailableRooms}
                        onChange={() => {
                          // Re-validate khi chọn phòng
                          form.validateFields(["num_adults", "num_children"]);
                        }}
                      >
                        {availableRoomsForType.map((room) => (
                          <Select.Option key={room.id} value={room.id}>
                            {room.name} - {room.status === "available" ? "Sẵn sàng" : room.status}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                  
                  {selectedRoomTypeId && availableRoomsForType.length === 0 && !loadingAvailableRooms && (
                    <div style={{ marginTop: 8, padding: 8, backgroundColor: "#fff1f0", borderRadius: 4 }}>
                      <Text type="danger" style={{ fontSize: 12 }}>
                        ⚠️ Không có phòng nào khả dụng cho loại phòng này trong khoảng thời gian đã chọn. Vui lòng chọn loại phòng khác hoặc thay đổi ngày.
                      </Text>
                    </div>
                  )}

                  <Form.Item
                    name="num_adults"
                    label="Số người lớn"
                    initialValue={1}
                    dependencies={["num_children", "room_type_id"]}
                    rules={[
                      { required: true, message: "Vui lòng nhập số người lớn" },
                      { type: "number", min: 1, message: "Phải có ít nhất 1 người lớn" },
                      {
                        validator: (_, value) => {
                          const roomTypeId = form.getFieldValue("room_type_id");
                          if (!roomTypeId) return Promise.resolve();
                          const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                          // Kiểm tra tổng số người (capacity)
                          const numChildren = form.getFieldValue("num_children") || 0;
                          const totalGuests = value + numChildren;
                          const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                          if (roomType && totalGuests > maxCapacity) {
                            return Promise.reject(
                              new Error(
                                `Tổng số người (${totalGuests}) vượt quá sức chứa phòng (${maxCapacity} người)`
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber 
                      min={1} 
                      max={(() => {
                        const roomTypeId = form.getFieldValue("room_type_id");
                        if (!roomTypeId) return 20;
                        const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                        const numChildren = form.getFieldValue("num_children") || 0;
                        const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                        // Tối đa = capacity - số trẻ em (đảm bảo tổng không vượt quá capacity)
                        return Math.max(1, maxCapacity - numChildren);
                      })()}
                      style={{ width: "100%" }}
                      onChange={(value) => {
                        const roomTypeId = form.getFieldValue("room_type_id");
                        if (roomTypeId) {
                          const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                          const numChildren = form.getFieldValue("num_children") || 0;
                          const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                          const maxAdults = Math.max(1, maxCapacity - numChildren);
                          // Tự động giới hạn nếu nhập quá
                          if (value && value > maxAdults) {
                            form.setFieldValue("num_adults", maxAdults);
                            message.warning(`Số người lớn tối đa là ${maxAdults} (tổng không vượt quá ${maxCapacity} người)`);
                          }
                        }
                        // Trigger validation lại khi thay đổi
                        form.validateFields(["num_adults", "num_children"]);
                      }}
                    />
                  </Form.Item>
                  <Form.Item dependencies={["num_adults", "room_type_id"]} noStyle>
                    {({ getFieldValue }) => {
                      const roomTypeId = getFieldValue("room_type_id");
                      const numAdults = getFieldValue("num_adults") || 1;
                      if (!roomTypeId) return null;
                      const selectedRoomType = roomTypes.find((rt) => rt.id === roomTypeId);
                      if (!selectedRoomType) return null;
                      const excessAdults = Math.max(0, numAdults - (selectedRoomType.max_adults || 0));
                      if (excessAdults > 0 && selectedRoomType.adult_surcharge) {
                        return (
                          <div style={{ marginTop: 8, padding: 8, backgroundColor: "#fff7e6", borderRadius: 4 }}>
                            <Text type="warning" style={{ fontSize: 12 }}>
                              ▲ Vượt quá {selectedRoomType.max_adults} người lớn tiêu chuẩn. Sẽ tính thêm phụ phí: {excessAdults} × {selectedRoomType.adult_surcharge.toLocaleString("vi-VN")} ₫ = {(excessAdults * selectedRoomType.adult_surcharge).toLocaleString("vi-VN")} ₫/đêm
                            </Text>
                          </div>
                        );
                      }
                      return null;
                    }}
                  </Form.Item>

                  <Form.Item
                    name="num_children"
                    label="Số trẻ em"
                    initialValue={0}
                    dependencies={["num_adults", "room_type_id"]}
                    rules={[
                      { type: "number", min: 0, message: "Số trẻ em không được âm" },
                      {
                        validator: (_, value) => {
                          const roomTypeId = form.getFieldValue("room_type_id");
                          if (!roomTypeId) return Promise.resolve();
                          const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                          // Kiểm tra tổng số người
                          const numAdults = form.getFieldValue("num_adults") || 1;
                          const totalGuests = numAdults + (value || 0);
                          const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                          if (roomType && totalGuests > maxCapacity) {
                            return Promise.reject(
                              new Error(
                                `Tổng số người (${totalGuests}) vượt quá sức chứa phòng (${maxCapacity} người)`
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber 
                      min={0} 
                      max={(() => {
                        const roomTypeId = form.getFieldValue("room_type_id");
                        if (!roomTypeId) return 20;
                        const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                        const numAdults = form.getFieldValue("num_adults") || 1;
                        const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                        // Tối đa = capacity - số người lớn (đảm bảo tổng không vượt quá capacity)
                        return Math.max(0, maxCapacity - numAdults);
                      })()}
                      style={{ width: "100%" }}
                      onChange={(value) => {
                        const roomTypeId = form.getFieldValue("room_type_id");
                        if (roomTypeId) {
                          const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                          const numAdults = form.getFieldValue("num_adults") || 1;
                          const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                          const maxChildren = Math.max(0, maxCapacity - numAdults);
                          // Tự động giới hạn nếu nhập quá
                          if (value && value > maxChildren) {
                            form.setFieldValue("num_children", maxChildren);
                            message.warning(`Số trẻ em tối đa là ${maxChildren} (tổng không vượt quá ${maxCapacity} người)`);
                          }
                        }
                        // Trigger validation lại khi thay đổi
                        form.validateFields(["num_adults", "num_children"]);
                      }}
                    />
                  </Form.Item>
                  <Form.Item dependencies={["num_children", "room_type_id"]} noStyle>
                    {({ getFieldValue }) => {
                      const roomTypeId = getFieldValue("room_type_id");
                      const numChildren = getFieldValue("num_children") || 0;
                      if (!roomTypeId) return null;
                      const selectedRoomType = roomTypes.find((rt) => rt.id === roomTypeId);
                      if (!selectedRoomType) return null;
                      const excessChildren = Math.max(0, numChildren - (selectedRoomType.max_children || 0));
                      if (excessChildren > 0 && selectedRoomType.child_surcharge) {
                        return (
                          <div style={{ marginTop: 8, padding: 8, backgroundColor: "#fff7e6", borderRadius: 4 }}>
                            <Text type="warning" style={{ fontSize: 12 }}>
                              ▲ Vượt quá {selectedRoomType.max_children} trẻ em tiêu chuẩn. Sẽ tính thêm phụ phí: {excessChildren} × {selectedRoomType.child_surcharge.toLocaleString("vi-VN")} ₫ = {(excessChildren * selectedRoomType.child_surcharge).toLocaleString("vi-VN")} ₫/đêm
                            </Text>
                          </div>
                        );
                      }
                      return null;
                    }}
                  </Form.Item>

                  <Button type="primary" onClick={handleAddRoom} block>
                    Thêm phòng vào danh sách
                  </Button>
                </Card>

                <Divider />

                <Title level={5}>Danh sách phòng đã chọn</Title>
                {selectedRooms.length === 0 ? (
                  <Text type="secondary">Chưa có phòng nào được chọn</Text>
                ) : (
                  selectedRooms.map((room, index) => {
                    const roomType = roomTypes.find(
                      (rt) => rt.id === room.room_type_id
                    );
                    return (
                      <Card key={index} className="mb-4">
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div>
                            <Text strong>{roomType?.name}</Text>
                            <Button
                              danger
                              size="small"
                              onClick={() => handleRemoveRoom(index)}
                              style={{ float: "right" }}
                            >
                              Xóa
                            </Button>
                          </div>
                          <Text>
                            Số lượng: {room.quantity} | Người lớn:{" "}
                            {room.num_adults} | Trẻ em: {room.num_children}
                          </Text>
                        </Space>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* Step 3: Confirm */}
            {currentStep === 2 && (
              <div>
                <Title level={4}>Xác nhận thông tin</Title>
                <Card>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Text strong>Khách hàng: </Text>
                      <Text>{form.getFieldValue("customer_name")}</Text>
                    </div>
                    <div>
                      <Text strong>Số điện thoại: </Text>
                      <Text>{form.getFieldValue("customer_phone")}</Text>
                    </div>
                    <div>
                      <Text strong>Email: </Text>
                      <Text>
                        {form.getFieldValue("customer_email") || "—"}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Tổng tiền: </Text>
                      <Text strong style={{ color: "#ff4d4f", fontSize: 18 }}>
                        {calculateTotal().toLocaleString("vi-VN")} VND
                      </Text>
                    </div>
                    {(() => {
                      const values = form.getFieldsValue();
                      const currentDateRange = dateRange || values.dateRange;
                      if (!currentDateRange || (Array.isArray(currentDateRange) && currentDateRange.length !== 2)) return null;
                      const checkIn = dayjs(Array.isArray(currentDateRange) ? currentDateRange[0] : currentDateRange);
                      const checkOut = dayjs(Array.isArray(currentDateRange) ? currentDateRange[1] : currentDateRange);
                      const nights = checkOut.diff(checkIn, "day");
                      
                      let baseTotal = 0;
                      let adultSurchargeTotal = 0;
                      let childSurchargeTotal = 0;
                      
                      selectedRooms.forEach((room) => {
                        const roomType = roomTypes.find((rt) => rt.id === room.room_type_id);
                        if (roomType && roomType.price) {
                          baseTotal += roomType.price * nights * room.quantity;
                          
                          if (room.num_adults > (roomType.max_adults || 0)) {
                            const excessAdults = room.num_adults - (roomType.max_adults || 0);
                            adultSurchargeTotal += excessAdults * (roomType.adult_surcharge || 0) * nights * room.quantity;
                          }
                          
                          const excessChildren = Math.max(0, room.num_children - (roomType.max_children || 0));
                          if (excessChildren > 0 && roomType.child_surcharge) {
                            childSurchargeTotal += excessChildren * (roomType.child_surcharge || 0) * nights * room.quantity;
                          }
                        }
                      });
                      
                      if (adultSurchargeTotal > 0 || childSurchargeTotal > 0) {
                        return (
                          <div style={{ marginTop: 12, padding: 12, backgroundColor: "#f0f2f5", borderRadius: 4 }}>
                            <Space direction="vertical" style={{ width: "100%" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <Text>Tiền phòng ({nights} đêm):</Text>
                                <Text strong>{baseTotal.toLocaleString("vi-VN")} VND</Text>
                              </div>
                              {adultSurchargeTotal > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <Text style={{ color: "#ff9800" }}>Phụ phí người lớn:</Text>
                                  <Text strong style={{ color: "#ff9800" }}>{adultSurchargeTotal.toLocaleString("vi-VN")} VND</Text>
                                </div>
                              )}
                              {childSurchargeTotal > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <Text style={{ color: "#ff9800" }}>Phụ phí trẻ em:</Text>
                                  <Text strong style={{ color: "#ff9800" }}>{childSurchargeTotal.toLocaleString("vi-VN")} VND</Text>
                                </div>
                              )}
                            </Space>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </Space>
                </Card>

                <Form.Item
                  name="payment_method"
                  label="Phương thức thanh toán dự kiến"
                  initialValue="cash"
                >
                  <Select placeholder="Chọn phương thức thanh toán">
                    <Select.Option value="cash">Tiền mặt</Select.Option>
                    <Select.Option value="card">Thẻ</Select.Option>
                    <Select.Option value="transfer">Chuyển khoản</Select.Option>
                    <Select.Option value="momo">MoMo</Select.Option>
                    <Select.Option value="vnpay">VNPay</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
              <Space>
                {currentStep > 0 && (
                  <Button onClick={handlePrev}>
                    Quay lại
                  </Button>
                )}
                {currentStep > 0 && (
                  <Button danger onClick={handleCancelBooking}>
                    Hủy đặt phòng
                  </Button>
                )}
                {currentStep === 0 && (
                  <Button danger onClick={handleCancelBooking}>
                    Hủy đặt phòng
                  </Button>
                )}
              </Space>
              <Space>
                {currentStep < steps.length - 1 && (
                  <Button
                    type="primary"
                    onClick={async () => {
                      try {
                        // Validate form trước khi chuyển bước
                        await form.validateFields();
                        
                        // Lưu dateRange vào state khi chuyển từ bước 1 sang bước 2
                        if (currentStep === 0) {
                          const values = form.getFieldsValue();
                          if (
                            values.dateRange &&
                            Array.isArray(values.dateRange) &&
                            values.dateRange.length === 2
                          ) {
                            setDateRange([
                              dayjs(values.dateRange[0]),
                              dayjs(values.dateRange[1]),
                            ]);
                          }
                        }
                        
                        setCurrentStep((s) => s + 1);
                      } catch (error) {
                        // Form validation failed, error messages will be shown automatically
                        console.error("Validation error:", error);
                      }
                    }}
                  >
                    Tiếp theo
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={loading}
                    size="large"
                  >
                    Tạo booking
                  </Button>
                )}
              </Space>
            </div>
          </Form>
        </Card>
=======
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
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
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
