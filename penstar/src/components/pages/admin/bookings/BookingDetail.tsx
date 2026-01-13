import {
  cancelBooking,
<<<<<<< HEAD
  updateBookingDamages,
} from "@/services/bookingsApi";
import { getRoomID } from "@/services/roomsApi";
import { getServiceById, getServices } from "@/services/servicesApi";
import {
  createBookingService,
  deleteBookingService,
} from "@/services/bookingServicesApi";
import { getDevices, type Device } from "@/services/devicesApi";
import type { BookingDetails } from "@/types/bookings";
import type { Room } from "@/types/room";
import type { Services } from "@/types/services";
import { useQuery, useQueryClient } from "@tanstack/react-query";
=======
  confirmCheckin,
  confirmCheckout,
  getBookingById,
  markNoShow,
  setBookingStatus,
  markBookingRefunded,
  calculateLateFee,
} from "@/services/bookingsApi";
import { getRoomID } from "@/services/roomsApi";
import { getServiceById, getServices } from "@/services/servicesApi";
import { createBookingService } from "@/services/bookingServicesApi";
import type { BookingDetails } from "@/types/bookings";
import type { Room } from "@/types/room";
import type { Services } from "@/types/services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Spin,
  Card,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  Divider,
  Input,
  InputNumber,
  Avatar,
  List,
  Button,
  message,
  Empty,
  Modal,
  Select,
  Input,
  InputNumber,
  Descriptions,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  HomeOutlined,
  DollarOutlined,
  TagOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { getRoomDevices } from "@/services/roomDevicesApi";
