import {
  getBookingServices as modelGetBookingServices,
  getBookingServiceById as modelGetBookingServiceById,
  createBookingService as modelCreateBookingService,
  getServicesByBookingItem as modelGetServicesByBookingItem,
  getServicesByBooking as modelGetServicesByBooking,
} from "../models/booking_servicesmodel.js";
import { createBookingServiceLog } from "../models/booking_service_logsmodel.js";
import pool from "../db.js";
import { ERROR_MESSAGES, STAY_STATUS } from "../utils/constants.js";

export const getBookingServices = async (req, res) => {
  try {
    const data = await modelGetBookingServices();
    res.success(data, "Lấy danh sách dịch vụ booking thành công");
  } catch (error) {
    console.error("booking_services.getBookingServices error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getBookingServiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetBookingServiceById(id);
    if (!item) {
      return res.error("Không tìm thấy dịch vụ booking", null, 404);
    }
    res.success(item, "Lấy dịch vụ booking thành công");
  } catch (error) {
    console.error("booking_services.getBookingServiceById error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createBookingService = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      booking_id,
      booking_item_id,
      service_id,
      quantity = 1,
      note,
    } = req.body;
    const userId = req.user?.id || req.body.created_by; // Ưu tiên lấy từ token, fallback từ body

    // Validate required fields
    if (!booking_id || !service_id) {
      return res.error("Thiếu booking_id hoặc service_id", null, 400);
    }

    // Validate trạng thái booking
    const bookingRes = await client.query(
      "SELECT stay_status_id FROM bookings WHERE id = $1",
      [booking_id]
    );
    if (!bookingRes.rows[0]) {
      return res.error("Booking không tồn tại", null, 404);
    }
    const stayStatus = Number(bookingRes.rows[0].stay_status_id);
    if (stayStatus !== STAY_STATUS.CHECKED_IN) {
      return res.error(
        "Chỉ có thể thêm dịch vụ khi booking đã check-in!",
        null,
        400
      );
    }

    // Get service price
    const serviceRes = await client.query(
      "SELECT price FROM services WHERE id = $1",
      [service_id]
    );
    if (serviceRes.rows.length === 0) {
      return res.error("Dịch vụ không tồn tại", null, 404);
    }
    const servicePrice = serviceRes.rows[0].price;
    const total_service_price = servicePrice * quantity;

    // Create booking service (có created_by, note)
    const item = await modelCreateBookingService({
      booking_id,
      booking_item_id: booking_item_id || null,
      service_id,
      quantity,
      total_service_price,
      created_by: userId,
      note,
    });

    // Update booking total_price
    await client.query(
      "UPDATE bookings SET total_price = total_price + $1 WHERE id = $2",
      [total_service_price, booking_id]
    );

    // Ghi log
    await createBookingServiceLog({
      booking_service_id: item.id,
      action: "add",
      action_by: userId,
      note,
    });

    await client.query("COMMIT");

    res.success(item, "Thêm dịch vụ thành công", 201);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("booking_services.createBookingService error:", error);
    if (error && error.code === "23503") {
      return res.error("Foreign key constraint failed", error.message, 400);
    }
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  } finally {
    client.release();
  }
};

// Get services by booking_item_id
export const getServicesByBookingItem = async (req, res) => {
  try {
    const { booking_item_id } = req.params;
    const data = await modelGetServicesByBookingItem(booking_item_id);
    res.success(data, "Lấy dịch vụ theo booking item thành công");
  } catch (error) {
    console.error("booking_services.getServicesByBookingItem error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// Get services by booking_id
export const getServicesByBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const data = await modelGetServicesByBooking(booking_id);
    res.success(data, "Lấy dịch vụ theo booking thành công");
  } catch (error) {
    console.error("booking_services.getServicesByBooking error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
