import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Upload,
  Row,
  Col,
  Table,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import QuillEditor from "@/components/common/QuillEditor";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { createRoomType } from "@/services/roomTypeApi";
import { uploadRoomTypeImage } from "@/services/roomTypeImagesApi";
import { getMasterEquipments } from "@/services/masterEquipmentsApi";
import { upsertDeviceStandard } from "@/services/roomTypeEquipmentsAdminApi";
import type { RcFile } from "antd/lib/upload";
type FileWithMeta = RcFile & { lastModified?: number };

interface EquipmentSelection {
  equipment_id: number;
  equipment_name: string;
  min_quantity: number;
  max_quantity: number;
}

const RoomTypeAdd: React.FC = () => {
  const [form] = Form.useForm();
  const [extras, setExtras] = useState<RcFile[]>([]);
  const [thumb, setThumb] = useState<RcFile | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [selectedEquipments, setSelectedEquipments] = useState<
    EquipmentSelection[]
  >([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch danh sách thiết bị
  const { data: equipmentList = [] } = useQuery({
    queryKey: ["master-equipments"],
    queryFn: getMasterEquipments,
  });

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  const uploadSelectedFiles = async (roomTypeId: number) => {
    if (thumb) {
      try {
        await uploadRoomTypeImage(roomTypeId, thumb, true);
      } catch (e) {
        console.error("Upload failed for thumb", e);
      }
      setThumb(null);
    }
    if (extras.length > 0) {
      for (const f of extras) {
        try {
          await uploadRoomTypeImage(roomTypeId, f, false);
        } catch (e) {
          console.error("Upload failed for extra", e);
        }
      }
    }
    setExtras([]);
    setPreviews({});
  };

  // Lưu thiết bị cho loại phòng
  const saveEquipments = async (roomTypeId: number) => {
    for (const eq of selectedEquipments) {
      try {
        await upsertDeviceStandard({
          room_type_id: roomTypeId,
          master_equipment_id: eq.equipment_id,
          min_quantity: eq.min_quantity,
          max_quantity: eq.max_quantity,
        });
      } catch (e) {
        console.error("Error saving equipment:", eq.equipment_name, e);
      }
    }
  };

  // Thêm thiết bị vào danh sách
  const addEquipment = (equipmentId: number) => {
    const equipment = equipmentList.find(
      (e: { id: number; name: string }) => e.id === equipmentId
    );
    if (!equipment) return;

    // Kiểm tra đã tồn tại chưa
    if (selectedEquipments.some((e) => e.equipment_id === equipmentId)) {
      message.warning("Thiết bị này đã được chọn");
      return;
    }

    setSelectedEquipments((prev) => [
      ...prev,
      {
        equipment_id: equipment.id,
        equipment_name: equipment.name,
        min_quantity: 1,
        max_quantity: 1,
      },
    ]);
  };

  // Xóa thiết bị khỏi danh sách
  const removeEquipment = (equipmentId: number) => {
    setSelectedEquipments((prev) =>
      prev.filter((e) => e.equipment_id !== equipmentId)
    );
  };

  // Cập nhật số lượng
  const updateEquipmentQuantity = (
    equipmentId: number,
    field: "min_quantity" | "max_quantity",
    value: number
  ) => {
    setSelectedEquipments((prev) =>
      prev.map((e) =>
        e.equipment_id === equipmentId ? { ...e, [field]: value } : e
      )
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">THÊM LOẠI PHÒNG</h2>
        <Link to="/admin/roomtypes">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const PLACEHOLDER_THUMBNAIL =
              "https://via.placeholder.com/800x600?text=No+Image";
            const payload = {
              name: values.name ?? "",
              description: values.description ?? "",
              capacity: values.capacity ? Number(values.capacity) : 2,
              base_adults: values.base_adults ? Number(values.base_adults) : 2,
              base_children: values.base_children
                ? Number(values.base_children)
                : 0,
              extra_adult_fee: values.extra_adult_fee
                ? Number(values.extra_adult_fee)
                : 0,
              extra_child_fee: values.extra_child_fee
                ? Number(values.extra_child_fee)
                : 0,
              child_age_limit: values.child_age_limit
                ? Number(values.child_age_limit)
                : 12,
              thumbnail: PLACEHOLDER_THUMBNAIL,
              price: values.price ? Number(values.price) : 0,
              bed_type: values.bed_type,
              view_direction: values.view_direction,
              // amenities: values.amenities || [],
              free_amenities: values.free_amenities || [],
              paid_amenities: values.paid_amenities || [],
              room_size: values.room_size
                ? Number(values.room_size)
                : undefined,
              policies: values.policies || {},
            };
            try {
              const created = await createRoomType(payload);
              const roomTypeId = created && (created as { id?: number }).id;
              if (roomTypeId) {
                await uploadSelectedFiles(roomTypeId);
                await saveEquipments(roomTypeId);
              }
              message.success("Tạo loại phòng thành công");
              queryClient.invalidateQueries({ queryKey: ["room_types"] });
              navigate("/admin/roomtypes");
            } catch (err) {
              const e = err as { response?: { data?: { message?: string } } };
              const serverMsg = e?.response?.data?.message;
              console.error("Error creating room type:", e, serverMsg ?? "");
              message.error(serverMsg ?? "Tạo loại phòng thất bại");
            }
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên loại phòng"
                rules={[{ required: true }]}
              >
                <Input placeholder="Nhập tên loại phòng (VD: Deluxe, Suite)" />
              </Form.Item>
              <Form.Item
                name="price"
                label="Giá (VND)"
                rules={[{ required: true }]}
                tooltip="Giá phòng cho loại này"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="1000000"
                />
              </Form.Item>
              <Form.Item
                name="capacity"
                label="Sức chứa tối đa"
                rules={[{ required: true }]}
                tooltip="Tổng số người tối đa (người lớn + trẻ em)"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="2"
                />
              </Form.Item>
              <Form.Item name="free_amenities" label="Tiện nghi miễn phí">
                <Select
                  mode="tags"
                  placeholder="Nhập tiện nghi miễn phí và nhấn Enter"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item name="paid_amenities" label="Tiện nghi tính phí">
                <Select
                  mode="tags"
                  placeholder="Nhập tiện nghi tính phí và nhấn Enter"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              {/* Phần chọn thiết bị */}
              <Form.Item label="Thiết bị tiêu chuẩn">
                <div style={{ marginBottom: 12 }}>
                  <Select
                    placeholder="Chọn thiết bị để thêm"
                    style={{ width: "100%" }}
                    showSearch
                    optionFilterProp="children"
                    onChange={(value) =>
                      value !== undefined && addEquipment(value)
                    }
                    value={undefined}
                  >
                    {equipmentList
                      .filter(
                        (eq: { id: number }) =>
                          !selectedEquipments.some(
                            (s) => s.equipment_id === eq.id
                          )
                      )
                      .map((eq: { id: number; name: string; type: string }) => (
                        <Select.Option key={eq.id} value={eq.id}>
                          {eq.name} ({eq.type})
                        </Select.Option>
                      ))}
                  </Select>
                </div>
                {selectedEquipments.length > 0 && (
                  <Table
                    dataSource={selectedEquipments}
                    rowKey="equipment_id"
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: "Thiết bị",
                        dataIndex: "equipment_name",
                        key: "equipment_name",
                      },
                      {
                        title: "SL tối thiểu",
                        dataIndex: "min_quantity",
                        key: "min_quantity",
                        width: 120,
                        render: (_, record) => (
                          <InputNumber
                            min={1}
                            value={record.min_quantity}
                            onChange={(value) =>
                              updateEquipmentQuantity(
                                record.equipment_id,
                                "min_quantity",
                                value || 1
                              )
                            }
                            size="small"
                            style={{ width: "100%" }}
                          />
                        ),
                      },
                      {
                        title: "SL tối đa",
                        dataIndex: "max_quantity",
                        key: "max_quantity",
                        width: 120,
                        render: (_, record) => (
                          <InputNumber
                            min={record.min_quantity}
                            value={record.max_quantity}
                            onChange={(value) =>
                              updateEquipmentQuantity(
                                record.equipment_id,
                                "max_quantity",
                                value || record.min_quantity
                              )
                            }
                            size="small"
                            style={{ width: "100%" }}
                          />
                        ),
                      },
                      {
                        title: "",
                        key: "action",
                        width: 50,
                        render: (_, record) => (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeEquipment(record.equipment_id)}
                          />
                        ),
                      },
                    ]}
                  />
                )}
              </Form.Item>

              <Form.Item name="room_size" label="Diện tích sử dụng (m²)">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="40"
                />
              </Form.Item>
              {/* <Form.Item name="policies" label="Chính sách phòng">
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập chính sách phòng (JSON hoặc text)"
                />
              </Form.Item> */}

              <Form.Item name="description" label="Mô tả" valuePropName="value">
                <QuillEditor />
              </Form.Item>

              {/* Đã xoá Form.Item amenities */}

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="bed_type" label="Loại giường">
                  <Input placeholder="Nhập loại giường (VD: King, Queen, Twin...)" />
                </Form.Item>
                <Form.Item name="view_direction" label="Hướng nhìn">
                  <Input placeholder="Nhập hướng nhìn (VD: Biển, Thành phố, Vườn...)" />
                </Form.Item>
              </div>

              <Form.Item name="safety_info" label="Thông tin an toàn">
                {/* Trường này không còn trong schema, có thể bỏ nếu không dùng */}
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="Ảnh đại diện">
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  fileList={
                    thumb
                      ? [
                          {
                            uid: "thumb",
                            name: thumb.name,
                            status: "done",
                            originFileObj: thumb,
                            url: previews.thumb,
                          },
                        ]
                      : []
                  }
                  beforeUpload={(file) => {
                    const f = file as RcFile;
                    setThumb(f);
                    setPreviews((p) => ({
                      ...p,
                      thumb: URL.createObjectURL(f),
                    }));
                    return false;
                  }}
                  onRemove={() => {
                    setThumb(null);
                    setPreviews((p) => {
                      const copy = { ...p } as Record<string, string>;
                      if (copy.thumb) URL.revokeObjectURL(copy.thumb);
                      delete copy.thumb;
                      return copy;
                    });
                    return true;
                  }}
                >
                  {!thumb && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-2xl">+</div>
                      <div>Tải ảnh</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item label="Ảnh bổ sung (không bắt buộc)">
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  multiple
                  fileList={extras.map((f, i) => ({
                    uid: `${i}`,
                    name: f.name,
                    status: "done",
                    originFileObj: f,
                    url: previews[
                      `${f.name}-${f.size}-${(f as FileWithMeta).lastModified}`
                    ],
                  }))}
                  beforeUpload={(file) => {
                    const f = file as RcFile;
                    setExtras((prev) => {
                      const exists = prev.some(
                        (p) =>
                          p.name === f.name &&
                          p.size === f.size &&
                          (p as FileWithMeta).lastModified ===
                            (f as FileWithMeta).lastModified
                      );
                      if (exists) return prev;
                      return [...prev, f];
                    });
                    const key = `${f.name}-${f.size}-${
                      (f as FileWithMeta).lastModified
                    }`;
                    setPreviews((p) => ({
                      ...p,
                      [key]: URL.createObjectURL(f),
                    }));
                    return false;
                  }}
                  onRemove={(file) => {
                    const origin = (
                      file as unknown as { originFileObj?: RcFile }
                    ).originFileObj;
                    const originLast = origin
                      ? (origin as FileWithMeta).lastModified
                      : (file as FileWithMeta).lastModified;
                    const key = origin
                      ? `${origin.name}-${origin.size}-${originLast}`
                      : `${file.name}-${file.size}-${originLast}`;
                    setExtras((prev) =>
                      prev.filter(
                        (p) =>
                          !(
                            p.name === (origin?.name ?? file.name) &&
                            p.size === (origin?.size ?? file.size) &&
                            (p as FileWithMeta).lastModified === originLast
                          )
                      )
                    );
                    setPreviews((p) => {
                      const copy = { ...p } as Record<string, string>;
                      if (copy[key]) URL.revokeObjectURL(copy[key]);
                      delete copy[key];
                      return copy;
                    });
                    return true;
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-2xl">+</div>
                    <div>Tải ảnh</div>
                  </div>
                </Upload>

                <div className="text-xs text-gray-500 mt-2">
                  Đã chọn: {extras.length} ảnh
                </div>
              </Form.Item>
            </Col>
          </Row>

          <div className="mt-6 pt-4 border-t">
            <div className="flex gap-3">
              <Button type="primary" htmlType="submit" size="large">
                Tạo loại phòng
              </Button>
              <Link to="/admin/roomtypes">
                <Button size="large">Hủy</Button>
              </Link>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RoomTypeAdd;
