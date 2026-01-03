/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "@/services/statisticsApi";
import { Spin, DatePicker } from "antd"; // Chỉ giữ lại DatePicker vì xử lý lịch khá phức tạp
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";
import dayjs from "dayjs";
import {
  FaMoneyBillWave,
  FaCalendarCheck,
  FaBed,
  FaUserClock,
  FaArrowUp,
  FaConciergeBell,
} from "react-icons/fa"; // Cài thêm: npm install react-icons

const { RangePicker } = DatePicker;

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const { data: stats, isLoading } = useQuery({
    queryKey: [
      "statistics",
      dateRange[0].format("YYYY-MM-DD"),
      dateRange[1].format("YYYY-MM-DD"),
    ],
    queryFn: () =>
      getStatistics(
        dateRange[0].format("YYYY-MM-DD"),
        dateRange[1].format("YYYY-MM-DD")
      ),
  });

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tổng quan hoạt động
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Số liệu từ {dateRange[0].format("DD/MM/YYYY")} đến{" "}
            {dateRange[1].format("DD/MM/YYYY")}
          </p>
        </div>
        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
            format="DD/MM/YYYY"
            allowClear={false}
            className="border-none"
          />
        </div>
      </div>

      {/* --- KPI STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Doanh thu */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Tổng doanh thu
            </p>
            <h3 className="text-2xl font-bold text-emerald-600">
              {formatVND(stats?.totalRevenue || 0)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <FaMoneyBillWave size={20} />
          </div>
        </div>

        {/* Booking */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Đơn đặt phòng
            </p>
            <h3 className="text-2xl font-bold text-blue-600">
              {stats?.totalBookings || 0}
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <FaCalendarCheck size={20} />
          </div>
        </div>

        {/* Lấp đầy */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Tỷ lệ lấp đầy
            </p>
            <h3 className="text-2xl font-bold text-amber-500">
              {stats?.occupancyRate || 0}%
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
            <FaBed size={20} />
          </div>
        </div>

        {/* Chờ duyệt */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Đang chờ duyệt
            </p>
            <h3 className="text-2xl font-bold text-rose-500">
              {stats?.pendingBookings || 0}
            </h3>
          </div>
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
            <FaUserClock size={20} />
          </div>
        </div>
      </div>

      {/* --- STATUS & CHARTS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Cột trái: Trạng thái phòng (Realtime) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaConciergeBell className="text-gray-400" /> Trạng thái phòng hiện
            tại
          </h3>
          <div className="space-y-4">
            <StatusItem
              label="Phòng trống"
              count={stats?.roomStatusCount?.available ?? 0}
              color="bg-emerald-500"
            />
            <StatusItem
              label="Đang có khách"
              count={stats?.roomStatusCount?.occupied ?? 0}
              color="bg-blue-500"
            />
            <StatusItem
              label="Đã đặt trước"
              count={stats?.roomStatusCount?.reserved ?? 0}
              color="bg-amber-500"
            />
            <StatusItem
              label="Đang bảo trì"
              count={stats?.roomStatusCount?.maintenance ?? 0}
              color="bg-gray-400"
            />
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Check-in trong kỳ:{" "}
                <b className="text-gray-800">{stats?.countCheckins ?? 0}</b>
              </span>
              <span>
                Check-out trong kỳ:{" "}
                <b className="text-gray-800">{stats?.countCheckouts ?? 0}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Cột phải: Biểu đồ doanh thu (Chiếm 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FaArrowUp className="text-emerald-500 rotate-45" /> Xu hướng doanh
            thu
          </h3>
          <div className="h-[300px] w-full">
            {(stats?.revenueChart?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.revenueChart ?? []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(t) => format(new Date(t), "dd/MM")}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("vi-VN", {
                        notation: "compact",
                      }).format(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(v: number) => [formatVND(v), "Doanh thu"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#10B981",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- TABLES SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Table (Chiếm 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Booking mới nhất</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Tổng tiền</th>
                  <th className="px-5 py-3">Thanh toán</th>
                  <th className="px-5 py-3">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.recentBookings?.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/bookings/${item.id}`)}
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">
                      #{item.id}
                    </td>
                    <td className="px-5 py-3">{item.customer_name}</td>
                    <td className="px-5 py-3 font-medium text-emerald-600">
                      {formatVND(item.total_price)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.payment_status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.payment_status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.payment_status === "paid"
                          ? "Đã TT"
                          : item.payment_status === "pending"
                            ? "Chờ TT"
                            : "Chưa TT"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {format(new Date(item.created_at), "dd/MM/yy HH:mm")}
                    </td>
                  </tr>
                ))}
                {(!stats?.recentBookings ||
                  stats.recentBookings.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Damage Table / Payment Pie Chart */}
        <div className="flex flex-col gap-6">
          {/* Biểu đồ tròn nhỏ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">
              Phương thức thanh toán
            </h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.paymentMethods || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats?.bookingsByPaymentMethod || []).map(
                      (_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {stats?.bookingsByPaymentMethod?.map((m: any, idx: number) => (
                <span
                  key={idx}
                  className="text-xs text-gray-500 flex items-center gap-1"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                  ></span>
                  {m.name || m.paymentMethod}
                </span>
              ))}
            </div>
          </div>

          {/* Sự cố thiết bị */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
            <div className="p-4 border-b border-gray-100 bg-red-50">
              <h3 className="font-bold text-red-700 text-sm">
                Sự cố thiết bị mới
              </h3>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-gray-100">
                  {stats?.recentDamage?.map((d: any) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 text-gray-600">
                        <b>{d.room}</b> - {d.item}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">
                        {formatVND(d.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component con để hiển thị thanh trạng thái
const StatusItem = ({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-600 text-sm flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`}></span>
      {label}
    </span>
    <span className="font-bold text-gray-800">{count || 0}</span>
  </div>
);

export default Dashboard;
