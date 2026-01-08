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
  message,
  Switch,
  Tooltip,
  Drawer,
  Descriptions,
  Divider,
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

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const {
    data: vouchers = [],
    isLoading,
    refetch,
  } = useQuery<Voucher[]>({
    queryKey: ["vouchers", "vouchers-admin-all"],
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
      queryClient.invalidateQueries({
        queryKey: ["vouchers", "vouchers-admin-all"],
      });
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

  const openDrawer = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedVoucher(null);
  };

  const getVoucherStatus = (voucher: Voucher) => {
    const now = dayjs();
    const end = voucher.end_date ? dayjs(voucher.end_date) : null;
    const isExpired = end && end.isBefore(now);

    if (isExpired) return { label: "Hết hạn", color: "red" };
    if (voucher.status === "active")
      return { label: "Hoạt động", color: "green" };
    return { label: "Tắt", color: "default" };
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
              onClick={() => openDrawer(record)}
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

      {/* Drawer xem chi tiết voucher */}
      <Drawer
        title="Chi tiết Voucher"
        placement="right"
        width={480}
        onClose={closeDrawer}
        open={drawerOpen}
        extra={
          selectedVoucher && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                closeDrawer();
                navigate(`/admin/discount-codes/${selectedVoucher.id}/edit`);
              }}
            >
              Chỉnh sửa
            </Button>
          )
        }
      >
        {selectedVoucher && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Tên voucher">
                {selectedVoucher.name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Mã voucher">
                <Tag color="blue">{selectedVoucher.code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Loại giảm giá">
                <Tag
                  color={selectedVoucher.type === "percent" ? "blue" : "green"}
                >
                  {selectedVoucher.type === "percent"
                    ? "Phần trăm"
                    : "Số tiền cố định"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Giá trị giảm">
                <span className="font-semibold text-red-500">
                  {selectedVoucher.type === "percent"
                    ? `${selectedVoucher.value}%`
                    : formatCurrency(selectedVoucher.value)}
                </span>
              </Descriptions.Item>
              {selectedVoucher.type === "percent" &&
              selectedVoucher.max_discount_amount ? (
                <Descriptions.Item label="Giảm tối đa">
                  {formatCurrency(selectedVoucher.max_discount_amount)}
                </Descriptions.Item>
              ) : null}
              <Descriptions.Item label="Đơn tối thiểu">
                {selectedVoucher.min_total
                  ? formatCurrency(selectedVoucher.min_total)
                  : "Không giới hạn"}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions
              column={1}
              bordered
              size="small"
              title="Giới hạn sử dụng"
            >
              <Descriptions.Item label="Tổng số lượng">
                {selectedVoucher.max_uses || "Không giới hạn"}
              </Descriptions.Item>
              <Descriptions.Item label="Đã sử dụng">
                <span className="font-semibold">
                  {selectedVoucher.total_usage || 0}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Tối đa/tài khoản">
                {selectedVoucher.max_uses_per_user || 1}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions
              column={1}
              bordered
              size="small"
              title="Thời gian áp dụng"
            >
              <Descriptions.Item label="Ngày bắt đầu">
                {selectedVoucher.start_date
                  ? dayjs(selectedVoucher.start_date).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {selectedVoucher.end_date
                  ? dayjs(selectedVoucher.end_date).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getVoucherStatus(selectedVoucher).color}>
                  {getVoucherStatus(selectedVoucher).label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedVoucher.description && (
              <>
                <Divider />
                <div>
                  <h4 className="font-semibold mb-2">Mô tả</h4>
                  <p className="text-gray-600">{selectedVoucher.description}</p>
                </div>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default DiscountList;
