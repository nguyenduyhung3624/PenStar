/* eslint-disable @typescript-eslint/no-explicit-any */
import instance from "./api";

export interface Voucher {
  id: number;
  code: string;
  name?: string;
  type: "percent" | "fixed";
  value: number;
  min_total?: number;
  max_uses?: number;
  max_uses_per_user?: number;
  max_discount_amount?: number;
  start_date?: string;
  end_date?: string;
  status: "active" | "inactive" | "expired";
  description?: string;
  created_at?: string;
  updated_at?: string;
  total_usage?: number;
  potential_discount?: number;
  remaining_uses?: number | null;
}

export interface VoucherCreatePayload {
  code: string;
  name?: string;
  type: "percent" | "fixed";
  value: number;
  min_total?: number;
  max_uses?: number;
  max_uses_per_user?: number;
  max_discount_amount?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  description?: string;
}

/**
 * GET /voucher - List valid vouchers only
 */
export const fetchValidVouchers = async (total?: number): Promise<Voucher[]> => {
  const url = total ? `/voucher?total=${total}` : "/voucher";
  const res = await instance.get(url);
  return res.data?.data || [];
};

/**
 * GET /voucher/admin/all - List all vouchers (admin)
 */
export const fetchAllVouchers = async (): Promise<Voucher[]> => {
  const res = await instance.get("/voucher/admin/all");
  return res.data?.data || [];
};

/**
 * GET /voucher/details/:id - Get voucher details
 */
export const getVoucherById = async (id: string | number): Promise<Voucher> => {
  const res = await instance.get(`/voucher/details/${id}`);
  return res.data?.data || res.data;
};

/**
 * POST /voucher - Create new voucher
 */
export const createVoucher = async (data: VoucherCreatePayload): Promise<Voucher> => {
  const res = await instance.post("/voucher", data);
  return res.data?.data || res.data;
};

/**
 * PUT /voucher/:id - Update voucher
 */
export const updateVoucher = async (
  id: string | number,
  data: Partial<VoucherCreatePayload>
): Promise<Voucher> => {
  const res = await instance.put(`/voucher/${id}`, data);
  return res.data?.data || res.data;
};

/**
 * PATCH /voucher/update-status/:id - Update voucher status
 */
export const updateVoucherStatus = async (
  id: string | number,
  status: "active" | "inactive" | "expired"
): Promise<Voucher> => {
  const res = await instance.patch(`/voucher/update-status/${id}`, { status });
  return res.data?.data || res.data;
};
