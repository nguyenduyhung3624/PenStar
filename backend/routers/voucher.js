import express from "express";
import { DiscountCodesModel } from "../models/discount_codesmodel.js";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.js";
import {
  DISCOUNT_STATUS,
  ERROR_MESSAGES,
  DISCOUNT_TYPE,
} from "../utils/constants.js";
const router = express.Router();
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { total } = req.query;
    const userId = req.user?.id;
    const now = new Date();
    const allCodes = await DiscountCodesModel.list();
    const validVouchers = [];
    for (const code of allCodes) {
      if (code.status !== DISCOUNT_STATUS.ACTIVE) continue;
      if (code.start_date && new Date(code.start_date) > now) continue;
      if (code.end_date && new Date(code.end_date) < now) continue;
      const totalUsage = await DiscountCodesModel.getTotalUsageCount(code.id);
      if (code.max_uses && totalUsage >= code.max_uses) continue;
      if (userId && code.max_uses_per_user) {
        const userUsage = await DiscountCodesModel.getUserUsageCount(
          code.id,
          userId
        );
        if (userUsage >= code.max_uses_per_user) continue;
      }
      let potentialDiscount = 0;
      if (total) {
        if (code.type === DISCOUNT_TYPE.PERCENT) {
          potentialDiscount = Math.round((code.value / 100) * Number(total));
          if (code.max_discount_amount && code.max_discount_amount > 0) {
            potentialDiscount = Math.min(
              potentialDiscount,
              code.max_discount_amount
            );
          }
        } else {
          potentialDiscount = Math.min(code.value, Number(total));
        }
      }
      validVouchers.push({
        ...code,
        potential_discount: potentialDiscount,
        remaining_uses: code.max_uses ? code.max_uses - totalUsage : null,
      });
    }
    res.success(validVouchers);
  } catch (err) {
    console.error("List valid vouchers error:", err);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
});
router.get("/details/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await DiscountCodesModel.findById(id);
    if (!voucher) {
      return res.error("Không tìm thấy voucher", null, 404);
    }
    voucher.total_usage = await DiscountCodesModel.getTotalUsageCount(
      voucher.id
    );
    res.success(voucher);
  } catch (err) {
    console.error("Get voucher details error:", err);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
});
router.get(
  "/admin/all",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const vouchers = await DiscountCodesModel.list();
      for (const v of vouchers) {
        v.total_usage = await DiscountCodesModel.getTotalUsageCount(v.id);
      }
      res.success(vouchers);
    } catch (err) {
      console.error("List all vouchers error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  }
);
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const voucher = await DiscountCodesModel.create(req.body);
    res.success(voucher, "Tạo voucher thành công", 201);
  } catch (err) {
    console.error("Create voucher error:", err);
    if (err.code === "23505") {
      return res.error("Mã voucher đã tồn tại", null, 400);
    }
    res.error("Lỗi tạo voucher", err.message, 400);
  }
});
router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DiscountCodesModel.updateById(id, req.body);
    if (!updated) {
      return res.error("Không tìm thấy voucher", null, 404);
    }
    res.success(updated, "Cập nhật voucher thành công");
  } catch (err) {
    console.error("Update voucher error:", err);
    if (err.code === "23505") {
      return res.error("Mã voucher đã tồn tại", null, 400);
    }
    res.error("Lỗi cập nhật voucher", err.message, 400);
  }
});
router.patch(
  "/update-status/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.error("Trạng thái không được để trống", null, 400);
      }
      const validStatuses = ["active", "inactive", "expired"];
      if (!validStatuses.includes(status)) {
        return res.error(
          `Trạng thái phải là: ${validStatuses.join(", ")}`,
          null,
          400
        );
      }
      const voucher = await DiscountCodesModel.findById(id);
      if (!voucher) {
        return res.error("Không tìm thấy voucher", null, 404);
      }
      const updated = await DiscountCodesModel.updateById(id, {
        ...voucher,
        status,
      });
      res.success(
        updated,
        `Đã ${status === "active" ? "kích hoạt" : "vô hiệu hóa"} voucher`
      );
    } catch (err) {
      console.error("Update voucher status error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  }
);
export default router;
