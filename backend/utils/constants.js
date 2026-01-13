export const STAY_STATUS = {
  PENDING: 0,
  RESERVED: 1,
  CHECKED_IN: 2,
  CHECKED_OUT: 3,
  CANCELLED: 4,
  NO_SHOW: 5,
  PAYMENT_PENDING: 6,
};
export const STAY_STATUS_NAMES = {
  [STAY_STATUS.PENDING]: "Chờ xác nhận",
  [STAY_STATUS.RESERVED]: "Đã đặt",
  [STAY_STATUS.CHECKED_IN]: "Đang ở",
  [STAY_STATUS.CHECKED_OUT]: "Đã trả phòng",
  [STAY_STATUS.CANCELLED]: "Đã hủy",
  [STAY_STATUS.NO_SHOW]: "Không có mặt",
  [STAY_STATUS.PAYMENT_PENDING]: "Chờ thanh toán",
};
export const ACTIVE_STAY_STATUS = [
  STAY_STATUS.RESERVED,
  STAY_STATUS.CHECKED_IN,
  STAY_STATUS.PAYMENT_PENDING,
];
export const ROOM_STATUS = {
  AVAILABLE: "available",
  BOOKED: "booked",
  OCCUPIED: "occupied",
  PENDING: "pending",
  CLEANING: "cleaning",
  MAINTENANCE: "maintenance",
  CHECKOUT: "checkout",
};
export const DEVICE_STATUS = {
  WORKING: "working",
  BROKEN: "broken",
  MAINTENANCE: "maintenance",
};
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  REFUNDED: "refunded",
  PARTIAL: "partial",
};
export const ROLE_ID = {
  CUSTOMER: 1,
  STAFF: 2,
  MANAGER: 3,
  ADMIN: 4,
};
export const ROLE_NAME = {
  CUSTOMER: "customer",
  STAFF: "staff",
  MANAGER: "manager",
  ADMIN: "admin",
};
export const CAPACITY = {
  MAX_GUESTS_DEFAULT: 4,
  MAX_ADULTS: 3,
  MAX_CHILDREN: 2,
  CHILD_AGE_LIMIT: 8,
};
export const BOOKING = {
  MAX_ROOM_CHANGES: 1,
  CHECKIN_HOUR: 14,
  CHECKOUT_HOUR: 14,
  TIMEZONE: "Asia/Ho_Chi_Minh",
  MAX_NIGHTS: 30, 
  MIN_NIGHTS: 1,
  MAX_ADVANCE_DAYS: 365, 
};
export const DISCOUNT_TYPE = {
  PERCENT: "percent",
  FIXED: "fixed",
};
export const DISCOUNT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  EXPIRED: "expired",
};
export const STOCK_LOG_TYPE = {
  IMPORT: "import",
  EXPORT: "export",
  TRANSFER: "transfer",
  DEVICE: "device",
};
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};
export const EMAIL_TEMPLATE = {
  BOOKING_CONFIRMATION: "booking_confirmation",
  BOOKING_CANCELLED: "booking_cancelled",
  PAYMENT_REMINDER: "payment_reminder",
  DEVICE_DAMAGE: "device_damage",
};
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Vui lòng đăng nhập",
  FORBIDDEN: "Bạn không có quyền truy cập",
  INVALID_TOKEN: "Token không hợp lệ",
  BOOKING_NOT_FOUND: "Booking không tồn tại",
  BOOKING_BELONGS_TO_OTHER: "Bạn không có quyền cập nhật booking này",
  ROOM_NOT_FOUND: "Phòng không tồn tại",
  ROOM_NOT_AVAILABLE: "Phòng không khả dụng",
  ROOM_ALREADY_BOOKED: "Phòng đã được đặt trong khoảng thời gian này",
  INVALID_CHECKIN_DATE: "Ngày check-in không hợp lệ",
  INVALID_CHECKOUT_DATE: "Ngày check-out không hợp lệ",
  GUEST_EXCEEDS_CAPACITY: "Số khách vượt quá sức chứa của phòng",
  PAYMENT_ALREADY_PAID: "Booking đã được thanh toán",
  PAYMENT_FAILED: "Thanh toán thất bại",
  DISCOUNT_NOT_FOUND: "Mã giảm giá không tồn tại",
  DISCOUNT_EXPIRED: "Mã giảm giá đã hết hạn",
  DISCOUNT_INVALID: "Mã giảm giá không hợp lệ",
  DEVICE_NOT_FOUND: "Thiết bị không tồn tại",
  DEVICE_INSUFFICIENT_STOCK: "Không đủ số lượng thiết bị",
  INTERNAL_ERROR: "Lỗi hệ thống, vui lòng thử lại sau",
  INVALID_INPUT: "Dữ liệu đầu vào không hợp lệ",
  MISSING_REQUIRED_FIELD: "Thiếu thông tin bắt buộc",
};
export const SUCCESS_MESSAGES = {
  BOOKING_CREATED: "Tạo booking thành công",
  BOOKING_UPDATED: "Cập nhật booking thành công",
  BOOKING_CANCELLED: "Hủy booking thành công",
  CHECKIN_SUCCESS: "Check-in thành công",
  CHECKOUT_SUCCESS: "Check-out thành công",
  PAYMENT_RECEIVED: "Nhận thanh toán thành công",
  REFUND_PROCESSED: "Hoàn tiền thành công",
  ROOM_CREATED: "Tạo phòng thành công",
  ROOM_UPDATED: "Cập nhật phòng thành công",
  ROOM_DELETED: "Xóa phòng thành công",
  DISCOUNT_CREATED: "Tạo mã giảm giá thành công",
  DISCOUNT_UPDATED: "Cập nhật mã giảm giá thành công",
  DISCOUNT_DELETED: "Xóa mã giảm giá thành công",
};
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^(\+84|0)\d{9,10}$/,
  ROOM_NAME_PATTERN: /^[A-Za-z0-9\-\.]+$/,
};
export const RATE_LIMIT = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW: 15 * 60 * 1000,
  API_CALLS_PER_MINUTE: 100,
  API_CALLS_PER_HOUR: 5000,
};
export const DB_CONFIG = {
  POOL_MIN: 2,
  POOL_MAX: 10,
  IDLE_TIMEOUT: 30000,
  CONNECTION_TIMEOUT: 5000,
};
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  UPLOAD_DIR: "uploads",
};
export const CACHE = {
  ROOM_TYPES_TTL: 3600,
  SERVICES_TTL: 3600,
  DISCOUNT_CODES_TTL: 1800,
  USER_PROFILE_TTL: 1800,
};
export const LOG_LEVEL = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};
export const getStatusName = (statusId) => {
  return STAY_STATUS_NAMES[statusId] || "Không xác định";
};
export const isActiveBooking = (stayStatusId) => {
  return ACTIVE_STAY_STATUS.includes(stayStatusId);
};
export const getRoleName = (roleId) => {
  const roleNames = {
    [ROLE_ID.CUSTOMER]: ROLE_NAME.CUSTOMER,
    [ROLE_ID.STAFF]: ROLE_NAME.STAFF,
    [ROLE_ID.MANAGER]: ROLE_NAME.MANAGER,
    [ROLE_ID.ADMIN]: ROLE_NAME.ADMIN,
  };
  return roleNames[roleId] || "unknown";
};
export const hasPermission = (userRoleId, requiredRoleId) => {
  return userRoleId >= requiredRoleId;
};
export const getRoomStatusDescription = (status) => {
  const descriptions = {
    [ROOM_STATUS.AVAILABLE]: "Phòng trống, có thể đặt",
    [ROOM_STATUS.BOOKED]: "Đã được đặt",
    [ROOM_STATUS.OCCUPIED]: "Khách đang ở",
    [ROOM_STATUS.PENDING]: "Chờ xác nhận",
    [ROOM_STATUS.CLEANING]: "Đang dọn dẹp",
    [ROOM_STATUS.MAINTENANCE]: "Bảo trì",
    [ROOM_STATUS.CHECKOUT]: "Chờ xác nhận checkout",
  };
  return descriptions[status] || status;
};
export const getDeviceStatusDescription = (status) => {
  const descriptions = {
    [DEVICE_STATUS.WORKING]: "Hoạt động bình thường",
    [DEVICE_STATUS.BROKEN]: "Hỏng",
    [DEVICE_STATUS.MAINTENANCE]: "Bảo trì",
  };
  return descriptions[status] || status;
};
export default {
  STAY_STATUS,
  STAY_STATUS_NAMES,
  ACTIVE_STAY_STATUS,
  ROOM_STATUS,
  DEVICE_STATUS,
  PAYMENT_STATUS,
  ROLE_ID,
  ROLE_NAME,
  CAPACITY,
  BOOKING,
  DISCOUNT_TYPE,
  DISCOUNT_STATUS,
  STOCK_LOG_TYPE,
  PAGINATION,
  EMAIL_TEMPLATE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION,
  RATE_LIMIT,
  DB_CONFIG,
  FILE_UPLOAD,
  CACHE,
  LOG_LEVEL,
  getStatusName,
  isActiveBooking,
  getRoleName,
  hasPermission,
  getRoomStatusDescription,
  getDeviceStatusDescription,
};
