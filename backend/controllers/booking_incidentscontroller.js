export const getIncidentsByRoom = async (req, res) => {
  try {
    const { room_id } = req.query;
    if (!room_id)
      return res
        .status(400)
        .json({ success: false, message: "Missing room_id" });
    const incidents = await model.getIncidentsByRoom(Number(room_id));
    res.json({ success: true, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
import * as model from "../models/booking_incidentsmodel.js";

export const getIncidentsByBooking = async (req, res) => {
  try {
    const { booking_id, showDeleted } = req.query;
    if (!booking_id)
      return res
        .status(400)
        .json({ success: false, message: "Missing booking_id" });
    const incidents = await model.getIncidentsByBooking(
      Number(booking_id),
      showDeleted === "true"
    );
    res.json({ success: true, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createIncident = async (req, res) => {
  try {
    const incident = await model.createIncident(req.body);
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    console.error("Lỗi tạo sự cố thiết bị:", error, "\nPayload:", req.body);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleted_by, deleted_reason } = req.body;
    if (!id)
      return res.status(400).json({ success: false, message: "Missing id" });
    const incident = await model.deleteIncident(
      Number(id),
      deleted_by,
      deleted_reason
    );
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
