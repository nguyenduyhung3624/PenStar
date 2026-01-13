import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Select, message } from "antd";
import QuillEditor from "@/components/common/QuillEditor";
import { useQuery } from "@tanstack/react-query";
import { createRoom } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getFloors } from "@/services/floorsApi";
import type { RoomType } from "@/types/roomtypes";
import type { Floors as Floor } from "@/types/floors";

const RoomAdd: React.FC = () => {
  const [form] = Form.useForm();
  const { data: roomTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ["roomtypes"],
    queryFn: getRoomTypes,
  });
  const { data: floors = [], isLoading: floorsLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: getFloors,
  });
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">THÊM PHÒNG</h2>
        <Link to="/admin/rooms">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const payload = {
              name: values.name ?? "",
              type_id: values.type_id ? Number(values.type_id) : undefined,
              floor_id: values.floor_id ? Number(values.floor_id) : undefined,
              short_desc: values.short_desc ?? "",
              long_desc: values.long_desc ?? "",
              status: "available",
              thumbnail: null,
            } as Record<string, unknown>;
            console.log("Creating room with payload:", payload);
            try {
              await createRoom(payload);
              message.success("Tạo phòng thành công");
              navigate("/admin/rooms");
            } catch (err) {
              const e = err as { response?: { data?: { message?: string } } };
              const serverMsg = e?.response?.data?.message;
              console.error("Error creating room:", e, serverMsg ?? "");
              message.error(serverMsg ?? "Tạo phòng thất bại");
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
                    {roomTypes.map((t: RoomType) => (
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
                    {floors.map((f: Floor) => (
                      <Select.Option key={f.id} value={f.id}>
                        {f.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
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
              Tạo mới
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
export default RoomAdd;
