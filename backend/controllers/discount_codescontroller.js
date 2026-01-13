import { DiscountCodesModel } from "../models/discount_codesmodel.js";
import {
  DISCOUNT_TYPE,
  DISCOUNT_STATUS,
  ERROR_MESSAGES,
} from "../utils/constants.js";
export const DiscountCodesController = {
  async checkCode(req, res) {
    try {
      const { code, total } = req.body;
      const userId = req.user?.id;
      if (!code) {
        return res.error(ERROR_MESSAGES.INVALID_INPUT, null, 400);
      }
      const found = await DiscountCodesModel.findByCode(code);
      if (!found) {
        return res.error(ERROR_MESSAGES.DISCOUNT_NOT_FOUND, null, 404);
      }
      if (found.status !== DISCOUNT_STATUS.ACTIVE) {
        return res.error(ERROR_MESSAGES.DISCOUNT_INVALID, null, 400);
      }
      const now = new Date();
      if (found.start_date && new Date(found.start_date) > now) {
        return res.error("Mã giảm giá chưa bắt đầu", null, 400);
      }
      if (found.end_date && new Date(found.end_date) < now) {
        return res.error(ERROR_MESSAGES.DISCOUNT_EXPIRED, null, 400);
      }
      if (found.min_total && total < found.min_total) {
        return res.error(
          `Đơn hàng tối thiểu ${found.min_total.toLocaleString("vi-VN")}đ`,
          null,
          400
        );
      }
      const totalUsage = await DiscountCodesModel.getTotalUsageCount(found.id);
      if (found.max_uses && totalUsage >= found.max_uses) {
        return res.error("Mã giảm giá đã hết lượt sử dụng", null, 400);
      }
      if (userId && found.max_uses_per_user) {
        const userUsage = await DiscountCodesModel.getUserUsageCount(
          found.id,
          userId
        );
        if (userUsage >= found.max_uses_per_user) {
          return res.error(
            `Bạn đã sử dụng hết ${found.max_uses_per_user} lượt cho mã này`,
            null,
            400
          );
        }
      }
      let discountAmount = 0;
      if (found.type === DISCOUNT_TYPE.PERCENT) {
        discountAmount = Math.round((found.value / 100) * total);
        if (found.max_discount_amount && found.max_discount_amount > 0) {
          discountAmount = Math.min(discountAmount, found.max_discount_amount);
        }
      } else if (found.type === DISCOUNT_TYPE.FIXED) {
        discountAmount = Math.min(found.value, total);
      }
      res.success({
        code: found,
        discountAmount,
        remainingUses: found.max_uses ? found.max_uses - totalUsage : null,
        userRemainingUses:
          userId && found.max_uses_per_user
            ? found.max_uses_per_user -
              (await DiscountCodesModel.getUserUsageCount(found.id, userId))
            : null,
      });
    } catch (err) {
      console.error("checkCode error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },
  async applyCode(req, res) {
    try {
      const { code, bookingId } = req.body;
      const userId = req.user?.id;
      if (!code) {
        return res.error("Mã giảm giá không được để trống", null, 400);
      }
      const found = await DiscountCodesModel.findByCode(code);
      if (!found) {
        return res.error(ERROR_MESSAGES.DISCOUNT_NOT_FOUND, null, 404);
      }
      if (userId) {
        await DiscountCodesModel.recordUsage(found.id, userId, bookingId);
      }
      res.success({ message: "Đã áp dụng mã giảm giá" });
    } catch (err) {
      console.error("applyCode error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },
  async create(req, res) {
    try {
      const code = await DiscountCodesModel.create(req.body);
      res.success(code, "Tạo mã giảm giá thành công", 201);
    } catch (err) {
      console.error("create error:", err);
      if (err.code === "23505") {
        res.error("Mã giảm giá đã tồn tại", null, 400);
      } else {
        res.error("Lỗi tạo mã giảm giá", err.message, 400);
      }
    }
  },
  async list(req, res) {
    try {
      const codes = await DiscountCodesModel.list();
      for (const code of codes) {
        code.total_usage = await DiscountCodesModel.getTotalUsageCount(code.id);
      }
      res.success(codes);
    } catch (err) {
      console.error("list error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },
  async suggestForBooking(req, res) {
    try {
      const { total } = req.query;
      const userId = req.user?.id;
      const now = new Date();
      let codes = await DiscountCodesModel.list();
      const validCodes = [];
      for (const code of codes) {
        if (code.status !== DISCOUNT_STATUS.ACTIVE) continue;
        if (code.start_date && new Date(code.start_date) > now) continue;
        if (code.end_date && new Date(code.end_date) < now) continue;
        if (code.min_total && total && Number(total) < code.min_total) continue;
        const totalUsage = await DiscountCodesModel.getTotalUsageCount(code.id);
        if (code.max_uses && totalUsage >= code.max_uses) continue;
        if (userId && code.max_uses_per_user) {
          const userUsage = await DiscountCodesModel.getUserUsageCount(
            code.id,
            userId
          );
          if (userUsage >= code.max_uses_per_user) continue;
        }
        let discountAmount = 0;
        if (total) {
          if (code.type === DISCOUNT_TYPE.PERCENT) {
            discountAmount = Math.round((code.value / 100) * Number(total));
            if (code.max_discount_amount && code.max_discount_amount > 0) {
              discountAmount = Math.min(
                discountAmount,
                code.max_discount_amount
              );
            }
          } else {
            discountAmount = Math.min(code.value, Number(total));
          }
        }
        validCodes.push({
          ...code,
          potential_discount: discountAmount,
          remaining_uses: code.max_uses ? code.max_uses - totalUsage : null,
        });
      }
      validCodes.sort((a, b) => b.potential_discount - a.potential_discount);
      res.success(validCodes);
    } catch (err) {
      console.error("suggestForBooking error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },
  async getAvailableVouchers(req, res) {
    try {
      const now = new Date();
      let codes = await DiscountCodesModel.list();
      const availableCodes = [];
      for (const code of codes) {
        if (code.status !== DISCOUNT_STATUS.ACTIVE) continue;
        if (code.start_date && new Date(code.start_date) > now) continue;
        if (code.end_date && new Date(code.end_date) < now) continue;

        const totalUsage = await DiscountCodesModel.getTotalUsageCount(code.id);
        if (code.max_uses && totalUsage >= code.max_uses) continue;

        availableCodes.push({
          ...code,
          remaining_uses: code.max_uses ? code.max_uses - totalUsage : null,
          total_usage: totalUsage,
        });
      }
      res.success(availableCodes);
    } catch (err) {
      console.error("getAvailableVouchers error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },
  async findById(req, res) {
    try {
      const { id } = req.params;
      const found = await DiscountCodesModel.findById(id);
      if (!found) {
        return res.error(ERROR_MESSAGES.DISCOUNT_NOT_FOUND, null, 404);
      }
      found.total_usage = await DiscountCodesModel.getTotalUsageCount(found.id);
      found.usage_history = await DiscountCodesModel.getUsageHistory(found.id);
      res.success(found);
    } catch (err) {
      console.error("findById error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },
  async updateById(req, res) {
    try {
      const { id } = req.params;
      console.log("[UPDATE DISCOUNT] id:", id);
      const updated = await DiscountCodesModel.updateById(id, req.body);
      if (!updated) {
        return res.error(ERROR_MESSAGES.DISCOUNT_NOT_FOUND, null, 404);
      }
      res.success(updated, "Cập nhật mã giảm giá thành công");
    } catch (err) {
      console.error("[UPDATE ERROR]", err);
      if (err.code === "23505") {
        res.error("Mã giảm giá đã tồn tại", null, 400);
      } else {
        res.error("Lỗi cập nhật mã", err.message, 400);
      }
    }
  },
  async deleteById(req, res) {
    try {
      const { id } = req.body;
      await DiscountCodesModel.deleteById(id);
      res.success(null, "Xóa mã giảm giá thành công");
    } catch (err) {
      console.error("deleteById error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },
  async getUsageHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await DiscountCodesModel.getUsageHistory(id);
      res.success(history);
    } catch (err) {
      console.error("getUsageHistory error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },
};
