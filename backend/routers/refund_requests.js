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
router.get("/", requireAuth, requireRole("admin"), getAllRequests);
router.get("/stats", requireAuth, requireRole("admin"), getStats);
router.get("/:id", requireAuth, getRequestById);
router.patch("/:id", requireAuth, requireRole("admin"), updateRequestStatus);
router.post(
  "/:id/upload-receipt",
  requireAuth,
  requireRole("admin"),
  uploadMiddleware.single("receipt"),
  uploadReceipt
);
export default router;
