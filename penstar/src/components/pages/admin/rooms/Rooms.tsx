import { EditOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Table,
  Select,
  Input,
  Drawer,
  Descriptions,
  Image,
} from "antd";
import { Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Room } from "@/types/room";
import { getRooms } from "@/services/roomsApi";
import { getFloors } from "@/services/floorsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
const Rooms = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [filterTypeId, setFilterTypeId] = useState<number | string | null>(
    null,
  );
  const [filterFloorName, setFilterFloorName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const navigate = useNavigate();
  const {
    data: rooms,
    isLoading,
    isError,
  } = useQuery<Room[]>({ queryKey: ["rooms"], queryFn: getRooms });
  type FloorShort = { id: number | string; name: string };
  const { data: floors = [] } = useQuery<FloorShort[]>({
    queryKey: ["floors"],
    queryFn: getFloors,
  });
  type RoomTypeShort = { id: number | string; name: string };
  const { data: room_types = [] } = useQuery<RoomTypeShort[]>({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });

  if (isLoading) return <div>Đang tải...</div>;
  if (isError) return <div>Lỗi</div>;
  const filteredRooms = rooms
    ?.filter((r) => {
      if (filterTypeId && String(r.type_id) !== String(filterTypeId))
        return false;
      if (filterFloorName) {
        if (r.floor_name !== filterFloorName) return false;
      }
      const q = String(searchTerm ?? "")
        .trim()
        .toLowerCase();
      if (q) {
        const name = String(
          (r as unknown as Record<string, unknown>).name ?? "",
        ).toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    })
    ?.sort((a, b) => Number(b.id) - Number(a.id));

  console.log("Filtered rooms count:", filteredRooms?.length);

  const getImageUrl = (path: string | undefined) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const apiUrl =
      import.meta.env.VITE_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:5001";
    const baseUrl = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    return baseUrl + (path.startsWith("/") ? "" : "/") + path;
  };

  const columns: ColumnsType<Room> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    { title: "Tên phòng", dataIndex: "name", key: "name" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta: Record<string, { label: string; color: string }> = {
          available: { label: "Còn trống", color: "green" },
          booked: { label: "Đã đặt", color: "gold" },
          occupied: { label: "Đang ở", color: "orange" },
          cleaning: { label: "Đang dọn", color: "cyan" },
          unavailable: { label: "Không khả dụng", color: "red" },
          pending: { label: "Chờ xử lý", color: "yellow" },
          maintenance: { label: "Bảo trì", color: "purple" },
        };
        const m = meta[String(status)] || {
          label: String(status).toUpperCase(),
          color: "default",
        };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    {
      title: "Loại phòng",
      dataIndex: "type_name",
      key: "type_name",
      render: (type_name, record) => {
        let src = record.image;
        if (src && !src.startsWith("http")) {
          const apiUrl =
            import.meta.env.VITE_BASE_URL ||
            import.meta.env.VITE_API_URL ||
            "http://localhost:5001";
          const baseUrl = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
          src = baseUrl + (src.startsWith("/") ? "" : "/") + src;
        }
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 500 }}>{type_name || "N/A"}</span>
          </div>
        );
      },
    },
    {
      title: "Tầng",
      dataIndex: "floor_name",
      key: "floor_name",
      render: (floor_name, r) => (
        <span>
          {floor_name || "N/A"}{" "}
          <span className="text-gray-400 text-xs">#{r.floor_id}</span>
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, room) => (
        <div className="flex gap-2">
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRoom(room as Room);
              setDetailOpen(true);
            }}
          >
            Chi tiết
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              navigate(`/admin/rooms/${(room as Room).id}/edit`);
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["rooms"] });
              }, 500);
            }}
          >
            Sửa
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">DANH SÁCH PHÒNG</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm theo tên phòng"
            allowClear
            style={{ width: 260 }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Lọc theo loại phòng"
            style={{ width: 200 }}
            value={filterTypeId ?? undefined}
            onChange={(val) => {
              setFilterTypeId(val ?? null);
              setCurrentPage(1);
            }}
          >
            {Array.isArray(room_types) &&
              room_types.map((t: RoomTypeShort) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
          </Select>
          <Select
            allowClear
            placeholder="Lọc theo tầng"
            style={{ width: 200 }}
            value={filterFloorName ?? undefined}
            onChange={(val) => {
              setFilterFloorName(val ?? null);
              setCurrentPage(1);
            }}
          >
            {Array.isArray(floors) &&
              Array.from(new Set(floors.map((f: FloorShort) => f.name))).map(
                (name) => (
                  <Select.Option key={name} value={name}>
                    {name}
                  </Select.Option>
                ),
              )}
          </Select>
          <Button
            onClick={() => {
              setFilterTypeId(null);
              setFilterFloorName(null);
              setCurrentPage(1);
            }}
          >
            Xóa lọc
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              navigate("/admin/rooms/add");
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["rooms"] });
              }, 500);
            }}
          >
            Thêm mới
          </Button>
        </div>
      </div>
      <div className="bg-white p-4 rounded shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredRooms ?? rooms}
          rowKey="id"
          pagination={{
            pageSize,
            current: currentPage,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total}`,
            showQuickJumper: true,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </div>
      <Drawer
        title="Chi tiết phòng"
        placement="right"
        onClose={() => setDetailOpen(false)}
        open={detailOpen}
        width={500}
      >
        {selectedRoom && (
          <div>
            <div className="mb-6 flex justify-center">
              {getImageUrl(selectedRoom.image) ? (
                <Image
                  width={400}
                  src={getImageUrl(selectedRoom.image)}
                  style={{ borderRadius: 8, objectFit: "cover" }}
                />
              ) : (
                <div
                  className="w-full h-48 bg-gray-100 flex items-center justify-center rounded"
                  style={{ borderRadius: 8 }}
                >
                  <span className="text-gray-400">Không có ảnh</span>
                </div>
              )}
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Tên phòng">
                <span className="font-semibold text-lg">
                  {selectedRoom.name}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {(() => {
                  const meta: Record<string, { label: string; color: string }> =
                    {
                      available: { label: "Còn trống", color: "green" },
                      booked: { label: "Đã đặt", color: "gold" },
                      occupied: { label: "Đang ở", color: "orange" },
                      cleaning: { label: "Đang dọn", color: "cyan" },
                      unavailable: { label: "Không khả dụng", color: "red" },
                      pending: { label: "Chờ xử lý", color: "yellow" },
                      maintenance: { label: "Bảo trì", color: "purple" },
                    };
                  const m = meta[String(selectedRoom.status)] || {
                    label: String(selectedRoom.status).toUpperCase(),
                    color: "default",
                  };
                  return <Tag color={m.color}>{m.label}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Loại phòng">
                {selectedRoom.type_name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Tầng">
                {selectedRoom.floor_name || "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default Rooms;
