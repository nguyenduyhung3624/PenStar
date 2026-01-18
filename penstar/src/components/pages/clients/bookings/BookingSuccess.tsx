import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Button, Spin, Tag, Table } from "antd";
import { getBookingById } from "@/services/bookingsApi";
import { getBookingIncidents } from "@/services/bookingIncidentsApi";
import type { Booking, BookingService } from "@/types/bookings";
import { getServiceById } from "@/services/servicesApi";
import dayjs from "@/utils/dayjs";
const fmtPrice = (v: string | number | undefined) => {
  if (v == null) return "0";
  const n = Math.round(Number(v) || 0);
  return n.toLocaleString("vi-VN");
};
const BookingSuccess: React.FC = () => {
  const loc = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const initial =
    (loc.state as unknown as { booking?: Booking })?.booking ?? null;
  const [booking, setBooking] = React.useState<Booking | null>(initial);
  const [loading, setLoading] = React.useState(!initial);
  const [services, setServices] = React.useState<
    Record<number, { name: string; price: number }>
  >({});
  const [incidents, setIncidents] = React.useState<any[]>([]);
  const fetchBooking = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [bookingData, incidentsData] = await Promise.all([
        getBookingById(Number(id)),
        getBookingIncidents(Number(id)).catch(() => []),
      ]);
      setBooking(bookingData);
      setIncidents(incidentsData);
      if (
        Array.isArray(bookingData.services) &&
        bookingData.services.length > 0
      ) {
        const serviceIds = Array.from(
          new Set(
            bookingData.services
              .map((s: { service_id?: number }) => s.service_id)
              .filter((id): id is number => id != null),
          ),
        );
        Promise.all(serviceIds.map((sid: number) => getServiceById(sid)))
          .then((serviceResults) => {
            const serviceMap: Record<number, { name: string; price: number }> =
              {};
            serviceResults.forEach((s) => {
              if (s && s.id)
                serviceMap[s.id] = { name: s.name, price: s.price };
            });
            setServices(serviceMap);
          })
          .catch((err) => {
            console.error("Error fetching services:", err);
          });
      }
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [id]);
  React.useEffect(() => {
    if (!id) return;
    if (initial && initial.id && String(initial.id) === id) {
      setBooking(initial);
      setLoading(false);
      setTimeout(() => {
        fetchBooking();
      }, 100);
    }
  }, [id, initial, fetchBooking]);
  const getStatusTag = (statusId?: number) => {
    const id = statusId || 0;
    const statusMap: Record<number, { color: string; text: string }> = {
      6: { color: "warning", text: "Chờ xác nhận" },
      1: { color: "yellow", text: "Đã xác nhận" },
      2: { color: "green", text: "Đã Check-in" },
      3: { color: "default", text: "Đã Check-out" },
      4: { color: "red", text: "Đã hủy" },
      5: { color: "magenta", text: "No show" },
    };
    const status = statusMap[id] || { color: "default", text: "-" };
    return <Tag color={status.color}>{status.text}</Tag>;
  };
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  const statusId = booking?.stay_status_id || 0;
  const paymentStatus = booking?.payment_status || "";
  const checkIn = booking?.items?.[0]?.check_in;
  const checkOut = booking?.items?.[0]?.check_out;
  const nights =
    checkIn && checkOut ? dayjs(checkOut).diff(dayjs(checkIn), "day") : 1;
  const totalAdults = Array.isArray(booking?.items)
    ? booking!.items.reduce((sum, item) => sum + (item.num_adults || 0), 0)
    : 0;
  const totalChildren = Array.isArray(booking?.items)
    ? booking!.items.reduce((sum, item) => sum + (item.num_children || 0), 0)
    : 0;
  const tableData = [
    ...(booking?.items?.map((item, idx) => ({
      key: `room-${idx}`,
      description: `Phòng ${idx + 1}${item.room_type_name ? ` - ${item.room_type_name}` : ""}`,
      unitCost: item.room_type_price || item.room_price || 0,
      quantity: nights,
      amount: item.room_type_price || item.room_price || 0,
    })) || []),
    ...(booking?.items?.flatMap((item, idx) => {
      const extras = [];
      if ((item.extra_adult_fees ?? 0) > 0) {
        extras.push({
          key: `extra-adult-${idx}`,
          description: `  ↳ Phụ phí người lớn (${item.num_adults || 0} người)`,
          unitCost: null,
          quantity: null,
          amount: item.extra_adult_fees || 0,
        });
      }
      if ((item.extra_child_fees ?? 0) > 0) {
        extras.push({
          key: `extra-child-${idx}`,
          description: `  ↳ Phụ phí trẻ em (${item.num_children || 0} trẻ)`,
          unitCost: null,
          quantity: null,
          amount: item.extra_child_fees || 0,
        });
      }
      return extras;
    }) || []),
    ...(booking?.services?.map((s: BookingService, idx: number) => ({
      key: `service-${idx}`,
      description: services[s.service_id]?.name || `Dịch vụ #${s.service_id}`,
      unitCost: services[s.service_id]?.price || 0,
      quantity: s.quantity,
      amount: s.total_service_price,
    })) || []),
    ...(incidents.map((inc, idx) => ({
      key: `incident-${idx}`,
      description: `⚠️ Đền bù: ${inc.equipment_name} (${inc.room_name || "Phòng " + inc.room_id})`,
      unitCost: inc.compensation_price || 0,
      quantity: inc.quantity,
      amount: inc.amount,
      isIncident: true,
    })) || []),
  ];
  const columns = [
    {
      title: "MÔ TẢ",
      dataIndex: "description",
      key: "description",
      className: "text-left",
      render: (text: string, record: any) => (
        <span className={record.isIncident ? "text-red-600 font-medium" : ""}>
          {text}
        </span>
      ),
    },
    {
      title: "ĐƠN GIÁ",
      dataIndex: "unitCost",
      key: "unitCost",
      width: 120,
      className: "text-right",
      render: (v: number | null, record: any) =>
        v != null ? (
          <span className={record.isIncident ? "text-red-600" : ""}>
            {fmtPrice(v)} ₫
          </span>
        ) : (
          ""
        ),
    },
    {
      title: "THÀNH TIỀN",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      className: "text-right font-medium",
      render: (v: number, record: any) => (
        <span className={record.isIncident ? "text-red-600" : ""}>
          {fmtPrice(v)} ₫
        </span>
      ),
    },
  ];
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {}
          <div className="border-b-4 border-yellow-500 px-8 py-6">
            <h1 className="text-3xl font-light tracking-wide text-center text-gray-800 uppercase">
              Xác Nhận Đặt Phòng
            </h1>
          </div>
          {}
          {statusId === 6 && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-8 py-4 flex items-center gap-3">
              <span className="text-xl">⏳</span>
              <span className="text-yellow-800">
                Booking đang chờ xác nhận từ khách sạn
              </span>
            </div>
          )}
          {statusId === 1 && paymentStatus === "paid" && (
            <div className="bg-green-50 border-b border-green-200 px-8 py-4 flex items-center gap-3">
              <span className="text-xl">✅</span>
              <span className="text-green-800">
                Đã xác nhận và thanh toán thành công!
              </span>
            </div>
          )}
          {statusId === 4 && (
            <div className="bg-red-50 border-b border-red-200 px-8 py-4 flex items-center gap-3">
              <span className="text-xl">❌</span>
              <span className="text-red-800">Booking đã bị hủy</span>
              {booking?.is_refunded && (
                <Tag color="purple" className="ml-2">
                  Đã hoàn tiền
                </Tag>
              )}
            </div>
          )}
          <div className="p-8">
            {}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {}
              <div className="space-y-3">
                <div className="flex gap-4">
                  <span className="text-gray-500 w-28 text-sm uppercase">
                    Mã booking
                  </span>
                  <span className="font-semibold">
                    #{String(booking?.id || id).padStart(6, "0")}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500 w-28 text-sm uppercase">
                    Ngày đặt
                  </span>
                  <span>
                    {booking?.created_at
                      ? dayjs(booking.created_at).format("DD/MM/YYYY")
                      : "-"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500 w-28 text-sm uppercase">
                    Check-in
                  </span>
                  <span>
                    {checkIn ? dayjs(checkIn).format("DD/MM/YYYY") : "-"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500 w-28 text-sm uppercase">
                    Check-out
                  </span>
                  <span>
                    {checkOut ? dayjs(checkOut).format("DD/MM/YYYY") : "-"}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500 w-28 text-sm uppercase">
                    Số phòng
                  </span>
                  <span>{booking?.items?.length || 0} phòng</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500 w-28 text-sm uppercase">
                    Số khách
                  </span>
                  <span>
                    {totalAdults} người lớn
                    {totalChildren > 0 && `, ${totalChildren} trẻ em`}
                  </span>
                </div>
              </div>
              {}
              <div className="text-right space-y-3">
                <div className="mb-4">
                  <div className="text-xl font-semibold text-gray-800 mb-1">
                    PenStar Hotel
                  </div>
                  <div className="text-gray-500 text-sm">
                    123 Đường ABC, Quận 1
                    <br />
                    TP. Hồ Chí Minh, Việt Nam
                    <br />
                    contact@penstar.vn
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-end items-center gap-2 mb-2">
                    <span className="text-gray-500 text-sm">Trạng thái:</span>
                    {getStatusTag(statusId)}
                  </div>
                  <div className="flex justify-end items-center gap-2">
                    <span className="text-gray-500 text-sm">Thanh toán:</span>
                    <Tag
                      color={
                        paymentStatus === "paid"
                          ? "green"
                          : paymentStatus === "pending"
                            ? "gold"
                            : paymentStatus === "refunded"
                              ? "purple"
                              : "red"
                      }
                    >
                      {paymentStatus === "paid"
                        ? "Đã thanh toán"
                        : paymentStatus === "pending"
                          ? "Chờ thanh toán"
                          : paymentStatus === "refunded"
                            ? "Đã hoàn tiền"
                            : "Chưa thanh toán"}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
            {}
            <div className="border-t pt-6 mb-6">
              <div className="text-xs uppercase text-gray-500 font-semibold mb-3">
                Thông tin khách hàng
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm">Họ tên:</span>
                  <span className="ml-2 font-medium">
                    {booking?.customer_name || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Liên hệ:</span>
                  <span className="ml-2">
                    {booking?.phone || booking?.email || "-"}
                  </span>
                </div>
              </div>
            </div>
            {}
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              size="small"
              className="border rounded-lg overflow-hidden mb-6"
            />
            {}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  {booking?.original_total && booking?.discount_amount ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tạm tính:</span>
                        <span className="line-through text-gray-400">
                          {fmtPrice(booking.original_total)} ₫
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Giảm giá ({booking.promo_code}):
                        </span>
                        <span className="text-green-600">
                          -{fmtPrice(booking.discount_amount)} ₫
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold">Tổng cộng:</span>
                    <span
                      className="text-xl font-bold"
                      style={{ color: "#d97706" }}
                    >
                      {fmtPrice(booking?.total_price)} ₫
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {}
            {booking?.id &&
              (paymentStatus === "pending" || paymentStatus === "failed") &&
              statusId !== 4 &&
              statusId !== 5 && (
                <div className="mt-6 pt-6 border-t text-center">
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      navigate("/bookings/payment-method", {
                        state: { bookingId: booking.id, bookingInfo: booking },
                      });
                    }}
                    style={{
                      backgroundColor: "#d97706",
                      borderColor: "#d97706",
                      height: "48px",
                      minWidth: "200px",
                      fontSize: "16px",
                    }}
                  >
                    THANH TOÁN NGAY
                  </Button>
                </div>
              )}
            {}
            {booking?.notes && (
              <div className="mt-6 pt-6 border-t">
                <div className="text-xs uppercase text-gray-500 font-semibold mb-2">
                  Ghi chú
                </div>
                <p className="text-gray-600 text-sm">{booking.notes}</p>
              </div>
            )}
          </div>
          {}
          <div className="bg-gray-50 px-8 py-4 flex justify-between items-center border-t">
            <div className="text-xs text-gray-400">
              Check-in: 14:00 • Check-out: 14:00
            </div>
            <div className="flex gap-3">
              <Button
                type="primary"
                onClick={() => navigate("/")}
                style={{
                  backgroundColor: "#1f2937",
                  borderColor: "#1f2937",
                }}
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BookingSuccess;
