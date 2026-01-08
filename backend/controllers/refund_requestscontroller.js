import { RefundRequestsModel } from "../models/refund_requestsmodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";
import { sendRefundNotificationEmail } from "../utils/mailer.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/refund-receipts");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép upload ảnh (jpeg, jpg, png, gif, webp)"));
    }
  },
});

/**
 * Create refund request - User
 */
export const createRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.error("Unauthorized", null, 401);
    }

    const {
      booking_id,
      booking_item_id,
      amount,
      bank_name,
      account_number,
      account_holder,
    } = req.body;

    // Validate required fields
    if (!amount || !bank_name || !account_number || !account_holder) {
      return res.error(
        "Vui lòng điền đầy đủ thông tin ngân hàng và số tiền hoàn",
        null,
        400
      );
    }

    if (!booking_id && !booking_item_id) {
      return res.error(
        "Vui lòng chọn đơn hàng hoặc phòng cần hoàn tiền",
        null,
        400
      );
    }

    // Check if request already exists
    if (booking_id && !booking_item_id) {
      const exists = await RefundRequestsModel.existsForBooking(booking_id);
      if (exists) {
        return res.error("Đã có yêu cầu hoàn tiền cho đơn hàng này", null, 400);
      }
    }

    if (booking_item_id) {
      const exists = await RefundRequestsModel.existsForBookingItem(
        booking_item_id
      );
      if (exists) {
        return res.error("Đã có yêu cầu hoàn tiền cho phòng này", null, 400);
      }
    }

    const request = await RefundRequestsModel.create({
      booking_id,
      booking_item_id,
      user_id: userId,
      amount,
      bank_name,
      account_number,
      account_holder,
    });

    res.success(request, "Đã gửi yêu cầu hoàn tiền thành công", 201);
  } catch (error) {
    console.error("createRequest error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Get my refund requests - User
 */
export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.error("Unauthorized", null, 401);
    }

    const requests = await RefundRequestsModel.findByUserId(userId);
    res.success(requests);
  } catch (error) {
    console.error("getMyRequests error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Get all refund requests - Admin
 */
export const getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await RefundRequestsModel.list(status || null);
    res.success(requests);
  } catch (error) {
    console.error("getAllRequests error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Get refund request detail
 */
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await RefundRequestsModel.findById(id);

    if (!request) {
      return res.error("Không tìm thấy yêu cầu hoàn tiền", null, 404);
    }

    res.success(request);
  } catch (error) {
    console.error("getRequestById error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Update refund request status - Admin
 */
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const adminId = req.user?.id;

    if (!status) {
      return res.error("Vui lòng chọn trạng thái", null, 400);
    }

    const validStatuses = ["pending", "approved", "completed", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.error(
        `Trạng thái phải là: ${validStatuses.join(", ")}`,
        null,
        400
      );
    }

    const updated = await RefundRequestsModel.updateStatus(id, {
      status,
      admin_notes,
      processed_by: adminId,
    });

    if (!updated) {
      return res.error("Không tìm thấy yêu cầu hoàn tiền", null, 404);
    }

    // Send email notification for status changes (approved, rejected)
    if (["approved", "rejected"].includes(status)) {
      const userEmail = updated.user_email;
      if (userEmail) {
        sendRefundNotificationEmail(userEmail, updated);
      }
    }

    res.success(updated, `Đã cập nhật trạng thái thành ${status}`);
  } catch (error) {
    console.error("updateRequestStatus error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Upload transfer receipt - Admin
 */
export const uploadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!req.file) {
      return res.error("Vui lòng upload ảnh bill chuyển khoản", null, 400);
    }

    const receiptUrl = `/uploads/refund-receipts/${req.file.filename}`;

    const updated = await RefundRequestsModel.updateStatus(id, {
      status: "completed",
      receipt_image: receiptUrl,
      processed_by: adminId,
    });

    if (!updated) {
      return res.error("Không tìm thấy yêu cầu hoàn tiền", null, 404);
    }

    // Send email notification with receipt
    const userEmail = updated.user_email;
    if (userEmail) {
      sendRefundNotificationEmail(userEmail, updated);
    }

    res.success(updated, "Đã upload bill và hoàn tất yêu cầu hoàn tiền");
  } catch (error) {
    console.error("uploadReceipt error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

/**
 * Get refund statistics - Admin
 */
export const getStats = async (req, res) => {
  try {
    const stats = await RefundRequestsModel.getStats();
    res.success(stats);
  } catch (error) {
    console.error("getStats error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
