import React, { useState } from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Button,
  Upload,
  message,
  Image,
  Divider,
  Space,
  Input,
} from "antd";
import {
  UploadOutlined,
  DollarOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadRefundReceipt,
  updateRefundRequestStatus,
  type RefundRequest,
} from "@/services/refundApi";
import dayjs from "dayjs";
const { TextArea } = Input;
interface RefundProcessModalProps {
  open: boolean;
  request: RefundRequest | null;
  onClose: () => void;
}
const RefundProcessModal: React.FC<RefundProcessModalProps> = ({
  open,
  request,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };
  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: "orange", label: "Chờ xử lý" },
      approved: { color: "yellow", label: "Đã duyệt" },
      completed: { color: "green", label: "Hoàn thành" },
      rejected: { color: "red", label: "Từ chối" },
    };
    const config = statusConfig[status] || { color: "default", label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!request || !selectedFile) throw new Error("No file selected");
      return uploadRefundReceipt(request.id, selectedFile);
    },
    onSuccess: () => {
      message.success("Đã hoàn trả tiền thành công!");
      queryClient.resetQueries();
      queryClient.refetchQueries({ queryKey: ["refund-requests"] });
      queryClient.refetchQueries({ queryKey: ["my-bookings"] });
      queryClient.refetchQueries({ queryKey: ["booking-detail"] });
      handleClose();
    },
    onError: (err: any) => {
      message.error(
        err?.response?.data?.message || err?.message || "Lỗi hoàn tiền"
      );
    },
  });
  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!request) throw new Error("No request");
      return updateRefundRequestStatus(request.id, "rejected", adminNotes);
    },
    onSuccess: () => {
      message.success("Đã từ chối yêu cầu hoàn tiền");
      queryClient.invalidateQueries({ queryKey: ["refund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["refund-stats"] });
      handleClose();
    },
    onError: (err: any) => {
      message.error(err?.message || "Từ chối thất bại");
    },
  });
  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setAdminNotes("");
    onClose();
  };
  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRefund = () => {
    if (!selectedFile) {
      message.warning("Vui lòng upload ảnh bill chuyển khoản");
      return;
    }
    uploadMutation.mutate();
  };
  if (!request) return null;
  const canProcess =
    request.status === "pending" || request.status === "approved";
  return (
    <Modal
      title="Chi tiết yêu cầu hoàn tiền"
      open={open}
      onCancel={handleClose}
      width={650}
      footer={
        <Space>
          <Button onClick={handleClose}>Đóng</Button>
          {canProcess && (
            <>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => rejectMutation.mutate()}
                loading={rejectMutation.isPending}
              >
                Từ chối
              </Button>
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={handleRefund}
                loading={uploadMutation.isPending}
                disabled={!selectedFile}
                className="bg-green-600 hover:bg-green-700"
              >
                Hoàn trả tiền
              </Button>
            </>
          )}
        </Space>
      }
    >
      {}
      <Descriptions column={1} bordered size="small" className="mb-4">
        <Descriptions.Item label="ID yêu cầu">{request.id}</Descriptions.Item>
        <Descriptions.Item label="Khách hàng">
          <div>
            <strong>{request.user_name || request.customer_name}</strong>
            <div className="text-xs text-gray-500">{request.user_email}</div>
            <div className="text-xs text-gray-500">{request.user_phone}</div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Số tiền hoàn">
          <span className="text-red-500 font-bold text-lg">
            {formatCurrency(request.amount)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          {getStatusTag(request.status)}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {dayjs(request.created_at).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
        {request.processed_at && (
          <Descriptions.Item label="Ngày xử lý">
            {dayjs(request.processed_at).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
        )}
      </Descriptions>
      <Divider />
      {}
      <h4 className="font-semibold mb-2">Thông tin ngân hàng</h4>
      <Descriptions column={1} bordered size="small" className="mb-4">
        <Descriptions.Item label="Ngân hàng">
          <strong>{request.bank_name}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Số tài khoản">
          <span className="font-mono text-lg">{request.account_number}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Chủ tài khoản">
          <strong>{request.account_holder}</strong>
        </Descriptions.Item>
      </Descriptions>
      <Divider />
      {}
      {canProcess && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">
              <span className="text-red-500">*</span> Upload bill chuyển khoản
            </h4>
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleFileChange}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh bill</Button>
            </Upload>
            {previewUrl && (
              <div className="mt-3">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxWidth: 300, borderRadius: 8 }}
                />
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Ghi chú (tùy chọn)</h4>
            <TextArea
              rows={3}
              placeholder="Nhập ghi chú cho khách hàng..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>
      )}
      {}
      {request.receipt_image && (
        <div>
          <h4 className="font-semibold mb-2">Bill chuyển khoản đã gửi</h4>
          <Image
            src={request.receipt_image}
            alt="Receipt"
            style={{ maxWidth: 400, borderRadius: 8 }}
          />
        </div>
      )}
      {}
      {request.admin_notes && (
        <div className="mt-4">
          <h4 className="font-semibold mb-1">Ghi chú từ admin</h4>
          <p className="text-gray-600">{request.admin_notes}</p>
        </div>
      )}
    </Modal>
  );
};
export default RefundProcessModal;
