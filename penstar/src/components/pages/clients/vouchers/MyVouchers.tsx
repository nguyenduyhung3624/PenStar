import { Card, Empty, Tag, Button, Spin, message, Typography } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getAvailableVouchers } from "@/services/discountApi";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const MyVouchers = () => {
  const { data: response, isLoading } = useQuery({
    queryKey: ["my-vouchers"],
    queryFn: getAvailableVouchers,
  });

  const vouchers = response?.data || [];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success(`Đã sao chép mã: ${code}`);
  };

  const activeVouchers = vouchers.filter((v: any) => {
    const now = new Date();
    const start = new Date(v.start_date);
    const end = new Date(v.end_date);
    return v.status === "active" && now >= start && now <= end;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Title level={2}>Voucher của tôi</Title>
        <Text type="secondary">
          Danh sách các mã giảm giá hiện có thể sử dụng
        </Text>
      </div>

      {activeVouchers.length === 0 ? (
        <Card>
          <Empty description="Hiện không có voucher khả dụng" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeVouchers.map((voucher: any) => (
            <div
              key={voucher.id}
              className="relative bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-1 shadow-lg text-white transform hover:-translate-y-1 transition-transform"
            >
              <div className="bg-white h-full rounded-lg p-5 flex flex-col justify-between relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute -left-3 top-1/2 w-6 h-6 bg-gray-100 rounded-full transform -translate-y-1/2"></div>
                <div className="absolute -right-3 top-1/2 w-6 h-6 bg-gray-100 rounded-full transform -translate-y-1/2"></div>

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Tag color="red" className="m-0 font-bold">
                      GIẢM GIÁ
                    </Tag>
                    <div className="text-gray-400 text-xs">
                      HSD: {dayjs(voucher.end_date).format("DD/MM/YYYY")}
                    </div>
                  </div>
                  <h3 className="text-gray-800 font-bold text-lg mb-1">
                    {voucher.code}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">
                    Giảm{" "}
                    {voucher.type === "percent"
                      ? `${voucher.value}%`
                      : formatPrice(voucher.value)}
                    {voucher.min_total > 0 &&
                      ` cho đơn từ ${formatPrice(voucher.min_total)}`}
                  </p>
                  {voucher.description && (
                    <p className="text-gray-400 text-xs line-clamp-2">
                      {voucher.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <span className="text-red-500 font-bold text-xl">
                    {voucher.type === "percent"
                      ? `${voucher.value}% OFF`
                      : `-${formatPrice(voucher.value)}`}
                  </span>
                  <Button
                    icon={<CopyOutlined />}
                    size="small"
                    type="dashed"
                    danger
                    onClick={() => handleCopyCode(voucher.code)}
                  >
                    Sao chép
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyVouchers;
