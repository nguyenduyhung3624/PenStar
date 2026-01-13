import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Form, Input, Select, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import QuillEditor from "@/components/common/QuillEditor";
import { getRoomID, updateRoom } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getFloors } from "@/services/floorsApi";
import type { RoomType } from "@/types/roomtypes";
import type { Floors } from "@/types/floors";

const RoomEdit = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: types = [], isLoading: typesLoading } = useQuery({
    queryKey: ["roomtypes"],
    queryFn: getRoomTypes,
  });
  const { data: floors = [], isLoading: floorsLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getRoomID(Number(id));
        if (data) {
          form.setFieldsValue({
            name: data.name,
            type_id: data.type_id,
            floor_id: data.floor_id,
            short_desc: data.short_desc,
            long_desc: data.long_desc,
            status: data.status,
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id, form]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">SỬA PHÒNG</h2>
        <Link to="/admin/rooms">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (!id) return;
            const payload = {
              ...values,
              type_id: values.type_id ? Number(values.type_id) : undefined,
              floor_id: values.floor_id ? Number(values.floor_id) : undefined,
            } as Record<string, unknown>;

            // Ensure thumbnail is handled if needed, or just leave it as is if backend doesn't require change
            // Since we removed upload, we don't update thumbnail here unless we want to clear it or keep it.
            // Assuming we just keep existing or set null if consistent with RoomAdd logic.
            // But usually Edit doesn't touch fields not in form.
            // However, previous logic had: payload.thumbnail = existingThumbUrl ?? null;
            // Since we are removing image management, we can probably omit thumbnail from payload
            // or let backend handle it. But to be safe and consistent with "removing image feature",
            // we might want to not send it or send null if that's the intention.
            // Given the user said "taken from room type", maybe we should set it to null or not send it.
            // Let's just send the form values.

            try {
              await updateRoom(Number(id), payload);
              message.success("Cập nhật phòng thành công");
              navigate("/admin/rooms");
            } catch (e: any) {
              console.error("Failed to update room:", e);
              const errorMsg =
                e?.response?.data?.message || "Cập nhật phòng thất bại";
              message.error(errorMsg);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-4">
            <div className="w-full">
              <Form.Item
                name="name"
                label="Tên phòng"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="type_id"
                  label="Loại phòng"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn loại phòng" loading={typesLoading}>
                    {types.map((t: RoomType) => (
                      <Select.Option key={t.id} value={t.id}>
                        {t.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="floor_id"
                  label="Tầng"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn tầng" loading={floorsLoading}>
                    {floors.map((f: Floors) => (
                      <Select.Option key={f.id} value={f.id}>
                        {f.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Select.Option value="available">Còn trống</Select.Option>
                  <Select.Option value="booked">Đã đặt</Select.Option>
                  <Select.Option value="occupied">Đang ở</Select.Option>
                  <Select.Option value="unavailable">
                    Không khả dụng
                  </Select.Option>
                  <Select.Option value="cleaning">Đang dọn</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="short_desc"
                label="Mô tả ngắn"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item
                name="long_desc"
                label="Mô tả chi tiết"
                valuePropName="value"
              >
                <QuillEditor />
              </Form.Item>
            </div>
          </div>
          <div className="mt-4">
            <Button type="primary" htmlType="submit">
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
export default RoomEdit;
