import { DiscountCodesModel } from "../models/discount_codesmodel.js";

export const DiscountCodesController = {
  async checkCode(req, res) {
    const { code, total } = req.body;
    if (!code)
      return res.status(400).json({ ok: false, error: "Thiếu mã giảm giá" });
    const found = await DiscountCodesModel.findByCode(code);
    if (!found)
      return res.status(404).json({ ok: false, error: "Mã không tồn tại" });
    if (found.status !== "active")
      return res
        .status(400)
        .json({ ok: false, error: "Mã không còn hiệu lực" });
    if (found.start_date && new Date(found.start_date) > new Date())
      return res.status(400).json({ ok: false, error: "Mã chưa bắt đầu" });
    if (found.end_date && new Date(found.end_date) < new Date())
      return res.status(400).json({ ok: false, error: "Mã đã hết hạn" });
    if (found.min_total && total < found.min_total)
      return res
        .status(400)
        .json({ ok: false, error: `Đơn tối thiểu ${found.min_total}` });
    // TODO: kiểm tra max_uses, max_uses_per_user nếu cần
    let discountAmount = 0;
    if (found.type === "percent") {
      discountAmount = Math.round((found.value / 100) * total);
    } else if (found.type === "fixed") {
      discountAmount = Math.min(found.value, total);
    }
    res.json({ ok: true, code: found, discountAmount });
  },

  async create(req, res) {
    try {
      const code = await DiscountCodesModel.create(req.body);
      res.json({ ok: true, code });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  },

  async list(req, res) {
    const codes = await DiscountCodesModel.list();
    res.json({ ok: true, codes });
  },

  async suggestForBooking(req, res) {
    // Lọc các mã đủ điều kiện cho booking (theo tổng tiền, ngày, trạng thái, số lượt dùng...)
    const { total } = req.query;
    const now = new Date();
    let codes = await DiscountCodesModel.list();
    codes = codes.filter((code) => {
      if (code.status !== "active") return false;
      if (code.start_date && new Date(code.start_date) > now) return false;
      if (code.end_date && new Date(code.end_date) < now) return false;
      if (code.min_total && total && Number(total) < code.min_total)
        return false;
      // TODO: kiểm tra max_uses, max_uses_per_user nếu cần
      return true;
    });
    res.json({ ok: true, codes });
  },

  async findById(req, res) {
    const { id } = req.params;
    const found = await DiscountCodesModel.findById(id);
    if (!found) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, code: found });
  },

  async updateById(req, res) {
    const { id } = req.params;
    const fields = req.body;
    console.log("[UPDATE DISCOUNT] id:", id, "fields:", fields);
    try {
      const updated = await DiscountCodesModel.updateById(id, fields);
      res.json({ ok: true, code: updated });
    } catch (err) {
      console.error("[UPDATE DISCOUNT ERROR]", err);
      res.status(400).json({ ok: false, error: err.message });
    }
  },

  async deleteById(req, res) {
    const { id } = req.body;
    await DiscountCodesModel.deleteById(id);
    res.json({ ok: true });
  },
};

// Đã xóa toàn bộ logic discount code controller. Viết lại từ đầu nếu cần.
