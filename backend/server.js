import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Khởi tạo kết nối database (Supabase/PostgreSQL)
import "./db.js";

// Load environment variables FIRST
dotenv.config();

// Set timezone for Node.js process - MUST be before any date operations
process.env.TZ = "Asia/Ho_Chi_Minh";

// Middleware
import { responseHandler } from "./middlewares/responeseHandler.js";

// Routers
import bookingsRouter from "./routers/bookings.js";
import bookingBillLogsRouter from "./routers/booking_bill_logs.js";
import bookingIncidentsRouter from "./routers/booking_incidents.js";
import bookingItemsRouter from "./routers/booking_items.js";
import bookingServicesRouter from "./routers/booking_services.js";
import discountCodesRouter from "./routers/discount_codes.js";
import equipmentStockLogsRouter from "./routers/equipment_stock_logs.js";
import floorsRouter from "./routers/floors.js";
import masterEquipmentsRouter from "./routers/master_equipments.js";
import paymentRouter from "./routers/payment.js";
import rolesRouter from "./routers/roles.js";
import roomDevicesRouter from "./routers/roomdevices.js";
import roomsRouter from "./routers/rooms.js";
import roomTypesRouter from "./routers/roomstype.js";
import roomTypeImagesRouter from "./routers/roomtypeimages.js";
import roomTypeEquipmentsRouter from "./routers/room_type_equipments.js";
import servicesRouter from "./routers/services.js";
import statisticsRouter from "./routers/statistics.js";
import stayStatusRouter from "./routers/stay_status.js";
import usersRouter from "./routers/users.js";
import voucherRouter from "./routers/voucher.js";
import refundRequestsRouter from "./routers/refund_requests.js";

// Constants
import { ERROR_MESSAGES } from "./utils/constants.js";
import { corsOptions } from "./utils/cors.js";

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Response handler (res.success, res.error)
app.use(responseHandler);

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request logging (development)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// API ROUTES
// ============================================================================

// Auth & Users
app.use("/api/users", usersRouter);

// Bookings
app.use("/api/bookings", bookingsRouter);
app.use("/api/booking-bill-logs", bookingBillLogsRouter);
app.use("/api/booking-incidents", bookingIncidentsRouter);
app.use("/api/booking-items", bookingItemsRouter);
app.use("/api/booking-services", bookingServicesRouter);

// Rooms & Room Types
app.use("/api/rooms", roomsRouter);
app.use("/api/roomtypes", roomTypesRouter);
app.use("/api/room-type-images", roomTypeImagesRouter);
app.use("/api/room-type-equipments", roomTypeEquipmentsRouter);

// Floors
app.use("/api/floors", floorsRouter);

// Services
app.use("/api/services", servicesRouter);

// Equipments & Devices
app.use("/api/master-equipments", masterEquipmentsRouter);
app.use("/api/room-devices", roomDevicesRouter);
app.use("/api/equipment-stock-logs", equipmentStockLogsRouter);

// Discount Codes & Vouchers
app.use("/api/discount-codes", discountCodesRouter);
app.use("/api/voucher", voucherRouter);

// Payment
app.use("/api/payment", paymentRouter);

// Roles & Stay Status
app.use("/api/roles", rolesRouter);
app.use("/api/stay-status", stayStatusRouter);

// Statistics
app.use("/api/statistics", statisticsRouter);

// Refund Requests
app.use("/api/refund-requests", refundRequestsRouter);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/api/health", (req, res) => {
  res.success(
    { status: "ok", timestamp: new Date().toISOString() },
    "Server is running",
  );
});

// API debug timezone - để kiểm tra thời gian server
app.get("/api/server-time", (req, res) => {
  const now = new Date();
  res.success(
    {
      isoString: now.toISOString(),
      localString: now.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tzEnv: process.env.TZ || "not set",
      timestamp: now.getTime(),
      utcOffset: now.getTimezoneOffset(),
    },
    "Server time info",
  );
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.error(`Route not found: ${req.method} ${req.path}`, null, 404);
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err, req, res, next) => {
  console.error("[UNHANDLED ERROR]", err);
  res.error(
    err.message || ERROR_MESSAGES.INTERNAL_ERROR,
    process.env.NODE_ENV !== "production" ? err.stack : null,
    err.statusCode || 500,
  );
});

// ============================================================================
// START SERVER
// ============================================================================

// Start Cron Jobs
import checkNoShow from "./cron/checkNoShow.js";
checkNoShow();

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    🏨 PENSTAR HOTEL API                    ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                  ║
║  Environment: ${(process.env.NODE_ENV || "development").padEnd(42)}║
║  Started at: ${new Date().toLocaleString().padEnd(43)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
