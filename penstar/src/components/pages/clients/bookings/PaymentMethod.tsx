/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, Radio, Typography, Spin, message, Space } from "antd";
import {
  CreditCardOutlined,
  WalletOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { createPayment, createMoMoPayment } from "@/services/paymentApi";

const { Title, Text } = Typography;

const PaymentMethod: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"vnpay" | "momo">("vnpay");

  // Lấy bookingInfo từ state hoặc localStorage
  const { bookingId, bookingInfo } = (location.state as any) || {};
  const [booking, setBooking] = useState<any>(bookingInfo || null);

  useEffect(() => {
    // Nếu không có bookingInfo từ state, thử lấy từ bookingId
    const fetchBooking = async () => {
      if (!booking && bookingId) {
        try {
          const { getBookingById } = await import("@/services/bookingsApi");
          const data = await getBookingById(Number(bookingId));
          setBooking(data);
        } catch (err) {
          console.error("Error fetching booking:", err);
          message.error("Không tìm thấy thông tin đặt phòng");
          navigate("/");
        }
      }
    };
    fetchBooking();
  }, [bookingId, booking, navigate]);

  // Nếu không có bookingId và bookingInfo, redirect về home
  useEffect(() => {
    if (!bookingId && !bookingInfo) {
      message.error("Không tìm thấy thông tin đặt phòng");
      navigate("/");
    }
  }, [bookingId, bookingInfo, navigate]);

  const handlePayment = async () => {
    if (!booking) {
      message.error("Không tìm thấy thông tin đặt phòng");
      return;
    }

    setLoading(true);
    try {
      const totalPrice = booking.total_price || 0;
      const currentBookingId = bookingId || booking.id;

      // Lưu bookingId vào localStorage để PaymentResult có thể lấy
      localStorage.setItem("bookingId", String(currentBookingId));

      const returnUrl = `${window.location.origin}/payment-result?bookingId=${currentBookingId}`;

      if (paymentMethod === "vnpay") {
        const result = await createPayment({
          bookingId: currentBookingId,
          amount: totalPrice,
          returnUrl,
        });
        const paymentUrl = result?.paymentUrl || result?.data?.paymentUrl;
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          throw new Error("Không thể tạo link thanh toán VNPay");
        }
      } else if (paymentMethod === "momo") {
        const result = await createMoMoPayment({
          bookingId: currentBookingId,
          amount: totalPrice,
          orderInfo: `Thanh toán đặt phòng #${currentBookingId}`,
          returnUrl,
        });
        const paymentUrl = result?.paymentUrl || result?.data?.paymentUrl;
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          throw new Error("Không thể tạo link thanh toán MoMo");
        }
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      message.error(err.message || "Có lỗi xảy ra khi tạo thanh toán");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải thông tin đặt phòng..." />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="mb-4 p-0"
        >
          Quay lại
        </Button>

        <Card className="shadow-md">
          <Title level={3} className="text-center mb-6">
            Thanh toán lại
          </Title>

          {/* Thông tin đơn hàng */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <Text strong>Mã đặt phòng: </Text>
            <Text>#{booking.id}</Text>
            <br />
            <Text strong>Khách hàng: </Text>
            <Text>{booking.customer_name}</Text>
            <br />
            <Text strong className="text-lg">
              Tổng tiền:{" "}
            </Text>
            <Text strong className="text-lg text-red-600">
              {formatPrice(booking.total_price || 0)}
            </Text>
          </div>

          {/* Chọn phương thức thanh toán */}
          <div className="mb-6">
            <Text strong className="block mb-3">
              Chọn phương thức thanh toán:
            </Text>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full"
            >
              <Space direction="vertical" className="w-full">
                <Radio
                  value="vnpay"
                  className="w-full p-3 border rounded-lg hover:border-blue-500"
                >
                  <Space>
                    <CreditCardOutlined className="text-blue-600 text-xl" />
                    <span>VNPay (Thẻ ATM/Visa/MasterCard)</span>
                  </Space>
                </Radio>
                <Radio
                  value="momo"
                  className="w-full p-3 border rounded-lg hover:border-pink-500"
                >
                  <Space>
                    <WalletOutlined className="text-pink-600 text-xl" />
                    <span>Ví MoMo</span>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </div>

          {/* Nút thanh toán */}
          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={handlePayment}
            style={{
              backgroundColor: paymentMethod === "momo" ? "#a50064" : "#0a4f86",
              borderColor: paymentMethod === "momo" ? "#a50064" : "#0a4f86",
              height: 48,
              fontWeight: 600,
            }}
          >
            {loading
              ? "Đang xử lý..."
              : `Thanh toán ${formatPrice(booking.total_price || 0)}`}
          </Button>

          <div className="text-center mt-4">
            <Button type="link" onClick={() => navigate("/")}>
              Về trang chủ
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentMethod;
