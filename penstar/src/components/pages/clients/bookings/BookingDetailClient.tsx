import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  message,
  Popconfirm,
  Image,
  Spin,
  Alert,
  Divider,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookingById, cancelBooking } from "@/services/bookingsApi";
import {
  cancelBookingItem,
  getBookingItemsWithRefund,
} from "@/services/refundApi";
import RefundRequestModal from "./RefundRequestModal";
import dayjs from "dayjs";
import type { Booking, BookingItem } from "@/types/bookings";
import { getImageUrl } from "@/utils/imageUtils";
const { Title, Text } = Typography;
const BookingDetailClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BookingItem | null>(null);
  const {
    data: booking,
    isLoading,
    refetch,
  } = useQuery<Booking>({
    queryKey: ["booking-detail", id],
    queryFn: () => getBookingById(Number(id)),
    enabled: !!id,
  });
  const { data: items = [], refetch: refetchItems } = useQuery<BookingItem[]>({
    queryKey: ["booking-items", id],
    queryFn: () => getBookingItemsWithRefund(Number(id)),
    enabled: !!id,
  });
  const cancelBookingMutation = useMutation({
    mutationFn: (reason: string) => cancelBooking(Number(id), reason),
    onSuccess: () => {
      message.success("Đã hủy đơn đặt phòng thành công!");
      refetch();
      refetchItems();
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Lỗi hủy đơn");
    },
  });
  const cancelItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      cancelBookingItem(itemId, "Khách hàng yêu cầu hủy phòng lẻ"),
    onSuccess: () => {
      message.success("Đã hủy phòng thành công!");
      queryClient.refetchQueries({ queryKey: ["booking-detail", id] });
      queryClient.refetchQueries({ queryKey: ["booking-items", id] });
      queryClient.refetchQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Lỗi hủy phòng");
    },
  });
  const handleOpenRefundModal = (item: BookingItem) => {
    setSelectedItem(item);
    setRefundModalOpen(true);
  };
  const formatPrice = (price?: number) =>
    new Intl.NumberFormat("vi-VN").format(price || 0) + "đ";
  const getStatusTag = (statusId: number) => {
    const config: Record<number, { color: string; label: string }> = {
      // ... existing code ...
      6: { color: "orange", label: "Chờ xác nhận" },
      1: { color: "yellow", label: "Đã xác nhận" },
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
      approved: { color: "yellow", label: "Đã duyệt" },
      completed: { color: "green", label: "Đã hoàn tiền" },
      rejected: { color: "red", label: "Từ chối" },
    };
    const c = config[status] || { color: "default", label: status };
    return <Tag color={c.color}>{c.label}</Tag>;
  };
  const allowCancelBooking =
    (booking?.stay_status_id === 6 || booking?.stay_status_id === 1) && true;
  const canCancelItem = (item: BookingItem) => {
    return (
      (booking?.stay_status_id === 6 || booking?.stay_status_id === 1) &&
      item.status === "active"
    );
  };
  const canRequestRefund = (item: BookingItem) => {
    return (
      item.status === "cancelled" &&
      !item.refund_request_id &&
      booking?.payment_status === "paid"
    );
  };
  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Spin size="large" />
      </div>
    );
  if (!booking)
    return (
      <div className="p-8 text-center">
        <Alert message="Không tìm thấy booking" type="error" />
        <Button onClick={() => navigate("/my-bookings")} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    );
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/my-bookings")}
        className="mb-4"
      >
        Quay lại danh sách
      </Button>
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <Title level={3} className="mb-0">
              Booking #{booking.id}
            </Title>
            <Text type="secondary">
              Ngày tạo: {dayjs(booking.created_at).format("DD/MM/YYYY HH:mm")}
            </Text>
          </div>
          <Space className="mt-4 md:mt-0">
            {getStatusTag(booking.stay_status_id)}
            {getPaymentTag(
              booking.payment_status,
              booking.is_refunded ?? false
            )}
          </Space>
        </div>
        <Divider />
        <Descriptions
          title="Thông tin chung"
          bordered
          column={{ xs: 1, sm: 2 }}
        >
          <Descriptions.Item label="Khách hàng">
            {booking.customer_name}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">
            <Text strong className="text-yellow-600 text-lg">
              {formatPrice(booking.total_price)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức thanh toán">
            {booking.payment_method || "Chưa chọn"}
          </Descriptions.Item>
          {booking.discount_code && (
            <Descriptions.Item label="Mã giảm giá">
              <Tag color="red">{booking.discount_code}</Tag>
            </Descriptions.Item>
          )}
          {booking.discount_amount && booking.discount_amount > 0 && (
            <Descriptions.Item label="Giảm giá">
              <Text type="danger" strong>
                {booking.discount_type === "percent" && booking.discount_value
                  ? `${booking.discount_value}% (-${formatPrice(booking.discount_amount)})`
                  : `-${formatPrice(booking.discount_amount)}`}
              </Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Ghi chú">
            {booking.notes || "Không có"}
          </Descriptions.Item>
        </Descriptions>
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <Title level={4}>Danh sách phòng</Title>
          </div>
          <Table
            dataSource={items}
            rowKey="id"
            pagination={false}
            rowClassName={(item) =>
              item.status === "cancelled" ? "bg-gray-50 opacity-70" : ""
            }
            columns={[
              {
                title: "Phòng / Loại phòng",
                key: "room",
                width: "35%",
                render: (_, item) => (
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    {item.room_type_image && (
                      <Image
                        src={getImageUrl(item.room_type_image)}
                        alt={item.room_type_name}
                        width={80}
                        style={{
                          borderRadius: "8px",
                          objectFit: "cover",
                          height: "50px",
                        }}
                        preview={{ mask: "Xem" }}
                      />
                    )}
                    <Space direction="vertical" size={0}>
                      <Text strong delete={item.status === "cancelled"}>
                        {item.room_name}
                      </Text>
                      <Text type="secondary">{item.room_type_name}</Text>
                    </Space>
                  </div>
                ),
              },
              {
                title: "Khách",
                key: "guests",
                render: (_, item) => {
                  const parts = [];
                  if (item.num_adults > 0) parts.push(`${item.num_adults} NL`);
                  if (item.num_children > 0)
                    parts.push(`${item.num_children} TE`);
                  if ((item.num_babies ?? 0) > 0)
                    parts.push(`${item.num_babies} Bé`);
                  return <Text>{parts.join(", ")}</Text>;
                },
              },
              {
                title: "Phụ phí",
                key: "extra_fees",
                render: (_, item) => {
                  const extraAdultFee = Number(item.extra_adult_fees) || 0;
                  const extraChildFee = Number(item.extra_child_fees) || 0;
                  const otherFees = Number(item.extra_fees) || 0;

                  const hasExtraFees =
                    extraAdultFee > 0 || extraChildFee > 0 || otherFees > 0;

                  if (!hasExtraFees) {
                    return <Text type="secondary">Không</Text>;
                  }

                  return (
                    <Space direction="vertical" size={0}>
                      {extraAdultFee > 0 && (
                        <Text style={{ fontSize: 12 }}>
                          NL: +{formatPrice(extraAdultFee)}
                        </Text>
                      )}
                      {extraChildFee > 0 && (
                        <Text style={{ fontSize: 12 }}>
                          TE: +{formatPrice(extraChildFee)}
                        </Text>
                      )}
                      {otherFees > 0 && (
                        <Text style={{ fontSize: 12 }}>
                          Khác: +{formatPrice(otherFees)}
                        </Text>
                      )}
                    </Space>
                  );
                },
              },
              {
                title: "Thời gian",
                key: "dates",
                render: (_, item) => (
                  <Space direction="vertical" size={0}>
                    <Text>
                      Check-in: {dayjs(item.check_in).format("DD/MM/YYYY")}
                    </Text>
                    <Text>
                      Check-out: {dayjs(item.check_out).format("DD/MM/YYYY")}
                    </Text>
                  </Space>
                ),
              },
              {
                title: "Đơn giá",
                key: "price",
                align: "right",
                render: (_, item) => {
                  const total =
                    (Number(item.room_type_price) || 0) +
                    (Number(item.extra_adult_fees) || 0) +
                    (Number(item.extra_child_fees) || 0) +
                    (Number(item.extra_fees) || 0);
                  return (
                    <Text delete={item.status === "cancelled"}>
                      {formatPrice(total)}
                    </Text>
                  );
                },
              },
              {
                title: "Trạng thái",
                key: "status",
                render: (_, item) => (
                  <Space direction="vertical">
                    {item.status === "cancelled" ? (
                      <Tag color="red">Đã hủy</Tag>
                    ) : (
                      <Tag color="green">Đang sử dụng</Tag>
                    )}
                    {getRefundStatusTag(item.refund_status)}
                  </Space>
                ),
              },
              {
                title: "Bill hoàn tiền",
                key: "receipt",
                render: (_, item) => {
                  const apiBase =
                    import.meta.env.VITE_BASE_URL ||
                    "http://localhost:5001/api";
                  const baseUrl = apiBase.replace(/\/api\/?$/, "");
                  const imageUrl = item.receipt_image?.startsWith("http")
                    ? item.receipt_image
                    : `${baseUrl}${item.receipt_image}`;
                  return item.receipt_image ? (
                    <Image src={imageUrl} width={50} className="rounded" />
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
                        description="Hành động này sẽ hủy phòng lẻ này khỏi booking."
                        onConfirm={() =>
                          item.id && cancelItemMutation.mutate(item.id)
                        }
                        okText="Hủy phòng"
                        cancelText="Quay lại"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<CloseCircleOutlined />}
                          loading={cancelItemMutation.isPending}
                        >
                          Hủy
                        </Button>
                      </Popconfirm>
                    )}
                    {canRequestRefund(item) && (
                      <Button
                        size="small"
                        type="primary"
                        icon={<DollarOutlined />}
                        onClick={() => handleOpenRefundModal(item)}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        Hoàn tiền
                      </Button>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </div>
        {}
        <div className="mt-8 flex justify-end gap-4 p-4 bg-gray-50 rounded-lg">
          {allowCancelBooking && (
            <Popconfirm
              title="Hủy toàn bộ đơn đặt phòng?"
              description="Tất cả các phòng trong đơn này sẽ bị hủy. Bạn có chắc chắn không?"
              onConfirm={() =>
                cancelBookingMutation.mutate("Khách hàng hủy toàn bộ đơn")
              }
              okText="Đồng ý hủy đơn"
              cancelText="Suy nghĩ lại"
              okButtonProps={{ danger: true, size: "large" }}
            >
              <Button
                type="primary"
                danger
                size="large"
                icon={<CloseCircleOutlined />}
                loading={cancelBookingMutation.isPending}
              >
                Hủy đơn đặt phòng này
              </Button>
            </Popconfirm>
          )}
          {/* {booking.payment_status === "unpaid" &&
            booking.stay_status_id !== 4 && (
              <Button
                type="primary"
                size="large"
                onClick={() =>
                  navigate(`/bookings/payment-method?booking_id=${booking.id}`)
                }
              >
                Thanh toán ngay
              </Button>
            )} */}
        </div>
      </Card>
      <RefundRequestModal
        open={refundModalOpen}
        bookingId={booking.id}
        bookingItemId={selectedItem?.id}
        refundAmount={selectedItem?.refund_amount || 0}
        onClose={() => {
          setRefundModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["booking-detail", id] });
          queryClient.invalidateQueries({ queryKey: ["booking-items", id] });
          queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
        }}
      />
    </div>
  );
};
export default BookingDetailClient;
