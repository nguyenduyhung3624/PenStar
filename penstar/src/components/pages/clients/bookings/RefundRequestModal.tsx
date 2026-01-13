import React from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Alert,
  Select,
  Space,
  Typography,
} from "antd";
import {
  BankOutlined,
  CreditCardOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRefundRequest } from "@/services/refundApi";

const { Text } = Typography;

interface RefundRequestModalProps {
  open: boolean;
  bookingId?: number;
  bookingItemId?: number;
  refundAmount: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const BANK_OPTIONS = [
  "Vietcombank",
  "VietinBank",
  "BIDV",
  "Agribank",
  "Techcombank",
  "MB Bank",
  "ACB",
  "VPBank",
  "Sacombank",
  "TPBank",
  "SHB",
  "HDBank",
  "OCB",
  "SeABank",
  "MSB",
  "LienVietPostBank",
  "VIB",
  "Nam A Bank",
  "Bac A Bank",
  "Eximbank",
  "Khác",
];

const RefundRequestModal: React.FC<RefundRequestModalProps> = ({
  open,
  bookingId,
  bookingItemId,
  refundAmount,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createRefundRequest,
    onSuccess: () => {
      message.success("Đã gửi yêu cầu hoàn tiền thành công!");
      queryClient.invalidateQueries({ queryKey: ["my-refund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      form.resetFields();
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Gửi yêu cầu thất bại");
    },
  });

  const actualRefundAmount = Math.round(refundAmount * 0.8);

  const handleSubmit = (values: any) => {
    mutation.mutate({
      booking_id: bookingItemId ? undefined : bookingId,
      booking_item_id: bookingItemId || undefined,
      amount: actualRefundAmount,
      bank_name: values.bank_name,
      account_number: values.account_number,
      account_holder: values.account_holder?.toUpperCase(),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "₫";
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined style={{ color: "#1890ff" }} />
          <span>Yêu cầu hoàn tiền</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={550}
    >
      <Alert
        message={
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 16 }}>
              Số tiền hoàn (80% giá trị): {formatCurrency(actualRefundAmount)}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Theo chính sách, phí hoàn tiền là 20% giá trị.
            </Text>
          </Space>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
        <Form.Item
          name="bank_name"
          label="Ngân hàng"
          rules={[{ required: true, message: "Vui lòng chọn ngân hàng" }]}
        >
          <Select
            placeholder="Chọn ngân hàng"
            showSearch
            optionFilterProp="children"
            suffixIcon={<BankOutlined />}
            filterOption={(input, option) =>
              String(option?.children || "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {BANK_OPTIONS.map((bank) => (
              <Select.Option key={bank} value={bank}>
                {bank}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="account_number"
          label="Số tài khoản"
          rules={[
            { required: true, message: "Vui lòng nhập số tài khoản" },
            {
              pattern: /^[0-9]{6,20}$/,
              message: "Số tài khoản phải từ 6-20 chữ số",
            },
          ]}
        >
          <Input
            placeholder="Nhập số tài khoản ngân hàng"
            prefix={<CreditCardOutlined style={{ color: "#bfbfbf" }} />}
            maxLength={20}
          />
        </Form.Item>

        <Form.Item
          name="account_holder"
          label="Tên chủ tài khoản"
          rules={[
            { required: true, message: "Vui lòng nhập tên chủ tài khoản" },
            { min: 3, message: "Tên chủ tài khoản quá ngắn" },
            {
              pattern: /^[A-Z\s]+$/,
              message: "Tên phải viết HOA không dấu",
            },
          ]}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tên không dấu, VIẾT HOA, giống trên thẻ ngân hàng
            </Text>
          }
        >
          <Input
            placeholder="VD: NGUYEN VAN A"
            prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
            style={{ textTransform: "uppercase" }}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              form.setFieldValue("account_holder", value);
            }}
          />
        </Form.Item>

        <Space style={{ width: "100%", justifyContent: "flex-end" }} size={8}>
          <Button onClick={onClose} size="large">
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.isPending}
            size="large"
          >
            Gửi yêu cầu hoàn tiền
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};

export default RefundRequestModal;
