/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Collapse,
  message,
  Popconfirm,
  Image,
  Tooltip,
  Empty,
  Spin,
} from "antd";
import {
  EyeOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getMyBookings } from "@/services/bookingsApi";
import {
  cancelBookingItem,
  getBookingItemsWithRefund,
} from "@/services/refundApi";
import RefundRequestModal from "./RefundRequestModal";
import useAuth from "@/hooks/useAuth";
import dayjs from "dayjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BookingItem {
  id: number;
  room_id: number;
  room_name: string;
  room_type_name: string;
  check_in: string;
  check_out: string;
  room_type_price: number;
  extra_adult_fees: number;
  extra_child_fees: number;
  extra_fees: number;
  status: string;
  refund_amount: number;
  refund_request_id?: number;
  refund_status?: string;
  refund_amount_requested?: number;
  receipt_image?: string;
  cancelled_at?: string;
}

interface Booking {
  id: number;
  customer_name: string;
  total_price: number;
  stay_status_id: number;
  stay_status_name?: string;
  payment_status: string;
  is_refunded?: boolean;
  created_at?: string;
  items?: BookingItem[];
}

const MyBookings: React.FC = () => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [itemsCache, setItemsCache] = useState<Record<number, BookingItem[]>>(
    {}
  );
  const queryClient = useQueryClient();

  // Refund modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BookingItem | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null
  );

  const auth = useAuth() as unknown as { user?: { id?: number } };

  // Fetch bookings using TanStack Query
  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
    enabled: !!auth?.user,
  });

  // Cancel item mutation
  const cancelMutation = useMutation({
    mutationFn: (itemId: number) =>
      cancelBookingItem(itemId, "Khách hàng yêu cầu hủy"),
    onSuccess: (_, itemId) => {
      message.success("Đã hủy phòng thành công!");
      // Find booking and refresh its items
      const bookingId = Object.keys(itemsCache).find((key) =>
        itemsCache[Number(key)]?.some((item) => item.id === itemId)
      );
      if (bookingId) {
        fetchItemsForBooking(Number(bookingId));
      }
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Lỗi hủy phòng");
    },
  });

  // Fetch items for a specific booking
  const fetchItemsForBooking = async (bookingId: number) => {
    try {
      const items = await getBookingItemsWithRefund(bookingId);
      setItemsCache((prev) => ({ ...prev, [bookingId]: items }));
    } catch (err) {
      console.error("Error fetching booking items:", err);
    }
  };

  const handleExpand = (keys: string[]) => {
    setExpandedKeys(keys);
    // Load items for newly expanded bookings
    keys.forEach((key) => {
      const bookingId = parseInt(key);
      if (!itemsCache[bookingId]) {
        fetchItemsForBooking(bookingId);
      }
    });
  };

  const openRefundModal = (item: BookingItem, bookingId: number) => {
    setSelectedItem(item);
    setSelectedBookingId(bookingId);
    setRefundModalOpen(true);
  };

  const formatPrice = (price?: number) =>
    new Intl.NumberFormat("vi-VN").format(price || 0) + "đ";

  const getStatusTag = (statusId: number) => {
    const config: Record<number, { color: string; label: string }> = {
      6: { color: "orange", label: "Chờ xác nhận" },
      1: { color: "blue", label: "Đã xác nhận" },
      2: { color: "green", label: "Đã Check-in" },
      3: { color: "cyan", label: "Đã Check-out" },
      4: { color: "red", label: "Đã hủy" },
      5: { color: "purple", label: "No show" },
    };
    const c = config[statusId] || { color: "default", label: "Không rõ" };
    return <Tag color={c.color}>{c.label}</Tag>;
  };

  const getPaymentTag = (status: string, isRefunded: boolean) => {
    if (isRefunded)
      return (
        <Tag color="purple" icon={<CheckCircleOutlined />}>
          Đã hoàn tiền
        </Tag>
      );
    const config: Record<string, { color: string; label: string }> = {
      paid: { color: "green", label: "Đã thanh toán" },
      unpaid: { color: "red", label: "Chưa thanh toán" },
      pending: { color: "orange", label: "Đang xử lý" },
    };
    const c = config[status] || { color: "default", label: status };
    return <Tag color={c.color}>{c.label}</Tag>;
  };

  const getRefundStatusTag = (status?: string) => {
    if (!status) return null;
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: "orange", label: "Đang chờ duyệt" },
      approved: { color: "blue", label: "Đã duyệt" },
      completed: { color: "green", label: "Đã hoàn tiền" },
      rejected: { color: "red", label: "Từ chối" },
    };
    const c = config[status] || { color: "default", label: status };
    return <Tag color={c.color}>{c.label}</Tag>;
  };

  // Render room items table
  const renderItemsTable = (booking: Booking) => {
    const items = itemsCache[booking.id];

    if (!items) {
      return (
        <div className="py-8 text-center">
          <Spin />
        </div>
      );
    }

    if (items.length === 0) {
      return <Empty description="Không có phòng nào" />;
    }

    const canCancelItem = (item: BookingItem) => {
      return booking.stay_status_id === 6 && item.status === "active";
    };

    const canRequestRefund = (item: BookingItem) => {
      return (
        item.status === "cancelled" &&
        !item.refund_request_id &&
        booking.payment_status === "paid"
      );
    };

    return (
      <Table
        dataSource={items}
        rowKey="id"
        size="small"
        pagination={false}
        rowClassName={(item) =>
          item.status === "cancelled" ? "bg-gray-100 opacity-70" : ""
        }
        columns={[
          {
            title: "Phòng",
            key: "room",
            render: (_, item) => (
              <div
                className={item.status === "cancelled" ? "line-through" : ""}
              >
                <div className="font-medium">{item.room_name}</div>
                <div className="text-xs text-gray-500">
                  {item.room_type_name}
                </div>
              </div>
            ),
          },
          {
            title: "Ngày",
            key: "dates",
            render: (_, item) => (
              <div className="text-xs">
                <div>{dayjs(item.check_in).format("DD/MM/YYYY")}</div>
                <div>→ {dayjs(item.check_out).format("DD/MM/YYYY")}</div>
              </div>
            ),
          },
          {
            title: "Giá phòng",
            key: "price",
            render: (_, item) => {
              const total =
                (item.room_type_price || 0) +
                (item.extra_adult_fees || 0) +
                (item.extra_child_fees || 0) +
                (item.extra_fees || 0);
              return (
                <span
                  className={item.status === "cancelled" ? "line-through" : ""}
                >
                  {formatPrice(total)}
                </span>
              );
            },
          },
          {
            title: "Trạng thái",
            key: "status",
            render: (_, item) => (
              <div className="space-y-1">
                {item.status === "cancelled" ? (
                  <Tag color="red">Đã hủy</Tag>
                ) : (
                  <Tag color="green">Đang sử dụng</Tag>
                )}
                {item.refund_status && getRefundStatusTag(item.refund_status)}
              </div>
            ),
          },
          {
            title: "Bill hoàn tiền",
            key: "receipt",
            render: (_, item) => {
              const apiUrl =
                import.meta.env.VITE_API_URL || "http://localhost:5001";
              const imageUrl = item.receipt_image?.startsWith("http")
                ? item.receipt_image
                : `${apiUrl}${item.receipt_image}`;
              return item.receipt_image ? (
                <Image
                  src={imageUrl}
                  alt="Bill hoàn tiền"
                  width={60}
                  style={{ borderRadius: 4 }}
                />
              ) : item.refund_status === "completed" ? (
                <span className="text-gray-400 text-xs">Chưa có</span>
              ) : null;
            },
          },
          {
            title: "Thao tác",
            key: "action",
            render: (_, item) => (
              <Space>
                {canCancelItem(item) && (
                  <Popconfirm
                    title="Bạn có chắc muốn hủy phòng này?"
                    description="Bạn có thể yêu cầu hoàn tiền sau khi hủy."
                    onConfirm={() => cancelMutation.mutate(item.id)}
                    okText="Hủy phòng"
                    cancelText="Không"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={cancelMutation.isPending}
                    >
                      Hủy
                    </Button>
                  </Popconfirm>
                )}
                {canRequestRefund(item) && (
                  <Tooltip title="Yêu cầu hoàn tiền cho phòng này">
                    <Button
                      size="small"
                      type="primary"
                      icon={<DollarOutlined />}
                      onClick={() => openRefundModal(item, booking.id)}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      Hoàn tiền
                    </Button>
                  </Tooltip>
                )}
                {item.refund_status === "pending" && (
                  <Tag color="orange">Đang chờ duyệt hoàn tiền</Tag>
                )}
              </Space>
            ),
          },
        ]}
      />
    );
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card
        title={<span className="text-xl font-bold">Booking của tôi</span>}
        loading={isLoading}
      >
        {bookings.length === 0 ? (
          <Empty description="Bạn chưa có booking nào" />
        ) : (
          <Collapse
            activeKey={expandedKeys}
            onChange={(keys) => handleExpand(keys as string[])}
            items={bookings.map((booking) => ({
              key: String(booking.id),
              label: (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Space>
                    <span className="font-bold">#{booking.id}</span>
                    <span className="text-gray-600">
                      {booking.customer_name}
                    </span>
                    {getStatusTag(booking.stay_status_id)}
                    {getPaymentTag(
                      booking.payment_status,
                      booking.is_refunded ?? false
                    )}
                  </Space>
                  <span className="font-semibold text-blue-600">
                    {formatPrice(booking.total_price)}
                  </span>
                </div>
              ),
              children: renderItemsTable(booking),
            }))}
          />
        )}
      </Card>

      {/* Refund Modal */}
      <RefundRequestModal
        open={refundModalOpen}
        bookingId={selectedBookingId || undefined}
        bookingItemId={selectedItem?.id}
        refundAmount={selectedItem?.refund_amount || 0}
        onClose={() => {
          setRefundModalOpen(false);
          setSelectedItem(null);
          setSelectedBookingId(null);
        }}
        onSuccess={() => {
          if (selectedBookingId) {
            fetchItemsForBooking(selectedBookingId);
          }
          queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
        }}
      />
    </div>
  );
};

export default MyBookings;
