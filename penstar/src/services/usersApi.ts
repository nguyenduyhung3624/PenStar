import { instance } from "./api";
import type { RegisterPayload } from "@/types/users";
export const register = async (payload: RegisterPayload) => {
  const response = await instance.post(`/users/register`, payload);
  return response.data?.data?.user || response.data?.user;
};
export const login = async (email: string, password: string) => {
  const response = await instance.post(`/users/login`, { email, password });
  console.debug("[usersApi] login response:", response);
  const token = response.data?.data?.token || response.data?.token;
  if (!token) {
    console.error("[usersApi] login: No token in response", response.data);
  }
  return token;
};
export const getUsers = async () => {
  const response = await instance.get(`/users`);
  return response.data?.data || response.data;
};
export const updateUser = async (
  id: number | string,
  payload: Record<string, unknown>
) => {
  const response = await instance.put(`/users/${id}`, payload);
  return response.data?.data || response.data;
};
export const getCurrentUser = async () => {
  const response = await instance.get(`/users/me`);
  return response.data?.data?.user || response.data?.user;
};
