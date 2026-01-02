/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { getAllDeviceStandards } from "@/services/roomTypeEquipmentsAdminApi";
import { getRoomTypes, getEquipments } from "@/services/masterDataApi";
import { Table, Button, Select } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "antd";
import { useState } from "react";

function useQueryParamId(param: string): number | undefined {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const value = params.get(param);
  return value ? Number(value) : undefined;
}

interface DeviceStandardAdminProps {
  equipmentId?: number;
}

const DeviceStandardAdmin: React.FC<DeviceStandardAdminProps> = (props) => {
  // Lấy equipmentId từ query param nếu có
  const queryEquipmentId = useQueryParamId("equipmentId");
  const equipmentId = props.equipmentId ?? queryEquipmentId;
  // Phân trang frontend
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [filterRoomType, setFilterRoomType] = useState<number | null>(null);
  const navigate = useNavigate();
  const { data: standards = [], isLoading } = useQuery({
    queryKey: ["device-standards"],
    queryFn: getAllDeviceStandards,
  });
  // Dữ liệu phân trang
  let filteredData = Array.isArray(standards)
    ? filterRoomType != null
      ? standards.filter((item: any) => item.room_type_id === filterRoomType)
      : standards
    : [];
  if (equipmentId) {
    filteredData = filteredData.filter(
      (item: any) => item.master_equipment_id === equipmentId
    );
  }
  const pagedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const { data: roomTypes = [] } = useQuery({
    queryKey: ["room-types"],
    queryFn: getRoomTypes,
  });
  const { data: equipments = [] } = useQuery({
    queryKey: ["equipments"],
    queryFn: getEquipments,
  });
  // Thêm cột STT và các cột khác
  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Loại phòng",
      dataIndex: "room_type_id",
      key: "room_type_id",
      render: (id: number) =>
        roomTypes.find((r: any) => r.id === id)?.name || id,
    },
    {
      title: "Thiết bị",
      dataIndex: "master_equipment_id",
      key: "master_equipment_id",
      render: (id: number) =>
        equipments.find((e: any) => e.id === id)?.name || id,
    },
    {
      title: "Tối thiểu",
      dataIndex: "min_quantity",
      key: "min_quantity",
      align: "center" as const,
    },
    {
      title: "Tối đa",
      dataIndex: "max_quantity",
      key: "max_quantity",
      align: "center" as const,
    },
  ];

  function isDeviceStandardRow(
    r: any
  ): r is { room_type_id: number; master_equipment_id: number } {
    return (
      r &&
      typeof r === "object" &&
      "room_type_id" in r &&
      "master_equipment_id" in r
    );
  }

  if (isLoading) return <div>Loading...</div>;
  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#f5f6fa" }}>
      <Card style={{ maxWidth: 1200, margin: "0 auto", borderRadius: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            Quản lý tiêu chuẩn thiết bị
          </h2>
          <Button
            type="primary"
            onClick={() => navigate("/admin/device-standards/add")}
          >
            Thêm tiêu chuẩn
          </Button>
        </div>
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontWeight: 500 }}>Lọc theo loại phòng:</span>
          <Select
            style={{ minWidth: 220 }}
            placeholder="Tất cả loại phòng"
            allowClear
            value={filterRoomType ?? undefined}
            onChange={(val) => {
              setFilterRoomType(val ?? null);
              setCurrentPage(1);
            }}
            options={roomTypes.map((rt: any) => ({
              value: rt.id,
              label: rt.name,
            }))}
          />
        </div>
        <Table
          columns={columns}
          dataSource={pagedData}
          rowKey={(r: any) =>
            isDeviceStandardRow(r)
              ? `${r.room_type_id}-${r.master_equipment_id}`
              : String(r?.id || JSON.stringify(r))
          }
          pagination={{
            current: currentPage,
            pageSize,
            total: filteredData.length,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
};

export default DeviceStandardAdmin;
