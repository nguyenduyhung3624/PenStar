/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Modal, Form, Input, Button, message, Alert } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRefundRequest } from "@/services/refundApi";

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

  const handleSubmit = (values: any) => {
    mutation.mutate({
      booking_id: bookingItemId ? undefined : bookingId,
      booking_item_id: bookingItemId || undefined,
      amount: refundAmount,
      bank_name: values.bank_name,
      account_number: values.account_number,
      account_holder: values.account_holder?.toUpperCase(),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  return (
    <Modal
      title="Yêu cầu hoàn tiền"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Alert
        message={`Số tiền hoàn: ${formatCurrency(refundAmount)}`}
        type="info"
        showIcon
        className="mb-4"
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="bank_name"
          label="Ngân hàng"
          rules={[{ required: true, message: "Vui lòng nhập tên ngân hàng" }]}
        >
          <Input
            placeholder="Nhập tên ngân hàng (VD: Vietcombank, BIDV...)"
            list="bank-list"
          />
        </Form.Item>
        <datalist id="bank-list">
          {BANK_OPTIONS.map((bank) => (
            <option key={bank} value={bank} />
          ))}
        </datalist>

        <Form.Item
          name="account_number"
          label="Số tài khoản"
          rules={[
            { required: true, message: "Vui lòng nhập số tài khoản" },
            {
              pattern: /^[0-9]{6,20}$/,
              message: "Số tài khoản không hợp lệ",
            },
          ]}
        >
          <Input placeholder="Nhập số tài khoản ngân hàng" />
        </Form.Item>

        <Form.Item
          name="account_holder"
          label="Tên chủ tài khoản"
          rules={[
            { required: true, message: "Vui lòng nhập tên chủ tài khoản" },
            { min: 3, message: "Tên chủ tài khoản quá ngắn" },
          ]}
          extra="Tên không dấu, giống trên thẻ ngân hàng"
        >
          <Input
            placeholder="VD: NGUYEN VAN A"
            style={{ textTransform: "uppercase" }}
          />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Gửi yêu cầu hoàn tiền
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default RefundRequestModal;
