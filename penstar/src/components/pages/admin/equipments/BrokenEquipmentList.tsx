import { Table, Card, Input, Button, Tag, Popconfirm, message } from "antd";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllIncidents,
  resolveBookingIncident,
} from "@/services/bookingIncidentsApi";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircleOutlined, ToolOutlined } from "@ant-design/icons";

const BrokenEquipmentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Fetch Data
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["booking-incidents", "all"],
    queryFn: getAllIncidents,
  });

  // Mutation
  const resolveMutation = useMutation({
    mutationFn: resolveBookingIncident,
    onSuccess: () => {
      message.success("Đã xác nhận sửa xong thiết bị!");
      queryClient.invalidateQueries({ queryKey: ["booking-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // Update room status if released
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  // Formatting Helpers
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Columns
  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Ngày báo",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      render: (date: string) =>
        format(new Date(date), "dd/MM/yyyy HH:mm", { locale: vi }),
    },
    {
      title: "Thiết bị",
      dataIndex: "equipment_name",
      key: "equipment_name",
      width: 180,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Phòng",
      dataIndex: "room_name",
      key: "room_name",
      width: 100,
      align: "center" as const,
      render: (text: string) => (
        <span className="text-yellow-600 font-bold">{text}</span>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 160,
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      width: 50,
      align: "center" as const,
    },
    {
      title: "Phí đền bù",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      align: "right" as const,
      render: (price: number) => (
        <span className="text-red-500 font-bold">{formatPrice(price)}</span>
      ),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      align: "center" as const,
      render: (status: string) => {
        if (status === "fixed") return <Tag color="success">Đã sửa</Tag>;
        return <Tag color="warning">Chưa sửa</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center" as const,
      render: (_: any, record: any) => (
        <Popconfirm
          title="Xác nhận đã sửa xong?"
          description={`Phòng ${record.room_name} sẽ được mở lại nếu hết sự cố.`}
          onConfirm={() => resolveMutation.mutate(record.id)}
          okText="Đồng ý"
          cancelText="Hủy"
          disabled={record.status === "fixed"}
        >
          <Button
            type="primary"
            size="small"
            icon={
              record.status === "fixed" ? (
                <CheckCircleOutlined />
              ) : (
                <ToolOutlined />
              )
            }
            disabled={record.status === "fixed"}
          >
            {record.status === "fixed" ? "Đã xong" : "Sửa xong"}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const [hideFixed, setHideFixed] = useState(true);

  // Filter Logic
  const filteredData = incidents.filter((item: any) => {
    if (hideFixed && item.status === "fixed") return false;
    const s = searchTerm.toLowerCase();
    return (
      item.equipment_name?.toLowerCase().includes(s) ||
      item.room_name?.toLowerCase().includes(s) ||
      item.customer_name?.toLowerCase().includes(s) ||
      item.reason?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            DANH SÁCH THIẾT BỊ HỎNG
          </h1>
          <p className="text-gray-500">Quản lý sửa chữa và đền bù thiết bị</p>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Button
            type={hideFixed ? "primary" : "default"}
            onClick={() => setHideFixed(!hideFixed)}
          >
            {hideFixed ? "Hiện đã sửa" : "Ẩn đã sửa"}
          </Button>
          <Input.Search
            placeholder="Tìm theo thiết bị, phòng, khách..."
            allowClear
            style={{ width: 300 }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default BrokenEquipmentList;
