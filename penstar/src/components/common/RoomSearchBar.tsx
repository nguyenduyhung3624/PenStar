import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { DatePicker, Input, Button, message } from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import type { RoomSearchParams } from "@/types/room";
import { nowVN } from "@/utils/dayjs";
import type { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface RoomSearchBarProps {
  onSearch: (params: RoomSearchParams) => void;
  loading?: boolean;
  variant?: "floating" | "inline"; // floating cho HomePage, inline cho Results
  requireAuthForSearch?: boolean; // if true, redirect to signin when not authenticated
}

const RoomSearchBar: React.FC<RoomSearchBarProps> = ({
  onSearch,
  loading,
  variant = "inline",
  requireAuthForSearch = true,
}) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  // Gom logic validate ngày vào một hàm
  const validateDates = (
    checkInDate: Dayjs,
    checkOutDate: Dayjs,
    now: Dayjs
  ) => {
    if (!checkInDate || !checkOutDate) {
      return {
        valid: false,
        error: "Vui lòng chọn ngày check-in và check-out",
      };
    }

    // Check ngày check-in không phải quá khứ
    const todayStart = now.startOf("day");
    if (checkInDate.isBefore(todayStart)) {
      return {
        valid: false,
        error: "Ngày check-in không được là ngày trong quá khứ.",
      };
    }

    // Check-in ngày hôm nay: phải sau 14:00
    const isCheckInToday = checkInDate.isSame(now, "day");
    if (isCheckInToday && now.hour() < 14) {
      return {
        valid: false,
        error: "Check-in từ 14:00. Vui lòng chọn ngày khác hoặc đợi đến 14:00.",
      };
    }

    // Giới hạn đặt phòng cùng ngày: quá 21:00 thì không cho đặt check-in hôm nay
    if (isCheckInToday && now.hour() >= 21) {
      return {
        valid: false,
        error:
          "Quá 21:00, không thể đặt phòng check-in hôm nay. Vui lòng chọn ngày mai.",
      };
    }

    // Check ngày check-out không phải quá khứ
    if (checkOutDate.isBefore(todayStart)) {
      return {
        valid: false,
        error: "Ngày check-out không được là ngày trong quá khứ.",
      };
    }

    // Check-out ngày hôm nay: phải trước 14:00
    const isCheckOutToday = checkOutDate.isSame(now, "day");
    if (isCheckOutToday && now.hour() >= 14) {
      return {
        valid: false,
        error: "Check-out trước 14:00. Đã quá giờ check-out cho ngày hôm nay.",
      };
    }

    // Check-out phải sau check-in
    if (
      checkOutDate.isBefore(checkInDate) ||
      checkOutDate.isSame(checkInDate)
    ) {
      return { valid: false, error: "Ngày check-out phải sau ngày check-in." };
    }
    return { valid: true, error: "" };
  };

  const handleSearch = () => {
    if (requireAuthForSearch && auth?.initialized && !auth?.token) {
      message.error("Vui lòng đăng nhập để tìm kiếm và đặt phòng");
      navigate("/signin");
      return;
    }
    if (!dates || dates.length !== 2) {
      message.warning("Vui lòng chọn ngày check-in và check-out");
      return;
    }
    const checkInDate = dates[0];
    const checkOutDate = dates[1];
    const now = nowVN();
    const { valid, error } = validateDates(checkInDate, checkOutDate, now);
    if (!valid) {
      message.warning(error);
      return;
    }
    const searchParams: RoomSearchParams = {
      check_in: checkInDate.format("YYYY-MM-DD"),
      check_out: checkOutDate.format("YYYY-MM-DD"),
      promo_code: promoCode || undefined,
      status: "available", // Chỉ tìm phòng trống
      booking_statuses: [1, 2, 6], // Chỉ loại trừ các booking trạng thái reserved, checked_in, pending
    };
    onSearch(searchParams);
  };

  const containerClass =
    variant === "floating"
      ? "absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-full max-w-6xl px-4 z-20"
      : "w-full max-w-6xl mx-auto";

  return (
    <div className={containerClass}>
      <div className="bg-white p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Dates */}
          <div className="flex-1 min-w-[250px] relative">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Ngày nhận - trả phòng
            </div>
            <RangePicker
              size="middle"
              format="DD/MM/YYYY"
              placeholder={["Check-in", "Check-out"]}
              suffixIcon={<CalendarOutlined />}
              className="w-full border-0 bg-gray-50"
              style={{ borderRadius: 0 }}
              disabledDate={(current) => {
                return current && current < nowVN().startOf("day");
              }}
              onChange={(values) => {
                if (values && values[0] && values[1]) {
                  setDates([values[0], values[1]]);
                  const now = nowVN();
                  const checkInDate = values[0];
                  const checkOutDate = values[1];
                  const { valid, error } = validateDates(
                    checkInDate,
                    checkOutDate,
                    now
                  );
                  setDateError(valid ? null : error);
                } else {
                  setDates(null);
                  setDateError(null);
                }
              }}
            />
            {/* Hiển thị lỗi validation ngày - position absolute để không đẩy layout */}
            {dateError && (
              <div className="absolute left-0 top-full mt-1 text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-200 whitespace-nowrap z-10">
                ⚠️ {dateError}
              </div>
            )}
          </div>

          {/* Đã xóa phần chọn số lượng phòng. Số lượng phòng sẽ chọn ở từng loại phòng trong RoomSearchResults. */}

          {/* Mã khuyến mãi */}
          <div className="flex-1 min-w-[160px]">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Mã khuyến mãi
            </div>
            <Input
              size="middle"
              placeholder="Nhập mã (nếu có)"
              prefix={<GiftOutlined className="text-orange-500" />}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="border-0 bg-gray-50"
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Button */}
          <div>
            <Button
              type="primary"
              size="middle"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
              disabled={!!dateError}
              className="h-[32px] px-6 font-bold"
              style={{
                background: "#fbbf24",
                borderColor: "#fbbf24",
                borderRadius: 0,
              }}
            >
              TÌM KIẾM
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSearchBar;
