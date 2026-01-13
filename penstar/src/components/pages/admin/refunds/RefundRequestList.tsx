import React, { useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Input,
  Tooltip,
  Statistic,
  Row,
  Col,
  Select,
  Image,
} from "antd";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import {
  getAllRefundRequests,
  getRefundStats,
  type RefundRequest,
  type RefundStats,
} from "@/services/refundApi";
import {
  EyeOutlined,
  CloseOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import RefundProcessModal from "./RefundProcessModal";
const RefundRequestList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const { data: requests = [], isLoading } = useQuery<RefundRequest[]>({
    queryKey: ["refund-requests", statusFilter],
    queryFn: () => getAllRefundRequests(statusFilter || undefined),
  });
  const { data: stats } = useQuery<RefundStats>({
    queryKey: ["refund-stats"],
    queryFn: getRefundStats,
  });
  const filteredRequests = requests
    .filter((r) => {
      const q = searchTerm.toLowerCase();
      if (!q) return true;
      return (
        r.user_name?.toLowerCase().includes(q) ||
        r.user_email?.toLowerCase().includes(q) ||
        r.bank_name?.toLowerCase().includes(q) ||
        r.account_holder?.toLowerCase().includes(q)
      );
    })
    ?.sort((a, b) => Number(b.id) - Number(a.id));
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };
  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: "orange", label: "Chờ xử lý" },
      approved: { color: "yellow", label: "Đã duyệt" },
      completed: { color: "green", label: "Hoàn thành" },
      rejected: { color: "red", label: "Từ chối" },
    };
    const config = statusConfig[status] || { color: "default", label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };
  const openProcessModal = (request: RefundRequest) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 180,
      render: (_: any, record: RefundRequest) => (
        <div>
          <div className="font-medium">
            {record.user_name || record.customer_name}
          </div>
          <div className="text-xs text-gray-500">{record.user_email}</div>
          <div className="text-xs text-gray-500">{record.user_phone}</div>
        </div>
      ),
    },
    {
      title: "Số tiền hoàn",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      render: (v: number) => (
        <span className="font-semibold text-red-500">{formatCurrency(v)}</span>
      ),
    },
    {
      title: "Thông tin ngân hàng",
      key: "bank",
      width: 200,
      render: (_: any, record: RefundRequest) => (
        <div className="text-xs">
          <div className="font-medium">{record.bank_name}</div>
          <div>STK: {record.account_number}</div>
          <div>Chủ TK: {record.account_holder}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Bill chuyển khoản",
      dataIndex: "receipt_image",
      key: "receipt_image",
      width: 120,
      render: (url: string) => {
        if (!url) return <span className="text-gray-400">Chưa có</span>;
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const imageUrl = url.startsWith("http") ? url : `${apiUrl}${url}`;
        return (
          <Image
            src={imageUrl}
            alt="Receipt"
            width={80}
            style={{ borderRadius: 4 }}
          />
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      render: (_: any, record: RefundRequest) => (
        <Space wrap>
          {(record.status === "pending" || record.status === "approved") && (
            <Tooltip title="Hoàn trả tiền cho khách">
              <Button
                type="primary"
                size="small"
                icon={<DollarOutlined />}
                onClick={() => openProcessModal(record)}
                className="bg-green-600 hover:bg-green-700"
              >
                Hoàn trả
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openProcessModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4">Quản lý yêu cầu hoàn tiền</h1>
        {}
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card>
              <Statistic
                title="Chờ xử lý"
                value={stats?.pending_count || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã duyệt"
                value={stats?.approved_count || 0}
                prefix={<CheckOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={stats?.completed_count || 0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Từ chối"
                value={stats?.rejected_count || 0}
                prefix={<CloseOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
        </Row>
        {}
        <div className="flex items-center gap-3 mb-4">
          <Input.Search
            placeholder="Tìm theo tên, email, ngân hàng..."
            allowClear
            style={{ width: 300 }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 180 }}
            onChange={(value) => setStatusFilter(value || "")}
            options={[
              { value: "pending", label: "Chờ xử lý" },
              { value: "approved", label: "Đã duyệt" },
              { value: "completed", label: "Hoàn thành" },
              { value: "rejected", label: "Từ chối" },
            ]}
          />
        </div>
      </div>
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRequests}
          loading={isLoading}
          scroll={{ x: 1100 }}
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
      {}
      <RefundProcessModal
        open={modalOpen}
        request={selectedRequest}
        onClose={() => {
          setModalOpen(false);
          setSelectedRequest(null);
        }}
      />
    </div>
  );
};
export default RefundRequestList;
