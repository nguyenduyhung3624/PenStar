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

const BookingDetail = () => {
  // Lưu danh sách thiết bị theo từng phòng đã chọn
  const [roomDevicesMap, setRoomDevicesMap] = useState<Record<number, any[]>>(
    {}
  );
  // Modal xác nhận cuối cùng trước khi thực hiện checkout thật sự
  const [finalConfirmVisible, setFinalConfirmVisible] = useState(false);
  // Modal báo thiết bị hỏng sau khi checkout
  const [brokenModalVisible, setBrokenModalVisible] = useState(false);
  // Danh sách báo cáo thiết bị hỏng: [{roomId, deviceId, quantity, status}]
  const [brokenReports, setBrokenReports] = useState<
    Array<{
      roomId: number | null;
      deviceId: number | null;
      quantity: number;
      status: string;
    }>
  >([{ roomId: null, deviceId: null, quantity: 1, status: "" }]);
  const [brokenLoading, setBrokenLoading] = useState(false);
  // State để lưu số lượng dịch vụ khi thêm
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
  // Danh sách sự cố thiết bị (đền bù)
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

  // Validate điều kiện no show ở frontend (tối ưu bằng Set)
  // No Show: chỉ cho phép khi booking ở trạng thái reserved (1) hoặc pending (6)
  // VÀ đã quá giờ check-in (14:00 ngày nhận phòng)
  const timeZone = "Asia/Ho_Chi_Minh";
  const invalidStatusForNoShow = new Set([2, 3, 4, 5]); // checked_in, checked_out, cancelled, no_show
  let canMarkNoShow = false;
  if (
    booking &&
    !invalidStatusForNoShow.has(booking.stay_status_id) &&
    booking.check_in
  ) {
    const now = toZonedTime(new Date(), timeZone);
    const checkInDate = toZonedTime(new Date(booking.check_in), timeZone);
    checkInDate.setHours(14, 0, 0, 0); // Check-in từ 14:00
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
      }
    };

    loadExtras();
    // Load incidents đền bù
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
      // Duyệt booking: chuyển sang trạng thái reserved
      // Với tiền mặt: chưa thu tiền nên vẫn giữ payment_status = pending, sẽ đánh dấu paid khi check-in
      // Với online: payment_status sẽ được callback từ cổng thanh toán cập nhật
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

  // Xác nhận đã thanh toán tiền mặt (dùng cho booking cash khi check-in)
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
      message.success("Đã nhận phòng - Trạng thái booking chuyển sang đã nhận");
      refetch();
    } catch (err: any) {
      console.error("Lỗi nhận phòng:", err);
      // Hiển thị message chi tiết từ backend nếu có
      const backendMsg = err?.response?.data?.message;
      message.error(backendMsg || "Lỗi nhận phòng");
    } finally {
      setUpdating(false);
    }
  };

  // Khi ấn nút checkout, chỉ mở modal báo thiết bị hỏng
  const handleCheckOut = () => {
    if (!booking || !booking.check_out) return;
    // Lấy thời gian hiện tại ở VN
    const now = toZonedTime(new Date(), timeZone);
    // Tạo mốc 14:00 chiều ngày checkout ở VN
    const checkOutDate = toZonedTime(new Date(booking.check_out), timeZone);
    checkOutDate.setHours(14, 0, 0, 0);
    if (now < checkOutDate) {
      message.warning(
        "Chỉ được checkout sau thời gian check-out (sau 14:00 ngày trả phòng)"
      );
      return;
    }
    setBrokenModalVisible(true);
  };

  // Khi chọn phòng ở từng dòng, fetch thiết bị phòng đó nếu chưa có
  const handleSelectRoom = async (roomId: number | null, idx: number) => {
    if (roomId !== null && !roomDevicesMap[roomId]) {
      const devices = await getRoomDevices({ room_id: roomId });
      setRoomDevicesMap((prev) => ({ ...prev, [roomId]: devices }));
    }
    // Reset deviceId khi đổi phòng
    const arr = [...brokenReports];
    arr[idx].roomId = roomId;
    arr[idx].deviceId = null;
    setBrokenReports(arr);
  };
  // Khi ấn xác nhận checkout trong modal báo thiết bị hỏng, mở modal xác nhận cuối cùng
  const handleConfirmBrokenDevice = async () => {
    // Validate: nếu có dòng nào báo cáo mà thiếu trường thì báo lỗi
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
      // Validate số lượng không vượt quá số lượng thực tế
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

    // Lọc các dòng báo cáo hợp lệ (có đủ roomId, deviceId, status, quantity)
    const validReports = brokenReports.filter(
      (r) => r.roomId && r.deviceId && r.status && r.quantity && r.quantity > 0
    );

    if (validReports.length > 0) {
      setBrokenLoading(true);
      try {
        for (const r of validReports) {
          // Lấy object thiết bị trong roomDevicesMap để lấy master_equipment_id
          const device = (
            r.roomId !== null ? roomDevicesMap[r.roomId] : []
          ).find((d: any) => String(d.id) === String(r.deviceId));
          if (!device) continue;
          await createBookingIncident({
            booking_id: booking?.id,
            room_id: r.roomId,
            equipment_id: device.master_equipment_id, // Gửi đúng master_equipment_id
            quantity: r.quantity,
            reason: r.status,
          });
        }
        message.success("Đã ghi nhận báo cáo thiết bị hỏng!");
        // Refetch booking để cập nhật tổng tiền ngay
        refetch();
      } catch (err) {
        message.error("Lỗi ghi nhận thiết bị hỏng!");
        setBrokenLoading(false);
        return;
      }
      setBrokenLoading(false);
    }
    // Nếu không có dòng hợp lệ, không gọi API, không hiện message
    setBrokenModalVisible(false);
    setFinalConfirmVisible(true);
  };

  // Khi xác nhận ở modal cuối cùng, mới thực sự gọi API checkout
  const handleFinalCheckout = async () => {
    if (!booking || !booking.id) return;
    setUpdating(true);
    try {
      await confirmCheckout(booking.id);
      message.success("Đã checkout - Trạng thái booking chuyển sang đã trả");
      refetch();
      setFinalConfirmVisible(false);
      // Reset báo cáo thiết bị hỏng về mặc định
      setBrokenReports([
        { roomId: null, deviceId: null, quantity: 1, status: "" },
      ]);
    } catch (err) {
      message.error("Lỗi checkout");
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

  // Chỉ cho phép thêm/xóa dịch vụ khi booking ở trạng thái hợp lệ
  const canModifyService = booking && Number(booking.stay_status_id) === 2;

  const handleAddService = async (
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
    // Tìm service để lấy giá
    const service = allServices.find((s) => s.id === serviceId);
    if (!service) {
      message.error("Không tìm thấy dịch vụ");
      return;
    }
    // Hỏi note khi thêm dịch vụ
    let note = "";
    note =
      window.prompt("Ghi chú cho thao tác thêm dịch vụ (nếu có):", "") || "";
    setAddingService(bookingItemId);
    setUpdating(true);
    try {
      await createBookingService({
        booking_id: booking.id,
        booking_item_id: bookingItemId,
        service_id: serviceId,
        quantity: quantity,
        total_service_price: service.price * quantity,
        note: note || undefined,
      });
      message.success("Đã thêm dịch vụ thành công");
      refetch();
    } catch (err) {
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
    // Sử dụng generateBillHTML để tạo HTML hóa đơn
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

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
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
        {/* Booking ID only, no status/payment tag, no Tag PAID */}
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

        {/* Customer Info + Người check-in/out */}
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

          {/* Dòng ngày check-in/check-out riêng biệt */}
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

          {/* Thông tin hủy booking */}
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

                // Các trường extra
                const extraAdultFees = item.extra_adult_fees || 0;
                const extraChildFees = item.extra_child_fees || 0;
                const extraFees = item.extra_fees || 0;
                const quantity = item.quantity || 1;
                const numBabies = item.num_babies || 0;

                // Get services for this specific room
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
                              {/* Hiển thị các trường extra */}
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
                              {quantity > 1 && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Số lượng phòng: {quantity}
                                </Text>
                              )}
                            </Space>
                          </div>
                        </div>
                        {/* Đã xóa giá phòng góc phải */}
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
                            {/* Đã ẩn InputNumber chỉnh số lượng dịch vụ */}
                            <Select
                              placeholder="Thêm dịch vụ"
                              style={{ width: 200 }}
                              size="small"
                              loading={addingService === item.id}
                              onSelect={(serviceId: number | null) => {
                                if (serviceId) {
                                  handleAddService(item.id, serviceId, 1);
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

        {/* Services without booking_item_id (old data or general services) */}
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
                  // Nhóm các dịch vụ trùng lặp theo service_id
                  const groupedServices = booking.services
                    .filter((s: any) => !s.booking_item_id)
                    .reduce((acc: any[], curr: any) => {
                      const existing = acc.find(
                        (item) => item.service_id === curr.service_id
                      );
                      if (existing) {
                        // Cộng số lượng và giá (đảm bảo convert sang number)
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

        {/* Payment Summary */}
        <Card
          title={
            <Space>
              <DollarOutlined /> Tổng kết thanh toán
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Divider style={{ margin: "12px 0" }} />
            {/* Hiển thị thông tin hoàn tiền khi booking đã hủy */}
            {booking.stay_status_id === 4 && (
              <>
                {booking.refund_amount !== undefined &&
                booking.refund_amount > 0 ? (
                  <>
                    {/* Chi tiết hoàn tiền cho từng phòng */}
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
                                      ? `(Hoàn ${refundPercent}% trước ${refundPolicy?.refund_deadline_hours || 24}h)`
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
                    {/* Tổng số tiền hoàn trả */}
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
            {/* Hiển thị trạng thái thanh toán nếu chưa hoàn tiền */}
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
              <Text>Tiền phòng</Text>
              <Text strong>{formatPrice(booking.total_room_price || 0)}</Text>
            </Row>
            {booking.total_service_price ? (
              <Row justify="space-between">
                <Text>Dịch vụ bổ sung</Text>
                <Text strong>{formatPrice(booking.total_service_price)}</Text>
              </Row>
            ) : null}
            {/* Chi tiết đền bù thiết bị */}
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
                {incidents.map((incident, idx) => (
                  <Row
                    key={idx}
                    justify="space-between"
                    style={{ fontSize: 13 }}
                  >
                    <Col>
                      <Text>
                        {incident.equipment_name} (phòng {incident.room_id}) x{" "}
                        {incident.quantity}
                      </Text>
                    </Col>
                    <Col>
                      <Text type="danger">
                        {formatPrice(Number(incident.amount) || 0)}
                      </Text>
                    </Col>
                  </Row>
                ))}
                <Row justify="space-between">
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
            {/* Nút hoàn tiền cho admin: chỉ hiện khi booking đã bị hủy, đã thanh toán, chưa hoàn tiền, và có số tiền hoàn lại > 0 */}
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
            {/* Ẩn toàn bộ action button nếu đã hủy hoặc no show */}
            {booking.stay_status_id !== 4 && booking.stay_status_id !== 5 && (
              <>
                {/* Nút xác nhận đã thanh toán tiền mặt: 
                    Hiện khi booking reserved + tiền mặt + chưa paid */}
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
                {/* Hiện nút Hủy khi booking chưa bị hủy, chưa check-in, chưa check-out */}
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
                {/* Nút No Show cho admin */}
                <Button
                  danger
                  type="dashed"
                  onClick={handleNoShow}
                  loading={noShowLoading}
                  disabled={!canMarkNoShow || noShowLoading || updating}
                >
                  No Show
                </Button>
                {/* Hiện nút Xác nhận checkout khi khách đã checkout (stay_status_id === 2 = checked_out) VÀ chưa confirm */}
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
                {/* Modal báo thiết bị hỏng khi checkout (có thể bỏ qua) */}
                <Modal
                  title="Báo cáo thiết bị hỏng khi checkout (có thể bỏ qua)"
                  open={brokenModalVisible}
                  onCancel={() => {
                    setBrokenModalVisible(false);
                    setBrokenReports([
                      { roomId: null, deviceId: null, quantity: 1, status: "" },
                    ]);
                  }}
                  footer={[
                    <Button
                      key="cancel"
                      onClick={() => setBrokenModalVisible(false)}
                    >
                      Bỏ qua
                    </Button>,
                    <Button
                      key="ok"
                      type="primary"
                      loading={brokenLoading}
                      onClick={handleConfirmBrokenDevice}
                    >
                      Xác nhận checkout
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
                        {(r.roomId !== null
                          ? roomDevicesMap[r.roomId]
                          : []
                        ).map((d: any) => (
                          <Select.Option key={d.id} value={d.id}>
                            {d.device_name}
                          </Select.Option>
                        ))}
                      </Select>
                      <input
                        type="number"
                        min={1}
                        value={r.quantity}
                        style={{ width: 60 }}
                        onChange={(e) => {
                          const arr = [...brokenReports];
                          arr[idx].quantity = Number(e.target.value);
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

                {/* Modal xác nhận cuối cùng trước khi thực hiện checkout thật sự */}
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
                {/* Hiện nút In hóa đơn chỉ khi đã checkout và đã thanh toán */}
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
      </div>
    </div>
  );
};

export default BookingDetail;
