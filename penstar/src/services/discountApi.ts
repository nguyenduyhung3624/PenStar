/* eslint-disable @typescript-eslint/no-explicit-any */
import instance from "./api";
import type { DiscountCode } from "@/types/discount";

export const fetchDiscountCodes = async (): Promise<DiscountCode[]> => {
  const res = await instance.get("/discount-codes/list");
  return res.data.codes || [];
};

export const addDiscountCode = async (data: any) => {
  const res = await instance.post("/discount-codes/add", data);
  return res.data;
};
export const deleteDiscountCode = async (id: number) => {
  const res = await instance.delete(`/discount-codes/delete/${id}`);
  return res.data;
};

export const getDiscountCodeById = async (id: string | number) => {
  const res = await instance.get(`/discount-codes/id/${id}`);
  return res.data.code;
};

export const updateDiscountCode = async (id: string | number, data: any) => {
  const res = await instance.put(`/discount-codes/${id}`, data);
  return res.data;
};
export const checkDiscountCode = async (code: string, total: number) => {
  const res = await instance.post("/discount-codes/check", { code, total });
  return res.data;
};
export const suggestDiscountCodes = async (total: number) => {
  const res = await instance.get(`/discount-codes/suggest?total=${total}`);
  return res.data;
};
