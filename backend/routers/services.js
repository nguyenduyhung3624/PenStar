import express from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/servicescontroller.js";
import {
  validateServiceCreate,
  validateServiceUpdate,
} from "../middlewares/servicevalidate.js";
import multer from "multer";
import path from "path";
import fs from "fs";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), "uploads/services");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage: storage });
import { requireAuth, requireRole } from "../middlewares/auth.js";
const serviceRouter = express.Router();
serviceRouter.get("/", getServices);
serviceRouter.get("/check-name", async (req, res) => {
  try {
    const { name, excludeId } = req.query;
    if (!name)
      return res.status(400).json({ success: false, message: "name required" });
    const { existsServiceWithName } = await import(
      "../models/servicesmodel.js"
    );
    const exists = await existsServiceWithName(
      String(name),
      excludeId ? Number(excludeId) : null
    );
    return res.json({ success: true, exists });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
serviceRouter.get("/:id", getServiceById);
serviceRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnail_file", maxCount: 1 },
  ]),
  validateServiceCreate,
  createService
);
serviceRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnail_file", maxCount: 1 },
  ]),
  validateServiceUpdate,
  updateService
);
serviceRouter.delete("/:id", requireAuth, requireRole("admin"), deleteService);
export default serviceRouter;
