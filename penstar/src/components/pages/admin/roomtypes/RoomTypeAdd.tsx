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
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { createRoomType } from "@/services/roomTypeApi";
import { uploadRoomTypeImage } from "@/services/roomTypeImagesApi";
import { getMasterEquipments } from "@/services/masterEquipmentsApi";
import { upsertDeviceStandard } from "@/services/roomTypeEquipmentsAdminApi";
import type { RcFile } from "antd/lib/upload";
import RoomTypeEquipmentSelector, {
  type EquipmentSelection,
} from "./components/RoomTypeEquipmentSelector";
import RoomTypeImageUploader from "./components/RoomTypeImageUploader";
import { FIXED_AMENITIES } from "@/utils/amenities";
const RoomTypeAdd: React.FC = () => {
  const [form] = Form.useForm();
  const [extras, setExtras] = useState<RcFile[]>([]);
  const [thumb, setThumb] = useState<RcFile | null>(null);
  const [selectedEquipments, setSelectedEquipments] = useState<
    EquipmentSelection[]
  >([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: equipmentList = [] } = useQuery({
    queryKey: ["master-equipments"],
    queryFn: getMasterEquipments,
  });
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
    for (const eq of selectedEquipments) {
      try {
        await upsertDeviceStandard({
          room_type_id: roomTypeId,
          master_equipment_id: eq.equipment_id,
          quantity: eq.quantity,
        });
      } catch (e) {
        console.error("Error saving equipment:", eq.equipment_name, e);
      }
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
              free_amenities: values.free_amenities || [],
              paid_amenities: [], // Legacy compat
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
                  equipmentList={equipmentList}
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
