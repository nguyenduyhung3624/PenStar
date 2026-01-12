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
  unit?: string;
}
export const getServices = async (): Promise<Services[]> => {
  const response = await instance.get("/services");
  return response.data.data;
};
export const getServiceById = async (
  id: string | number
): Promise<Services> => {
  const response = await instance.get(`/services/${id}`);
  return response.data.data;
};
export const createService = async (formData: FormData): Promise<Services> => {
  const response = await instance.post("/services", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
  return response.data.data;
};
export const updateService = async (
  id: string | number,
  formData: FormData
): Promise<Services> => {
  const response = await instance.put(`/services/${id}`, formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
  return response.data.data;
};
export const deleteService = async (id: string | number): Promise<void> => {
  await instance.delete(`/services/${id}`);
};
