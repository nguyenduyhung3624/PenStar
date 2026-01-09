import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
export const TIMEZONE = "Asia/Ho_Chi_Minh";
export const nowVN = () => dayjs().tz(TIMEZONE);
export const toVN = (date: dayjs.ConfigType) => dayjs(date).tz(TIMEZONE);
export default dayjs;
