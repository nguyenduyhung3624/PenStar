import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Row,
  Col,
  Spin,
} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import QuillEditor from "@/components/common/QuillEditor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRoomTypeById,
  updateRoomType,
  getRoomTypeEquipments,
} from "@/services/roomTypeApi";
import {
  uploadRoomTypeImage,
  getImagesByRoomType,
  deleteRoomTypeImage,
} from "@/services/roomTypeImagesApi";
// Removed getMasterEquipments import
import { updateDeviceStandards } from "@/services/roomTypeEquipmentsAdminApi";
import type { RcFile } from "antd/lib/upload";
import type { RoomTypeImage } from "@/types/roomTypeImage";
import RoomTypeEquipmentSelector, {
  type EquipmentSelection,
} from "./components/RoomTypeEquipmentSelector";
import RoomTypeImageUploader from "./components/RoomTypeImageUploader";
import { FIXED_AMENITIES } from "@/utils/amenities";

const RoomTypeEdit = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Image State
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const [thumbFile, setThumbFile] = useState<RcFile | null>(null);
  const [existingThumbUrl, setExistingThumbUrl] = useState<string | null>(null);
  const [existingExtras, setExistingExtras] = useState<RoomTypeImage[]>([]);

  // Equipment State
  const [selectedEquipments, setSelectedEquipments] = useState<
    EquipmentSelection[]
  >([]);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ["roomtype", id],
    queryFn: () => getRoomTypeById(id as string),
    enabled: !!id,
  });

  const { data: existingImages = [] } = useQuery({
    queryKey: ["roomtype_images", id],
    queryFn: () => getImagesByRoomType(Number(id)),
    enabled: !!id,
  });

  // Removed master equipments query

  const { data: existingStandards = [] } = useQuery({
    queryKey: ["roomtype_standards", id],
    queryFn: () => getRoomTypeEquipments(Number(id)),
    enabled: !!id,
  });

  // Effects
  useEffect(() => {
    if (!existingImages || existingImages.length === 0) {
      if (existingThumbUrl || existingExtras.length > 0) {
        setExistingThumbUrl(null);
        setExistingExtras([]);
      }
      return;
    }

    const thumb = existingImages.find((img) => img.is_thumbnail);
    const extras = existingImages.filter((img) => !img.is_thumbnail);

    if (thumb && thumb.image_url !== existingThumbUrl) {
      setExistingThumbUrl(thumb.image_url);
    }

    // Deep compare check to avoid loop
    const isSame =
      extras.length === existingExtras.length &&
      extras.every((e, i) => e.id === existingExtras[i]?.id);

    if (!isSame) {
      setExistingExtras(extras);
    }
  }, [existingImages]);

  useEffect(() => {
    if (existingStandards.length > 0 && selectedEquipments.length === 0) {
      const selections: EquipmentSelection[] = existingStandards.map(
        (std: any) => ({
          id: std.id,
          name: std.name, // Was equipment_name, now name in API response (see model)
          quantity: std.quantity,
          price: std.price || 0,
        })
      );
      setSelectedEquipments(selections);
    }
  }, [existingStandards]);

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      name: data.name,
      description: data.description,
      free_amenities: [
        ...(data.free_amenities || []),
        ...(data.paid_amenities || []),
      ],
      paid_amenities: [],

      capacity: data.capacity,
      base_adults: data.base_adults,
      base_children: data.base_children,
      extra_adult_fee: data.extra_adult_fee,
      extra_child_fee: data.extra_child_fee,
      child_age_limit: data.child_age_limit,
      price: data.price,
      bed_type: data.bed_type,
      view_direction: data.view_direction,
      room_size: data.room_size,
      policies: data.policies || {},
    });
  }, [data, form]);

  const handleFinish = async (values: any) => {
    try {
      // 1. Update Room Type Info
      await updateRoomType(id as string, {
        name: values.name,
        description: values.description,
        free_amenities: values.free_amenities || [],
        paid_amenities: [], // Legacy compat
        capacity: values.capacity ? Number(values.capacity) : undefined,
        base_adults: values.base_adults
          ? Number(values.base_adults)
          : undefined,
        base_children: values.base_children
          ? Number(values.base_children)
          : undefined,
        extra_adult_fee: values.extra_adult_fee
          ? Number(values.extra_adult_fee)
          : undefined,
        extra_child_fee: values.extra_child_fee
          ? Number(values.extra_child_fee)
          : undefined,
        // child_age_limit removed from UI
        price: values.price ? Number(values.price) : undefined,
        bed_type: values.bed_type,
        view_direction: values.view_direction,
        room_size: values.room_size ? Number(values.room_size) : undefined,
        policies: values.policies || {},
      });

      // 2. Handle Thumbnail
      if (thumbFile) {
        // Find old thumbnail to delete
        const oldThumb = existingImages.find((img) => img.is_thumbnail);
        if (oldThumb) {
          try {
            await deleteRoomTypeImage(oldThumb.id);
          } catch (e) {
            console.error("Failed to delete old thumbnail:", e);
          }
        }
        // Upload new thumbnail
        try {
          await uploadRoomTypeImage(Number(id), thumbFile, true);
        } catch (e) {
          console.error("Failed to upload new thumbnail:", e);
          message.error("Lỗi khi tải lên thumbnail mới");
        }
      }

      // 3. Handle Gallery Images
      if (fileList.length > 0) {
        for (const f of fileList) {
          try {
            await uploadRoomTypeImage(Number(id), f, false);
          } catch (e) {
            console.error("Failed to upload gallery image:", e);
          }
        }
      }

      // 4. Handle Equipments
      try {
        await updateDeviceStandards(
          Number(id),
          selectedEquipments.map((e) => ({
            name: e.name,
            quantity: e.quantity,
            price: e.price,
          }))
        );
      } catch (e) {
        console.error("Error saving equipments:", e);
      }

      message.success("Cập nhật loại phòng thành công");
      queryClient.invalidateQueries({ queryKey: ["room_types"] });
      queryClient.invalidateQueries({ queryKey: ["roomtype", id] });
      queryClient.invalidateQueries({ queryKey: ["roomtype_images", id] });
      queryClient.invalidateQueries({ queryKey: ["roomtype_standards", id] });
      navigate("/admin/roomtypes");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMsg =
        error?.response?.data?.message || "Cập nhật loại phòng thất bại";
      message.error(errorMsg);
    }
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    try {
      await deleteRoomTypeImage(imageId);
      setExistingExtras((prev) => prev.filter((img) => img.id !== imageId));
      message.success("Xóa ảnh thành công");
    } catch (err) {
      console.error("Failed to delete image:", err);
      message.error("Xóa ảnh thất bại");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Loading room type data..." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">CHỈNH SỬA LOẠI PHÒNG</h2>
        <Link to="/admin/roomtypes">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Row gutter={24}>
            {/* Left Column: Info & Equipments */}
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên loại phòng"
                rules={[{ required: true }]}
              >
                <Input placeholder="Nhập tên loại phòng (VD: Deluxe, Suite)" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="Giá (VND)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="capacity"
                    label="Sức chứa tối đa"
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={1} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="free_amenities" label="Tiện nghi phòng">
                <Select
                  mode="tags"
                  placeholder="Chọn tiện nghi từ danh sách hoặc nhập mới"
                  style={{ width: "100%" }}
                  options={FIXED_AMENITIES}
                />
              </Form.Item>

              <Form.Item label="Thiết bị tiêu chuẩn">
                <RoomTypeEquipmentSelector
                  value={selectedEquipments}
                  onChange={setSelectedEquipments}
                />
              </Form.Item>

              <Form.Item name="room_size" label="Diện tích sử dụng (m²)">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>

              <Form.Item name="description" label="Mô tả" valuePropName="value">
                <QuillEditor />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="bed_type" label="Loại giường">
                  <Input placeholder="VD: King, Queen..." />
                </Form.Item>
                <Form.Item name="view_direction" label="Hướng nhìn">
                  <Input placeholder="VD: Biển, Thành phố..." />
                </Form.Item>
              </div>

              {/* Extra Pricing Details (Optional but preserved) */}
              <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-100">
                <div className="font-semibold mb-3 text-gray-700">
                  Cấu hình chi tiết (Người & Phụ thu)
                </div>
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item name="base_adults" label="Người lớn (gốc)">
                      <InputNumber style={{ width: "100%" }} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="base_children" label="Trẻ em (gốc)">
                      <InputNumber style={{ width: "100%" }} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="extra_adult_fee"
                      label="Phụ thu NL"
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
            </Col>

            {/* Right Column: Images */}
            <Col span={8}>
              <RoomTypeImageUploader
                thumbnail={thumbFile}
                onThumbnailChange={setThumbFile}
                gallery={fileList}
                onGalleryChange={setFileList}
                existingThumbnailUrl={existingThumbUrl}
                existingGallery={existingExtras}
                onDeleteExisting={handleDeleteExistingImage}
              />
            </Col>
          </Row>

          <div className="mt-6 pt-4 border-t">
            <div className="flex gap-3">
              <Button type="primary" htmlType="submit" size="large">
                Lưu thay đổi
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

export default RoomTypeEdit;
