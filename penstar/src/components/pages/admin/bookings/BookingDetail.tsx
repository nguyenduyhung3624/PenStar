/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  cancelBooking,
  confirmCheckin,
  confirmCheckout,
  getBookingById,
  markNoShow,
  setBookingStatus,
  markBookingRefunded,
} from "@/services/bookingsApi";
import { getRoomID } from "@/services/roomsApi";
import { getServiceById, getServices } from "@/services/servicesApi";
import { createBookingService } from "@/services/bookingServicesApi";
import type { BookingDetails } from "@/types/bookings";
import type { Room } from "@/types/room";
import type { Services } from "@/types/services";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  Avatar,
  List,
  Button,
  message,
  Empty,
  Modal,
  Select,
  Input,
  InputNumber,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
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

const { Title, Text } = Typography;
const { TextArea } = Input;

const BookingDetail = () => {
  const [roomDevicesMap, setRoomDevicesMap] = useState<Record<number, any[]>>(
    {}
  );
  const [finalConfirmVisible, setFinalConfirmVisible] = useState(false);
  const [brokenModalVisible, setBrokenModalVisible] = useState(false);
  const [brokenReports, setBrokenReports] = useState<
    Array<{
      roomId: number | null;
      deviceId: number | null;
      quantity: number;
      status: string;
    }>
  >([{ roomId: null, deviceId: null, quantity: 1, status: "" }]);
  const [brokenLoading, setBrokenLoading] = useState(false);

  // --- STATE MODAL THÊM DỊCH VỤ ---
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [serviceNote, setServiceNote] = useState("");
  // Lưu trạng thái đang thêm dịch vụ nào
  const [pendingService, setPendingService] = useState<{
    bookingItemId: number;
    serviceId: number;
    quantity: number;
    serviceName: string;
  } | null>(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const [noShowLoading, setNoShowLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Services[]>([]);
  const [allServices, setAllServices] = useState<Services[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);
  const [addingService, setAddingService] = useState<number | null>(null);

  const [incidents, setIncidents] = useState<any[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  const {
    data: booking,
    isLoading,
    isError,
    refetch,
  } = useQuery<BookingDetails | null>({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(Number(id)),
    enabled: !!id,
    retry: false,
  });

  const timeZone = "Asia/Ho_Chi_Minh";
  const invalidStatusForNoShow = new Set([2, 3, 4, 5]);
  let canMarkNoShow = false;
  if (
    booking &&
    !invalidStatusForNoShow.has(booking.stay_status_id) &&
    booking.check_in
  ) {
    const now = toZonedTime(new Date(), timeZone);
    const checkInDate = toZonedTime(new Date(booking.check_in), timeZone);
    checkInDate.setHours(14, 0, 0, 0);
    if (now >= checkInDate) {
      canMarkNoShow = true;
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
      onOk: async () => {
        setRefundLoading(true);
        try {
          const res = await markBookingRefunded(booking.id!);
          if (res.success) {
            message.success("Đã đánh dấu hoàn tiền thành công.");
            refetch();
          } else {
            message.error(res.message || "Có lỗi khi đánh dấu hoàn tiền.");
          }
        } catch (err) {
          message.error("Lỗi khi đánh dấu hoàn tiền.");
        } finally {
          setRefundLoading(false);
        }
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
      onOk: async () => {
        setNoShowLoading(true);
        try {
          await markNoShow(booking.id!);
          message.success("Đã đánh dấu No Show thành công.");
          refetch();
        } catch (err) {
          console.error("Lỗi No Show:", err);
          const error = err as { response?: { data?: { message?: string } } };
          message.error(error.response?.data?.message || "Lỗi No Show");
        } finally {
          setNoShowLoading(false);
        }
      },
    });
  };

  useEffect(() => {
    let mounted = true;
    const loadExtras = async () => {
      if (!booking) return;
      setLoadingExtras(true);

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

        const uniqueServiceIds = Array.from(new Set(serviceIds));
        const allServicesData = await getServices();

        const [roomResults, serviceResults] = await Promise.all([
          Promise.all(roomIds.map(getRoomID)),
          Promise.all(uniqueServiceIds.map(getServiceById)),
        ]);

        if (mounted) {
          setRooms(roomResults.filter(Boolean) as Room[]);
          setServices(serviceResults.filter(Boolean) as Services[]);
          setAllServices(allServicesData);

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
      }
    };

    loadExtras();
    const fetchIncidents = async () => {
      if (!booking?.id) return;
      setIncidentsLoading(true);
      try {
        const data = await getBookingIncidents(booking.id);
        setIncidents(data);
      } catch (err) {
        setIncidents([]);
      } finally {
        setIncidentsLoading(false);
      }
    };
    fetchIncidents();
    return () => {
      mounted = false;
    };
  }, [booking]);

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "dd 'tháng' MM, yyyy", { locale: vi });
  };

  const handleApprove = async () => {
    if (!booking || !booking.id) return;
    setUpdating(true);
    try {
      await setBookingStatus(booking.id, { stay_status_id: 1 });
      message.success("Đã duyệt booking - Phòng chuyển sang trạng thái Booked");
      refetch();
    } catch (err) {
      console.error("Lỗi duyệt booking:", err);
      message.error("Lỗi duyệt booking");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!booking || !booking.id) return;
    setUpdating(true);
    try {
      await setBookingStatus(booking.id, { payment_status: "paid" });
      message.success("Đã xác nhận thanh toán tiền mặt thành công");
      refetch();
    } catch (err) {
      console.error("Lỗi xác nhận thanh toán:", err);
      message.error("Lỗi xác nhận thanh toán");
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckIn = async () => {
    if (!booking || !booking.id) return;
    setUpdating(true);
    try {
      await confirmCheckin(booking.id);
      message.success(
        "Đã check-in thành công - Phòng chuyển sang trạng thái Đã nhận"
      );
      refetch();
    } catch (err: any) {
      console.error("Check-in error:", err);
      message.error(err.response?.data?.message || "Lỗi check-in");
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckOut = () => {
    if (!booking || !booking.check_out) return;

    // ✅ KIỂM TRA THỜI GIAN CLIENT NGAY LẬP TỨC
    const now = new Date();
    const checkOutDate = new Date(booking.check_out);
    checkOutDate.setHours(14, 0, 0, 0);

    console.log("[CheckOut] Now:", now.toLocaleString("vi-VN"));
    console.log(
      "[CheckOut] CheckOut limit:",
      checkOutDate.toLocaleString("vi-VN")
    );

    // ✅ NẾU ĐƯỢC PHÉP, MỚI MỞ MODAL BÃO CÁO THIẾT BỊ HỎA
    setBrokenModalVisible(true);
  };

  const handleSelectRoom = async (roomId: number | null, idx: number) => {
    if (roomId !== null && !roomDevicesMap[roomId]) {
      const devices = await getRoomDevices({ room_id: roomId });
      setRoomDevicesMap((prev) => ({ ...prev, [roomId]: devices }));
    }
    const arr = [...brokenReports];
    arr[idx].roomId = roomId;
    arr[idx].deviceId = null;
    setBrokenReports(arr);
  };

  const handleConfirmBrokenDevice = async () => {
    for (const r of brokenReports) {
      if (
        (r.roomId || r.deviceId || r.status) &&
        (!r.roomId || !r.deviceId || !r.status || !r.quantity || r.quantity < 1)
      ) {
        message.warning(
          "Vui lòng nhập đầy đủ thông tin cho tất cả các dòng báo cáo thiết bị!"
        );
        return;
      }
      if (r.roomId && r.deviceId && r.quantity) {
        const device = (r.roomId !== null ? roomDevicesMap[r.roomId] : []).find(
          (d: any) => String(d.id) === String(r.deviceId)
        );
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
      setBrokenLoading(true);
      try {
        for (const r of validReports) {
          const device = (
            r.roomId !== null ? roomDevicesMap[r.roomId] : []
          ).find((d: any) => String(d.id) === String(r.deviceId));
          if (!device) continue;
          await createBookingIncident({
            booking_id: booking?.id,
            room_id: r.roomId,
            equipment_id: device.master_equipment_id,
            quantity: r.quantity,
            reason: r.status,
          });
        }
        message.success("Đã ghi nhận báo cáo thiết bị hỏng!");
        // Không refetch ngay ở đây, chờ checkout xong refetch thể
      } catch (err) {
        message.error("Lỗi ghi nhận thiết bị hỏng!");
        setBrokenLoading(false);
        return;
      }
      setBrokenLoading(false);
    }
    setBrokenModalVisible(false);
    setFinalConfirmVisible(true);
  };

  const handleFinalCheckout = async () => {
    if (!booking || !booking.id) return;
    setUpdating(true);
    try {
      await confirmCheckout(booking.id);
      message.success("Đã checkout - Phòng chuyển sang trạng thái Cleaning");
      refetch();
      setFinalConfirmVisible(false);
      setBrokenReports([
        { roomId: null, deviceId: null, quantity: 1, status: "" },
      ]);
    } catch (err: any) {
      console.error("Final checkout error:", err);
      // Đây là lúc hiển thị lỗi "Chưa đến giờ check-out" từ Backend
      message.error(err.response?.data?.message || "Lỗi checkout");
    } finally {
      setUpdating(false);
    }
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
      onOk: async () => {
        setUpdating(true);
        try {
          await cancelBooking(booking.id!, reason);
          message.success(
            "Đã hủy booking - Phòng chuyển sang trạng thái Available."
          );
          refetch();
        } catch (err) {
          console.error("Lỗi hủy booking:", err);
          const error = err as { response?: { data?: { message?: string } } };
          message.error(error.response?.data?.message || "Lỗi hủy booking");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const canModifyService = booking && Number(booking.stay_status_id) === 2;

  // 1. Hàm chuẩn bị thêm dịch vụ (Mở Modal)
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
    });
    setServiceNote("");
    setServiceModalVisible(true);
  };

  // 2. Hàm xác nhận thêm dịch vụ (Gọi API)
  const confirmAddService = async () => {
    if (!pendingService || !booking?.id) return;

    const { bookingItemId, serviceId, quantity } = pendingService;
    const service = allServices.find((s) => s.id === serviceId);

    if (!service) return;

    setAddingService(bookingItemId);
    setUpdating(true);

    try {
      await createBookingService({
        booking_id: booking.id,
        booking_item_id: bookingItemId,
        service_id: serviceId,
        quantity: quantity,
        total_service_price: service.price * quantity,
        note: serviceNote || undefined,
      });
      message.success("Đã thêm dịch vụ thành công");
      refetch();
      setServiceModalVisible(false);
      setPendingService(null);
    } catch (err: any) {
      console.error("Lỗi thêm dịch vụ:", err);
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || "Lỗi thêm dịch vụ");
    } finally {
      setAddingService(null);
      setUpdating(false);
    }
  };

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
  };

  if (isLoading) {
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

        {/* ... (Phần hiển thị thông tin chung và khách hàng giữ nguyên) ... */}
        <Card style={{ marginBottom: 16 }}>
          <Row>
            <Col>
              <Text type="secondary">Mã đặt phòng</Text>
              <Title level={4} style={{ margin: "4px 0" }}>
                #{booking.id}
              </Title>
              <Text type="secondary">
                Thời gian đặt:{" "}
                {booking.created_at ? formatDate(booking.created_at) : "—"}
              </Text>
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <Space>
              <UserOutlined /> Thông tin đặt phòng
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Họ tên</Text>
              <br />
              <Text strong>{booking.customer_name || "—"}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                <MailOutlined /> Email
              </Text>
              <br />
              <Text>{booking.email || "—"}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                <PhoneOutlined /> Số điện thoại
              </Text>
              <br />
              <Text>{booking.phone || "—"}</Text>
            </Col>
            <Col span={12}>
              {(booking.booking_method || booking.payment_method) && (
                <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                  <Space size={12}>
                    {booking.booking_method && (
                      <Tag
                        color={
                          booking.booking_method === "online" ? "blue" : "green"
                        }
                        style={{ fontSize: 14, padding: "2px 12px" }}
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
                        style={{ fontSize: 14, padding: "2px 12px" }}
                      >
                        {booking.payment_method.toUpperCase()}
                      </Tag>
                    )}
                  </Space>
                </div>
              )}
            </Col>
          </Row>
          <Divider style={{ margin: "16px 0 8px 0" }} />
          <Row gutter={16} style={{ marginBottom: 8 }}>
            <Col span={12}>
              <Text type="secondary">Ngày check-in:</Text>
              <Text style={{ fontWeight: 600, marginLeft: 8 }}>
                {booking.check_in
                  ? format(new Date(booking.check_in), "dd/MM/yyyy")
                  : "—"}
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Ngày check-out:</Text>
              <Text style={{ fontWeight: 600, marginLeft: 8 }}>
                {booking.check_out
                  ? format(new Date(booking.check_out), "dd/MM/yyyy")
                  : "—"}
              </Text>
            </Col>
          </Row>
          <Divider style={{ margin: "8px 0 16px 0" }} />
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text type="secondary">Người check-in</Text>
              </div>
              <Text>
                {booking.checked_in_by_email || (
                  <span style={{ color: "#aaa" }}>Chưa check-in</span>
                )}
              </Text>
            </Col>
            <Col span={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text type="secondary">Người check-out</Text>
              </div>
              <Text>
                {booking.checked_out_by_email || (
                  <span style={{ color: "#aaa" }}>Chưa check-out</span>
                )}
              </Text>
            </Col>
          </Row>
          {booking.stay_status_id === 4 && (
            <>
              <Divider style={{ margin: "16px 0 8px 0" }} />
              <Row gutter={16} style={{ marginBottom: 8 }}>
                <Col span={12}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Text type="secondary" style={{ color: "#d4380d" }}>
                      Người hủy
                    </Text>
                  </div>
                  <Text style={{ color: "#d4380d" }}>
                    {booking.canceled_by_name || (
                      <span style={{ color: "#aaa" }}>Không rõ</span>
                    )}
                  </Text>
                </Col>
                <Col span={12}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Text type="secondary" style={{ color: "#d4380d" }}>
                      Thời gian hủy
                    </Text>
                  </div>
                  <Text style={{ color: "#d4380d" }}>
                    {booking.canceled_at
                      ? format(
                          new Date(booking.canceled_at),
                          "HH:mm dd/MM/yyyy"
                        )
                      : "—"}
                  </Text>
                </Col>
              </Row>
              {booking.cancel_reason && (
                <Row>
                  <Col span={24}>
                    <Text type="secondary" style={{ color: "#d4380d" }}>
                      Lý do hủy:{" "}
                    </Text>
                    <Text style={{ color: "#d4380d" }}>
                      {booking.cancel_reason}
                    </Text>
                  </Col>
                </Row>
              )}
            </>
          )}
        </Card>

        {/* ... (Phần hiển thị danh sách phòng - giữ nguyên) ... */}
        <Card
          title={
            <Space>
              <HomeOutlined /> Phòng đã đặt ({booking.items?.length || 0} phòng)
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
                const numAdults = item.num_adults || 0;
                const numChildren = item.num_children || 0;
                const totalGuests = numAdults + numChildren;
                const specialRequests = item.special_requests;
                const extraAdultFees = item.extra_adult_fees || 0;
                const extraChildFees = item.extra_child_fees || 0;
                const extraFees = item.extra_fees || 0;
                const quantity = item.quantity || 1;
                const numBabies = item.num_babies || 0;

                const roomServices =
                  booking.services?.filter(
                    (s: any) => s.booking_item_id === item.id
                  ) || [];

                return (
                  <List.Item key={index}>
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ display: "flex", gap: "16px", flex: 1 }}>
                          {room.thumbnail ? (
                            <Avatar
                              shape="square"
                              size={64}
                              src={room.thumbnail}
                            />
                          ) : (
                            <Avatar
                              shape="square"
                              size={64}
                              icon={<HomeOutlined />}
                            />
                          )}
                          <div>
                            <Space direction="vertical" size={0}>
                              <Text strong>
                                {room.name || `Phòng ${room.id}`}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Loại phòng {room.type_id || "Không xác định"}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <UserOutlined /> {numAdults} người lớn
                                {numChildren > 0
                                  ? `, ${numChildren} trẻ em`
                                  : ""}
                                {numBabies > 0 ? `, ${numBabies} em bé` : ""}
                                (Tổng: {totalGuests + numBabies} khách)
                              </Text>
                              {specialRequests && (
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 12,
                                    fontStyle: "italic",
                                    color: "#1890ff",
                                  }}
                                >
                                  Yêu cầu: {specialRequests}
                                </Text>
                              )}
                              {(extraAdultFees > 0 ||
                                extraChildFees > 0 ||
                                extraFees > 0) && (
                                <div style={{ marginTop: 8 }}>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                  >
                                    <strong>Phụ phí:</strong>
                                  </Text>
                                  {extraAdultFees > 0 && (
                                    <Text
                                      type="danger"
                                      style={{ fontSize: 12, marginLeft: 8 }}
                                    >
                                      Người lớn: {formatPrice(extraAdultFees)}
                                    </Text>
                                  )}
                                  {extraChildFees > 0 && (
                                    <Text
                                      type="danger"
                                      style={{ fontSize: 12, marginLeft: 8 }}
                                    >
                                      Trẻ em: {formatPrice(extraChildFees)}
                                    </Text>
                                  )}
                                  {extraFees > 0 && (
                                    <Text
                                      type="danger"
                                      style={{ fontSize: 12, marginLeft: 8 }}
                                    >
                                      Tổng phụ phí: {formatPrice(extraFees)}
                                    </Text>
                                  )}
                                </div>
                              )}
                            </Space>
                          </div>
                        </div>
                      </div>

                      {/* Services for this room */}
                      <div
                        style={{
                          marginTop: 12,
                          marginLeft: 80,
                          paddingLeft: 12,
                          borderLeft: "2px solid #f0f0f0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 12,
                            }}
                          >
                            <TagOutlined /> Dịch vụ bổ sung (
                            {roomServices.length}):
                          </Text>
                          <Space>
                            <Select
                              placeholder="Thêm dịch vụ"
                              style={{ width: 200 }}
                              size="small"
                              loading={addingService === item.id}
                              onSelect={(serviceId: number | null) => {
                                if (serviceId) {
                                  initiateAddService(item.id, serviceId, 1);
                                }
                              }}
                              value={null}
                              disabled={
                                addingService === item.id || !canModifyService
                              }
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
                                    {s.name} - {formatPrice(s.price)}
                                  </Select.Option>
                                ))}
                            </Select>
                          </Space>
                        </div>
                        {roomServices.length > 0 ? (
                          roomServices.map(
                            (bookingService: any, sIndex: number) => {
                              const service = services.find(
                                (s) => s.id === bookingService.service_id
                              );
                              return (
                                <div
                                  key={sIndex}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 4,
                                  }}
                                >
                                  <Text style={{ fontSize: 13 }}>
                                    •{" "}
                                    {service?.name ||
                                      `Dịch vụ ${bookingService.service_id}`}
                                    {bookingService.quantity > 1 && (
                                      <Text type="secondary">
                                        {" "}
                                        × {bookingService.quantity}
                                      </Text>
                                    )}
                                  </Text>
                                  <Space>
                                    <Text
                                      style={{ fontSize: 13, color: "#ff4d4f" }}
                                    >
                                      {formatPrice(
                                        bookingService.total_service_price || 0
                                      )}
                                    </Text>
                                  </Space>
                                </div>
                              );
                            }
                          )
                        ) : (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Chưa có dịch vụ nào
                          </Text>
                        )}
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty description="Không có thông tin phòng" />
          )}
        </Card>

        {/* ... (Phần Dịch vụ chung và Tổng tiền - Giữ nguyên) ... */}
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
                              <Tag color="blue">
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
                                (booking.refund_amount /
                                  booking.total_room_price) *
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
            )}
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between">
              <Title level={4} style={{ margin: 0 }}>
                Tổng cộng
              </Title>
              <Title level={4} type="danger" style={{ margin: 0 }}>
                {formatPrice(
                  booking.total_price != null
                    ? booking.total_price
                    : (booking.total_room_price || 0) +
                        (booking.total_service_price || 0)
                )}
              </Title>
            </Row>
          </Space>
        </Card>

        {/* Action Buttons */}
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
                  loading={refundLoading}
                  onClick={handleMarkRefunded}
                >
                  Đánh dấu đã hoàn tiền ({formatPrice(booking.refund_amount)})
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
                  loading={noShowLoading}
                  disabled={!canMarkNoShow || noShowLoading || updating}
                >
                  No Show
                </Button>
                {booking.stay_status_id === 2 && !checkoutConfirmed && (
                  <>
                    <Button
                      type="primary"
                      loading={updating}
                      disabled={updating}
                      onClick={handleCheckOut}
                    >
                      Xác nhận checkout
                    </Button>
                  </>
                )}
                <Modal
                  title="Báo cáo thiết bị hỏng khi checkout (có thể bỏ qua)"
                  open={brokenModalVisible}
                  onCancel={() => {
                    // Khi tắt ngang (dấu X hoặc click ra ngoài), ta chỉ đóng modal này
                    setBrokenModalVisible(false);
                    // Reset form nếu cần thiết
                    setBrokenReports([
                      { roomId: null, deviceId: null, quantity: 1, status: "" },
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
                      loading={brokenLoading}
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
                        {rooms.map((room) => (
                          <Select.Option key={room.id} value={room.id}>
                            {room.name || `Phòng ${room.id}`}
                          </Select.Option>
                        ))}
                      </Select>

                      {/* ✅ FIX 2: LOGIC LỌC THIẾT BỊ ĐÃ CHỌN */}
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
                        {(r.roomId !== null ? roomDevicesMap[r.roomId] : [])
                          // 👇 Lọc thiết bị: Chỉ hiện nếu chưa được chọn ở dòng khác (cùng phòng)
                          ?.filter((d: any) => {
                            const isSelectedInOtherRow = brokenReports.some(
                              (report, reportIndex) =>
                                // Không phải dòng hiện tại
                                reportIndex !== idx &&
                                // Cùng phòng
                                report.roomId === r.roomId &&
                                // Cùng ID thiết bị
                                String(report.deviceId) === String(d.id)
                            );
                            return !isSelectedInOtherRow;
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
                                    status: "",
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
                          status: "",
                        },
                      ])
                    }
                  >
                    Thêm dòng báo cáo
                  </Button>
                </Modal>

                <Modal
                  title="Xác nhận checkout"
                  open={finalConfirmVisible}
                  onCancel={() => setFinalConfirmVisible(false)}
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
                      Xác nhận
                    </Button>,
                  ]}
                >
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
            )}
          </Space>
        </div>

        {/* Modal Thêm Dịch Vụ */}
        <Modal
          title={`Thêm dịch vụ: ${pendingService?.serviceName}`}
          open={serviceModalVisible}
          onOk={confirmAddService}
          onCancel={() => {
            setServiceModalVisible(false);
            setPendingService(null);
          }}
          okText="Xác nhận thêm"
          cancelText="Hủy bỏ"
          confirmLoading={updating}
        >
          <div style={{ marginBottom: 12 }}>
            <Text>Số lượng:</Text>
            <InputNumber
              min={1}
              style={{ width: "100%", marginTop: 4 }}
              value={pendingService?.quantity || 1}
              onChange={(val) => {
                if (pendingService) {
                  setPendingService({
                    ...pendingService,
                    quantity: Number(val) || 1,
                  });
                }
              }}
            />
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
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BookingDetail;
