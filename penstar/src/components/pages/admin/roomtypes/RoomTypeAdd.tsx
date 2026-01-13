import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Row,
  Col,
} from "antd";
import QuillEditor from "@/components/common/QuillEditor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoomType } from "@/services/roomTypeApi";
import { uploadRoomTypeImage } from "@/services/roomTypeImagesApi";
<<<<<<< HEAD
import { getDevices } from "@/services/devicesApi";
import type { RcFile } from "antd/lib/upload";
type FileWithMeta = RcFile & { lastModified?: number };

const formatPrice = (price?: number) => {
  if (!price) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

=======
import { updateDeviceStandards } from "@/services/roomTypeEquipmentsAdminApi";
import type { RcFile } from "antd/lib/upload";
import RoomTypeEquipmentSelector, {
  type EquipmentSelection,
} from "./components/RoomTypeEquipmentSelector";
import RoomTypeImageUploader from "./components/RoomTypeImageUploader";
import { FIXED_AMENITIES } from "@/utils/amenities";
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
const RoomTypeAdd: React.FC = () => {
  const [form] = Form.useForm();
  const [extras, setExtras] = useState<RcFile[]>([]);
  const [thumb, setThumb] = useState<RcFile | null>(null);
  const [selectedEquipments, setSelectedEquipments] = useState<
    EquipmentSelection[]
  >([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

<<<<<<< HEAD
  // Load danh sách thiết bị
  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
  });

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);
=======
  // Removed master equipments query
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b

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
  };
  const saveEquipments = async (roomTypeId: number) => {
    try {
      await updateDeviceStandards(
        roomTypeId,
        selectedEquipments.map((eq) => ({
          name: eq.name,
          quantity: eq.quantity,
          price: eq.price,
        }))
      );
    } catch (e) {
      console.error("Error saving equipments:", e);
    }
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
<<<<<<< HEAD
              thumbnail: PLACEHOLDER_THUMBNAIL,
              devices_id: values.devices_id || [],
=======
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
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
              child_age_limit: 12, // Default 12, UI removed request
              thumbnail: PLACEHOLDER_THUMBNAIL,
              price: values.price ? Number(values.price) : 0,
<<<<<<< HEAD
              adult_surcharge: values.adult_surcharge ? Number(values.adult_surcharge) : 0,
              child_surcharge: values.child_surcharge ? Number(values.child_surcharge) : 0,
=======
              bed_type: values.bed_type,
              view_direction: values.view_direction,
              free_amenities: values.free_amenities || [],
              paid_amenities: [], // Legacy compat
              room_size: values.room_size
                ? Number(values.room_size)
                : undefined,
              policies: values.policies || {},
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
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
<<<<<<< HEAD
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="Enter room type name (e.g., Deluxe, Suite)" />
              </Form.Item>

              <div className="grid grid-cols-4 gap-4">
                <Form.Item
                  name="price"
                  label="Price (VND)"
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
                  label="Capacity"
                  rules={[{ required: true }]}
                  tooltip="Tổng số người tối đa (người lớn + trẻ em)"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    placeholder="2"
                  />
                </Form.Item>
                <Form.Item
                  name="max_adults"
                  label="Max Adults"
                  rules={[{ required: true }]}
                  tooltip="Số người lớn tối đa"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    placeholder="2"
                  />
                </Form.Item>
                <Form.Item
                  name="max_children"
                  label="Max Children"
                  rules={[{ required: true }]}
                  tooltip="Số trẻ em tối đa"
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="adult_surcharge"
                  label="Phụ phí người lớn (VND)"
                  tooltip="Phụ phí cho mỗi người lớn vượt quá max_adults"
                >
                  <InputNumber
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => {
                      const parsed = value?.replace(/\$\s?|(,*)/g, "") || "0";
                      return Number(parsed) as any;
                    }}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item
                  name="child_surcharge"
                  label="Phụ phí trẻ em (VND)"
                  tooltip="Phụ phí cho mỗi trẻ em"
                >
                  <InputNumber
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => {
                      const parsed = value?.replace(/\$\s?|(,*)/g, "") || "0";
                      return Number(parsed) as any;
                    }}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>
              <Form.Item
                name="devices_id"
                label="Thiết bị"
                tooltip="Chọn các thiết bị có trong phòng"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn thiết bị"
                  style={{ width: "100%" }}
                  options={devices.map((device) => ({
                    value: device.id,
                    label: `${device.name}${device.fee ? ` (${formatPrice(device.fee)})` : ""}`,
                  }))}
                />
              </Form.Item>

