/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { getAllStockLogs } from "@/services/equipmentStockLogsApi";
import { Card, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { getMasterEquipments } from "@/services/masterEquipmentsApi";

function getActionTag(a: string) {
  let viAction = "";
  switch (a) {
    case "create":
      viAction = "Thêm mới";
      break;
    case "update":
      viAction = "Cập nhật";
      break;
    case "delete":
      viAction = "Xóa";
      break;
    case "import":
      viAction = "Nhập kho";
      break;
    case "export":
      viAction = "Xuất kho";
      break;
    case "transfer":
      viAction = "Điều chuyển";
      break;
    case "create_master":
      viAction = "Thêm thiết bị master";
      break;
    default:
      viAction = a;
  }
  return (
    <Tag
      color={
        a === "create"
          ? "green"
          : a === "update"
            ? "blue"
            : a === "delete"
              ? "red"
              : a === "import"
                ? "cyan"
                : a === "export"
                  ? "orange"
                  : a === "transfer"
                    ? "purple"
                    : "default"
      }
    >
      {viAction}
    </Tag>
  );
}

const EquipmentLogHistory = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const equipmentId = searchParams.get("equipment_id");
  const { data = [], isLoading } = useQuery({
    queryKey: ["equipment-logs-all"],
    queryFn: getAllStockLogs,
  });
  const [masterEquipments, setMasterEquipments] = useState<any[]>([]);

  useEffect(() => {
    getMasterEquipments().then(setMasterEquipments);
  }, []);

  // Map equipment_id sang tên thiết bị
  const equipmentMap = masterEquipments.reduce(
    (acc, eq) => {
      acc[eq.id] = eq.name;
      return acc;
    },
    {} as Record<number, string>
  );

  const filteredData = equipmentId
    ? data.filter(
        (log: any) => String(log.equipment_id) === String(equipmentId)
      )
    : data;

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (_: any, __: any, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: "Tên thiết bị",
      dataIndex: "equipment_id",
      key: "equipment_id",
      width: 180,
      render: (_: any, record: any) => {
        // Ưu tiên tên thiết bị nếu có
        if (record.equipment_name) return record.equipment_name;
        if (record.name) return record.name;
        return equipmentMap[record.equipment_id] || `#${record.equipment_id}`;
      },
    },
    {
      title: "Loại thao tác",
      dataIndex: "action",
      key: "action",
      render: getActionTag,
    },
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
    },
    {
      title: "Chi tiết",
      key: "detail",
      align: "center" as const,
      render: (_: unknown, record: { id: number }) => (
        <a href={`/admin/equipments/log-detail/${record.id}`}>Xem chi tiết</a>
      ),
    },
    { title: "Ghi chú", dataIndex: "note", key: "note" },
  ];

  // Phân trang
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  return (
    <Card
      title={
        equipmentId
          ? `Lịch sử thay đổi thiết bị #${equipmentMap[Number(equipmentId)] || equipmentId}`
          : "Lịch sử thay đổi thiết bị"
      }
      style={{ marginTop: 24 }}
    >
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={isLoading}
        rowKey="id"
        size="small"
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showSizeChanger: true,
        }}
      />
    </Card>
  );
};

export default EquipmentLogHistory;
