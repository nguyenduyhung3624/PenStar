/* eslint-disable @typescript-eslint/no-explicit-any */
import { instance } from "./api";

export const getIncidentsByRoom = async (room_id: number) => {
  try {
    const res = await instance.get("/booking-incidents/room", {
      params: { room_id },
    });
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Error fetching incidents by room:", error);
    return [];
  }
};

export const getBookingIncidents = async (
  booking_id: number,
  showDeleted: boolean = false
) => {
  try {
    const res = await instance.get("/booking-incidents", {
      params: { booking_id, showDeleted },
    });
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Error fetching booking incidents:", error);
    return [];
  }
};

export const createBookingIncident = async (data: any) => {
  try {
    const res = await instance.post("/booking-incidents", data);
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error creating booking incident:", error);
    throw error;
  }
};

export const deleteBookingIncident = async (
  id: number,
  deleted_by?: number,
  deleted_reason?: string
) => {
  try {
    const res = await instance.delete(`/booking-incidents/${id}`, {
      data: { deleted_by, deleted_reason },
    });
    return res.data?.data ?? null;
  } catch (error) {
    console.error("Error deleting booking incident:", error);
    throw error;
  }
};
