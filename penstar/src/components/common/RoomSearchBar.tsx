import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { DatePicker, Button, message } from "antd";
import { SearchOutlined, CalendarOutlined } from "@ant-design/icons";
import type { RoomSearchParams } from "@/types/room";
import { nowVN } from "@/utils/dayjs";
import type { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface RoomSearchBarProps {
  onSearch: (params: RoomSearchParams) => void;
  loading?: boolean;
  variant?: "floating" | "inline"; // floating cho HomePage, inline cho Results
  requireAuthForSearch?: boolean;
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
  const [dateError, setDateError] = useState<string | null>(null);

  // --- LOGIC VALIDATE (GIỮ NGUYÊN 100%) ---
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

    const todayStart = now.startOf("day");
    if (checkInDate.isBefore(todayStart)) {
      return {
        valid: false,
        error: "Ngày check-in không được là ngày trong quá khứ.",
      };
    }

    const isCheckInToday = checkInDate.isSame(now, "day");
    if (isCheckInToday && now.hour() < 14) {
      return {
        valid: false,
        error: "Check-in từ 14:00. Vui lòng chọn ngày khác hoặc đợi đến 14:00.",
      };
    }

    if (isCheckInToday && now.hour() >= 21) {
      return {
        valid: false,
        error:
          "Quá 21:00, không thể đặt phòng check-in hôm nay. Vui lòng chọn ngày mai.",
      };
    }

    if (checkOutDate.isBefore(todayStart)) {
      return {
        valid: false,
        error: "Ngày check-out không được là ngày trong quá khứ.",
      };
    }

    const isCheckOutToday = checkOutDate.isSame(now, "day");
    if (isCheckOutToday && now.hour() >= 14) {
      return {
        valid: false,
        error: "Check-out trước 14:00. Đã quá giờ check-out cho ngày hôm nay.",
      };
    }

    if (
      checkOutDate.isBefore(checkInDate) ||
      checkOutDate.isSame(checkInDate)
    ) {
      return { valid: false, error: "Ngày check-out phải sau ngày check-in." };
    }

    const nights = checkOutDate.diff(checkInDate, "day");
    const MAX_NIGHTS = 30;
    if (nights > MAX_NIGHTS) {
      return {
        valid: false,
        error: `Không thể đặt phòng quá ${MAX_NIGHTS} đêm. Vui lòng liên hệ khách sạn.`,
      };
    }

    const MAX_ADVANCE_DAYS = 365;
    const daysInAdvance = checkInDate.diff(todayStart, "day");
    if (daysInAdvance > MAX_ADVANCE_DAYS) {
      return {
        valid: false,
        error: `Không thể đặt phòng trước quá ${MAX_ADVANCE_DAYS} ngày.`,
      };
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
      status: "available",
      booking_statuses: [1, 2, 6],
    };
    onSearch(searchParams);
  };

  // --- STYLING MỚI ---
  const containerClass =
    variant === "floating"
      ? "absolute left-1/2 -translate-x-1/2 bottom-[-40px] md:bottom-[-50px] w-[95%] md:w-auto z-20"
      : "w-full max-w-6xl mx-auto mb-8";

  return (
    <div className={containerClass}>
      {/* Box chính: Màu trắng, đổ bóng, bo góc */}
      <div className="bg-white shadow-xl border border-gray-100 p-2 md:p-3 flex flex-col md:flex-row gap-2 items-center justify-between max-w-5xl mx-auto">
        {/* Phần chọn ngày */}
        <div className="flex-1 w-full md:w-auto relative group px-2">
          <div className="flex items-center gap-3 h-14 md:h-16 px-4 bg-gray-50 rounded-lg border border-transparent group-hover:border-gray-200 transition-colors cursor-pointer">
            <div className="text-yellow-600 bg-yellow-50 p-2">
              <CalendarOutlined style={{ fontSize: "18px" }} />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-[2px]">
                Ngày nhận - Trả phòng
              </span>
              {/* RangePicker được customize để ẩn border mặc định */}
              <RangePicker
                format="DD/MM/YYYY"
                placeholder={["Nhận phòng", "Trả phòng"]}
                suffixIcon={null} // Ẩn icon mặc định để dùng icon custom bên trái
                variant="borderless"
                className="p-0 w-full hover:bg-transparent"
                style={{ background: "transparent" }}
                inputReadOnly={true}
                disabledDate={(current) =>
                  current && current < nowVN().startOf("day")
                }
                onChange={(values) => {
                  if (values && values[0] && values[1]) {
                    setDates([values[0], values[1]]);
                    const { valid, error } = validateDates(
                      values[0],
                      values[1],
                      nowVN()
                    );
                    setDateError(valid ? null : error);
                  } else {
                    setDates(null);
                    setDateError(null);
                  }
                }}
              />
            </div>
          </div>

          {/* Error Message hiển thị tinh tế hơn */}
          {dateError && (
            <div className="absolute top-full left-4 mt-2 z-10 animate-fade-in-down">
              <div className="bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-md border border-red-100 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                {dateError}
              </div>
            </div>
          )}
        </div>

        {/* Nút tìm kiếm */}
        <div className="w-full md:w-auto">
          <Button
            type="primary"
            size="large"
            onClick={handleSearch}
            loading={loading}
            disabled={!!dateError}
            className="w-full md:w-auto h-14 md:h-16 px-8 md:px-12 rounded-lg text-base md:text-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            style={{
              backgroundColor: "#d97706", // Màu vàng đậm sang trọng (Gold)
              borderColor: "#d97706",
              color: "#fff",
            }}
            icon={<SearchOutlined />}
          >
            TÌM PHÒNG
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomSearchBar;
