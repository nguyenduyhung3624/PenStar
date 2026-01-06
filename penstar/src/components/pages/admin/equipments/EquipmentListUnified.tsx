/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  Select,
  Button,
  Popconfirm,
  message,
  Alert,
  Modal,
  Tag,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getIncidentsByRoom } from "@/services/bookingIncidentsApi";
import {
  getMasterEquipments,
  deleteMasterEquipment,
} from "@/services/masterEquipmentsApi";
import { getRooms } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { checkRoomDevicesStandardByType } from "@/services/roomDevicesStandardApi";
import {
  getRoomDevices,
  checkRoomDevicesStandard,
  restoreRoomDeviceStatus,
} from "@/services/roomDevicesApi";

const EquipmentListUnified = () => {
  const [selectedRoom, setSelectedRoom] = useState<number | undefined>();
  const queryClient = useQueryClient();
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });
  const { data: roomTypes = [] } = useQuery({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });
  const [selectedRoomType, setSelectedRoomType] = useState<
    number | undefined
  >();
  const [showCheckByTypeModal, setShowCheckByTypeModal] = useState(false);
  const [checkingByType, setCheckingByType] = useState(false);
  const [checkResultByType, setCheckResultByType] = useState<any[]>([]);
  const [checkErrorByType, setCheckErrorByType] = useState<string | null>(null);
  // Hàm kiểm tra tiêu chuẩn thiết bị theo loại phòng
  const handleCheckStandardByType = async () => {
    if (!selectedRoomType) {
      setCheckErrorByType("Vui lòng chọn loại phòng để kiểm tra.");
      setShowCheckByTypeModal(true);
      return;
    }
    setCheckingByType(true);
    setCheckErrorByType(null);
    setShowCheckByTypeModal(true);
    try {
      const res = await checkRoomDevicesStandardByType(selectedRoomType);
      setCheckResultByType(res.data || []);
    } catch (err: any) {
      setCheckErrorByType("Lỗi kiểm tra tiêu chuẩn thiết bị!");
      setCheckResultByType([]);
    } finally {
      setCheckingByType(false);
    }
  };
  const { data: masterEquipments = [], refetch: refetchMasterEquipments } =
    useQuery({
      queryKey: ["master-equipments"],
      queryFn: getMasterEquipments,
    });
  // Xóa thiết bị master
  const handleDeleteMaster = async (id: number) => {
    try {
      await deleteMasterEquipment(id);
      message.success("Đã xóa thiết bị master");
      refetchMasterEquipments();
    } catch {
      message.error("Lỗi khi xóa thiết bị master");
    }
  };
  const { data: roomDevices = [] } = useQuery({
    queryKey: ["room-devices", selectedRoom],
    queryFn: () =>
      selectedRoom
        ? getRoomDevices({ room_id: selectedRoom })
        : Promise.resolve([]),
    enabled: !!selectedRoom,
  });

  // Lấy danh sách incidents theo phòng
  const { data: incidents = [] } = useQuery({
    queryKey: ["incidents-by-room", selectedRoom],
    queryFn: () =>
      selectedRoom ? getIncidentsByRoom(selectedRoom) : Promise.resolve([]),
    enabled: !!selectedRoom,
  });

  const navigate = useNavigate();
  // Đảm bảo dữ liệu masterEquipments có trường loss_price
  // Nếu backend trả về loss_price là string, ép kiểu về number
  const normalizedMasterEquipments = masterEquipments.map((item: any) => ({
    ...item,
    import_price:
      item.import_price !== undefined && item.import_price !== null
        ? Number(item.import_price)
        : undefined,
    loss_price:
      item.loss_price !== undefined && item.loss_price !== null
        ? Number(item.loss_price)
        : undefined,
  }));
  // Map trạng thái hỏng vào roomDevices: chỉ dựa vào trường status
  const roomDevicesWithStatus = selectedRoom
    ? roomDevices.map((device: any) => ({
        ...device,
        is_broken: device.status === "broken",
      }))
    : [];
  const dataSource = selectedRoom
    ? roomDevicesWithStatus
    : normalizedMasterEquipments;

  // Định nghĩa columns duy nhất ngoài return
  const columns = [
    {
      title: "Tên thiết bị",
      dataIndex: selectedRoom ? "device_name" : "name",
      key: "name",
    },
    {
      title: "Loại thiết bị",
      dataIndex: selectedRoom ? "device_type" : "type",
      key: "type",
    },
    // Chỉ hiển thị khi chưa lọc phòng
    !selectedRoom && {
      title: "Giá nhập",
      dataIndex: "import_price",
      key: "import_price",
      render: (v: number) => (v ? v.toLocaleString() + " ₫" : "-"),
    },
    !selectedRoom && {
      title: "Giá tổn thất",
      dataIndex: "compensation_price",
      key: "compensation_price",
      render: (v: number) =>
        v !== undefined && v !== null
          ? Number(v).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) + " ₫"
          : "-",
    },
    selectedRoom
      ? { title: "Số lượng", dataIndex: "quantity", key: "quantity" }
      : {
          title: "Tổng số lượng",
          dataIndex: "total_stock",
          key: "total_stock",
        },
    // Thêm cột trạng thái khi lọc theo phòng
    selectedRoom && {
      title: "Trạng thái",
      dataIndex: "is_broken",
      key: "is_broken",
      render: (is_broken: boolean) =>
        is_broken ? (
          <Tag color="red">Báo hỏng</Tag>
        ) : (
          <Tag color="green">Bình thường</Tag>
        ),
    },
    // Thêm cột Sự cố/Đền bù khi lọc theo phòng
    selectedRoom && {
      title: "Sự cố/Đền bù",
      key: "incidents",
      render: (_: any, record: any) => {
        // Nếu thiết bị đã khôi phục (status = 'working'), không hiển thị sự cố/đền bù
        if (record.status === "working") {
          return <span style={{ color: "#aaa" }}>Không có</span>;
        }
        // Lọc các incident liên quan đến thiết bị này, chỉ hiện sự cố chưa bị xóa
        const relatedIncidents = incidents.filter(
          (inc: any) =>
            inc.room_id === record.room_id &&
            inc.equipment_id === record.master_equipment_id &&
            !inc.deleted_at
        );
        if (!relatedIncidents.length)
          return <span style={{ color: "#aaa" }}>Không có</span>;
        return (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {relatedIncidents.map((inc: any) => (
              <li key={inc.id} style={{ marginBottom: 4 }}>
                <b>x{inc.quantity}</b>
                {inc.compensation_price ? (
                  <span>
                    {" "}
                    - Đền bù:{" "}
                    <b>
                      {Number(inc.compensation_price).toLocaleString("vi-VN")}₫
                    </b>
                  </span>
                ) : null}
                {inc.note ? <span> - {inc.note}</span> : null}
                {inc.amount ? (
                  <span>
                    {" "}
                    (Tổng: {Number(inc.amount).toLocaleString("vi-VN")}₫)
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        );
      },
    },
    selectedRoom && { title: "Ghi chú", dataIndex: "note", key: "note" },
    selectedRoom && {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      width: 200,
      render: (_: any, record: any) => (
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            alignItems: "center",
            minWidth: 180,
          }}
        >
          <Button
            size="small"
            style={{ minWidth: 90 }}
            onClick={() => navigate(`/admin/room-devices/${record.id}/edit`)}
          >
            Sửa tồn kho
          </Button>
          {record.is_broken && (
            <Button
              size="small"
              type="primary"
              style={{ minWidth: 90 }}
              onClick={async () => {
                try {
                  await restoreRoomDeviceStatus(record.id);
                  message.success("Đã khôi phục trạng thái thiết bị!");
                  // Refetch lại roomDevices bằng react-query
                  queryClient.invalidateQueries({
                    queryKey: ["room-devices", selectedRoom],
                  });
                } catch {
                  message.error("Lỗi khi khôi phục trạng thái thiết bị");
                }
              }}
            >
              Khôi phục
            </Button>
          )}
        </div>
      ),
    },
    // Thao tác cho master (khi không lọc phòng)
    !selectedRoom && {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      width: 200,
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button
            size="small"
            onClick={() =>
              navigate(`/admin/device-standards?equipmentId=${record.id}`)
            }
            type="default"
          >
            Kiểm tra chuẩn thiết bị
          </Button>
          <Popconfirm
            title="Xóa thiết bị master?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDeleteMaster(record.id)}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ].filter(Boolean) as any[];

  const handleCheckStandard = async () => {
    if (!selectedRoom) return;
    setChecking(true);
    try {
      const result = await checkRoomDevicesStandard(selectedRoom);
      // Chuyển missing thành errors dạng string nếu có
      let errors = [];
      if (result && result.missing) {
        errors = result.missing.map(
          (m: any) =>
            `${m.name}: thiếu ${m.required - m.actual} (có ${m.actual}, cần ${m.required})`
        );
      }
      setCheckResult({ ...result, errors });
      setShowCheckModal(true);
    } catch (e) {
      message.error("Lỗi kiểm tra tiêu chuẩn thiết bị phòng");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">DANH SÁCH THIẾT BỊ</h2>
      <div className="mb-4 flex gap-2 items-center justify-between">
        <div className="flex gap-2 items-center">
          <span>Lọc theo phòng:</span>
          <Select
            style={{ width: 220 }}
            showSearch
            placeholder="Chọn phòng"
            value={selectedRoom}
            onChange={setSelectedRoom}
            allowClear
            optionFilterProp="children"
          >
            {rooms.map((r: any) => (
              <Select.Option key={r.id} value={r.id}>
                {r.name}
              </Select.Option>
            ))}
          </Select>
          {selectedRoom && (
            <Button onClick={() => setSelectedRoom(undefined)}>Bỏ lọc</Button>
          )}
        </div>
        <div className="flex gap-2">
          {!selectedRoom ? (
            <>
              <Button
                type="primary"
                onClick={() => navigate("/admin/equipments/import")}
              >
                Nhập kho
              </Button>
              <Button onClick={() => navigate("/admin/equipments/create")}>
                Thêm thiết bị
              </Button>
              <Button onClick={() => navigate("/admin/equipments/log-history")}>
                Lịch sử thay đổi thiết bị
              </Button>
              {!selectedRoom && (
                <>
                  <Select
                    style={{ width: 220, marginLeft: 8 }}
                    placeholder="Chọn loại phòng để kiểm tra"
                    value={selectedRoomType}
                    onChange={setSelectedRoomType}
                    allowClear
                  >
                    {roomTypes.map((t: any) => (
                      <Select.Option key={t.id} value={t.id}>
                        {t.name}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button
                    style={{ marginLeft: 8 }}
                    type="default"
                    onClick={handleCheckStandardByType}
                    disabled={!selectedRoomType}
                  >
                    Kiểm tra tiêu chuẩn thiết bị theo loại phòng
                  </Button>
                </>
              )}
              <Modal
                open={showCheckByTypeModal}
                onCancel={() => {
                  setShowCheckByTypeModal(false);
                  setCheckResultByType([]);
                  setCheckErrorByType(null);
                }}
                title="Kết quả kiểm tra tiêu chuẩn thiết bị theo loại phòng"
                footer={null}
                width={700}
              >
                {checkingByType ? (
                  <div style={{ textAlign: "center", padding: 32 }}>
                    <Spin /> Đang kiểm tra...
                  </div>
                ) : checkErrorByType ? (
                  <Alert type="error" message={checkErrorByType} />
                ) : (
                  <Table
                    dataSource={checkResultByType}
                    rowKey="room_id"
                    pagination={false}
                    columns={[
                      {
                        title: "Phòng",
                        dataIndex: "room_name",
                        key: "room_name",
                      },
                      {
                        title: "Trạng thái",
                        key: "ok",
                        render: (r: any) =>
                          r.ok ? (
                            <Tag color="green">Đạt</Tag>
                          ) : (
                            <Tag color="red">Thiếu/thừa thiết bị</Tag>
                          ),
                      },
                      {
                        title: "Chi tiết lỗi",
                        dataIndex: "errors",
                        key: "errors",
                        render: (errors: string[]) =>
                          errors && errors.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                              {errors.map((e, i) => (
                                <li key={i}>{e}</li>
                              ))}
                            </ul>
                          ) : (
                            <Tag color="green">Đạt</Tag>
                          ),
                      },
                    ]}
                  />
                )}
              </Modal>
            </>
          ) : (
            <>
              <Button
                type="primary"
                onClick={() =>
                  navigate(`/admin/room-devices/create?room_id=${selectedRoom}`)
                }
              >
                Thêm thiết bị vào phòng
              </Button>
              {selectedRoom && (
                <Button
                  style={{ marginLeft: 8 }}
                  loading={checking}
                  onClick={handleCheckStandard}
                  type="default"
                >
                  Kiểm tra tiêu chuẩn thiết bị
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <Table
        dataSource={dataSource}
        rowKey={selectedRoom ? "id" : "id"}
        columns={columns}
        pagination={false}
      />
      <Modal
        open={showCheckModal}
        onCancel={() => {
          setShowCheckModal(false);
          setCheckResult(null);
        }}
        footer={null}
        title="Kiểm tra tiêu chuẩn thiết bị phòng"
      >
        {checkResult && (
          <div style={{ marginTop: 16 }}>
            {checkResult.ok ? (
              <Alert
                type="success"
                message="Thiết bị phòng đạt tiêu chuẩn!"
                showIcon
              />
            ) : (
              <Alert
                type="error"
                message={
                  checkResult.message ||
                  "Thiếu hoặc vượt thiết bị so với tiêu chuẩn:"
                }
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {checkResult.details && checkResult.details.length > 0 ? (
                      checkResult.details.map((item: any, idx: number) => (
                        <li key={idx}>
                          <b>{item.name}</b>: Số lượng thực tế{" "}
                          <b>{item.actual}</b>, tiêu chuẩn{" "}
                          <b>{item.required}</b>.
                          {item.status === "missing" && (
                            <span style={{ color: "red" }}>
                              {" "}
                              Thiếu {item.required - item.actual}
                            </span>
                          )}
                          {item.status === "exceed" && (
                            <span style={{ color: "orange" }}>
                              {" "}
                              Thừa {item.actual - item.required}
                            </span>
                          )}
                          {item.status === "ok" && (
                            <span style={{ color: "green" }}> Đạt</span>
                          )}
                        </li>
                      ))
                    ) : (
                      <li>Không có dữ liệu chi tiết!</li>
                    )}
                  </ul>
                }
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EquipmentListUnified;
