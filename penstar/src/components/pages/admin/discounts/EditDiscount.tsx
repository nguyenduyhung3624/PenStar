/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
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
  Radio,
  Switch,
  Spin,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVoucherById, updateVoucher } from "@/services/voucherApi";
import dayjs from "dayjs";

enum DiscountType {
  Percentage = "percent",
  Fixed = "fixed",
}

const EditDiscount: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [discountType, setDiscountType] = useState<DiscountType | null>(null);

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      message.error("ID không hợp lệ hoặc không tồn tại!");
      navigate("/admin/discount-codes");
    }
  }, [id, navigate]);

  // Fetch voucher details
  const { data: voucherDetails, isLoading } = useQuery({
    queryKey: ["voucher", id],
    queryFn: () => getVoucherById(id as string),
    enabled: !!id,
  });

  // Set form values when data is loaded
  useEffect(() => {
    if (voucherDetails && discountType === null) {
      form.setFieldsValue({
        name: voucherDetails.name,
        code: voucherDetails.code,
        type: voucherDetails.type,
        value: voucherDetails.value,
        max_discount_amount: voucherDetails.max_discount_amount || 0,
        min_total: voucherDetails.min_total || 0,
        max_uses: voucherDetails.max_uses || 1,
        max_uses_per_user: voucherDetails.max_uses_per_user || 1,
        start_date: voucherDetails.start_date
          ? dayjs(voucherDetails.start_date)
          : null,
        end_date: voucherDetails.end_date
          ? dayjs(voucherDetails.end_date)
          : null,
        status: voucherDetails.status === "active",
        description: voucherDetails.description || "",
      });
      setDiscountType(
        (voucherDetails.type as DiscountType) || DiscountType.Percentage
      );
    }
  }, [voucherDetails, discountType, form]);

  const mutation = useMutation({
    mutationFn: (values: any) => updateVoucher(Number(id), values),
    onSuccess: () => {
      message.success("Cập nhật voucher thành công");
      queryClient.invalidateQueries({ queryKey: ["vouchers-admin-all"] });
      queryClient.invalidateQueries({ queryKey: ["voucher", id] });
      navigate("/admin/discount-codes");
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Cập nhật thất bại");
    },
  });

  const handleDiscountTypeChange = (e: any) => {
    setDiscountType(e.target.value);
    if (e.target.value === DiscountType.Fixed) {
      form.setFieldsValue({ max_discount_amount: 0 });
    }
  };

  const onFinish = (values: any) => {
    const payload = {
      code: values.code?.toUpperCase(),
      name: values.name,
      type: values.type,
      value: values.value,
      min_total: values.min_total || 0,
      max_uses: values.max_uses || 1,
      max_uses_per_user: values.max_uses_per_user || 1,
      max_discount_amount:
        values.type === DiscountType.Percentage
          ? values.max_discount_amount || 0
          : 0,
      start_date: values.start_date?.format("YYYY-MM-DD") || null,
      end_date: values.end_date?.format("YYYY-MM-DD") || null,
      status: values.status ? "active" : "inactive",
      description: values.description || "",
    };
    mutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">CẬP NHẬT VOUCHER</h2>
        <Button onClick={() => navigate("/admin/discount-codes")}>
          Quay lại
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="flex flex-col gap-4"
      >
        {/* Thông tin voucher */}
        <Card title="Thông tin voucher">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên Voucher"
                rules={[
                  { required: true, message: "Vui lòng nhập tên voucher!" },
                ]}
              >
                <Input size="large" placeholder="VD: Giảm giá mùa hè" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã Voucher"
                rules={[
                  { required: true, message: "Vui lòng nhập mã voucher!" },
                ]}
              >
                <Input
                  size="large"
                  placeholder="VD: SUMMER2026"
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={2} placeholder="Mô tả ngắn về voucher" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="type"
                label="Loại giảm giá"
                rules={[
                  { required: true, message: "Vui lòng chọn loại giảm giá!" },
                ]}
              >
                <Radio.Group onChange={handleDiscountTypeChange}>
                  <Radio value={DiscountType.Percentage}>
                    Giảm giá theo phần trăm
                  </Radio>
                  <Radio value={DiscountType.Fixed}>Giảm giá cố định</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            {discountType === DiscountType.Percentage ? (
              <Col span={12}>
                <Form.Item
                  name="value"
                  label="Phần trăm giảm giá (%)"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập giá trị giảm giá!",
                    },
                    {
                      type: "number",
                      min: 1,
                      max: 100,
                      message: "Phần trăm phải từ 1-100!",
                    },
                  ]}
                >
                  <InputNumber
                    size="large"
                    style={{ width: "100%" }}
                    placeholder="Nhập % giảm giá"
                    min={1}
                    max={100}
                  />
                </Form.Item>
              </Col>
            ) : (
              <Col span={12}>
                <Form.Item
                  name="value"
                  label="Giá trị giảm giá (VND)"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập giá trị giảm giá!",
                    },
                  ]}
                >
                  <InputNumber
                    size="large"
                    style={{ width: "100%" }}
                    placeholder="Nhập giá trị giảm giá"
                    min={1000}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      value!.replace(/\$\s?|(,*)/g, "") as unknown as number
                    }
                  />
                </Form.Item>
              </Col>
            )}

            {discountType === DiscountType.Percentage && (
              <Col span={12}>
                <Form.Item
                  name="max_discount_amount"
                  label="Giảm giá tối đa (VND)"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập giá trị giảm giá tối đa!",
                    },
                  ]}
                >
                  <InputNumber
                    size="large"
                    style={{ width: "100%" }}
                    placeholder="Nhập giá trị giảm giá tối đa"
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      value!.replace(/\$\s?|(,*)/g, "") as unknown as number
                    }
                  />
                </Form.Item>
              </Col>
            )}

            <Col span={12}>
              <Form.Item
                name="min_total"
                label="Giá trị đơn hàng tối thiểu"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập giá trị đơn hàng tối thiểu!",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        discountType === DiscountType.Percentage ||
                        value > getFieldValue("value")
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        "Giá trị đơn hàng tối thiểu phải lớn hơn giá trị giảm giá"
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Nhập giá trị đơn hàng tối thiểu"
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) =>
                    value!.replace(/\$\s?|(,*)/g, "") as unknown as number
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="max_uses"
                label="Số lượng voucher"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tổng số lượng voucher!",
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Nhập số lượng cho voucher này"
                  min={1}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) =>
                    value!.replace(/\$\s?|(,*)/g, "") as unknown as number
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="max_uses_per_user"
                label="Số lượng dùng trên mỗi tài khoản"
                dependencies={["max_uses"]}
                rules={[
                  {
                    required: true,
                    message: "Số lượng sử dụng tối thiểu là 1!",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxUses = getFieldValue("max_uses");
                      if (!value || !maxUses || value <= maxUses) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        "Số lượng dùng trên mỗi tài khoản phải nhỏ hơn hoặc bằng số lượng voucher"
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Nhập số lượng tối đa mỗi người được dùng"
                  min={1}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) =>
                    value!.replace(/\$\s?|(,*)/g, "") as unknown as number
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Thời gian áp dụng */}
        <Card title="Thời gian áp dụng">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Ngày bắt đầu"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày bắt đầu!" },
                ]}
              >
                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày bắt đầu"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="end_date"
                label="Ngày kết thúc"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày kết thúc!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        value.isAfter(getFieldValue("start_date"))
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        "Ngày kết thúc phải lớn hơn ngày bắt đầu"
                      );
                    },
                  }),
                ]}
              >
                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày kết thúc"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Cài đặt voucher */}
        <Card title="Cài đặt voucher">
          <Form.Item name="status" label="Công khai" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>

        {/* Submit buttons */}
        <div className="flex gap-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.isPending}
            size="large"
          >
            Cập nhật
          </Button>
          <Button
            size="large"
            onClick={() => navigate("/admin/discount-codes")}
          >
            Huỷ
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditDiscount;
