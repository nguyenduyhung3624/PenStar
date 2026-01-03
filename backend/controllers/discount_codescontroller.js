import { DiscountCodesModel } from "../models/discount_codesmodel.js";
import {
  DISCOUNT_TYPE,
  DISCOUNT_STATUS,
  ERROR_MESSAGES,
} from "../utils/constants.js";

export const DiscountCodesController = {
  /**
   * Check discount code validity
   */
  async checkCode(req, res) {
    try {
      const { code, total } = req.body;

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

      if (found.start_date && new Date(found.start_date) > new Date()) {
        return res.error("Mã giảm giá chưa bắt đầu", null, 400);
      }

      if (found.end_date && new Date(found.end_date) < new Date()) {
        return res.error(ERROR_MESSAGES.DISCOUNT_EXPIRED, null, 400);
      }

      if (found.min_total && total < found.min_total) {
        return res.error(`Đơn tối thiểu ${found.min_total}`, null, 400);
      }

      let discountAmount = 0;
      if (found.type === DISCOUNT_TYPE.PERCENT) {
        discountAmount = Math.round((found.value / 100) * total);
      } else if (found.type === DISCOUNT_TYPE.FIXED) {
        discountAmount = Math.min(found.value, total);
      }

      res.success({ code: found, discountAmount });
    } catch (err) {
      console.error("checkCode error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },

  async create(req, res) {
    try {
      const code = await DiscountCodesModel.create(req.body);
      res.success(code, "Tạo mã giảm giá thành công", 201);
    } catch (err) {
      console.error("create error:", err);
      res.error("Lỗi tạo mã giảm giá", err.message, 400);
    }
  },

  async list(req, res) {
    try {
      const codes = await DiscountCodesModel.list();
      res.success(codes);
    } catch (err) {
      console.error("list error:", err);
      res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
    }
  },

  async suggestForBooking(req, res) {
    try {
      const { total } = req.query;
      const now = new Date();

      let codes = await DiscountCodesModel.list();
      codes = codes.filter((code) => {
        if (code.status !== DISCOUNT_STATUS.ACTIVE) return false;
        if (code.start_date && new Date(code.start_date) > now) return false;
        if (code.end_date && new Date(code.end_date) < now) return false;
        if (code.min_total && total && Number(total) < code.min_total)
          return false;
        return true;
      });

      res.success(codes);
    } catch (err) {
      console.error("suggestForBooking error:", err);
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
      res.success(updated, "Cập nhật mã giảm giá thành công");
    } catch (err) {
      console.error("[UPDATE ERROR]", err);
      res.error("Lỗi cập nhật mã", err.message, 400);
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
};
