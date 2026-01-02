/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  DatePicker,
  message,
  Card,
  Row,
  Col,
} from "antd";
import { useNavigate } from "react-router-dom";
import { addDiscountCode } from "@/services/discountApi";

const AddDiscount: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      const payload = {
        code: values.code,
        type: values.type || "percent", // mặc định là percent
        value: values.discount_percent, // map đúng trường backend
        min_total: values.min_total || 0,
        max_uses: values.max_uses || 1,
        max_uses_per_user: values.max_uses_per_user || 1,
        start_date: values.start_date
          ? values.start_date.format("YYYY-MM-DD")
          : null,
        end_date: values.end_date ? values.end_date.format("YYYY-MM-DD") : null,
        status: "active",
        description: values.description || "",
      };
      await addDiscountCode(payload);
      message.success("Thêm mã giảm giá thành công!");
      navigate("/admin/discount-codes");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">THÊM MÃ GIẢM GIÁ</h2>
        <Button onClick={() => navigate("/admin/discount-codes")}>
          Quay lại
        </Button>
      </div>
      <Card style={{ maxWidth: 600, margin: "0 auto" }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="code"
                label="Mã giảm giá"
                rules={[{ required: true, message: "Nhập mã giảm giá" }]}
              >
                <Input placeholder="Nhập mã giảm giá" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Mô tả">
                <Input placeholder="Mô tả ngắn về mã giảm giá" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discount_percent"
                label="Phần trăm giảm (%)"
                rules={[{ required: true, message: "Nhập phần trăm giảm" }]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: "100%" }}
                  placeholder="% giảm"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="min_total" label="Giá trị tối thiểu đơn hàng">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Tối thiểu (VND)"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_uses" label="Số lần sử dụng tối đa">
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="Tối đa lượt dùng"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_uses_per_user" label="Tối đa/user">
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="Tối đa/user"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="start_date" label="Ngày bắt đầu">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày bắt đầu"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="Ngày kết thúc">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày kết thúc"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ textAlign: "right" }}>
            <Button type="primary" htmlType="submit">
              Thêm
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => navigate("/admin/discount-codes")}
            >
              Huỷ
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddDiscount;
