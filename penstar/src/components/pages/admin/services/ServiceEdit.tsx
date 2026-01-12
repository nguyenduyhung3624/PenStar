import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Upload,
  Modal,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import QuillEditor from "@/components/common/QuillEditor";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getServiceById, updateService } from "@/services/servicesApi";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
const ServiceEdit = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [thumbnailFileList, setThumbnailFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const handleCancel = () => setPreviewOpen(false);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      if (file.originFileObj) {
        file.preview = await getBase64(file.originFileObj as File);
      }
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf("/") + 1)
    );
  };
  const { data, isLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: () => getServiceById(id as string),
    enabled: !!id,
  });
  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      name: data.name,
      description: data.description,
      price: data.price,
      unit: data.unit || "Cái",
    });
    if (data.thumbnail) {
      setThumbnailFileList([
        {
          uid: "-2",
          name: "thumbnail.jpg",
          status: "done",
          url: data.thumbnail.startsWith("http")
            ? data.thumbnail
            : `http://localhost:5001${data.thumbnail}`,
        },
      ]);
    }
  }, [data, form]);
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateService(id, payload),
    onSuccess: () => {
      message.success("Cập nhật dịch vụ thành công");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate("/admin/services");
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      message.error(
        error?.response?.data?.message || "Cập nhật dịch vụ thất bại"
      );
    },
  });
  const handleSubmit = async (values: any) => {
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      const value = values[key];
      if (value !== undefined && value !== null) {
        if (typeof value === "boolean") {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      }
    });
    const thumbnailFile = thumbnailFileList[0];
    if (thumbnailFile) {
      if (thumbnailFile.originFileObj) {
        formData.append("thumbnail_file", thumbnailFile.originFileObj);
      } else if (thumbnailFile.url) {
        formData.append("thumbnail", thumbnailFile.url);
      }
    }
    console.log("[ServiceEdit] Form values:", values);
    console.log("[ServiceEdit] FormData entries:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    updateMut.mutate({ id, payload: formData });
  };
  if (isLoading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">CHỈNH SỬA DỊCH VỤ</h2>
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
            <Form.Item name="unit" label="Đơn vị tính">
              <Input placeholder="VD: Cái, Chai, Lần..." />
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
              onPreview={handlePreview}
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
              loading={updateMut.isPending}
            >
              Lưu thay đổi
            </Button>
            <Button onClick={() => navigate("/admin/services")}>Hủy</Button>
          </div>
        </Form>
      </Card>
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="example" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </div>
  );
};
export default ServiceEdit;

const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
