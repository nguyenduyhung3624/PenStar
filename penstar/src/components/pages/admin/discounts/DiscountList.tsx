/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Input,
  Popconfirm,
  message,
  Switch,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllVouchers,
  updateVoucherStatus,
  type Voucher,
} from "@/services/voucherApi";
import { PlusOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";

const DiscountList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const {
    data: vouchers = [],
    isLoading,
    refetch,
  } = useQuery<Voucher[]>({
    queryKey: ["vouchers-admin-all"],
    queryFn: fetchAllVouchers,
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "active" | "inactive";
    }) => updateVoucherStatus(id, status),
    onSuccess: () => {
      message.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["vouchers-admin-all"] });
    },
    onError: () => {
      message.error("Cập nhật trạng thái thất bại");
    },
  });

  // Filter by code, name or description
  const filteredVouchers = vouchers.filter((v) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return (
      String(v.code ?? "")
        .toLowerCase()
        .includes(q) ||
      String(v.name ?? "")
        .toLowerCase()
        .includes(q) ||
      String(v.description ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  const handleStatusChange = (record: Voucher, checked: boolean) => {
    statusMutation.mutate({
      id: record.id,
      status: checked ? "active" : "inactive",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (_v: any, _r: any, idx: number) =>
        idx + 1 + (currentPage - 1) * pageSize,
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (v: string, record: Voucher) => (
        <div>
          <div className="font-medium">{v || record.code}</div>
          <div className="text-xs text-gray-500">{record.code}</div>
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (v: string) => (
        <Tag color={v === "percent" ? "blue" : "green"}>
          {v === "percent" ? "Phần trăm" : "Số tiền"}
        </Tag>
      ),
    },
    {
      title: "Giá trị",
      dataIndex: "value",
      key: "value",
      width: 120,
      render: (v: number, record: Voucher) =>
        record.type === "percent" ? `${v}%` : formatCurrency(v),
    },
    {
      title: "Giảm tối đa",
      dataIndex: "max_discount_amount",
      key: "max_discount_amount",
      width: 120,
      render: (v: number, record: Voucher) =>
        record.type === "percent" && v > 0 ? formatCurrency(v) : "-",
    },
    {
      title: "Đơn tối thiểu",
      dataIndex: "min_total",
      key: "min_total",
      width: 120,
      render: (v: number) => (v > 0 ? formatCurrency(v) : "-"),
    },
    {
      title: "Đã dùng",
      key: "usage",
      width: 100,
      render: (_: any, record: Voucher) => (
        <span>
          {record.total_usage || 0} / {record.max_uses || "∞"}
        </span>
      ),
    },
    {
      title: "Thời gian",
      key: "date_range",
      width: 180,
      render: (_: any, record: Voucher) => (
        <div className="text-xs">
          <div>
            Từ:{" "}
            {record.start_date
              ? dayjs(record.start_date).format("DD/MM/YYYY")
              : "-"}
          </div>
          <div>
            Đến:{" "}
            {record.end_date
              ? dayjs(record.end_date).format("DD/MM/YYYY")
              : "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string, record: Voucher) => {
        const now = dayjs();
        const end = record.end_date ? dayjs(record.end_date) : null;
        const isExpired = end && end.isBefore(now);
        const isActive = status === "active" && !isExpired;

        return (
          <Space direction="vertical" size={4}>
            <Switch
              checked={isActive}
              onChange={(checked) => handleStatusChange(record, checked)}
              loading={statusMutation.isPending}
              disabled={isExpired}
              size="small"
            />
            {isExpired ? (
              <Tag color="red">Hết hạn</Tag>
            ) : status === "active" ? (
              <Tag color="green">Hoạt động</Tag>
            ) : (
              <Tag color="default">Tắt</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_: any, record: Voucher) => (
        <Space>
          <Tooltip title="Chi tiết">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/admin/discount-codes/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() =>
                navigate(`/admin/discount-codes/${record.id}/edit`)
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý Voucher</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm kiếm theo mã, tên hoặc mô tả"
            allowClear
            style={{ width: 300 }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/discount-codes/add")}
          >
            Thêm voucher
          </Button>
        </div>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredVouchers}
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize,
            current: currentPage,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong tổng ${total}`,
            showQuickJumper: true,
            onChange: (p) => setCurrentPage(p),
          }}
        />
      </Card>
    </div>
  );
};

export default DiscountList;
