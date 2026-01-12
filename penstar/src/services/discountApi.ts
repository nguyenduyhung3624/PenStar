import instance from "./api";
import axios from "axios";
import type { DiscountCode } from "@/types/discount";
export const fetchDiscountCodes = async (): Promise<DiscountCode[]> => {
  const res = await instance.get("/discount-codes/list");
  return res.data?.data || res.data?.codes || [];
};
export const addDiscountCode = async (data: any) => {
  const res = await instance.post("/discount-codes/add", data);
  return res.data?.data || res.data;
};
export const deleteDiscountCode = async (id: number) => {
  const res = await instance.delete(`/discount-codes/delete/${id}`);
  return res.data?.data || res.data;
};
export const getDiscountCodeById = async (id: string | number) => {
  const res = await instance.get(`/discount-codes/id/${id}`);
  return res.data?.data || res.data?.code;
};
export const updateDiscountCode = async (id: string | number, data: any) => {
  const res = await instance.put(`/discount-codes/${id}`, data);
  return res.data?.data || res.data;
};
export const checkDiscountCode = async (code: string, total: number) => {
  try {
    const res = await instance.post("/discount-codes/check", { code, total });
    return { ok: true, ...(res.data?.data || res.data) };
  } catch (err: any) {
    return {
      ok: false,
      error:
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Mã không hợp lệ",
    };
  }
};
export const suggestDiscountCodes = async (total: number) => {
  try {
    const res = await instance.get("/discount-codes/suggest", {
      params: { total },
    });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return {
        ok: false,
        message: err.response?.data?.message || "Không thể tải gợi ý voucher.",
      };
    }
    return { ok: false, message: "Lỗi không xác định." };
  }
};

export const getAvailableVouchers = async () => {
  try {
    const res = await instance.get("/discount-codes/available");
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return {
        ok: false,
        message: err.response?.data?.message || "Không thể tải danh sách voucher.",
      };
    }
    return { ok: false, message: "Lỗi không xác định." };
  }
};
