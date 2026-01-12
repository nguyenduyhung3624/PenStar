import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "@/services/statisticsApi";
import {
  Spin,
  DatePicker,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Typography,
  Space,
  Avatar,
  Empty,
  Button,
  Tabs,
  List,
} from "antd";
import {
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  FallOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useState } from "react";
import dayjs from "dayjs";
import { vi } from "date-fns/locale";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
const REVENUE_COLORS = ["#007AFF", "#34C759", "#FF9500"];
const STATUS_COLORS = {
  confirmed: "#007AFF",
  checked_in: "#34C759",
  checked_out: "#8E8E93",
  cancelled: "#FF3B30",
  pending: "#FF9500",
  no_show: "#AF52DE",
};

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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );

  const revenueBreakdownData = stats?.revenueBreakdown
    ? [
        { name: "Phòng", value: stats.revenueBreakdown.room },
        { name: "Dịch vụ", value: stats.revenueBreakdown.service },
        { name: "Phụ phí", value: stats.revenueBreakdown.incident },
      ].filter((d) => d.value > 0)
    : [];

  const topRoomsData =
    stats?.topRoomTypes?.map((r) => ({
      ...r,
      bookings: Number(r.bookings),
      revenue: Number(r.revenue),
    })) || [];
  const bottomRoomsData =
    stats?.bottomRoomTypes?.map((r) => ({
      ...r,
      bookings: Number(r.bookings),
    })) || [];

  const topServicesData =
    stats?.topServices?.map((s) => ({
      ...s,
      usage: Number(s.usage),
      revenue: Number(s.revenue),
    })) || [];
  const bottomServicesData =
    stats?.bottomServices?.map((s) => ({ ...s, usage: Number(s.usage) })) || [];

  const bookingStatusData =
    stats?.bookingStatusStats
      ?.map((s) => ({
        name:
          s.name === "confirmed"
            ? "Đã xác nhận"
            : s.name === "checked_in"
              ? "Đang ở"
              : s.name === "checked_out"
                ? "Đã trả phòng"
                : s.name === "cancelled"
                  ? "Đã hủy"
                  : s.name === "pending"
                    ? "Chờ duyệt"
                    : s.name === "no_show"
                      ? "Vắng mặt"
                      : s.name,
        originalName: s.name,
        value: s.value,
      }))
      .filter((d) => d.value > 0) || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Thống Kê & Báo Cáo
          </Title>
          <Text type="secondary">
            Dữ liệu từ {dateRange[0].format("DD/MM/YYYY")} đến{" "}
            {dateRange[1].format("DD/MM/YYYY")}
          </Text>
        </div>
        <Card size="small" className="shadow-sm">
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
            format="DD/MM/YYYY"
            allowClear={false}
            bordered={false}
          />
        </Card>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm h-full">
            <Statistic
              title="Tổng doanh thu"
              value={stats?.totalRevenue}
              formatter={(val) => (
                <span className="text-emerald-600 font-bold text-2xl">
                  {formatVND(Number(val))}
                </span>
              )}
              prefix={
                <DollarOutlined className="bg-emerald-100 text-emerald-600 p-2 rounded-full mr-2" />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm h-full">
            <Statistic
              title="Tổng đơn đặt"
              value={stats?.totalBookings}
              valueStyle={{ fontWeight: "bold" }}
              prefix={
                <CalendarOutlined className="bg-blue-100 text-blue-600 p-2 rounded-full mr-2" />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm h-full">
            <Statistic
              title="Đơn hủy"
              value={
                bookingStatusData.find((s) => s.originalName === "cancelled")
                  ?.value || 0
              }
              valueStyle={{ color: "#ef4444", fontWeight: "bold" }}
              prefix={
                <CloseCircleOutlined className="bg-red-100 text-red-600 p-2 rounded-full mr-2" />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm h-full">
            <Statistic
              title="Đơn thành công"
              value={
                (stats?.totalBookings || 0) -
                (bookingStatusData.find((s) => s.originalName === "cancelled")
                  ?.value || 0) -
                (bookingStatusData.find((s) => s.originalName === "no_show")
                  ?.value || 0)
              }
              valueStyle={{ color: "#10b981", fontWeight: "bold" }}
              prefix={
                <CheckCircleOutlined className="bg-emerald-100 text-emerald-600 p-2 rounded-full mr-2" />
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Main Charts Area */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card
            title="Biểu đồ doanh thu"
            bordered={false}
            className="shadow-sm h-full"
          >
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats?.revenueChart || []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(t) => format(new Date(t), "dd/MM")}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("en", {
                        notation: "compact",
                      }).format(v)
                    }
                  />
                  <Tooltip formatter={(val: number) => formatVND(val)} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="Trạng thái đơn hàng"
            bordered={false}
            className="shadow-sm h-full"
          >
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          (STATUS_COLORS as any)[entry.originalName] ||
                          PIE_COLORS[index]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {bookingStatusData.map((d, idx) => (
                <Tag
                  key={idx}
                  color={(STATUS_COLORS as any)[d.originalName] || "default"}
                >
                  {d.name}: {d.value}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Analysis Section: Room Types & Services */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm h-full"
            bodyStyle={{ padding: "0 10px 10px 10px" }}
          >
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: (
                    <span className="mx-4 text-emerald-600">
                      <TrophyOutlined /> Top 5 Loại Phòng (Đặt nhiều)
                    </span>
                  ),
                  children: (
                    <div style={{ padding: "0 10px" }}>
                      <Table
                        dataSource={topRoomsData}
                        rowKey="name"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: "Tên loại phòng",
                            dataIndex: "name",
                            width: "50%",
                          },
                          {
                            title: "Số lượt đặt",
                            dataIndex: "bookings",
                            sorter: (a, b) => a.bookings - b.bookings,
                            defaultSortOrder: "descend",
                            width: "20%",
                          },
                          {
                            title: "Doanh thu",
                            dataIndex: "revenue",
                            render: (val) => formatVND(val),
                            width: "30%",
                            align: "right",
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span className="mx-4 text-red-500">
                      <FallOutlined /> Top 5 Loại Phòng (Đặt ít)
                    </span>
                  ),
                  children: (
                    <div style={{ padding: "0 10px" }}>
                      <List
                        dataSource={bottomRoomsData}
                        renderItem={(item, index) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  style={{
                                    backgroundColor: "#ffccc7",
                                    color: "#cf1322",
                                  }}
                                >
                                  {index + 1}
                                </Avatar>
                              }
                              title={item.name}
                              description={`Chỉ có ${item.bookings} lượt đặt trong kỳ này`}
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm h-full"
            bodyStyle={{ padding: "0 10px 10px 10px" }}
          >
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: (
                    <span className="mx-4 text-blue-600">
                      <TrophyOutlined /> Top 5 Dịch Vụ (Dùng nhiều)
                    </span>
                  ),
                  children: (
                    <div style={{ height: 260, padding: "10px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topServicesData}
                          layout="vertical"
                          margin={{ top: 5, left: 30, right: 30, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            vertical={true}
                          />
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(val: number) => val}
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="usage"
                            name="Lượt dùng"
                            fill="#3b82f6"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                            label={{ position: "right" }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span className="mx-4 text-gray-500">
                      <FallOutlined /> Top 5 Dịch Vụ (Ít dùng)
                    </span>
                  ),
                  children: (
                    <div style={{ padding: "0 10px" }}>
                      <Table
                        dataSource={bottomServicesData}
                        rowKey="name"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: "Tên dịch vụ", dataIndex: "name" },
                          {
                            title: "Số lượt sử dụng",
                            dataIndex: "usage",
                            sorter: (a, b) => a.usage - b.usage,
                            defaultSortOrder: "ascend",
                            align: "right",
                          },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Đặt phòng gần đây"
        bordered={false}
        className="shadow-sm"
        extra={
          <Button type="link" onClick={() => navigate("/admin/bookings")}>
            Xem tất cả
          </Button>
        }
      >
        <Table
          dataSource={stats?.recentBookings || []}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: true }}
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              render: (t) => <Text strong>#{t}</Text>,
            },
            { title: "Khách", dataIndex: "customer_name" },
            {
              title: "Tổng tiền",
              dataIndex: "total_price",
              render: (t) => <Text type="success">{formatVND(t)}</Text>,
            },
            {
              title: "Trạng thái",
              dataIndex: "stay_status_name",
              render: (t) => {
                const statusMap: Record<
                  string,
                  { label: string; color: string }
                > = {
                  confirmed: { label: "Đã xác nhận", color: "blue" },
                  checked_in: { label: "Đang ở", color: "green" },
                  checked_out: { label: "Đã trả phòng", color: "default" },
                  cancelled: { label: "Đã hủy", color: "red" },
                  pending: { label: "Chờ duyệt", color: "orange" },
                  no_show: { label: "Vắng mặt", color: "purple" },
                };
                const status = statusMap[t] || { label: t, color: "default" };
                return <Tag color={status.color}>{status.label}</Tag>;
              },
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