=======
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
              <Form.Item
                name="name"
                label="Tên loại phòng"
                rules={[{ required: true }]}
              >
                <Input placeholder="Nhập tên loại phòng (VD: Deluxe, Suite)" />
              </Form.Item>
<<<<<<< HEAD

              <Form.Item name="devices_id" label="Thiết bị trong phòng">
                <Select
                  mode="multiple"
                  placeholder="Chọn thiết bị có trong loại phòng này"
                  style={{ width: "100%" }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={devices.map((d) => ({
                    label: `${d.name}${d.fee ? ` (${formatPrice(d.fee)})` : ""}`,
                    value: d.id,
                  }))}
=======
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
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
                />
              </Form.Item>

              <Form.Item
                name="capacity"
                label="Sức chứa tối đa (Max Capacity)"
                rules={[{ required: true }]}
                tooltip="Tổng số người tối đa (người lớn + trẻ em) được phép ở trong phòng"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="Ví dụ: 3"
                />
              </Form.Item>

              {/* Extra Pricing Details */}
              <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-100">
                <div className="font-semibold mb-3 text-gray-700">
                  Cấu hình chi tiết (Người & Phụ thu)
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  * Nếu không điền, hệ thống sẽ sử dụng giá trị mặc định (Người
                  gốc = 2, Phụ thu = 0).
                </div>
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item
                      name="base_adults"
                      label="NL (gốc)"
                      initialValue={2}
                      tooltip="Số người lớn tiêu chuẩn trong giá phòng"
                    >
                      <InputNumber style={{ width: "100%" }} min={1} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="base_children"
                      label="TE (gốc)"
                      initialValue={1}
                      tooltip="Số trẻ em tiêu chuẩn trong giá phòng"
                    >
                      <InputNumber style={{ width: "100%" }} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="extra_adult_fee"
                      label="Phụ thu NL"
                      initialValue={0}
                      tooltip="Phụ thu cho mỗi người lớn vượt quá số lượng gốc"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) =>
                          Number(value?.replace(/\$\s?|(,*)/g, "")) as any
                        }
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="extra_child_fee"
                      label="Phụ thu TE"
                      initialValue={0}
                      tooltip="Phụ thu cho mỗi trẻ em vượt quá số lượng gốc"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) =>
                          Number(value?.replace(/\$\s?|(,*)/g, "")) as any
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <Form.Item name="free_amenities" label="Tiện nghi phòng">
                <Select
                  mode="tags"
                  placeholder="Chọn tiện nghi từ danh sách hoặc nhập mới"
                  style={{ width: "100%" }}
                  options={FIXED_AMENITIES}
                />
              </Form.Item>
              {}
              <Form.Item label="Thiết bị tiêu chuẩn">
                <RoomTypeEquipmentSelector
                  value={selectedEquipments}
                  onChange={setSelectedEquipments}
                />
              </Form.Item>
              <Form.Item name="room_size" label="Diện tích sử dụng (m²)">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="40"
                />
              </Form.Item>
              <Form.Item name="description" label="Mô tả" valuePropName="value">
                <QuillEditor />
              </Form.Item>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="bed_type" label="Loại giường">
                  <Input placeholder="Nhập loại giường (VD: King, Queen, Twin...)" />
                </Form.Item>
                <Form.Item name="view_direction" label="Hướng nhìn">
                  <Input placeholder="Nhập hướng nhìn (VD: Biển, Thành phố, Vườn...)" />
                </Form.Item>
              </div>
            </Col>
            <Col span={8}>
              {}
              <RoomTypeImageUploader
                thumbnail={thumb}
                onThumbnailChange={setThumb}
                gallery={extras}
                onGalleryChange={setExtras}
              />
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
