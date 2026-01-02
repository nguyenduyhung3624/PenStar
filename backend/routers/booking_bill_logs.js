import express from "express";
import { createBillLog } from "../controllers/bookingBillLogsController.js";

const router = express.Router();

router.post("/", createBillLog);

export default router;
