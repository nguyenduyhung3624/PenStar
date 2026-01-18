import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Input, Table, Space, Avatar } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Services } from "@/types/services";
import { getServices } from "@/services/servicesApi";
const ServiceList = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState<string>("");
  const {
    data: services = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
  console.log("[Services] Data:", services);
  console.log("[Services] Loading:", isLoading);
  console.log("[Services] Error:", error);
  const filteredServices = services.filter((s: Services) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return String(s.name ?? "")
      .toLowerCase()
      .includes(q);
  });
  // const deleteMut = useMutation({ ... }); // Nếu không dùng, xoá dòng này
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };
  const columns: ColumnsType<Services> = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
    },
    {
      title: "Ảnh",
      key: "thumbnail",
      width: 80,
      align: "center",
      render: (_v, record) => {
        let src = record.thumbnail;
        if (src && src.startsWith("/")) {
          const apiUrl =
            import.meta.env.VITE_BASE_URL ||
            import.meta.env.VITE_API_URL ||
            "http://localhost:5001";
          // If VITE_BASE_URL includes /api, remove it because uploads are served from root
          const baseUrl = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
          src = baseUrl + src;
        }
        return src ? (
          <Avatar
            shape="square"
            size={60}
            src={src}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <Avatar
            shape="square"
            size={60}
            icon={<PlusOutlined />}
            style={{ background: "#f0f0f0", color: "#999" }}
          />
        );
      },
    },
    {
      title: "Tên dịch vụ",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: 100,
      align: "center",
      render: (text) => text || "Cái",
    },
    {
      title: "Giá (VND)",
      dataIndex: "price",
      key: "price",
      width: 140,
      align: "right",
      render: (price) => (
        <span className="font-semibold text-emerald-600">
          {formatPrice(price)}
        </span>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => (
        <div
          className="max-w-[320px] line-clamp-2"
          dangerouslySetInnerHTML={{ __html: String(text ?? "") }}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 160,
      align: "center",
      render: (_v, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/services/${record.id}/edit`)}
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            DANH SÁCH DỊCH VỤ
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý các dịch vụ bổ sung của khách sạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm theo tên dịch vụ"
            allowClear
            style={{ width: 280 }}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/services/new")}
            size="large"
          >
            Thêm mới
          </Button>
        </div>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={filteredServices}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize,
            current: currentPage,
            total: filteredServices.length,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total} dịch vụ`,
            showQuickJumper: true,
            showSizeChanger: false,
            onChange: (page) => setCurrentPage(page),
          }}
          locale={{
            emptyText: searchTerm
              ? "Không tìm thấy dịch vụ nào"
              : "Chưa có dịch vụ nào",
          }}
        />
      </Card>
    </div>
  );
};
export default ServiceList;
