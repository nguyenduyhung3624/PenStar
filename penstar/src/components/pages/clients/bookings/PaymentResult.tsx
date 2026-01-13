import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Spin, Row, Col, Typography } from "antd";
const PaymentResult: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [paymentStatus, setPaymentStatus] = React.useState<any>(null);
  const queryParams = new URLSearchParams(window.location.search);
  let bookingId: string | null = queryParams.get("bookingId");
  if (!bookingId) {
    bookingId = localStorage.getItem("bookingId"); 
  }
  React.useEffect(() => {
    const paymentMethod = queryParams.get("paymentMethod");
    const resultCode = queryParams.get("resultCode");
    const partnerCode = queryParams.get("partnerCode");
    const isMoMo =
      paymentMethod === "momo" || resultCode !== null || partnerCode === "MOMO";
    let status: any = {
      success: false,
      responseCode: null,
      transactionNo: null,
      amount: 0,
      orderId: null,
    };
    if (isMoMo) {
      const momoStatus = queryParams.get("status"); 
      const orderId = queryParams.get("orderId");
      const amount = queryParams.get("amount");
      const transId = queryParams.get("transId");
      if (resultCode !== null) {
        const resultCodeNum = Number(resultCode);
        status = {
          responseCode: resultCode,
          transactionNo: transId || orderId || null,
          amount: amount ? Number(amount) : 0,
          orderId: orderId || null,
          success: resultCode === "0" || resultCodeNum === 0,
          paymentMethod: "momo",
        };
      } else {
        status = {
          responseCode: momoStatus === "success" ? "00" : "99",
          transactionNo: orderId || null,
          amount: amount ? Number(amount) : 0,
          orderId: orderId || null,
          success: momoStatus === "success",
          paymentMethod: "momo",
        };
      }
    } else {
      const responseCode = queryParams.get("vnp_ResponseCode");
      const transactionNo = queryParams.get("vnp_TransactionNo");
      const amount = queryParams.get("vnp_Amount");
      const orderId = queryParams.get("vnp_TxnRef");
      status = {
        responseCode,
        transactionNo,
        amount: amount ? Number(amount) / 100 : 0, 
        orderId,
        success: responseCode === "00",
        paymentMethod: "vnpay",
      };
    }
    setPaymentStatus(status);
    setLoading(false);
    if (status.success && bookingId) {
      (async () => {
        try {
          const { updateMyBooking } = await import("@/services/bookingsApi");
          await updateMyBooking(Number(bookingId), { payment_status: "paid" });
        } catch (err) {
          console.error("Lỗi tự động cập nhật trạng thái booking:", err);
        }
      })();
    }
  }, []);
  const [updating, setUpdating] = React.useState(false);
  const handleGoToBookingSuccess = async () => {
    if (!bookingId) {
      alert("Không tìm thấy bookingId");
      return;
    }
    setUpdating(true);
<<<<<<< HEAD
    (async () => {
      try {
        const { updateMyBooking } = await import("@/services/bookingsApi");
        await updateMyBooking(Number(bookingId), {
          payment_status: "paid",
          stay_status_id: 1, // Đặt phòng sang trạng thái reserved/booked sau khi thanh toán thành công
        });
      } catch (err: any) {
        console.error(" Lỗi cập nhật trạng thái booking (background):", err);
      } finally {
        setUpdating(false);
      }
    })();
=======
    try {
      const { updateMyBooking } = await import("@/services/bookingsApi");
      await updateMyBooking(Number(bookingId), { payment_status: "paid" });
      navigate(`/bookings/success/${bookingId}`, {
        replace: true,
      });
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái booking:", err);
    } finally {
      setUpdating(false);
    }
>>>>>>> 5db319d5f2855bc1711f9175ef8880e356a3210b
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7fafd] flex flex-col items-center justify-center">
        <Spin size="large" tip="Đang xử lý kết quả thanh toán..." />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Card
        style={{
          maxWidth: 480,
          width: "100%",
          borderRadius: 24,
          boxShadow: "0 8px 32px 0 rgba(10,79,134,0.13)",
          padding: 0,
          background: "#fff",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            background: paymentStatus?.success ? "#f6ffed" : "#fff1f0",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 32,
            textAlign: "center",
          }}
        >
          <Typography.Title
            level={3}
            style={{
              color: paymentStatus?.success ? "#0a4f86" : "#cf1322",
              margin: 0,
              letterSpacing: 1,
            }}
          >
            {paymentStatus?.success
              ? "Thanh toán thành công!"
              : "Thanh toán thất bại"}
          </Typography.Title>
          <div className="mt-2 mb-1 text-lg font-semibold text-gray-700">
            {paymentStatus?.success
              ? "Cảm ơn bạn đã đặt phòng tại PenStar!"
              : "Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ."}
          </div>
        </div>
        <div style={{ padding: 32, paddingTop: 18 }}>
          <Row gutter={[0, 18]} justify="center">
            <Col span={24}>
              <div className="mb-4">
                <div className="text-base text-gray-700 mb-1">
                  <strong>Mã giao dịch:</strong>{" "}
                  {paymentStatus?.transactionNo || "N/A"}
                </div>
                <div className="text-base text-gray-700 mb-1">
                  <strong>Số tiền:</strong>{" "}
                  <span
                    style={{ color: "#d4380d", fontWeight: 600, fontSize: 18 }}
                  >
                    {paymentStatus?.amount?.toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                {!paymentStatus?.success && (
                  <div className="text-base text-gray-700 mb-1">
                    <strong>Mã lỗi:</strong>{" "}
                    {paymentStatus?.responseCode || "Unknown"}
                  </div>
                )}
              </div>
            </Col>
            <Col span={24}>
              <Row gutter={[12, 12]} justify="center">
                {paymentStatus?.success ? (
                  <>
                    <Col span={24}>
                      <Button
                        type="primary"
                        block
                        size="large"
                        style={{
                          backgroundColor: "#0a4f86",
                          borderColor: "#0a4f86",
                          borderRadius: 10,
                          fontWeight: 600,
                        }}
                        onClick={handleGoToBookingSuccess}
                        loading={updating}
                      >
                        {updating
                          ? "Đang cập nhật..."
                          : "Xem chi tiết đơn đặt phòng"}
                      </Button>
                    </Col>
                    <Col span={24}>
                      <Button
                        block
                        size="large"
                        style={{
                          borderRadius: 10,
                          fontWeight: 500,
                          backgroundColor: "#dc2626",
                          borderColor: "#dc2626",
                          color: "#fff",
                        }}
                        onClick={() => navigate("/")}
                      >
                        Về trang chủ
                      </Button>
                    </Col>
                  </>
                ) : (
                  <>
                    <Col span={24}>
                      <Button
                        type="primary"
                        block
                        size="large"
                        style={{
                          backgroundColor: "#0a4f86",
                          borderColor: "#0a4f86",
                          borderRadius: 10,
                          fontWeight: 600,
                        }}
                        onClick={async () => {
                          const bookingId = localStorage.getItem("bookingId");
                          if (bookingId) {
                            try {
                              const { getBookingById } = await import(
                                "@/services/bookingsApi"
                              );
                              const bookingInfo = await getBookingById(
                                Number(bookingId)
                              );
                              navigate("/bookings/payment-method", {
                                state: {
                                  bookingId: Number(bookingId),
                                  bookingInfo: bookingInfo,
                                },
                              });
                            } catch (err) {
                              console.error("Error fetching booking:", err);
                              navigate(-1);
                            }
                          } else {
                            navigate(-1);
                          }
                        }}
                      >
                        Thanh toán lại
                      </Button>
                    </Col>
                    <Col span={24}>
                      <Button
                        block
                        size="large"
                        style={{
                          borderRadius: 10,
                          fontWeight: 500,
                          backgroundColor: "#dc2626",
                          borderColor: "#dc2626",
                          color: "#fff",
                        }}
                        onClick={() => navigate("/")}
                      >
                        Về trang chủ
                      </Button>
                    </Col>
                  </>
                )}
              </Row>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};
export default PaymentResult;
