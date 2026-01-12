import {
  WifiOutlined,
  CoffeeOutlined,
  SnippetsOutlined,
  HolderOutlined,
  HomeOutlined,
  PhoneOutlined,
  DesktopOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  SkinOutlined,
  FireOutlined,
  RestOutlined,
  ToolOutlined,
} from "@ant-design/icons";

const iconStyle = { fontSize: "18px", color: "#222" };

// Danh sách tiện nghi miễn phí phổ biến khi đặt phòng khách sạn
export const FIXED_AMENITIES = [
  {
    value: "WiFi miễn phí",
    label: "WiFi miễn phí",
    icon: <WifiOutlined style={iconStyle} />,
  },
  {
    value: "Điều hòa nhiệt độ",
    label: "Điều hòa nhiệt độ",
    icon: <FireOutlined style={iconStyle} />,
  },
  {
    value: "TV màn hình phẳng",
    label: "TV màn hình phẳng",
    icon: <DesktopOutlined style={iconStyle} />,
  },
  {
    value: "Máy sấy tóc",
    label: "Máy sấy tóc",
    icon: <ThunderboltOutlined style={iconStyle} />,
  },
  {
    value: "Dép đi trong phòng",
    label: "Dép đi trong phòng",
    icon: <SkinOutlined style={iconStyle} />,
  },
  {
    value: "Nước suối miễn phí",
    label: "Nước suối miễn phí",
    icon: <CoffeeOutlined style={iconStyle} />,
  },
  {
    value: "Bàn chải & kem đánh răng",
    label: "Bàn chải & kem đánh răng",
    icon: <SnippetsOutlined style={iconStyle} />,
  },
  {
    value: "Dầu gội & sữa tắm",
    label: "Dầu gội & sữa tắm",
    icon: <HolderOutlined style={iconStyle} />,
  },
  {
    value: "Khăn tắm",
    label: "Khăn tắm",
    icon: <SkinOutlined style={iconStyle} />,
  },
  {
    value: "Tủ quần áo",
    label: "Tủ quần áo",
    icon: <HomeOutlined style={iconStyle} />,
  },
  {
    value: "Bàn làm việc",
    label: "Bàn làm việc",
    icon: <ToolOutlined style={iconStyle} />,
  },
  {
    value: "Dọn phòng hàng ngày",
    label: "Dọn phòng hàng ngày",
    icon: <RestOutlined style={iconStyle} />,
  },
  {
    value: "Két an toàn",
    label: "Két an toàn",
    icon: <SafetyCertificateOutlined style={iconStyle} />,
  },
  {
    value: "Điện thoại",
    label: "Điện thoại",
    icon: <PhoneOutlined style={iconStyle} />,
  },
  {
    value: "Trà & cà phê miễn phí",
    label: "Trà & cà phê miễn phí",
    icon: <CoffeeOutlined style={iconStyle} />,
  },
  {
    value: "Bồn tắm",
    label: "Bồn tắm",
    icon: <HomeOutlined style={iconStyle} />,
  },
  {
    value: "Vòi sen",
    label: "Vòi sen",
    icon: <HomeOutlined style={iconStyle} />,
  },
  {
    value: "Ban công",
    label: "Ban công",
    icon: <HomeOutlined style={iconStyle} />,
  },
];
