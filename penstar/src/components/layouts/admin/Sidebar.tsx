import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import {
  DashboardOutlined,
  HomeOutlined,
  AppstoreOutlined,
  ToolOutlined,
  BuildOutlined,
  TeamOutlined,
  CalendarOutlined,
  CoffeeOutlined,
  TagsOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const auth = useAuth();
  const roleName = auth?.getRoleName(auth.user) || "user";
  const isManagerOrAbove = roleName === "manager" || roleName === "admin";
  const navItems = [
    {
      to: "/admin",
      label: "Thống kê",
      icon: <DashboardOutlined className="text-xl" />,
    },
    {
      to: "/admin/rooms",
      label: "Phòng",
      icon: <HomeOutlined className="text-xl" />,
    },
    {
      to: "/admin/roomtypes",
      label: "Loại phòng",
      icon: <AppstoreOutlined className="text-xl" />,
    },
    {
      to: "/admin/broken-equipments",
      label: "Thiết bị hỏng",
      icon: <ToolOutlined className="text-xl" />,
    },
    {
      to: "/admin/floors",
      label: "Tầng",
      icon: <BuildOutlined className="text-xl" />,
    },
    {
      to: "/admin/users",
      label: "Người dùng",
      requireRole: "manager",
      icon: <TeamOutlined className="text-xl" />,
    },
    {
      to: "/admin/bookings",
      label: "Đặt phòng",
      icon: <CalendarOutlined className="text-xl" />,
    },
    {
      to: "/admin/services",
      label: "Dịch vụ",
      icon: <CoffeeOutlined className="text-xl" />,
    },
    {
      to: "/admin/discount-codes",
      label: "Mã giảm giá",
      icon: <TagsOutlined className="text-xl" />,
    },
    {
      to: "/admin/refund-requests",
      label: "Hoàn tiền",
      icon: <RollbackOutlined className="text-xl" />,
    },
  ];
  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } min-h-screen bg-gray-800 text-white flex flex-col shadow-lg transition-all duration-200`}
    >
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          {!collapsed && (
            <div>
              <div className="text-lg font-bold uppercase">PenStar Center</div>
            </div>
          )}
          {collapsed && (
            <div>
              <div className="text-lg font-bold uppercase">P</div>
            </div>
          )}
        </Link>
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((s) => !s)}
          className="text-gray-400 hover:text-white p-1 rounded"
        >
          {collapsed ? (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M9 5l7 7-7 7"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M15 19l-7-7 7-7"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      <nav className="flex-1 p-3">
        <ul className="space-y-2">
          {navItems
            .filter((item) => {
              if ("requireRole" in item && item.requireRole === "manager") {
                return isManagerOrAbove;
              }
              return true;
            })
            .map((item) => (
              <li key={item.to} className="w-full">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 w-full ${
                      isActive ? "bg-gray-800" : "hover:bg-gray-700"
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? "#fadb14" : "#ffffff",
                    fontWeight: isActive ? 500 : 400,
                  })}
                  end
                >
                  <div className="flex items-center justify-center w-6">
                    {item.icon}
                  </div>
                  {!collapsed && <span className="ml-1">{item.label}</span>}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
};
export default Sidebar;
