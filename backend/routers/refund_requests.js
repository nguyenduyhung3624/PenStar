import express from "express";
import {
  createRequest,
  getMyRequests,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  uploadReceipt,
  getStats,
  uploadMiddleware,
} from "../controllers/refund_requestscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// =============================================
// USER ROUTES
// =============================================

/**
 * POST /api/refund-requests
 * Create a refund request (user)
 */
router.post("/", requireAuth, createRequest);

/**
 * GET /api/refund-requests/my
 * Get my refund requests (user)
 */
router.get("/my", requireAuth, getMyRequests);

// =============================================
// ADMIN ROUTES
// =============================================

/**
 * GET /api/refund-requests
 * Get all refund requests (admin)
 */
router.get("/", requireAuth, requireRole("staff"), getAllRequests);

/**
 * GET /api/refund-requests/stats
 * Get refund statistics (admin)
 */
router.get("/stats", requireAuth, requireRole("staff"), getStats);

/**
 * GET /api/refund-requests/:id
 * Get refund request detail
 */
router.get("/:id", requireAuth, getRequestById);

/**
 * PATCH /api/refund-requests/:id
 * Update refund request status (admin)
 */
router.patch("/:id", requireAuth, requireRole("staff"), updateRequestStatus);

/**
 * POST /api/refund-requests/:id/upload-receipt
 * Upload transfer receipt (admin)
 */
router.post(
  "/:id/upload-receipt",
  requireAuth,
  requireRole("staff"),
  uploadMiddleware.single("receipt"),
  uploadReceipt
);

export default router;
