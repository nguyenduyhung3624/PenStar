import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Table, Image } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRoomTypes } from "@/services/roomTypeApi";
import type { RoomType } from "@/types/roomtypes";
type RoomTypeItem = RoomType;
const RoomTypesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { data: types = [], isLoading } = useQuery({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });
  const filteredTypes = types
    .filter((t: RoomTypeItem) => {
      const q = String(searchTerm ?? "")
        .trim()
        .toLowerCase();
      if (!q) return true;
      return String(t.name ?? "")
        .toLowerCase()
        .includes(q);
    })
    .sort((a: RoomTypeItem, b: RoomTypeItem) => Number(b.id) - Number(a.id));

  const columns: ColumnsType<RoomTypeItem> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 60,
    },
    {
      title: "Ảnh đại diện",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 100,
      render: (thumbnail: string) => {
        const apiBase =
          import.meta.env.VITE_BASE_URL || "http://localhost:5001/api";
        const baseUrl = apiBase.replace(/\/api\/?$/, "");
        const imageUrl = thumbnail
          ? thumbnail.startsWith("http")
            ? thumbnail
            : `${baseUrl}${thumbnail}`
          : "https://via.placeholder.com/80x60?text=Không+ảnh";
        return (
          <Image
            src={imageUrl}
            alt="Ảnh đại diện"
            width={80}
            height={60}
            className="object-cover rounded"
            fallback="https://via.placeholder.com/80x60?text=Không+ảnh"
          />
        );
      },
    },
    {
      title: "Tên loại phòng",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "Giá phòng (VND)",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (price: number) =>
        price
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(price)
          : "--",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <div
          className="max-w-[400px] line-clamp-2 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: String(text ?? "") }}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 240,
      render: (_v, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              navigate(`/admin/roomtypes/${record.id}/edit`);
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["room_types"] });
              }, 500);
            }}
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh sách loại phòng</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm kiếm theo tên loại phòng"
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
            onClick={() => {
              navigate("/admin/roomtypes/new");
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["room_types"] });
              }, 500);
            }}
          >
            Thêm loại phòng
          </Button>
        </div>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTypes}
          rowKey="id"
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
export default RoomTypesPage;
