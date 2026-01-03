import { getStayStatuses as fetchStayStatuses } from "../models/staystatusmodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";

export const getStayStatuses = async (req, res) => {
  try {
    const data = await fetchStayStatuses();
    res.success(data, "Lấy danh sách trạng thái thành công");
  } catch (err) {
    console.error("getStayStatuses error:", err);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};

export default { getStayStatuses };