import {
  createBookingIncident,
  getBookingIncidents,
} from "@/services/bookingIncidentsApi";
import { generateBillHTML } from "@/utils/generateBillHTML";
import { toZonedTime } from "date-fns-tz";
import { getImageUrl } from "@/utils/imageUtils";
const { Title, Text } = Typography;
const { TextArea } = Input;
const BookingDetail = () => {
  const queryClient = useQueryClient();

  const [finalConfirmVisible, setFinalConfirmVisible] = useState(false);
  const [brokenModalVisible, setBrokenModalVisible] = useState(false);
  const [brokenReports, setBrokenReports] = useState<
    Array<{
      roomId: number | null;
      deviceId: number | null;
      quantity: number;
      status: string;
    }>
  >([{ roomId: null, deviceId: null, quantity: 1, status: "broken" }]);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [serviceNote, setServiceNote] = useState("");
  const [pendingService, setPendingService] = useState<{
    bookingItemId: number;
    serviceId: number;
    quantity: number;
    serviceName: string;
    servicePrice: number;
    serviceUnit: string;
  } | null>(null);
  const { id } = useParams();
  const navigate = useNavigate();
<<<<<<< HEAD
  const queryClient = useQueryClient();
=======
  const [addingService, setAddingService] = useState<number | null>(null);

  // --- Mutations ---

  const approveMutation = useMutation({
    mutationFn: (bookingId: number) =>
      setBookingStatus(bookingId, { stay_status_id: 1 }),
    onSuccess: () => {
      message.success("Đã duyệt booking - Phòng chuyển sang trạng thái Booked");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: (err) => {
      console.error("Lỗi duyệt booking:", err);
      message.error("Lỗi duyệt booking");
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (bookingId: number) =>
      setBookingStatus(bookingId, { payment_status: "paid" }),
    onSuccess: () => {
      message.success("Đã xác nhận thanh toán tiền mặt thành công");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: (err) => {
      console.error("Lỗi xác nhận thanh toán:", err);
      message.error("Lỗi xác nhận thanh toán");
    },
  });

  const checkInMutation = useMutation({
    mutationFn: confirmCheckin,
    onSuccess: () => {
      message.success(
        "Đã check-in thành công - Phòng chuyển sang trạng thái Đã nhận"
      );
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: (err: any) => {
      console.error("Check-in error:", err);
      message.error(err.response?.data?.message || "Lỗi check-in");
    },
  });

  const calculateLateFeeMutation = useMutation({
    mutationFn: calculateLateFee,
    onSuccess: (res) => {
      if (res && res.lateFee > 0) {
        message.info(
          `Phát hiện checkout muộn! Đã thêm phụ phí: ${formatPrice(
            res.lateFee
          )} (${res.hours} giờ)`
        );
        queryClient.invalidateQueries({ queryKey: ["booking", id] });
      }
    },
    onError: (e) => console.error("Error calc late fee", e),
  });

  const checkOutMutation = useMutation({
    mutationFn: confirmCheckout,
    onSuccess: () => {
      message.success("Đã checkout - Phòng chuyển sang trạng thái Cleaning");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      setFinalConfirmVisible(false);
      setBrokenReports([
        { roomId: null, deviceId: null, quantity: 1, status: "broken" },
      ]);
    },
    onError: (err: any) => {
      console.error("Final checkout error:", err);
      message.error(err.response?.data?.message || "Lỗi checkout");
    },
  });

  const markNoShowMutation = useMutation({
    mutationFn: markNoShow,
    onSuccess: () => {
      message.success("Đã đánh dấu No Show thành công.");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: (err: any) => {
      console.error("Lỗi No Show:", err);
      message.error(err.response?.data?.message || "Lỗi No Show");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: number;
      reason: string;
    }) => cancelBooking(bookingId, reason),
    onSuccess: () => {
      message.success(
        "Đã hủy booking - Phòng chuyển sang trạng thái Available."
      );
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: (err: any) => {
      console.error("Lỗi hủy booking:", err);
      message.error(err.response?.data?.message || "Lỗi hủy booking");
    },
  });

  const refundMutation = useMutation({
    mutationFn: markBookingRefunded,
    onSuccess: (res) => {
      if (res.success) {
        message.success("Đã đánh dấu hoàn tiền thành công.");
        queryClient.invalidateQueries({ queryKey: ["booking", id] });
      } else {
        message.error(res.message || "Có lỗi khi đánh dấu hoàn tiền.");
      }
    },
    onError: () => message.error("Lỗi khi đánh dấu hoàn tiền."),
  });

  const createIncidentMutation = useMutation({
    mutationFn: createBookingIncident,
    onSuccess: () => {
      // Don't show success here if mapping multiple, handle manually?
      // Or just invalidate.
      queryClient.invalidateQueries({
        queryKey: ["bookingIncidents", booking?.id],
      });
      // Also might affect total price if we refetch booking
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: () => {
      // Handled in loop or individual?
      // If we call mutateAsync in loop, we handle errors there.
    },
  });

  const addServiceMutation = useMutation({
    mutationFn: createBookingService,
    onSuccess: () => {
      message.success("Đã thêm dịch vụ thành công");
      queryClient.invalidateQueries({ queryKey: ["bookingServicesList"] });
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      setServiceModalVisible(false);
      setPendingService(null);
    },
    onError: (err: any) => {
      console.error("Lỗi thêm dịch vụ:", err);
      message.error(err.response?.data?.message || "Lỗi thêm dịch vụ");
    },
    onSettled: () => {
      setAddingService(null);
    },
  });

  // General "updating" state for UI blocking
  const updating =
    approveMutation.isPending ||
    markPaidMutation.isPending ||
    checkInMutation.isPending ||
    checkOutMutation.isPending ||
    cancelMutation.isPending ||
    addServiceMutation.isPending ||
    refundMutation.isPending;
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b

  const {
    data: booking,
    isLoading: isBookingLoading,
    isError,
    refetch,
  } = useQuery<BookingDetails | null>({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(Number(id)),
    enabled: !!id,
    retry: false,
  });
  // Load tất cả devices để có thể chọn (nếu không có room type)
  const { data: allDevices = [] } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: getDevices,
  });

  // Lấy room type từ booking để filter devices
  const roomTypeIds = useMemo(() => {
    if (!booking?.items) return [];
    return Array.from(
      new Set(
        booking.items
          .map((item: any) => item.room_type_id)
          .filter((id: number | undefined): id is number => !!id)
      )
    );
  }, [booking]);

  // Load room types để lấy devices_id
  const { data: roomTypes = [] } = useQuery({
    queryKey: ["room_types", roomTypeIds],
    queryFn: async () => {
      const { getRoomTypes } = await import("@/services/roomTypeApi");
      return getRoomTypes();
    },
    enabled: roomTypeIds.length > 0,
  });

  // Filter devices theo room type của booking
  const devices = useMemo(() => {
    if (!booking || roomTypeIds.length === 0) {
      return allDevices; // Fallback: hiển thị tất cả nếu không có room type
    }

    // Lấy tất cả devices_id từ các room types của booking
    const deviceIdsFromRoomTypes = new Set<number>();
    roomTypes.forEach((rt: any) => {
      if (roomTypeIds.includes(rt.id)) {
        // Lấy từ devices_id array
        if (rt.devices_id && Array.isArray(rt.devices_id)) {
          rt.devices_id.forEach((id: number) => deviceIdsFromRoomTypes.add(id));
        }
        // Nếu có devices array (từ join), cũng lấy
        if (rt.devices && Array.isArray(rt.devices)) {
          rt.devices.forEach((d: any) => deviceIdsFromRoomTypes.add(d.id));
        }
      }
    });

    // Filter devices theo deviceIdsFromRoomTypes
    if (deviceIdsFromRoomTypes.size === 0) {
      return allDevices; // Fallback nếu room type không có devices
    }

    return allDevices.filter((d) => deviceIdsFromRoomTypes.has(d.id));
  }, [allDevices, roomTypes, booking, roomTypeIds]);

<<<<<<< HEAD
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Services[]>([]);
  const [allServices, setAllServices] = useState<Services[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);
  const [addingService, setAddingService] = useState<number | null>(null); // booking_item_id đang thêm dịch vụ
  const [deviceDamageModalVisible, setDeviceDamageModalVisible] = useState(false);
  const [deviceDamage, setDeviceDamage] = useState<
    Array<{
      booking_item_id?: number | null;
      device_id?: number | null;
      device_name: string;
      description?: string;
      amount?: number;
    }>
  >([]);
  const [newDamage, setNewDamage] = useState<{
    device_id?: number | null;
    device_name: string;
    description: string;
    amount?: number;
  }>({ device_id: null, device_name: "", description: "", amount: undefined });

  const handleCheckout = async () => {
    if (!booking || !booking.id) return;
    Modal.confirm({
      title: "Xác nhận checkout khách",
      content:
        "Bạn chắc chắn checkout? Phòng sẽ chuyển sang trạng thái Checked-out để ghi nhận thiết bị hỏng và in hóa đơn.",
      okText: "Checkout",
      cancelText: "Hủy",
      onOk: async () => {
        setUpdating(true);
        try {
          await updateBookingStatus(Number(booking.id), { stay_status_id: 3 });
          message.success("Đã checkout. Tiếp tục xác nhận để ghi nhận thiết bị/in hóa đơn.");
          await refetch();
        } catch (err) {
          console.error("Lỗi checkout:", err);
          message.error("Checkout thất bại");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleCheckin = async () => {
    if (!booking || !booking.id) return;
    Modal.confirm({
      title: "Xác nhận check-in",
      content: "Xác nhận khách đã nhận phòng? Trạng thái sẽ chuyển sang Đang ở.",
      okText: "Check-in",
      cancelText: "Hủy",
      onOk: async () => {
        setUpdating(true);
        try {
          await updateBookingStatus(Number(booking.id), { stay_status_id: 2 });
          message.success("Đã check-in. Phòng chuyển sang trạng thái Đang ở.");
          await refetch();
        } catch (err) {
          console.error("Lỗi check-in:", err);
          message.error("Check-in thất bại");
        } finally {
          setUpdating(false);
        }
      },
    });
  };
=======
  const { data: allServices = [], isLoading: isAllServicesLoading } = useQuery({
    queryKey: ["allServices"],
    queryFn: getServices,
  });
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b

  const { data: incidents = [], isLoading: isIncidentsLoading } = useQuery({
    queryKey: ["bookingIncidents", booking?.id],
    queryFn: () => getBookingIncidents(booking!.id!),
    enabled: !!booking?.id,
  });

<<<<<<< HEAD
      console.log("📦 Booking data:", booking);
      console.log("🛎️ Booking services:", booking.services);
      console.log("🏨 Booking items:", booking.items);
      console.log("🔧 Booking damages:", booking.damages);
      console.log("💰 Booking damage_total:", booking.damage_total);
      console.log("💵 Booking total_price:", booking.total_price);

      try {
        const roomIds: string[] = [];
        const serviceIds: string[] = [];

        if (Array.isArray(booking.items)) {
          booking.items.forEach(
            (it: { room_id?: number }) =>
              it.room_id && roomIds.push(String(it.room_id))
          );
        }
        if (Array.isArray(booking.services)) {
          booking.services.forEach(
            (s: { service_id?: number }) =>
              s.service_id && serviceIds.push(String(s.service_id))
          );
        }

        // Don't use Set - we need all room instances even if same room_id
        const uniqueServiceIds = Array.from(new Set(serviceIds));

        // Load all services for adding new ones
        const allServicesData = await getServices();

        const [roomResults, serviceResults] = await Promise.all([
          Promise.all(roomIds.map(getRoomID)), // Fetch all rooms including duplicates
          Promise.all(uniqueServiceIds.map(getServiceById)),
        ]);

        if (mounted) {
          setRooms(roomResults.filter(Boolean) as Room[]);
          setServices(serviceResults.filter(Boolean) as Services[]);
          setAllServices(allServicesData);

          // Nếu booking đã checkout (stay_status_id = 3) VÀ phòng đã cleaning/available -> đã confirm rồi
          if (booking.stay_status_id === 3) {
            const hasCleaningRoom = roomResults.some(
              (r) => r && (r.status === "cleaning" || r.status === "available")
            );
            if (hasCleaningRoom) {
              setCheckoutConfirmed(true);
            }
          }
        }
      } catch (err) {
        message.error("Lỗi tải thông tin phòng/dịch vụ");
        console.error(err);
      } finally {
        if (mounted) setLoadingExtras(false);
=======
  const { data: rooms = [], isLoading: isRoomsLoading } = useQuery({
    queryKey: ["bookingRooms", booking?.id, booking?.stay_status_id],
    queryFn: async () => {
      const roomIds: string[] = [];
      if (Array.isArray(booking?.items)) {
        booking.items.forEach(
          (it: { room_id?: number }) =>
            it.room_id && roomIds.push(String(it.room_id))
        );
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
      }
      const uniqueRoomIds = [...new Set(roomIds)];
      const res = await Promise.all(uniqueRoomIds.map(getRoomID));
      // Map back to original order or just return unique?
      // The original code mapped index-to-index in the render: `rooms[index]`.
      // The original code pushed roomIds in order of items: `booking.items.forEach(...) roomIds.push(...)`.
      // So `rooms` array matched `booking.items` array index-for-index.
      // My new query needs to preserve this "per item" structure OR fetching logic must return array matching items.
      // Re-reading old logic:
      // roomIds.push(String(it.room_id)) inside forEach items.
      // Promise.all(roomIds.map(getRoomID))
      // So if items are [Room A, Room B], roomIds is [idA, idB].
      // result is [RoomAData, RoomBData].
      // So `rooms[index]` works.

      const orderedRoomIds =
        booking?.items?.map((it: any) =>
          it.room_id ? String(it.room_id) : null
        ) || [];
      const roomData = await Promise.all(
        orderedRoomIds.map((rid) =>
          rid ? getRoomID(rid) : Promise.resolve(null)
        )
      );
      return roomData.filter(Boolean) as Room[];
      // Wait, if I filter Boolean, the indices might shift if one fails?
      // Old code: `setRooms(roomResults.filter(Boolean) as Room[])`
      // If item 2 fails, `rooms[2]` becomes `rooms[3]`'s data?
      // Yes, potentially buggy old code if fetches fail, but let's replicate "per item" fetching for safety or robust matching.
      // Actually, standard practice is to map IDs to entities.
      // But the render loop uses `rooms[index]`.
      // Let's stick to the array matching.
    },
    enabled: !!booking?.items,
  });

  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ["bookingServicesList", booking?.id, booking?.services?.length],
    queryFn: async () => {
      const serviceIds: string[] = [];
      if (Array.isArray(booking?.services)) {
        booking.services.forEach(
          (s: { service_id?: number }) =>
            s.service_id && serviceIds.push(String(s.service_id))
        );
      }
      const uniqueServiceIds = Array.from(new Set(serviceIds));
      const res = await Promise.all(uniqueServiceIds.map(getServiceById));
      return res.filter(Boolean) as Services[];
    },
    enabled: !!booking?.services,
  });

  const { data: bookingDevicesMap = {} } = useQuery({
    queryKey: ["bookingDevicesMap", booking?.id],
    queryFn: async () => {
      if (!booking?.items) return {};
      const roomIds = booking.items
        .map((it: any) => it.room_id)
        .filter((id: any) => id);
      const uniqueIds = [...new Set(roomIds)];
      const results = await Promise.all(
        uniqueIds.map((id) => getRoomDevices({ room_id: Number(id) }))
      );
      const map: Record<number, any[]> = {};
      uniqueIds.forEach((id, idx) => {
        map[Number(id)] = results[idx];
      });
      return map;
    },
    enabled: !!booking?.id && brokenModalVisible,
  });

  const loadingExtras =
    isAllServicesLoading ||
    isIncidentsLoading ||
    isRoomsLoading ||
    isServicesLoading;

  // Calculate late checkout fee automatically
  const lateCheckoutInfo = useMemo(() => {
    if (!booking || booking.stay_status_id !== 2) {
      return { hours: 0, fee: 0, isLate: false };
    }

    const checkoutDates = booking.items
      ?.filter((item: any) => item.status !== "cancelled")
      .map((item: any) => new Date(item.check_out))
      .sort((a: Date, b: Date) => b.getTime() - a.getTime());

    if (!checkoutDates || checkoutDates.length === 0) {
      return { hours: 0, fee: 0, isLate: false };
    }

    const checkoutDate = checkoutDates[0];
    const standardCheckoutTime = new Date(checkoutDate);
    standardCheckoutTime.setHours(15, 0, 0, 0);

    const now = new Date();

    if (now <= standardCheckoutTime) {
      return { hours: 0, fee: 0, isLate: false };
    }

    const diffMs = now.getTime() - standardCheckoutTime.getTime();
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    const fee = hours * 100000;

    return { hours, fee, isLate: true };
  }, [booking]);

  const timeZone = "Asia/Ho_Chi_Minh";
  const invalidStatusForNoShow = new Set([2, 3, 4, 5]);
  let canMarkNoShow = false;
  if (
    booking &&
    !invalidStatusForNoShow.has(booking.stay_status_id) &&
    booking.check_in
  ) {
    const now = toZonedTime(new Date(), timeZone);
    const d = new Date(booking.check_in);
    if (!isNaN(d.getTime())) {
      const checkInDate = toZonedTime(d, timeZone);
      checkInDate.setHours(14, 0, 0, 0);
      if (now >= checkInDate) {
        canMarkNoShow = true;
      }
    }
  }
  const handleMarkRefunded = async () => {
    if (!booking || !booking.id) return;
    Modal.confirm({
      title: "Xác nhận hoàn tiền",
      content:
        "Bạn có chắc chắn muốn đánh dấu booking này đã hoàn tiền cho khách?",
      okText: "Đánh dấu đã hoàn tiền",
      cancelText: "Hủy",
      onOk: () => {
        refundMutation.mutate(booking.id!);
      },
    });
  };
  const handleNoShow = async () => {
    if (!booking || !booking.id) return;
    Modal.confirm({
      title: "Xác nhận No Show",
      content: "Bạn có chắc chắn muốn đánh dấu booking này là No Show?",
      okText: "Xác nhận No Show",
      cancelText: "Hủy",
      onOk: () => {
        markNoShowMutation.mutate(booking.id!);
      },
    });
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));
  };
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";
    try {
      return format(d, "dd 'tháng' MM, yyyy", { locale: vi });
    } catch {
      return "Invalid Date";
    }
  };

  const safeFormatDateShort = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    try {
      return format(d, "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  const safeFormatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    try {
      // Convert to Vietnam time (Asia/Ho_Chi_Minh)
      const d = new Date(date);
      if (isNaN(d.getTime())) return "—";

      const timeZone = "Asia/Ho_Chi_Minh";
      const zonedDate = toZonedTime(d, timeZone);

      return format(zonedDate, "HH:mm dd/MM/yyyy");
    } catch {
      return "—";
    }
  };
  const handleApprove = async () => {
    if (!booking || !booking.id) return;
    approveMutation.mutate(booking.id);
  };
  const handleMarkPaid = async () => {
    if (!booking || !booking.id) return;
    markPaidMutation.mutate(booking.id);
  };
  const handleCheckIn = async () => {
    if (!booking || !booking.id) return;
    checkInMutation.mutate(booking.id);
  };
  const handleCheckOut = async () => {
    if (!booking || !booking.check_out || !booking.id) return;
    const now = new Date();
    const checkOutDate = new Date(booking.check_out);
    checkOutDate.setHours(14, 0, 0, 0);
    console.log("[CheckOut] Now:", now.toLocaleString("vi-VN"));
    console.log(
      "[CheckOut] CheckOut limit:",
      checkOutDate.toLocaleString("vi-VN")
    );

    // Trigger late fee calculation
    await calculateLateFeeMutation.mutateAsync(booking.id);
    setBrokenModalVisible(true);
  };
  const handleSelectRoom = (roomId: number | null, idx: number) => {
    const arr = [...brokenReports];
    arr[idx].roomId = roomId;
    arr[idx].deviceId = null;
    setBrokenReports(arr);
  };
  const handleConfirmBrokenDevice = async () => {
    for (const r of brokenReports) {
      if (
        (r.roomId || r.deviceId) &&
        (!r.roomId || !r.deviceId || !r.status || !r.quantity || r.quantity < 1)
      ) {
        message.warning(
          "Vui lòng nhập đầy đủ thông tin cho tất cả các dòng báo cáo thiết bị!"
        );
        return;
      }
      if (r.roomId && r.deviceId && r.quantity) {
        const device = (
          r.roomId !== null ? bookingDevicesMap[r.roomId] : []
        ).find((d: any) => String(d.id) === String(r.deviceId));
        if (device && r.quantity > device.quantity) {
          message.warning(
            `Số lượng báo hỏng của thiết bị '${device.device_name}' trong phòng vượt quá số lượng thực tế!`
          );
          return;
        }
      }
    }
    const validReports = brokenReports.filter(
      (r) => r.roomId && r.deviceId && r.status && r.quantity && r.quantity > 0
    );
    if (validReports.length > 0) {
      try {
        const results = await Promise.allSettled(
          validReports.map((r) => {
            const device = (
              r.roomId !== null ? bookingDevicesMap[r.roomId] : []
            ).find((d: any) => String(d.id) === String(r.deviceId));
            if (!device || !booking?.id) return Promise.reject("Invalid data");
          })
        );
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          message.error(`Có ${failed.length} lỗi khi ghi nhận thiết bị hỏng.`);
          // Log errors if needed
        } else {
          message.success("Đã ghi nhận báo cáo thiết bị hỏng!");
        }
      } catch {
        message.error("Lỗi ghi nhận thiết bị hỏng!");
        return;
      }
    }
    setBrokenModalVisible(false);
    setFinalConfirmVisible(true);
  };

  // Improved handleFinalCheckout to handle payment if needed
  const handleFinalCheckout = async () => {
    if (!booking || !booking.id) return;

    // Calculate if payment is needed
    const totalRoomPrice = Number(booking.total_room_price || 0);
    const totalServicePrice = Number(booking.total_service_price || 0);
    const totalIncidentPrice = incidents.reduce(
      (sum, i) => sum + Number(i.amount || 0),
      0
    );
    const finalTotal = totalRoomPrice + totalServicePrice + totalIncidentPrice;

    // If amount_paid is valid (>0), use it.
    // If not, but status is PAID, assume they paid at least the Room Price (Legacy/Fallback logic)
    // This resolves the issue where "Paid" bookings show full amount due if amount_paid wasn't tracked.
    let amountPaid = Number(booking.amount_paid || 0);
    if (amountPaid === 0 && booking.payment_status === "paid") {
      amountPaid = totalRoomPrice;
    }
    const remaining = finalTotal - amountPaid;

    // If there is remaining amount, confirm payment first
    if (remaining > 0) {
      // Use mutateAsync to wait for it before checkout
      await markPaidMutation.mutateAsync(booking.id);
    }
    checkOutMutation.mutate(booking.id);
  };
  const handleCancel = async () => {
    if (!booking || !booking.id) return;
    let reason = "";
    Modal.confirm({
      title: "Xác nhận hủy",
      content: (
        <div>
          <div>
            Bạn có chắc muốn hủy booking này? Phòng sẽ trở về trạng thái
            Available. Trạng thái thanh toán sẽ tự động chuyển thành Failed.
          </div>
          <div style={{ marginTop: 12 }}>
            <b>Lý do hủy:</b>
            <textarea
              style={{ width: "100%", minHeight: 60, marginTop: 4 }}
              onChange={(e) => (reason = e.target.value)}
              placeholder="Nhập lý do hủy..."
            />
          </div>
        </div>
      ),
      onOk: () => {
        cancelMutation.mutate({ bookingId: booking.id!, reason });
      },
    });
  };
  const canModifyService = booking && Number(booking.stay_status_id) === 2;
  const initiateAddService = (
    bookingItemId: number,
    serviceId: number,
    quantity: number = 1
  ) => {
    if (!booking || !booking.id || !canModifyService) {
      message.warning(
        "Chỉ có thể thêm dịch vụ khi booking ở trạng thái Đã xác nhận hoặc Đang ở!"
      );
      return;
    }
    const service = allServices.find((s) => s.id === serviceId);
    if (!service) {
      message.error("Không tìm thấy dịch vụ");
      return;
    }
    setPendingService({
      bookingItemId,
      serviceId,
      quantity,
      serviceName: service.name,
      servicePrice: service.price,
      serviceUnit: service.unit || "Cái",
    });
    setServiceNote("");
    setServiceModalVisible(true);
  };
  const confirmAddService = () => {
    if (!pendingService || !booking?.id) return;
    const { bookingItemId, serviceId, quantity } = pendingService;
    const service = allServices.find((s) => s.id === serviceId);
    if (!service) return;
    setAddingService(bookingItemId);

    addServiceMutation.mutate({
      booking_id: booking.id,
      booking_item_id: bookingItemId,
      service_id: serviceId,
      quantity: quantity,
      total_service_price: service.price * quantity,
      note: serviceNote || undefined,
    });
  };
<<<<<<< HEAD

  const handleConfirmCheckout = async () => {
    if (!booking || !booking.id) return;
    // Mở modal để ghi nhận thiết bị hỏng
    setDeviceDamageModalVisible(true);
  };

  useEffect(() => {
    if (booking?.damages) {
      setDeviceDamage(
        booking.damages.map((d: any) => ({
          ...d,
          amount: d.amount !== undefined ? Number(d.amount) : d.amount,
        }))
      );
    }
  }, [booking?.damages]);

  // damageTotal không cần nữa vì dùng booking.damage_total trực tiếp

  const handleConfirmCheckoutWithDamage = async () => {
    if (!booking || !booking.id) return;
    
    setUpdating(true);
    try {
      // Kiểm tra nếu có thông tin trong newDamage nhưng chưa được thêm vào danh sách
      const finalDeviceDamage = [...deviceDamage];
      if (newDamage.device_name && newDamage.description) {
        // Tự động thêm vào danh sách nếu có thông tin
        finalDeviceDamage.push({
          device_id: newDamage.device_id || null,
          device_name: newDamage.device_name,
          description: newDamage.description,
          amount: newDamage.amount,
        });
        console.log("⚠️ Auto-added newDamage to list:", newDamage);
      }
      
      // Lưu danh sách thiết bị hỏng/mất vào DB (cập nhật total_price + damage_total)
      console.log("💾 Device damage before save:", finalDeviceDamage);
      
      const normalizedDamages = finalDeviceDamage.map((d) => ({
        booking_item_id: d.booking_item_id || null,
        device_id: d.device_id || null,
        device_name: d.device_name?.trim() || "",
        description: d.description || undefined,
        amount: d.amount ? Number(d.amount) : 0,
      }));

      console.log("💾 Normalized damages to save:", normalizedDamages);

      // Validate
      if (normalizedDamages.some((d) => !d.device_name)) {
        message.error("Vui lòng nhập tên thiết bị cho tất cả các mục");
        setUpdating(false);
        return;
      }

      // Luôn gọi API để lưu (kể cả mảng rỗng để xóa damages cũ nếu có)
      console.log("💾 Calling updateBookingDamages API with", normalizedDamages.length, "damages...");
      await updateBookingDamages(Number(booking.id), normalizedDamages);
      console.log("✅ updateBookingDamages API call completed");

      await confirmCheckout(booking.id!);
      
      // Invalidate cache và refetch để lấy dữ liệu mới nhất
      await queryClient.invalidateQueries({ queryKey: ["booking", id] });
      
      // Đợi một chút để đảm bảo DB transaction đã commit
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refetch và đợi kết quả
      const result = await refetch();
      
      console.log("✅ After checkout, updated booking:", result.data);
      console.log("✅ Damages:", result.data?.damages);
      console.log("✅ Damage total:", result.data?.damage_total);
      console.log("✅ Total price:", result.data?.total_price);
      
      setCheckoutConfirmed(true);
      setDeviceDamageModalVisible(false);
      setDeviceDamage([]);
      setNewDamage({ device_id: null, device_name: "", description: "", amount: undefined });
      message.success(
        "Đã xác nhận checkout - Phòng chuyển sang trạng thái Cleaning"
      );
    } catch (err: any) {
      console.error("Lỗi xác nhận checkout:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Lỗi xác nhận checkout";
      message.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintBill = async () => {
    if (!booking || !booking.id) return;
    
    // Refetch booking để đảm bảo có dữ liệu mới nhất (bao gồm damages)
    try {
      await queryClient.invalidateQueries({ queryKey: ["booking", id] });
      const result = await refetch();
      const latestBooking = result.data || booking;
      
      // Debug: log booking data để kiểm tra
      console.log("📄 Printing bill for booking:", latestBooking.id);
      console.log("📄 Booking damages:", latestBooking.damages);
      console.log("📄 Booking damage_total:", latestBooking.damage_total);
      console.log("📄 Booking total_price:", latestBooking.total_price);
      
      // Sử dụng latestBooking thay vì booking
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        message.error("Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.");
        return;
      }

    const groupedServices = latestBooking.services?.reduce((acc: any[], curr: any) => {
      const existing = acc.find(
        (s) => s.service_id === curr.service_id && s.booking_item_id === curr.booking_item_id
      );
      if (existing) {
        existing.quantity = (existing.quantity || 1) + (curr.quantity || 1);
        existing.total_service_price =
          (Number(existing.total_service_price) || 0) +
          (Number(curr.total_service_price) || 0);
      } else {
        acc.push({
          ...curr,
          quantity: curr.quantity || 1,
          total_service_price: Number(curr.total_service_price) || 0,
        });
      }
      return acc;
    }, []);

    const billHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Hóa đơn #${latestBooking.id}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #1890ff;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1890ff;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
              color: #333;
            }
            .text-right {
              text-align: right;
            }
            .total-section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #1890ff;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              font-size: 16px;
            }
            .total-final {
              font-size: 20px;
              font-weight: bold;
              color: #ff4d4f;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PENSTAR HOTEL</h1>
            <p>Hóa đơn thanh toán</p>
            <p>Mã đơn: #${latestBooking.id}</p>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Khách hàng:</span>
              <span class="info-value">${latestBooking.customer_name || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày tạo:</span>
              <span class="info-value">${latestBooking.created_at ? formatDate(latestBooking.created_at) : "—"}</span>
            </div>
            ${latestBooking.items && latestBooking.items.length > 0 ? `
            <div class="info-row">
              <span class="info-label">Ngày nhận phòng:</span>
              <span class="info-value">${formatDate(latestBooking.items[0].check_in)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày trả phòng:</span>
              <span class="info-value">${formatDate(latestBooking.items[0].check_out)}</span>
            </div>
            ` : ""}
            <div class="info-row">
              <span class="info-label">Phương thức thanh toán:</span>
              <span class="info-value">${latestBooking.payment_method?.toUpperCase() || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Trạng thái:</span>
              <span class="info-value">${latestBooking.payment_status?.toUpperCase() || "—"}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Phòng</th>
                <th class="text-right">Giá</th>
              </tr>
            </thead>
            <tbody>
              ${latestBooking.items?.map((item: any, idx: number) => {
                const room = rooms.find((r) => r.id === item.room_id);
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${room?.name || `Phòng ${item.room_id}`}</td>
                    <td class="text-right">${formatPrice(item.room_type_price || 0)}</td>
                  </tr>
                `;
              }).join("") || ""}
            </tbody>
          </table>

          ${groupedServices && groupedServices.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Dịch vụ</th>
                <th class="text-right">Số lượng</th>
                <th class="text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${groupedServices.map((service: any, idx: number) => {
                const serviceInfo = services.find((s) => s.id === service.service_id);
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${serviceInfo?.name || `Dịch vụ #${service.service_id}`}</td>
                    <td class="text-right">${service.quantity || 1}</td>
                    <td class="text-right">${formatPrice(service.total_service_price || 0)}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
          ` : ""}

          ${(latestBooking.damages && Array.isArray(latestBooking.damages) && latestBooking.damages.length > 0) ? `
          <h3 style="margin-top: 20px; margin-bottom: 10px; color: #333;">Thiết bị hỏng/mất</h3>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Thiết bị hỏng/mất</th>
                <th>Mô tả</th>
                <th class="text-right">Chi phí bồi thường</th>
              </tr>
            </thead>
            <tbody>
              ${latestBooking.damages.map((damage: any, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${damage.device_name || "—"}</td>
                  <td>${damage.description || "—"}</td>
                  <td class="text-right">${formatPrice(damage.amount || 0)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          ` : ""}

          <div class="total-section">
            <div class="total-row">
              <span>Tiền phòng:</span>
              <span>${formatPrice(latestBooking.total_room_price || 0)}</span>
            </div>
            ${latestBooking.total_service_price ? `
            <div class="total-row">
              <span>Dịch vụ bổ sung:</span>
              <span>${formatPrice(latestBooking.total_service_price)}</span>
            </div>
            ` : ""}
            ${latestBooking.promo_code && latestBooking.discount_amount ? `
            <div class="total-row">
              <span>Tổng tiền gốc:</span>
              <span style="text-decoration: line-through; color: #999;">${formatPrice(latestBooking.original_total || 0)}</span>
            </div>
            <div class="total-row">
              <span>Mã giảm giá (${latestBooking.promo_code}):</span>
              <span style="color: #52c41a;">-${formatPrice(latestBooking.discount_amount)}</span>
            </div>
            ` : ""}
            ${(latestBooking.damage_total !== undefined && latestBooking.damage_total !== null && Number(latestBooking.damage_total) > 0) ? `
            <div class="total-row">
              <span>Phí thiết bị hỏng/mất:</span>
              <span style="color: #ff4d4f;">${formatPrice(Number(latestBooking.damage_total))}</span>
            </div>
            ${latestBooking.payment_status === "paid" ? `
            <div class="total-row" style="font-size: 12px; color: #999;">
              <span>(Đã thanh toán: ${formatPrice(Number(latestBooking.total_price || 0) - Number(latestBooking.damage_total || 0))})</span>
            </div>
            ` : ""}
            ` : ""}
            <div class="total-row total-final">
              <span>${latestBooking.payment_status === "paid" && latestBooking.damage_total && Number(latestBooking.damage_total) > 0 ? "SỐ TIỀN CẦN TRẢ THÊM:" : "TỔNG CỘNG:"}</span>
              <span>${latestBooking.payment_status === "paid" && latestBooking.damage_total && Number(latestBooking.damage_total) > 0 
                ? formatPrice(Number(latestBooking.damage_total))
                : formatPrice(latestBooking.total_price || 0)}</span>
            </div>
            ${latestBooking.payment_status === "paid" && latestBooking.damage_total && Number(latestBooking.damage_total) > 0 ? `
            <div class="total-row" style="font-size: 12px; color: #999; margin-top: 8px;">
              <span>Tổng cộng (đã thanh toán + thiết bị hỏng): ${formatPrice(latestBooking.total_price || 0)}</span>
            </div>
            ` : ""}
          </div>

          <div class="footer">
            <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
            <p>PenStar Hotel - Hotline: 1900-xxxx</p>
          </div>
        </body>
      </html>
    `;

      printWindow.document.write(billHTML);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (err: any) {
      console.error("Lỗi khi in hóa đơn:", err);
      message.error("Không thể tải dữ liệu booking mới nhất. Vui lòng thử lại.");
    }
=======
  const handlePrintBill = () => {
    if (!booking) return;
    const html = generateBillHTML(
      booking,
      rooms,
      services,
      incidents,
      formatDate,
      formatPrice
    );
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      message.error(
        "Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt."
      );
      return;
    }
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.document.write(html);
      printWindow.print();
      printWindow.close();
    }, 250);
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
  };
  if (isBookingLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }
  if (isError || !booking) {
    return (
      <Card style={{ maxWidth: 800, margin: "20px auto" }}>
        <Space
          direction="vertical"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Text type="danger">Không thể tải thông tin đặt phòng.</Text>
          <Button type="primary" onClick={() => refetch()}>
            Thử lại
          </Button>
        </Space>
      </Card>
    );
  }
  const totalExtraAdultFees =
    booking?.items?.reduce(
      (sum, item: any) => sum + (Number(item.extra_adult_fees) || 0),
      0
    ) || 0;
  const totalExtraChildFees =
    booking?.items?.reduce(
      (sum, item: any) => sum + (Number(item.extra_child_fees) || 0),
      0
    ) || 0;
  const totalOtherExtraFees =
    booking?.items?.reduce(
      (sum, item: any) => sum + (Number(item.extra_fees) || 0),
      0
    ) || 0;
  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Space
          style={{
            marginBottom: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Space>
            <Title level={3} style={{ margin: 0 }}>
              Chi tiết đặt phòng
            </Title>
            {booking.is_refunded ? (
              <Tag
                color="purple"
                style={{ fontSize: 16, padding: "2px 12px", fontWeight: 600 }}
              >
                ĐÃ HOÀN TIỀN
              </Tag>
            ) : null}
          </Space>
        </Space>
        {}
        <Card style={{ marginBottom: 16 }}>
          <Descriptions
            title="Thông tin chung"
            bordered
            column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}
          >
            <Descriptions.Item label="Mã đặt phòng">
              #{booking.id}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian đặt">
              {booking.created_at ? formatDate(booking.created_at) : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {(() => {
                const statusId = Number(booking.stay_status_id);
                let color = "default";
                let text = "Unknown";
                // Map status (can be refactored to centralized helper)
                switch (statusId) {
                  case 1:
                    color = "cyan";
                    text = "Booked";
                    break;
                  case 2:
                    color = "green";
                    text = "Đã nhận phòng";
                    break;
                  case 3:
                    color = "orange";
                    text = "Đã trả phòng";
                    break;
                  case 4:
                    color = "red";
                    text = "Đã hủy";
                    break;
                  case 5:
                    color = "red";
                    text = "No Show";
                    break;
                  case 6:
                    color = "yellow";
                    text = "Pending Approval";
                    break;
                }
                return <Tag color={color}>{text}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày Check-in">
              {booking.check_in ? safeFormatDateShort(booking.check_in) : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày Check-out">
              {booking.check_out ? safeFormatDateShort(booking.check_out) : "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <Space>
              <UserOutlined /> Thông tin khách hàng
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Descriptions
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Họ tên">
              <b>{booking.customer_name || "—"}</b>
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {booking.phone || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {booking.email || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              <Space>
                {booking.booking_method && (
                  <Tag
                    color={
                      booking.booking_method === "online" ? "yellow" : "green"
                    }
                  >
                    {booking.booking_method === "online"
                      ? "Online"
                      : "Trực tiếp"}
                  </Tag>
                )}
                {booking.payment_method && (
                  <Tag
                    color={
                      booking.payment_method === "cash"
                        ? "green"
                        : booking.payment_method === "momo"
                          ? "magenta"
                          : booking.payment_method === "vnpay"
                            ? "purple"
                            : "default"
                    }
                  >
                    {booking.payment_method.toUpperCase()}
                  </Tag>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Check-in bởi">
              {booking.checked_in_by_email || (
                <Text type="secondary">Chưa check-in</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Check-out bởi">
              {booking.checked_out_by_email || (
                <Text type="secondary">Chưa check-out</Text>
              )}
            </Descriptions.Item>
            {booking.stay_status_id === 4 && (
              <>
                <Descriptions.Item label="Người hủy" span={2}>
                  <Text type="danger">
                    {booking.canceled_by_name || "Không rõ"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian hủy">
                  <Text type="danger">
                    {booking.canceled_at
                      ? safeFormatDateTime(booking.canceled_at)
                      : "—"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Lý do hủy">
                  <Text type="danger">{booking.cancel_reason || "—"}</Text>
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </Card>
        {}
        <Card
          title={
            <Space>
              <HomeOutlined />
              {(() => {
                const total = booking.items?.length || 0;
                const cancelled =
                  booking.items?.filter((i: any) => i.status === "cancelled")
                    .length || 0;
                const active = total - cancelled;
                if (cancelled > 0) {
                  return `Phòng đã đặt (${active} hoạt động, ${cancelled} đã hủy)`;
                }
                return `Phòng đã đặt (${total} phòng)`;
              })()}
            </Space>
          }
          style={{ marginBottom: 16 }}
          loading={loadingExtras}
        >
          {rooms.length > 0 ? (
            <List
              dataSource={booking.items?.map((item: any, index: number) => ({
                item,
                room: rooms[index],
                index,
              }))}
              renderItem={({ item, room, index }) => {
                if (!room) return null;
                const numAdults = Number(item.num_adults) || 0;
                const numChildren = Number(item.num_children) || 0;
                // const totalGuests = numAdults + numChildren;
                const specialRequests = item.special_requests;
                const extraAdultFees = item.extra_adult_fees || 0;
                const extraChildFees = item.extra_child_fees || 0;
                const extraFees = item.extra_fees || 0;
                // const quantity = item.quantity || 1;
                const numBabies = item.num_babies || 0;
                const roomServices =
                  booking.services?.filter(
                    (s: any) => s.booking_item_id === item.id
                  ) || [];
                const isCancelled = item.status === "cancelled";

                return (
                  <List.Item key={index}>
                    <Card
                      type="inner"
                      style={{
                        width: "100%",
                        background: isCancelled ? "#fff1f0" : "#fafafa",
                        opacity: isCancelled ? 0.8 : 1,
                      }}
                      bodyStyle={{ padding: "16px" }}
                    >
                      <Row gutter={[24, 24]}>
                        {/* Left Column: Room Info & Financials */}
                        <Col xs={24} md={10}>
                          <div
                            style={{
                              display: "flex",
                              gap: "16px",
                              marginBottom: "16px",
                            }}
                          >
                            <div
                              style={{
                                width: "100px",
                                height: "100px",
                                flexShrink: 0,
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "1px solid #f0f0f0",
                              }}
                            >
                              {room.image ? (
                                <img
                                  src={getImageUrl(room.image)}
                                  alt={room.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    filter: isCancelled
                                      ? "grayscale(100%)"
                                      : "none",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    background: "#f5f5f5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#ccc",
                                  }}
                                >
                                  <HomeOutlined style={{ fontSize: "24px" }} />
                                </div>
                              )}
                            </div>
                            <div>
                              <Space align="center" style={{ marginBottom: 4 }}>
                                <Text
                                  strong
                                  style={{
                                    fontSize: "16px",
                                    textDecoration: isCancelled
                                      ? "line-through"
                                      : "none",
                                  }}
                                >
                                  {room.name || `Phòng ${room.id}`}
                                </Text>
                                {isCancelled && (
                                  <Tag color="red" style={{ fontWeight: 600 }}>
                                    ĐÃ HỦY
                                  </Tag>
                                )}
                              </Space>
                              <div style={{ marginBottom: "4px" }}>
                                <Tag color="yellow">
                                  {room.type_name ||
                                    `Loại phòng ${room.type_id}`}
                                </Tag>
                              </div>
                              <div style={{ marginBottom: "4px" }}>
                                <Text strong className="text-yellow-600">
                                  {formatPrice(
                                    Number(item.room_type_price || 0)
                                  )}
                                </Text>
                              </div>
                              <Text
                                type="secondary"
                                style={{ fontSize: "13px" }}
                              >
                                <UserOutlined /> {numAdults} người lớn
                                {numChildren > 0
                                  ? `, ${numChildren} trẻ em`
                                  : ""}
                                {numBabies > 0 ? `, ${numBabies} em bé` : ""}
                              </Text>
                            </div>
                          </div>

                          {/* Special Requests */}
                          {specialRequests && (
                            <div
                              style={{
                                marginTop: "12px",
                                marginBottom: "12px",
                                padding: "8px 12px",
                                background: "#fff3cd",
                                border: "1px solid #FFC107",
                                borderRadius: "4px",
                                fontSize: "13px",
                                display: "flex",
                                gap: "8px",
                                alignItems: "start",
                              }}
                            >
                              <div style={{ marginTop: "2px" }}>
                                <TagOutlined />
                              </div>
                              <div>
                                <b>Yêu cầu đặc biệt:</b> <br />
                                {specialRequests}
                              </div>
                            </div>
                          )}

                          {/* Financials / Extra Fees */}
                          {(extraAdultFees > 0 ||
                            extraChildFees > 0 ||
                            extraFees > 0) && (
                            <div
                              style={{
                                background: "#fff",
                                padding: "12px",
                                borderRadius: "6px",
                                border: "1px dashed #d9d9d9",
                                marginTop: "12px",
                              }}
                            >
                              <Text strong style={{ fontSize: "13px" }}>
                                Phụ phí phát sinh:
                              </Text>
                              <div style={{ marginTop: "8px" }}>
                                {extraAdultFees > 0 && (
                                  <div className="flex justify-between text-xs mb-1">
                                    <Text type="secondary">Người lớn:</Text>
                                    <Text type="danger">
                                      {formatPrice(extraAdultFees)}
                                    </Text>
                                  </div>
                                )}
                                {extraChildFees > 0 && (
                                  <div className="flex justify-between text-xs mb-1">
                                    <Text type="secondary">Trẻ em:</Text>
                                    <Text type="danger">
                                      {formatPrice(extraChildFees)}
                                    </Text>
                                  </div>
                                )}
                                {extraFees > 0 && (
                                  <div
                                    className="flex justify-between text-xs pt-1 border-t border-dashed"
                                    style={{ marginTop: "4px" }}
                                  >
                                    <Text strong>Tổng phụ phí:</Text>
                                    <Text type="danger" strong>
                                      {formatPrice(extraFees)}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Col>

                        {/* Right Column: Services */}
                        <Col xs={24} md={14}>
                          <div
                            style={{
                              background: "#fff",
                              padding: "12px",
                              borderRadius: "6px",
                              border: "1px solid #f0f0f0",
                              height: "100%",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "12px",
                                borderBottom: "1px solid #f0f0f0",
                                paddingBottom: "8px",
                              }}
                            >
                              <Space>
                                <TagOutlined style={{ color: "#1890ff" }} />
                                <Text strong style={{ fontSize: "13px" }}>
                                  Dịch vụ ({roomServices.length})
                                </Text>
                              </Space>
                              <Space>
                                <Select
                                  placeholder="+ Thêm"
                                  style={{ width: 100 }}
                                  size="small"
                                  bordered={false}
                                  className="bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                                  loading={addingService === item.id}
                                  onSelect={(serviceId: number | null) => {
                                    if (serviceId) {
                                      initiateAddService(item.id, serviceId, 1);
                                    }
                                  }}
                                  value={null}
                                  disabled={
                                    addingService === item.id ||
                                    !canModifyService ||
                                    isCancelled
                                  }
                                  dropdownMatchSelectWidth={250}
                                >
                                  {allServices
                                    .filter(
                                      (s) =>
                                        !roomServices.some(
                                          (rs: any) => rs.service_id === s.id
                                        )
                                    )
                                    .map((s) => (
                                      <Select.Option key={s.id} value={s.id}>
                                        <Row justify="space-between">
                                          <Text>{s.name}</Text>
                                          <Text type="secondary">
                                            {formatPrice(s.price)}
                                          </Text>
                                        </Row>
                                      </Select.Option>
                                    ))}
                                </Select>
                              </Space>
                            </div>

                            <div
                              style={{
                                maxHeight: "120px",
                                overflowY: "auto",
                                paddingRight: "4px",
                              }}
                            >
                              {roomServices.length > 0 ? (
                                <div className="space-y-2">
                                  {roomServices.map(
                                    (bookingService: any, sIndex: number) => {
                                      const service = services.find(
                                        (s) =>
                                          s.id === bookingService.service_id
                                      );
                                      return (
                                        <div key={sIndex}>
                                          <div className="flex justify-between items-center text-xs">
                                            <div>
                                              <span className="text-gray-600">
                                                {service?.name ||
                                                  `#${bookingService.service_id}`}
                                              </span>
                                              <span className="text-gray-400 ml-1">
                                                (x{bookingService.quantity}{" "}
                                                {service?.unit || "Cái"})
                                              </span>
                                            </div>
                                            <div className="font-medium text-gray-700">
                                              {formatPrice(
                                                bookingService.total_service_price ||
                                                  0
                                              )}
                                            </div>
                                          </div>
                                          {bookingService.note && (
                                            <div
                                              className="text-gray-500 italic"
                                              style={{
                                                fontSize: "11px",
                                                marginTop: "-2px",
                                                marginLeft: "0px",
                                              }}
                                            >
                                              Ghi chú: {bookingService.note}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-400 text-xs italic">
                                  Chưa sử dụng dịch vụ
                                </div>
                              )}
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty description="Không có thông tin phòng" />
          )}
        </Card>
        {}
        {booking.services &&
          booking.services.some((s: any) => !s.booking_item_id) && (
            <Card
              title={
                <Space>
                  <TagOutlined /> Dịch vụ bổ sung chung
                </Space>
              }
              style={{ marginBottom: 16 }}
              loading={loadingExtras}
            >
              <div
                style={{
                  background: "#fffbe6",
                  border: "1px solid #ffe58f",
                  borderRadius: 4,
                  padding: "8px 12px",
                  marginBottom: 16,
                }}
              >
                <Text type="warning" style={{ fontSize: 12, display: "block" }}>
                  Các dịch vụ này chưa được gán cho phòng cụ thể (dữ liệu cũ -
                  trước cập nhật)
                </Text>
              </div>
              <List
                dataSource={(() => {
                  const groupedServices = booking.services
                    .filter((s: any) => !s.booking_item_id)
                    .reduce((acc: any[], curr: any) => {
                      const existing = acc.find(
                        (item) => item.service_id === curr.service_id
                      );
                      if (existing) {
                        existing.quantity =
                          (existing.quantity || 0) + (curr.quantity || 1);
                        existing.total_service_price =
                          (Number(existing.total_service_price) || 0) +
                          (Number(curr.total_service_price) || 0);
                      } else {
                        acc.push({
                          ...curr,
                          quantity: curr.quantity || 1,
                          total_service_price:
                            Number(curr.total_service_price) || 0,
                        });
                      }
                      return acc;
                    }, []);
                  return groupedServices;
                })()}
                renderItem={(bookingService: any, index: number) => {
                  const service = services.find(
                    (s) => s.id === bookingService.service_id
                  );
                  return (
                    <List.Item key={index}>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor: "#ff4d4f",
                              verticalAlign: "middle",
                            }}
                            size="large"
                            icon={<TagOutlined />}
                          />
                        }
                        title={
                          <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: 15 }}>
                              {service?.name ||
                                `Dịch vụ #${bookingService.service_id}`}
                            </Text>
                          </Space>
                        }
                        description={
                          <div style={{ marginTop: 8 }}>
                            <Space split={<Divider type="vertical" />}>
                              <Tag color="yellow">
                                Số lượng: {bookingService.quantity || 1}
                              </Tag>
                              {service?.price && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Đơn giá: {formatPrice(service.price)}
                                </Text>
                              )}
                            </Space>
                          </div>
                        }
                      />
                      <div
                        style={{
                          textAlign: "right",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                        }}
                      >
                        <Text strong style={{ fontSize: 16, color: "#ff4d4f" }}>
                          {formatPrice(bookingService.total_service_price || 0)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Thành tiền
                        </Text>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}
        <Card
          title={
            <Space>
              <DollarOutlined /> Tổng kết thanh toán
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Divider style={{ margin: "12px 0" }} />
            {booking.stay_status_id === 4 && (
              <>
                {booking.refund_amount !== undefined &&
                booking.refund_amount > 0 ? (
                  <>
                    {booking.items && booking.items.length > 1 && (
                      <div style={{ marginBottom: 12 }}>
                        <Text
                          strong
                          style={{
                            color: "#722ed1",
                            marginBottom: 8,
                            display: "block",
                          }}
                        >
                          Chi tiết hoàn tiền theo phòng:
                        </Text>
                        {booking.items.map((item: any, idx: number) => {
                          const room = rooms[idx];
                          const roomName = room?.name
                            ? `Phòng ${room.name}`
                            : `Phòng ${idx + 1}`;
                          const itemRefund = item.refund_amount || 0;
                          const refundPolicy = item.refund_policy;
                          const refundPercent =
                            refundPolicy?.refund_percent || 0;
                          const isNonRefundable = refundPolicy?.non_refundable;
                          const isRefundable = refundPolicy?.refundable;
                          return (
                            <Row
                              key={idx}
                              justify="space-between"
                              style={{
                                fontSize: 13,
                                marginLeft: 16,
                                marginBottom: 4,
                              }}
                            >
                              <Col>
                                <Text>{roomName}</Text>
                                <Text
                                  type="secondary"
                                  style={{ marginLeft: 8, fontSize: 12 }}
                                >
                                  {isNonRefundable
                                    ? "(Không hoàn tiền)"
                                    : isRefundable
                                      ? `(Hoàn ${refundPercent}% trước ${
                                          refundPolicy?.refund_deadline_hours ||
                                          24
                                        }h)`
                                      : "(Không có chính sách)"}
                                </Text>
                              </Col>
                              <Col>
                                <Text
                                  style={{
                                    color: itemRefund > 0 ? "#722ed1" : "#999",
                                  }}
                                >
                                  {itemRefund > 0
                                    ? formatPrice(itemRefund)
                                    : "Không hoàn"}
                                </Text>
                              </Col>
                            </Row>
                          );
                        })}
                        <Divider style={{ margin: "8px 0" }} />
                      </div>
                    )}
                    <Row justify="space-between" style={{ marginBottom: 8 }}>
                      <Col>
                        <Text strong style={{ color: "#722ed1" }}>
                          Tổng số tiền hoàn trả:
                        </Text>
                        <Text
                          type="secondary"
                          style={{ marginLeft: 8, fontSize: 13 }}
                        >
                          (
                          {booking.total_room_price
                            ? Math.round(
                                (Number(booking.refund_amount) /
                                  Number(booking.total_room_price)) *
                                  100
                              )
                            : 0}
                          % tiền phòng)
                        </Text>
                      </Col>
                      <Col>
                        <Text strong style={{ color: "#722ed1", fontSize: 16 }}>
                          {formatPrice(booking.refund_amount)}
                        </Text>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <Row style={{ marginBottom: 8 }}>
                    <Col span={24}>
                      <Tag color="orange" style={{ fontSize: 14 }}>
                        Booking này không được hoàn tiền (không đủ điều kiện
                        hoặc loại phòng không hoàn tiền)
                      </Tag>
                    </Col>
                  </Row>
                )}
              </>
            )}
            {booking.is_refunded ? (
              <Row>
                <Col span={24}>
                  <Tag
                    color="purple"
                    style={{ fontSize: 15, marginBottom: 8, fontWeight: 600 }}
                  >
                    Đặt phòng này đã được hoàn tiền cho khách.
                  </Tag>
                </Col>
              </Row>
            ) : null}
            {!booking.is_refunded && (
              <Row>
                <Col span={24}>
                  {(() => {
                    const vv = String(
                      booking.payment_status || ""
                    ).toLowerCase();
                    const color =
                      vv === "paid"
                        ? "green"
                        : vv === "pending"
                          ? "gold"
                          : vv === "failed"
                            ? "red"
                            : vv === "refunded"
                              ? "purple"
                              : vv === "cancelled"
                                ? "red"
                                : "default";
                    return (
                      <Tag
                        color={color}
                        style={{
                          fontSize: 15,
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                        {String(booking.payment_status || "").toUpperCase()}
                      </Tag>
                    );
                  })()}
                </Col>
              </Row>
            )}
            <Row justify="space-between">
              <Text>Tiền phòng (Giá gốc)</Text>
              <Text strong>
                {formatPrice(
                  (booking.total_room_price || 0) -
                    (totalExtraAdultFees +
                      totalExtraChildFees +
                      totalOtherExtraFees)
                )}
              </Text>
            </Row>
            {totalExtraAdultFees > 0 && (
              <Row justify="space-between" style={{ fontSize: 13 }}>
                <Text type="secondary" style={{ paddingLeft: 12 }}>
                  ↳ Phụ phí người lớn
                </Text>
                <Text>{formatPrice(totalExtraAdultFees)}</Text>
              </Row>
            )}
            {totalExtraChildFees > 0 && (
              <Row justify="space-between" style={{ fontSize: 13 }}>
                <Text type="secondary" style={{ paddingLeft: 12 }}>
                  ↳ Phụ phí trẻ em
                </Text>
                <Text>{formatPrice(totalExtraChildFees)}</Text>
              </Row>
            )}
            {totalOtherExtraFees > 0 && (
              <Row justify="space-between" style={{ fontSize: 13 }}>
                <Text type="secondary" style={{ paddingLeft: 12 }}>
                  ↳ Phụ phí khác
                </Text>
                <Text>{formatPrice(totalOtherExtraFees)}</Text>
              </Row>
            )}
            {booking.total_service_price ? (
              <Row justify="space-between" style={{ marginTop: 8 }}>
                <Text>Dịch vụ bổ sung</Text>
                <Text strong>{formatPrice(booking.total_service_price)}</Text>
              </Row>
            ) : null}
            {incidents.length > 0 && (
              <>
                <Divider style={{ margin: "12px 0" }} />
                <Row>
                  <Col span={24}>
                    <Text strong style={{ color: "#d4380d" }}>
                      Đền bù thiết bị:
                    </Text>
                  </Col>
                </Row>
                {incidents.map((incident, idx) => {
                  const roomObj = rooms.find((r) => r.id === incident.room_id);
                  const roomName = roomObj ? roomObj.name : incident.room_id;
                  return (
                    <Row
                      key={idx}
                      justify="space-between"
                      style={{ fontSize: 13 }}
                    >
                      <Col>
                        <Text>
                          {incident.equipment_name} (Phòng {roomName}) x{" "}
                          {incident.quantity}
                        </Text>
                      </Col>
                      <Col>
                        <Text type="danger">
                          {formatPrice(Number(incident.amount) || 0)}
                        </Text>
                      </Col>
                    </Row>
                  );
                })}
                <Row justify="space-between" style={{ marginTop: 4 }}>
                  <Text>Tổng đền bù</Text>
                  <Text strong type="danger">
                    {formatPrice(
                      incidents.reduce(
                        (sum, i) => sum + (Number(i.amount) || 0),
                        0
                      )
                    )}
                  </Text>
                </Row>
              </>
<<<<<<< HEAD
            ) : null}
            {(booking.damages && booking.damages.length > 0) && (
              <>
                <Divider style={{ margin: "12px 0" }} />
                <Title level={5} style={{ margin: 0 }}>
                  Thiết bị hỏng/mất
                </Title>
                <List
                  dataSource={booking.damages}
                  renderItem={(d: any) => (
                    <List.Item style={{ padding: "6px 0" }}>
                      <div style={{ width: "100%" }}>
                        <div className="flex justify-between">
                          <Text strong>{d.device_name}</Text>
                          {d.amount && (
                            <Text type="danger">{formatPrice(Number(d.amount))}</Text>
                          )}
                        </div>
                        {d.description && (
                          <Text type="secondary">{d.description}</Text>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
                {booking.damage_total && Number(booking.damage_total) > 0 && (
                  <Row justify="space-between" style={{ marginTop: 8 }}>
                    <Text strong>Tổng phí thiết bị</Text>
                    <Text strong type="danger">{formatPrice(Number(booking.damage_total))}</Text>
                  </Row>
                )}
              </>
            )}
            <Divider style={{ margin: "12px 0" }} />
            {booking.damage_total && Number(booking.damage_total) > 0 && (
              <>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Text>Phí thiết bị hỏng/mất</Text>
                  <Text strong style={{ color: "#ff4d4f" }}>
                    {formatPrice(Number(booking.damage_total))}
                  </Text>
                </Row>
                {booking.payment_status === "paid" && (
                  <Row justify="space-between" style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      (Đã thanh toán: {formatPrice((Number(booking.total_price || 0) - Number(booking.damage_total || 0)))})
                    </Text>
                  </Row>
                )}
              </>
            )}
=======
            )}
            {lateCheckoutInfo.isLate && (
              <>
                <Divider style={{ margin: "12px 0" }} />
                <Row
                  justify="space-between"
                  style={{
                    backgroundColor: "#fff7e6",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ffa940",
                  }}
                >
                  <div>
                    <Text strong style={{ color: "#fa541c" }}>
                      ⚠️ Phí checkout muộn
                    </Text>
                    <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                      {lateCheckoutInfo.hours} giờ × 100,000₫
                    </div>
                  </div>
                  <Text strong style={{ color: "#fa541c", fontSize: "16px" }}>
                    {lateCheckoutInfo.fee.toLocaleString("vi-VN")} ₫
                  </Text>
                </Row>
              </>
            )}
            <Divider style={{ margin: "12px 0" }} />
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between">
              <Title level={4} style={{ margin: 0 }}>
                {booking.payment_status === "paid" && booking.damage_total && Number(booking.damage_total) > 0
                  ? "Số tiền cần trả thêm"
                  : "Tổng cộng"}
              </Title>
<<<<<<< HEAD
              <Title level={4} type="danger" style={{ margin: 0 }}>
                {booking.payment_status === "paid" && booking.damage_total && Number(booking.damage_total) > 0
                  ? formatPrice(Number(booking.damage_total))
                  : formatPrice(booking.total_price || 0)}
              </Title>
=======
              <div style={{ textAlign: "right" }}>
                {(() => {
                  const originalTotal =
                    booking.total_price != null
                      ? booking.total_price
                      : (booking.total_room_price || 0) +
                        (booking.total_service_price || 0);

                  // Calculate total refund from items that are ACTUALLY refunded (is_refunded = true)
                  const totalRefunded =
                    booking.items?.reduce((sum: number, item: any) => {
                      if (
                        item.status === "cancelled" &&
                        item.refund_amount &&
                        item.is_refunded === true
                      ) {
                        return sum + Number(item.refund_amount);
                      }
                      return sum;
                    }, 0) || 0;

                  const finalTotal = originalTotal - totalRefunded;

                  if (totalRefunded > 0) {
                    return (
                      <>
                        <Text
                          delete
                          type="secondary"
                          style={{ display: "block" }}
                        >
                          {formatPrice(originalTotal)}
                        </Text>
                        <Title level={4} type="danger" style={{ margin: 0 }}>
                          {formatPrice(finalTotal)}
                        </Title>
                        <Text type="success" style={{ fontSize: "12px" }}>
                          (Đã trừ hoàn tiền: {formatPrice(totalRefunded)})
                        </Text>
                      </>
                    );
                  }

                  return (
                    <Title level={4} type="danger" style={{ margin: 0 }}>
                      {formatPrice(originalTotal)}
                    </Title>
                  );
                })()}
              </div>
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
            </Row>
            {booking.payment_status === "paid" && booking.damage_total && Number(booking.damage_total) > 0 && (
              <Row justify="space-between" style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tổng cộng (đã thanh toán + thiết bị hỏng): {formatPrice(booking.total_price || 0)}
                </Text>
              </Row>
            )}
          </Space>
        </Card>
        {}
        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Space>
            <Button onClick={() => navigate(-1)}>Quay lại</Button>
            {booking.stay_status_id === 4 &&
              booking.payment_status === "paid" &&
              !booking.is_refunded &&
              booking.refund_amount !== undefined &&
              booking.refund_amount > 0 && (
                <Button
                  type="primary"
                  danger
                  onClick={() => navigate("/admin/refund-requests")}
                >
                  Xử lý hoàn tiền ({formatPrice(booking.refund_amount)})
                </Button>
              )}
            {booking.stay_status_id !== 4 && booking.stay_status_id !== 5 && (
              <>
                {booking.stay_status_id === 1 &&
                  booking.payment_method === "cash" &&
                  booking.payment_status !== "paid" && (
                    <Button
                      type="primary"
                      style={{
                        backgroundColor: "#52c41a",
                        borderColor: "#52c41a",
                      }}
                      onClick={handleMarkPaid}
                      loading={updating}
                      disabled={updating}
                    >
                      Xác nhận đã thanh toán
                    </Button>
                  )}
                {booking.stay_status_id === 1 && (
                  <Button
                    type="primary"
                    onClick={handleCheckIn}
                    loading={updating}
                    disabled={updating}
                  >
                    Check In
                  </Button>
                )}
                {booking.stay_status_id === 6 && (
                  <Button
                    type="primary"
                    onClick={handleApprove}
                    loading={updating}
                    disabled={updating}
                  >
                    Duyệt
                  </Button>
                )}
                {booking.stay_status_id !== 4 &&
                  booking.stay_status_id !== 2 &&
                  booking.stay_status_id !== 3 && (
                    <Button
                      danger
                      onClick={handleCancel}
                      loading={updating}
                      disabled={updating}
                    >
                      Hủy
                    </Button>
                  )}
                <Button
                  danger
                  type="dashed"
                  onClick={handleNoShow}
                  loading={markNoShowMutation.isPending}
                  disabled={
                    !canMarkNoShow || markNoShowMutation.isPending || updating
                  }
                >
                  No Show
                </Button>
                {booking.stay_status_id === 2 && (
                  <Button
                    type="primary"
                    loading={updating}
                    disabled={updating}
                    onClick={handleCheckOut}
                  >
                    Trả phòng (Checkout)
                  </Button>
                )}
                <Modal
                  title="Báo cáo thiết bị hỏng khi checkout (có thể bỏ qua)"
                  open={brokenModalVisible}
                  onCancel={() => {
                    setBrokenModalVisible(false);
                    setBrokenReports([
                      {
                        roomId: null,
                        deviceId: null,
                        quantity: 1,
                        status: "broken",
                      },
                    ]);
                  }}
                  footer={[
                    <Button
                      key="cancel"
                      onClick={() => {
                        setBrokenModalVisible(false);
                        setFinalConfirmVisible(true);
                      }}
                    >
                      Bỏ qua (Tiếp tục Checkout)
                    </Button>,
                    <Button
                      key="ok"
                      type="primary"
                      loading={createIncidentMutation.isPending}
                      onClick={handleConfirmBrokenDevice}
                    >
                      Ghi nhận & Tiếp tục
                    </Button>,
                  ]}
                >
                  {brokenReports.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 8,
                        alignItems: "center",
                      }}
                    >
                      <Select
                        style={{ width: 140 }}
                        placeholder="Chọn phòng"
                        value={r.roomId}
                        onChange={(val) =>
                          handleSelectRoom(val as number | null, idx)
                        }
                      >
                        {booking.items
                          ?.filter(
                            (item: any) =>
                              item.status !== "cancelled" &&
                              item.status !== "checked_out" // Optional: avoid double checkout if handled elsewhere
                          )
                          .map((item: any) => {
                            const room = rooms.find(
                              (r) => r.id === item.room_id
                            );
                            if (!room) return null;
                            return (
                              <Select.Option key={room.id} value={room.id}>
                                {room.name || `Phòng ${room.id}`}
                              </Select.Option>
                            );
                          })}
                      </Select>
                      {}
                      <Select
                        style={{ width: 140 }}
                        placeholder="Chọn thiết bị"
                        value={r.deviceId}
                        onChange={(val) => {
                          const arr = [...brokenReports];
                          arr[idx].deviceId = val;
                          setBrokenReports(arr);
                        }}
                        disabled={!r.roomId}
                      >
                        {(r.roomId !== null ? bookingDevicesMap[r.roomId] : [])
                          ?.filter((d: any) => {
                            const isSelectedInOtherRow = brokenReports.some(
                              (report, reportIndex) =>
                                reportIndex !== idx &&
                                report.roomId === r.roomId &&
                                String(report.deviceId) === String(d.id)
                            );
                            const isWorking = d.status === "working";
                            return !isSelectedInOtherRow && isWorking;
                          })
                          .map((d: any) => (
                            <Select.Option key={d.id} value={d.id}>
                              {d.device_name}
                            </Select.Option>
                          ))}
                      </Select>
                      <InputNumber
                        min={1}
                        value={r.quantity}
                        style={{ width: 60 }}
                        onChange={(val) => {
                          const arr = [...brokenReports];
                          arr[idx].quantity = Number(val);
                          setBrokenReports(arr);
                        }}
                      />
                      <Select
                        style={{ width: 120 }}
                        placeholder="Trạng thái"
                        value={r.status}
                        onChange={(val) => {
                          const arr = [...brokenReports];
                          arr[idx].status = val;
                          setBrokenReports(arr);
                        }}
                      >
                        <Select.Option value="broken">Hỏng</Select.Option>
                        <Select.Option value="repairing">
                          Đang sửa
                        </Select.Option>
                        <Select.Option value="lost">Mất</Select.Option>
                      </Select>
                      <Button
                        danger
                        size="small"
                        onClick={() => {
                          const arr = [...brokenReports];
                          arr.splice(idx, 1);
                          setBrokenReports(
                            arr.length
                              ? arr
                              : [
                                  {
                                    roomId: null,
                                    deviceId: null,
                                    quantity: 1,
                                    status: "broken",
                                  },
                                ]
                          );
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() =>
                      setBrokenReports([
                        ...brokenReports,
                        {
                          roomId: null,
                          deviceId: null,
                          quantity: 1,
                          status: "broken",
                        },
                      ])
                    }
                  >
                    Thêm dòng báo cáo
                  </Button>
                </Modal>
                <Modal
                  title={
                    <Space>
                      <DollarOutlined /> Xác nhận Trả phòng & Thanh toán
                    </Space>
                  }
                  open={finalConfirmVisible}
                  onCancel={() => setFinalConfirmVisible(false)}
                  width={700}
                  footer={[
                    <Button
                      key="cancel"
                      onClick={() => setFinalConfirmVisible(false)}
                    >
                      Hủy
                    </Button>,
                    <Button
                      key="ok"
                      type="primary"
                      loading={updating}
                      onClick={handleFinalCheckout}
                    >
                      {(() => {
                        const totalRoomPrice = Number(
                          booking.total_room_price || 0
                        );
                        const totalServicePrice = Number(
                          booking.total_service_price || 0
                        );
                        const totalIncidentPrice = incidents.reduce(
                          (sum, i) => sum + Number(i.amount || 0),
                          0
                        );
                        const finalTotal =
                          totalRoomPrice +
                          totalServicePrice +
                          totalIncidentPrice;

<<<<<<< HEAD
            {/* Chỉ hiện nút Duyệt khi đang chờ xác nhận (stay_status_id === 6 = pending) */}
            {booking.stay_status_id === 6 && (
              <Button
                type="primary"
                onClick={handleApprove}
                loading={updating}
                disabled={updating}
              >
                Duyệt
              </Button>
            )}
            {/* Nút Check-in: xuất hiện khi đã duyệt và đang ở trạng thái reserved (1) */}
            {booking.stay_status_id === 1 && (
              <Button
                type="primary"
                onClick={handleCheckin}
                loading={updating}
                disabled={updating}
              >
                Check-in
              </Button>
            )}
            {/* Nút Checkout: xuất hiện khi khách đang ở (stay_status_id === 2) */}
            {booking.stay_status_id === 2 && (
              <Button
                type="primary"
                danger
                onClick={handleCheckout}
                loading={updating}
                disabled={updating}
              >
                Checkout khách
              </Button>
            )}
            {/* Hiện nút Hủy khi booking chưa bị hủy (stay_status_id !== 4) và chưa checked_out */}
            {booking.stay_status_id !== 4 && booking.stay_status_id !== 3 && (
              <Button
                danger
                onClick={handleCancel}
                loading={updating}
                disabled={updating}
              >
                Hủy
              </Button>
            )}
            {/* Hiện nút Xác nhận checkout khi khách đã checkout (stay_status_id === 3 = checked_out) VÀ chưa confirm */}
            {booking.stay_status_id === 3 && !checkoutConfirmed && (
              <Button
                type="primary"
                onClick={handleConfirmCheckout}
                loading={updating}
                disabled={updating}
              >
                Xác nhận checkout
              </Button>
            )}
            {/* Hiện nút In hóa đơn sau khi thanh toán hoặc đã checkout xong */}
            {(booking.payment_status === "paid" ||
              booking.stay_status_id === 3 ||
              checkoutConfirmed) && (
              <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={handlePrintBill}
              >
                In hóa đơn
              </Button>
=======
                        // Fallback logic for Amount Paid display
                        let amountPaid = Number(booking.amount_paid || 0);
                        if (
                          amountPaid === 0 &&
                          booking.payment_status === "paid"
                        ) {
                          amountPaid = totalRoomPrice;
                        }
                        const remaining = finalTotal - amountPaid;

                        return remaining > 0
                          ? `Thanh toán ${formatPrice(remaining)} & Checkout`
                          : "Xác nhận Checkout";
                      })()}
                    </Button>,
                  ]}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 12, fontWeight: 500 }}>
                      Vui lòng kiểm tra kỹ các khoản phí trước khi xác nhận trả
                      phòng:
                    </div>

                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "#f5f5f5",
                            borderBottom: "1px solid #d9d9d9",
                          }}
                        >
                          <th style={{ padding: "8px", textAlign: "left" }}>
                            Khoản mục
                          </th>
                          <th style={{ padding: "8px", textAlign: "right" }}>
                            Số tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            Tiền phòng (Giá gốc)
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #f0f0f0",
                              textAlign: "right",
                            }}
                          >
                            {formatPrice(booking.total_room_price || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            Dịch vụ bổ sung
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #f0f0f0",
                              textAlign: "right",
                            }}
                          >
                            {formatPrice(booking.total_service_price || 0)}
                          </td>
                        </tr>
                        {incidents.length > 0 && (
                          <>
                            <tr>
                              <td
                                colSpan={2}
                                style={{
                                  padding: "8px 8px 4px",
                                  fontWeight: 600,
                                  color: "#cf1322",
                                }}
                              >
                                Đền bù thiết bị:
                              </td>
                            </tr>
                            {incidents
                              .filter((i) => !i.deleted_at)
                              .map((inc, idx) => (
                                <tr key={`inc-${idx}`}>
                                  <td
                                    style={{
                                      padding: "4px 8px 4px 24px",
                                      color: "#555",
                                    }}
                                  >
                                    {inc.equipment_name} ({inc.equipment_type})
                                    x {inc.quantity}
                                  </td>
                                  <td
                                    style={{
                                      padding: "4px 8px",
                                      textAlign: "right",
                                      color: "#cf1322",
                                    }}
                                  >
                                    {formatPrice(inc.amount)}
                                  </td>
                                </tr>
                              ))}
                            <tr>
                              <td
                                style={{
                                  padding: "8px 8px 8px 24px",
                                  fontStyle: "italic",
                                }}
                              >
                                Tổng đền bù
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  textAlign: "right",
                                  fontWeight: 500,
                                  color: "#cf1322",
                                }}
                              >
                                {formatPrice(
                                  incidents.reduce(
                                    (sum, i) => sum + Number(i.amount || 0),
                                    0
                                  )
                                )}
                              </td>
                            </tr>
                          </>
                        )}
                        <tr style={{ background: "#fafafa" }}>
                          <td
                            style={{
                              padding: "12px 8px",
                              fontWeight: "bold",
                              fontSize: 16,
                            }}
                          >
                            Tổng cộng
                          </td>
                          <td
                            style={{
                              padding: "12px 8px",
                              textAlign: "right",
                              fontWeight: "bold",
                              fontSize: 16,
                              color: "#d4380d",
                            }}
                          >
                            {formatPrice(
                              Number(booking.total_room_price || 0) +
                                Number(booking.total_service_price || 0) +
                                incidents.reduce(
                                  (sum, i) => sum + Number(i.amount || 0),
                                  0
                                )
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "8px", color: "green" }}>
                            Đã thanh toán
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                              color: "green",
                              fontWeight: 600,
                            }}
                          >
                            {formatPrice(
                              (() => {
                                let paid = Number(booking.amount_paid || 0);
                                if (
                                  paid === 0 &&
                                  booking.payment_status === "paid"
                                ) {
                                  paid = Number(booking.total_room_price || 0);
                                }
                                return paid;
                              })()
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {(() => {
                      const totalRoomPrice = Number(
                        booking.total_room_price || 0
                      );
                      const totalServicePrice = Number(
                        booking.total_service_price || 0
                      );
                      const totalIncidentPrice = incidents.reduce(
                        (sum, i) => sum + Number(i.amount || 0),
                        0
                      );
                      const finalTotal =
                        totalRoomPrice + totalServicePrice + totalIncidentPrice;

                      let amountPaid = Number(booking.amount_paid || 0);
                      if (
                        amountPaid === 0 &&
                        booking.payment_status === "paid"
                      ) {
                        amountPaid = totalRoomPrice;
                      }

                      const remaining = finalTotal - amountPaid;

                      if (remaining > 0) {
                        return (
                          <div
                            style={{
                              marginTop: 16,
                              padding: 12,
                              background: "#fff2e8",
                              border: "1px solid #ffbb96",
                              borderRadius: 4,
                            }}
                          >
                            <Text type="danger" strong>
                              Khách còn nợ thanh toán: {formatPrice(remaining)}
                            </Text>
                            <br />
                            <Text type="secondary">
                              Hệ thống sẽ tự động xác nhận thanh toán số tiền
                              còn lại này khi bạn nhấn nút bên dưới.
                            </Text>
                          </div>
                        );
                      } else if (remaining < 0) {
                        return (
                          <div
                            style={{
                              marginTop: 16,
                              padding: 12,
                              background: "#e6f7ff",
                              border: "1px solid #91d5ff",
                              borderRadius: 4,
                            }}
                          >
                            <Text type="success" strong>
                              Cần hoàn lại khách:{" "}
                              {formatPrice(Math.abs(remaining))}
                            </Text>
                          </div>
                        );
                      }
                      return (
                        <div
                          style={{
                            marginTop: 16,
                            padding: 12,
                            background: "#f6ffed",
                            border: "1px solid #b7eb8f",
                            borderRadius: 4,
                          }}
                        >
                          <Text type="success" strong>
                            Đã thanh toán đủ.
                          </Text>
                        </div>
                      );
                    })()}
                  </div>
                  <div>Bạn có chắc chắn muốn checkout booking này không?</div>
                </Modal>
                {booking.stay_status_id === 3 &&
                  booking.payment_status === "paid" && (
                    <Button
                      type="default"
                      icon={<PrinterOutlined />}
                      onClick={handlePrintBill}
                    >
                      In hóa đơn
                    </Button>
                  )}
              </>
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
            )}
          </Space>
        </div>
        {}
        <Modal
          title={`Thêm dịch vụ: ${pendingService?.serviceName}`}
          open={serviceModalVisible}
          onOk={confirmAddService}
          onCancel={() => {
<<<<<<< HEAD
            setDeviceDamageModalVisible(false);
            setDeviceDamage([]);
            setNewDamage({ device_id: null, device_name: "", description: "", amount: undefined });
=======
            setServiceModalVisible(false);
            setPendingService(null);
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
          }}
          okText="Xác nhận thêm"
          cancelText="Hủy bỏ"
          confirmLoading={addServiceMutation.isPending}
        >
<<<<<<< HEAD
          <div>
            <Text>
              Xác nhận khách đã checkout? Phòng sẽ chuyển sang trạng thái Cleaning.
            </Text>
            <Divider />
            <Title level={5}>Thiết bị hỏng/mất</Title>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
              Ghi nhận các thiết bị bị hỏng/mất khi khách checkout (sẽ hiển thị trên hóa đơn)
            </Text>

            {devices.length > 0 && (
              <Select
                style={{ width: "100%", marginBottom: 12 }}
                placeholder="Chọn nhanh thiết bị"
                allowClear
                onChange={(value) => {
                  const dev = devices.find((d) => d.id === value);
                  if (dev) {
                    setNewDamage((p) => ({
                      ...p,
                      device_id: dev.id,
                      device_name: dev.name,
                      amount: dev.fee ?? p.amount,
                      description: p.description,
                    }));
                  }
                }}
              >
                {devices.map((d) => (
                  <Select.Option key={d.id} value={d.id}>
                    {d.name} {d.fee ? `(${formatPrice(d.fee)})` : ""}
                  </Select.Option>
                ))}
              </Select>
            )}

            <Space direction="vertical" style={{ width: "100%" }}>
              <div className="grid grid-cols-3 gap-8">
                <Input
                  placeholder="Tên thiết bị"
                  value={newDamage.device_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDamage((p) => ({ ...p, device_name: e.target.value }))
                  }
                />
                <Input
                  placeholder="Mô tả tình trạng"
                  value={newDamage.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewDamage((p) => ({ ...p, description: e.target.value }))
                  }
                />
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Chi phí bồi thường (VND)"
                  value={newDamage.amount}
                  onChange={(value) =>
                    setNewDamage((p) => ({
                      ...p,
                      amount: value ? Number(value) : undefined,
                    }))
                  }
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => {
                    const parsed = value!.replace(/\$\s?|(,*)/g, "");
                    return parsed ? Number(parsed) : 0;
                  }}
                  min={0}
                />
              </div>
              <Button
                type="dashed"
                onClick={() => {
                  if (!newDamage.device_name || !newDamage.description) {
                    message.warning("Nhập đầy đủ tên thiết bị và mô tả");
                    return;
                  }
                  setDeviceDamage([
                    ...deviceDamage,
                    {
                      device_id: newDamage.device_id || null,
                      device_name: newDamage.device_name,
                      description: newDamage.description,
                      amount: newDamage.amount,
                    },
                  ]);
                  setNewDamage({ device_id: null, device_name: "", description: "", amount: undefined });
                }}
              >
                + Thêm thiết bị hỏng/mất
              </Button>

              {deviceDamage.map((damage, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text strong>{damage.device_name}</Text>
                      <Space>
                        {typeof damage.amount === "number" && (
                          <Text type="danger">{formatPrice(damage.amount)}</Text>
                        )}
                        <Button
                          danger
                          size="small"
                          onClick={() => {
                            const newDamageList = deviceDamage.filter((_, i) => i !== index);
                            setDeviceDamage(newDamageList);
                          }}
                        >
                          Xóa
                        </Button>
                      </Space>
                    </div>
                    <Text>{damage.description}</Text>
                  </Space>
                </Card>
              ))}
            </Space>
=======
          <div style={{ marginBottom: 12 }}>
            <Text>Số lượng:</Text>
            <InputNumber
              min={1}
              style={{ width: "100%", marginTop: 4 }}
              value={pendingService?.quantity || 1}
              addonAfter={pendingService?.serviceUnit || "Cái"}
              onChange={(val) => {
                if (pendingService) {
                  setPendingService({
                    ...pendingService,
                    quantity: Number(val) || 1,
                  });
                }
              }}
            />
            {pendingService && (
              <div style={{ marginTop: 8, textAlign: "right" }}>
                <Text type="secondary">
                  Đơn giá: {formatPrice(pendingService.servicePrice || 0)}
                </Text>
                <br />
                <Text strong type="danger">
                  Thành tiền:{" "}
                  {formatPrice(
                    (pendingService.servicePrice || 0) *
                      (pendingService.quantity || 1)
                  )}
                </Text>
              </div>
            )}
          </div>
          <div>
            <Text>Ghi chú cho dịch vụ (tùy chọn):</Text>
            <TextArea
              rows={3}
              style={{ marginTop: 4 }}
              placeholder="Ví dụ: Mang lên lúc 7h tối, ít đá, ..."
              value={serviceNote}
              onChange={(e) => setServiceNote(e.target.value)}
            />
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
          </div>
        </Modal>
      </div>
    </div>
  );
};
export default BookingDetail;

