import React, { useState, useEffect } from "react";
import type { RadioChangeEvent } from "antd";
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
} from "antd";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  createVoucher,
  type VoucherCreatePayload,
} from "@/services/voucherApi";
import { genCode } from "@/utils/genCode";
import dayjs from "dayjs";

const DiscountType = {
  Percentage: "percent",
  Fixed: "fixed",
} as const;

type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];
interface VoucherFormValues {
  code: string;
  name: string;
  type: DiscountType;
  value: number;
  min_total?: number;
  max_uses?: number;
  max_uses_per_user?: number;
  max_discount_amount?: number;
  start_date?: dayjs.Dayjs;
  end_date?: dayjs.Dayjs;
  status: boolean;
  description?: string;
}
const AddDiscount: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [discountType, setDiscountType] = useState<DiscountType>(
    DiscountType.Percentage
  );
  useEffect(() => {
    const code = genCode("VC");
    form.setFieldsValue({ code });
  }, [form]);
  const mutation = useMutation({
    mutationFn: createVoucher,
    onSuccess: () => {
      message.success("Thêm voucher thành công!");
      navigate("/admin/discount-codes");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      message.error(error?.response?.data?.message || "Có lỗi xảy ra!");
    },
  });
  const handleDiscountTypeChange = (e: RadioChangeEvent) => {
    setDiscountType(e.target.value);
    if (e.target.value === DiscountType.Fixed) {
      form.setFieldsValue({ max_discount_amount: 0 });
    }
  };
  const onFinish = (values: VoucherFormValues) => {
    const payload: VoucherCreatePayload = {
      code: values.code?.toUpperCase(),
      name: values.name,
      type: values.type || DiscountType.Percentage,
      value: values.value,
      min_total: values.min_total || 0,
      max_uses: values.max_uses || 1,
      max_uses_per_user: values.max_uses_per_user || 1,
      max_discount_amount:
        values.type === DiscountType.Percentage
          ? values.max_discount_amount || 0
          : 0,
      start_date: values.start_date?.format("YYYY-MM-DD") || undefined,
      end_date: values.end_date?.format("YYYY-MM-DD") || undefined,
      status: values.status ? "active" : "inactive",
      description: values.description || "",
    };
    mutation.mutate(payload);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">TẠO VOUCHER MỚI</h2>
        <Button onClick={() => navigate("/admin/discount-codes")}>
          Quay lại
        </Button>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          type: DiscountType.Percentage,
          status: true,
          max_discount_amount: 0,
        }}
        className="flex flex-col gap-4"
      >
        {}
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
                label="Mã Voucher (tự động)"
                rules={[
                  { required: true, message: "Vui lòng nhập mã voucher!" },
                ]}
              >
                <Input
                  size="large"
                  disabled
                  style={{
                    textTransform: "uppercase",
                    backgroundColor: "#f5f5f5",
                  }}
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
                      value
                        ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        : ""
                    }
                    parser={(value) =>
                      value
                        ? (value.replace(
                            /\$\s?|(,*)/g,
                            ""
                          ) as unknown as number)
                        : 0 as any
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
                      value
                        ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        : ""
                    }
                    parser={(value) =>
                      value
                        ? (value.replace(
                            /\$\s?|(,*)/g,
                            ""
                          ) as unknown as number)
                        : 0 as any
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
                    value!.replace(/\$\s?|(,*)/g, "") as unknown as any
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
                    value!.replace(/\$\s?|(,*)/g, "") as unknown as any
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
                    value!.replace(/\$\s?|(,*)/g, "") as unknown as any
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        {}
        <Card title="Thời gian áp dụng">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Ngày bắt đầu"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày bắt đầu!" },
                  {
                    validator: (_, value) => {
                      if (value && value.isBefore(dayjs().startOf("day"))) {
                        return Promise.reject(
                          "Ngày bắt đầu phải lớn hơn hoặc bằng ngày hiện tại"
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Chọn ngày bắt đầu"
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
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
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        {}
        <Card title="Cài đặt voucher">
          <Form.Item name="status" label="Công khai" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>
        {}
        <div className="flex gap-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.isPending}
            size="large"
          >
            Tạo mới
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
export default AddDiscount;
