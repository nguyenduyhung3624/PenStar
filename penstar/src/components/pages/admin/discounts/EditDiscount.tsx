/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Button,
  Row,
  Col,
  message,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "@/utils/dayjs";
import {
  getDiscountCodeById,
  updateDiscountCode,
} from "@/services/discountApi";

const EditDiscount: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      message.error("ID không hợp lệ hoặc không tồn tại!");
      navigate("/admin/discount-codes");
    }
  }, [id, navigate]);
  const queryClient = useQueryClient();

  // Fetch discount code details
  const { data } = useQuery({
    queryKey: ["discount-code", id],
    queryFn: () => getDiscountCodeById(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        ...data,
        value: data.value,
        start_date: data.start_date ? dayjs(data.start_date) : null,
        end_date: data.end_date ? dayjs(data.end_date) : null,
      });
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (values: any) => updateDiscountCode(Number(id), values),
    onSuccess: () => {
      message.success("Cập nhật mã giảm giá thành công");
      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
      navigate("/admin/discount-codes");
    },
    onError: () => {
      message.error("Cập nhật thất bại");
    },
  });

  const onFinish = (values: any) => {
    mutation.mutate({ ...values, value: values.value });
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <Card title="Chỉnh sửa mã giảm giá">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{}}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="code"
                label="Mã giảm giá"
                rules={[{ required: true, message: "Nhập mã giảm giá" }]}
              >
                <Input placeholder="Nhập mã giảm giá" disabled />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Mô tả">
                <Input placeholder="Mô tả ngắn về mã giảm giá" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="value"
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
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
            >
              Lưu
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

export default EditDiscount;
