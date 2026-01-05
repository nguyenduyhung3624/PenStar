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
} from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { DiscountCode } from "@/types/discount";
import { fetchDiscountCodes, deleteDiscountCode } from "@/services/discountApi";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";

const DiscountList: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const {
    data: codes = [],
    isLoading,
    refetch,
  } = useQuery<DiscountCode[]>({
    queryKey: ["discount-codes-list"],
    queryFn: fetchDiscountCodes,
  });

  // Filter by code or description
  const filteredCodes = codes.filter((c) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return (
      String(c.code ?? "")
        .toLowerCase()
        .includes(q) ||
      String(c.description ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  const handleDelete = async (del: number) => {
    try {
      await deleteDiscountCode(del);
      message.success("Đã xóa mã giảm giá thành công");
      refetch();
    } catch (err) {
      message.error("Xóa mã giảm giá thất bại");
    }
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (_v: any, _r: any, idx: number) =>
        idx + 1 + (currentPage - 1) * pageSize,
    },
    { title: "Mã", dataIndex: "code", key: "code" },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (v: string) =>
        v === "percent" ? "Phần trăm" : v === "fixed" ? "Số tiền cố định" : v,
    },
    { title: "Giá trị", dataIndex: "value", key: "value" },
    { title: "Tối thiểu", dataIndex: "min_total", key: "min_total" },
    { title: "Tối đa lượt", dataIndex: "max_uses", key: "max_uses" },
    {
      title: "Tối đa/user",
      dataIndex: "max_uses_per_user",
      key: "max_uses_per_user",
    },
    { title: "Bắt đầu", dataIndex: "start_date", key: "start_date" },
    { title: "Kết thúc", dataIndex: "end_date", key: "end_date" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (_v: string, record: DiscountCode) => {
        const now = dayjs();
        const end = record.end_date ? dayjs(record.end_date) : null;
        if (record.status === "active" && end && end.isBefore(now)) {
          return <Tag color="red">Hết hạn</Tag>;
        }
        if (record.status === "active") {
          return <Tag color="green">Đang hoạt động</Tag>;
        }
        return <Tag color="red">Đã tắt</Tag>;
      },
    },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      render: (_: any, record: DiscountCode) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/admin/discount-codes/${record.id}/edit`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa mã này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh sách mã giảm giá</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm kiếm theo mã hoặc mô tả"
            allowClear
            style={{ width: 260 }}
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
            Thêm mã giảm giá
          </Button>
        </div>
      </div>

      <Card>
        <Table
          rowKey="code"
          columns={columns}
          dataSource={filteredCodes}
          loading={isLoading}
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
