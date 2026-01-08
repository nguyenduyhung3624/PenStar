import { DiscountCodesModel } from "../models/discount_codesmodel.js";
import {
  DISCOUNT_TYPE,
  DISCOUNT_STATUS,
  ERROR_MESSAGES,
} from "../utils/constants.js";

export const DiscountCodesController = {
  /**
   * Check discount code validity and calculate discount amount
   * Enhanced with: max_discount_amount, usage tracking
   */
  async checkCode(req, res) {
    try {
      const { code, total } = req.body;
      const userId = req.user?.id; // From optionalAuth middleware

      if (!code) {
        return res.error(ERROR_MESSAGES.INVALID_INPUT, null, 400);
      }

      // Find the discount code
      const found = await DiscountCodesModel.findByCode(code);
      if (!found) {
        return res.error(ERROR_MESSAGES.DISCOUNT_NOT_FOUND, null, 404);
      }

      // Check status
      if (found.status !== DISCOUNT_STATUS.ACTIVE) {
        return res.error(ERROR_MESSAGES.DISCOUNT_INVALID, null, 400);
      }

      // Check date range
      const now = new Date();
      if (found.start_date && new Date(found.start_date) > now) {
        return res.error("Mã giảm giá chưa bắt đầu", null, 400);
      }

      if (found.end_date && new Date(found.end_date) < now) {
        return res.error(ERROR_MESSAGES.DISCOUNT_EXPIRED, null, 400);
      }

      // Check minimum order total
      if (found.min_total && total < found.min_total) {
        return res.error(
          `Đơn hàng tối thiểu ${found.min_total.toLocaleString("vi-VN")}đ`,
          null,
          400
        );
      }

      // Check max_uses (total usage limit)
      const totalUsage = await DiscountCodesModel.getTotalUsageCount(found.id);
      if (found.max_uses && totalUsage >= found.max_uses) {
        return res.error("Mã giảm giá đã hết lượt sử dụng", null, 400);
      }

      // Check max_uses_per_user
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

      // Calculate discount amount
      let discountAmount = 0;
      if (found.type === DISCOUNT_TYPE.PERCENT) {
        discountAmount = Math.round((found.value / 100) * total);
        // Apply max_discount_amount cap for percentage discounts
        if (found.max_discount_amount && found.max_discount_amount > 0) {
          discountAmount = Math.min(discountAmount, found.max_discount_amount);
        }
      } else if (found.type === DISCOUNT_TYPE.FIXED) {
        discountAmount = Math.min(found.value, total);
      }

      // Return success with discount info
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

  /**
   * Apply/record usage of a discount code (called when booking is confirmed)
   */
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

      // Record usage
      if (userId) {
        await DiscountCodesModel.recordUsage(found.id, userId, bookingId);
      }

      res.success({ message: "Đã áp dụng mã giảm giá" });
    } catch (err) {
      console.error("applyCode error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },

  /**
   * Create a new discount code
   */
  async create(req, res) {
    try {
      const code = await DiscountCodesModel.create(req.body);
      res.success(code, "Tạo mã giảm giá thành công", 201);
    } catch (err) {
      console.error("create error:", err);
      if (err.code === "23505") {
        // Unique violation
        res.error("Mã giảm giá đã tồn tại", null, 400);
      } else {
        res.error("Lỗi tạo mã giảm giá", err.message, 400);
      }
    }
  },

  /**
   * List all discount codes
   */
  async list(req, res) {
    try {
      const codes = await DiscountCodesModel.list();

      // Add usage stats to each code
      for (const code of codes) {
        code.total_usage = await DiscountCodesModel.getTotalUsageCount(code.id);
      }

      res.success(codes);
    } catch (err) {
      console.error("list error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },

  /**
   * Suggest valid discount codes for a booking
   */
  async suggestForBooking(req, res) {
    try {
      const { total } = req.query;
      const userId = req.user?.id;
      const now = new Date();

      let codes = await DiscountCodesModel.list();

      // Filter valid codes
      const validCodes = [];
      for (const code of codes) {
        // Skip inactive codes
        if (code.status !== DISCOUNT_STATUS.ACTIVE) continue;

        // Skip codes not yet started
        if (code.start_date && new Date(code.start_date) > now) continue;

        // Skip expired codes
        if (code.end_date && new Date(code.end_date) < now) continue;

        // Skip codes with min_total requirement not met
        if (code.min_total && total && Number(total) < code.min_total) continue;

        // Check total usage limit
        const totalUsage = await DiscountCodesModel.getTotalUsageCount(code.id);
        if (code.max_uses && totalUsage >= code.max_uses) continue;

        // Check per-user usage limit
        if (userId && code.max_uses_per_user) {
          const userUsage = await DiscountCodesModel.getUserUsageCount(
            code.id,
            userId
          );
          if (userUsage >= code.max_uses_per_user) continue;
        }

        // Calculate potential discount
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

      // Sort by potential discount (highest first)
      validCodes.sort((a, b) => b.potential_discount - a.potential_discount);

      res.success(validCodes);
    } catch (err) {
      console.error("suggestForBooking error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },

  /**
   * Find discount code by ID
   */
  async findById(req, res) {
    try {
      const { id } = req.params;
      const found = await DiscountCodesModel.findById(id);

      if (!found) {
        return res.error(ERROR_MESSAGES.DISCOUNT_NOT_FOUND, null, 404);
      }

      // Add usage stats
      found.total_usage = await DiscountCodesModel.getTotalUsageCount(found.id);
      found.usage_history = await DiscountCodesModel.getUsageHistory(found.id);

      res.success(found);
    } catch (err) {
      console.error("findById error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },

  /**
   * Update discount code by ID
   */
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

  /**
   * Delete discount code by ID
   */
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

  /**
   * Get usage history for a discount code
   */
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
