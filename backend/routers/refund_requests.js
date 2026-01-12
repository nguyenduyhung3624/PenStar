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
router.post("/", requireAuth, createRequest);
router.get("/my", requireAuth, getMyRequests);
router.get("/", requireAuth, requireRole("staff"), getAllRequests);
router.get("/stats", requireAuth, requireRole("staff"), getStats);
router.get("/:id", requireAuth, getRequestById);
router.patch("/:id", requireAuth, requireRole("staff"), updateRequestStatus);
router.post(
  "/:id/upload-receipt",
  requireAuth,
  requireRole("staff"),
  uploadMiddleware.single("receipt"),
  uploadReceipt
);
export default router;
