import instance from "./api";
export interface RefundRequest {
  id: number;
  booking_id?: number;
  booking_item_id?: number;
  user_id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: "pending" | "approved" | "completed" | "rejected";
  receipt_image?: string;
  admin_notes?: string;
  processed_by?: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  customer_name?: string;
  booking_total?: number;
  processed_by_name?: string;
}
export interface RefundStats {
  pending_count: number;
  approved_count: number;
  completed_count: number;
  rejected_count: number;
  pending_amount: number;
  completed_amount: number;
}
export interface CreateRefundRequestPayload {
  booking_id?: number;
  booking_item_id?: number;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
}
export const createRefundRequest = async (
  data: CreateRefundRequestPayload
): Promise<RefundRequest> => {
  const res = await instance.post("/refund-requests", data);
  return res.data?.data || res.data;
};
export const getMyRefundRequests = async (): Promise<RefundRequest[]> => {
  const res = await instance.get("/refund-requests/my");
  return res.data?.data || [];
};
export const getAllRefundRequests = async (
  status?: string
): Promise<RefundRequest[]> => {
  const url = status
    ? `/refund-requests?status=${status}`
    : "/refund-requests";
  const res = await instance.get(url);
  return res.data?.data || [];
};
export const getRefundRequestById = async (
  id: number
): Promise<RefundRequest> => {
  const res = await instance.get(`/refund-requests/${id}`);
  return res.data?.data || res.data;
};
export const updateRefundRequestStatus = async (
  id: number,
  status: "pending" | "approved" | "completed" | "rejected",
  admin_notes?: string
): Promise<RefundRequest> => {
  const res = await instance.patch(`/refund-requests/${id}`, {
    status,
    admin_notes,
  });
  return res.data?.data || res.data;
};
export const uploadRefundReceipt = async (
  id: number,
  receiptFile: File
): Promise<RefundRequest> => {
  const formData = new FormData();
  formData.append("receipt", receiptFile);
  const res = await instance.post(`/refund-requests/${id}/upload-receipt`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data || res.data;
};
export const getRefundStats = async (): Promise<RefundStats> => {
  const res = await instance.get("/refund-requests/stats");
  return res.data?.data || res.data;
};
export const cancelBookingItem = async (
  itemId: number,
  cancelReason?: string
): Promise<any> => {
  const res = await instance.patch(`/booking-items/${itemId}/cancel`, {
    cancel_reason: cancelReason,
  });
  return res.data?.data || res.data;
};
export const getBookingItems = async (bookingId: number): Promise<any[]> => {
  const res = await instance.get(`/booking-items/booking/${bookingId}`);
  return res.data?.data || [];
};
export const getBookingItemsWithRefund = async (bookingId: number): Promise<any[]> => {
  const res = await instance.get(`/booking-items/booking/${bookingId}/with-refund`);
  return res.data?.data || [];
};
