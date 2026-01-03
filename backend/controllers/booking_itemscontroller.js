import {
  getBookingItems as modelGetBookingItems,
  getBookingItemById as modelGetBookingItemById,
  createBookingItem as modelCreateBookingItem,
  deleteBookingItem as modelDeleteBookingItem,
} from "../models/booking_itemsmodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

export const getBookingItems = async (req, res) => {
  try {
    const data = await modelGetBookingItems();
    res.success(data, "Lấy danh sách booking items thành công");
  } catch (error) {
    console.error("booking_items.getBookingItems error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getBookingItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetBookingItemById(id);
    if (!item) {
      return res.error("Không tìm thấy booking item", null, 404);
    }
    res.success(item, "Lấy booking item thành công");
  } catch (error) {
    console.error("booking_items.getBookingItemById error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createBookingItem = async (req, res) => {
  try {
    const payload = req.body;
    const item = await modelCreateBookingItem(payload);
    res.success(item, "Tạo booking item thành công", 201);
  } catch (error) {
    console.error("booking_items.createBookingItem error:", error);
    if (error && error.code === "23503") {
      return res.error("Foreign key constraint failed", error.message, 400);
    }
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const deleteBookingItem = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await modelDeleteBookingItem(id);
    if (!deleted) {
      return res.error("Không tìm thấy booking item", null, 404);
    }
    res.success(deleted, "Xóa booking item thành công");
  } catch (error) {
    console.error("booking_items.deleteBookingItem error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
