/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Card, Table, Tag, Button, Space, Empty, Typography } from "antd";
import { EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { getMyBookings } from "@/services/bookingsApi";
import useAuth from "@/hooks/useAuth";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { BookingShort } from "@/types/bookings";

const { Title } = Typography;

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth() as unknown as { user?: { id?: number } };

  // Fetch bookings using TanStack Query
  const { data: bookings = [], isLoading } = useQuery<BookingShort[]>({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
    enabled: !!auth?.user,
  });

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

  const columns = [
    {
      title: "Mã Booking",
      key: "id",
      render: (_: any, record: BookingShort) => (
        <span className="font-bold">#{record.id}</span>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a: BookingShort, b: BookingShort) =>
        new Date(b.created_at || "").getTime() -
        new Date(a.created_at || "").getTime(),
      defaultSortOrder: "ascend" as const, // asc so newest first? No wait, Sorter sorts table. Default should be 'descend' for newest first if logic is a-b.
      // Antd sort: a-b is ascending. b-a is descending.
      // So b-a means larger (newer) is first.
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (price: number) => (
        <span className="font-semibold text-blue-600">
          {formatPrice(price)}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, record: BookingShort) => (
        <Space direction="vertical" size={0}>
          {getStatusTag(record.stay_status_id)}
          {getPaymentTag(record.payment_status, record.is_refunded ?? false)}
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: BookingShort) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/my-bookings/${record.id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card
        title={
          <Title level={3} style={{ margin: 0 }}>
            Booking của tôi
          </Title>
        }
        loading={isLoading}
      >
        {bookings.length === 0 ? (
          <Empty description="Bạn chưa có booking nào" />
        ) : (
          <Table
            dataSource={bookings}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </div>
  );
};

export default MyBookings;
