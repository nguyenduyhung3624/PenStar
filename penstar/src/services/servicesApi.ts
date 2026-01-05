import instance from "./api";

export interface Services {
  id: number;
  name: string;
  description: string;
  price: number;
  thumbnail?: string;
  thumbnail_hash?: string;
  created_at?: string;
  updated_at?: string;
}

// ✅ GET: Lấy danh sách dịch vụ
export const getServices = async (): Promise<Services[]> => {
  const response = await instance.get("/services");
  return response.data.data;
};

// ✅ GET: Lấy chi tiết dịch vụ theo ID
export const getServiceById = async (
  id: string | number
): Promise<Services> => {
  const response = await instance.get(`/services/${id}`);
  return response.data.data;
};

// ✅ POST: Tạo dịch vụ mới
export const createService = async (formData: FormData): Promise<Services> => {
  const response = await instance.post("/services", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data;
};

// ✅ PUT: Cập nhật dịch vụ
export const updateService = async (
  id: string | number,
  formData: FormData
): Promise<Services> => {
  const response = await instance.put(`/services/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data;
};

// ✅ DELETE: Xóa dịch vụ
export const deleteService = async (id: string | number): Promise<void> => {
  await instance.delete(`/services/${id}`);
};
