import * as model from "../models/booking_incidentsmodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

export const getIncidentsByRoom = async (req, res) => {
  try {
    const { room_id } = req.query;
    if (!room_id) {
      return res.error("Thiếu room_id", null, 400);
    }
    const incidents = await model.getIncidentsByRoom(Number(room_id));
    res.success(incidents, "Lấy sự cố theo phòng thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getAllIncidents = async (req, res) => {
  try {
    const incidents = await model.getAllIncidents();
    res.success(incidents, "Lấy tất cả sự cố thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getIncidentsByBooking = async (req, res) => {
  try {
    const { booking_id, showDeleted } = req.query;
    if (!booking_id) {
      return res.error("Thiếu booking_id", null, 400);
    }
    const incidents = await model.getIncidentsByBooking(
      Number(booking_id),
      showDeleted === "true"
    );
    res.success(incidents, "Lấy sự cố theo booking thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createIncident = async (req, res) => {
  try {
    const incident = await model.createIncident(req.body);
    res.success(incident, "Tạo sự cố thành công", 201);
  } catch (error) {
    console.error("Lỗi tạo sự cố thiết bị:", error, "\nPayload:", req.body);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleted_by, deleted_reason } = req.body;
    if (!id) {
      return res.error("Thiếu id", null, 400);
    }
    const incident = await model.deleteIncident(
      Number(id),
      deleted_by,
      deleted_reason
    );
    res.success(incident, "Xóa sự cố thành công");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id) return res.error("Thiếu id", null, 400);

    const result = await model.resolveIncident(Number(id), userId);
    res.success(result, "Đã xác nhận sửa xong thiết bị");
  } catch (error) {
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
