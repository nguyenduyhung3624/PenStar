/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Card, Form, Input, InputNumber, message, Upload } from "antd";
import { Link, useNavigate } from "react-router-dom";
import QuillEditor from "@/components/common/QuillEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createService } from "@/services/servicesApi";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { UploadFile } from "antd";

const ServiceAdd = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Chỉ dùng thumbnailFileList làm ảnh đại diện
  const [thumbnailFileList, setThumbnailFileList] = useState<UploadFile[]>([]);

  const createMut = useMutation({
    mutationFn: (payload: FormData) => createService(payload),
    onSuccess: () => {
      message.success("Tạo dịch vụ thành công");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate("/admin/services");
    },
    onError: (error: any) => {
      console.error("Create error:", error);
      message.error(error?.response?.data?.message || "Tạo dịch vụ thất bại");
    },
  });

  const handleSubmit = (values: any) => {
    const formData = new FormData();

    // ✅ Add form fields - chỉ thêm những field có giá trị
    Object.keys(values).forEach((key) => {
      const value = values[key];
      if (value !== undefined && value !== null) {
        // Convert boolean thành string
        if (typeof value === "boolean") {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      }
    });

    // ✅ Chỉ upload thumbnail_file (ảnh đại diện)
    if (thumbnailFileList.length > 0 && thumbnailFileList[0].originFileObj) {
      formData.append("thumbnail_file", thumbnailFileList[0].originFileObj);
    }

    // ✅ Debug log
    console.log("[ServiceAdd] Form values:", values);
    console.log("[ServiceAdd] FormData entries:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    createMut.mutate(formData);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">THÊM DỊCH VỤ MỚI</h2>
        <Link to="/admin/services">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Tên dịch vụ"
            rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
          >
            <Input placeholder="VD: Buffet sáng, Spa massage..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="Giá (VND)"
              rules={[{ required: true, message: "Vui lòng nhập giá" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả" valuePropName="value">
            <QuillEditor />
          </Form.Item>
          <Form.Item label="Ảnh đại diện" required>
            <Upload
              listType="picture-card"
              fileList={thumbnailFileList}
              onChange={({ fileList }) => setThumbnailFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
            >
              {thumbnailFileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <div className="mt-4 flex gap-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={createMut.isPending}
            >
              Tạo dịch vụ
            </Button>
            <Button onClick={() => navigate("/admin/services")}>Hủy</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ServiceAdd;
