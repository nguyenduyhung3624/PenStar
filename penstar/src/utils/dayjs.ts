import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Vietnam
export const TIMEZONE = "Asia/Ho_Chi_Minh";

// Helper: Get current time in VN timezone
export const nowVN = () => dayjs().tz(TIMEZONE);

// Helper: Convert any date to VN timezone
export const toVN = (date: dayjs.ConfigType) => dayjs(date).tz(TIMEZONE);

export default dayjs;
