/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Select,
  Checkbox,
  Row,
  Col,
  Divider,
  Modal,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { createBooking } from "@/services/bookingsApi";
import { createPayment, createMoMoPayment } from "@/services/paymentApi";
import { useMutation } from "@tanstack/react-query";
import useAuth from "@/hooks/useAuth";

import {
  checkDiscountCode,
  suggestDiscountCodes,
} from "@/services/discountApi";
import { AutoComplete } from "antd";

const { TextArea } = Input;
const { Option } = Select;

const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const auth = useAuth();
  const user = auth?.user;

  // Dữ liệu từ RoomSearchResults
  const {
    searchParams,
    items = [],
    totalPrice: totalPriceFromState,
  } = location.state || {};

  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });
  const [promoCode, setPromoCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [suggestedCodes, setSuggestedCodes] = useState<
    { label: string; value: string; description?: string }[]
  >([]);

  // (Đã chuyển useEffect này xuống sau khi khai báo totalRoomPrice)
  const [notes, setNotes] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("vnpay");
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Auto-fill user info
  useEffect(() => {
    if (user) {
      const data = {
        customer_name: user.full_name || "",
        customer_email: user.email || "",
        customer_phone: user.phone || "",
      };
      form.setFieldsValue(data);
      setCustomerInfo(data);
    }
  }, [user, form]);

  // Tính số đêm
  const nights = useMemo(() => {
    if (!searchParams?.check_in || !searchParams?.check_out) return 1;
    const diff =
      new Date(searchParams.check_out).getTime() -
      new Date(searchParams.check_in).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [searchParams]);

  // Tính tổng tiền phòng - ưu tiên dùng totalPrice từ state
  const totalRoomPrice = useMemo(() => {
    if (totalPriceFromState) {
      return totalPriceFromState;
    }
    return items.reduce((sum: number, item: any) => {
      const pricePerNight =
        Number(item.base_price || item.room_type_price) +
        Number(item.extra_fees || 0);
      return sum + pricePerNight * nights;
    }, 0);
  }, [items, nights, totalPriceFromState]);

  // Lấy danh sách mã giảm giá đề xuất đủ điều kiện
  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const data = await suggestDiscountCodes(totalRoomPrice);
        if (data.ok && Array.isArray(data.codes)) {
          setSuggestedCodes(
            data.codes.map((c: any) => ({
              label: c.code + (c.description ? ` - ${c.description}` : ""),
              value: c.code,
              description: c.description,
            }))
          );
        }
      } catch (e) {
        setSuggestedCodes([]);
      }
    };
    fetchSuggested();
  }, [totalRoomPrice]);

  // Lấy danh sách mã giảm giá đề xuất đủ điều kiện
  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await fetch(
          "/api/discount-codes/suggest?total=" + totalRoomPrice
        );
        const data = await res.json();
        if (data.ok && Array.isArray(data.codes)) {
          setSuggestedCodes(
            data.codes.map((c: any) => ({
              label: c.code + (c.description ? ` - ${c.description}` : ""),
              value: c.code,
              description: c.description,
            }))
          );
        }
      } catch (e) {
        setSuggestedCodes([]);
      }
    };
    fetchSuggested();
  }, [totalRoomPrice]);

  // Tổng sau giảm giá
  const totalAfterDiscount = useMemo(() => {
    if (discountInfo?.discountAmount) {
      return Math.max(0, totalRoomPrice - discountInfo.discountAmount);
    }
    return totalRoomPrice;
  }, [totalRoomPrice, discountInfo]);

  // Format giá
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Math.round(price));

  // Mutation create booking
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: async (res: any) => {
      const bookingId = res?.id || res?.data?.id;
      const booking = res?.data || res;

      // Nếu chọn cash (tiền mặt), chuyển thẳng sang success
      if (paymentMethod === "cash") {
        message.success(
          "Đặt phòng thành công! Vui lòng thanh toán khi nhận phòng."
        );
        navigate(`/bookings/success/${bookingId}`, {
          state: { booking },
        });
        return;
      }

      // Nếu chọn online payment (vnpay/momo), tạo payment URL
      try {
        let paymentUrl: string = "";
        const paymentParams = {
          bookingId: bookingId,
          amount: totalAfterDiscount,
          orderInfo: `Thanh toán đặt phòng #${bookingId}`,
        };

        if (paymentMethod === "vnpay") {
          const paymentRes = await createPayment(paymentParams);
          paymentUrl =
            paymentRes.paymentUrl ?? paymentRes.data?.paymentUrl ?? "";
        } else if (paymentMethod === "momo") {
          const paymentRes = await createMoMoPayment(paymentParams);
          paymentUrl =
            paymentRes.paymentUrl ?? paymentRes.data?.paymentUrl ?? "";
        }

        if (paymentUrl) {
          message.success("Đang chuyển đến trang thanh toán...");
          // Lưu bookingId vào localStorage để PaymentResult có thể lấy
          localStorage.setItem("bookingId", bookingId.toString());
          localStorage.setItem("bookingInfo", JSON.stringify(booking));
          // Redirect to payment gateway
          window.location.href = paymentUrl;
        } else {
          throw new Error("Không nhận được URL thanh toán");
        }
      } catch (paymentError: any) {
        console.error("Payment error:", paymentError);
        message.error("Lỗi khi tạo thanh toán. Vui lòng thử lại.");
      }
    },
    onError: (err: any) => {
      console.error("Booking error:", err);
      message.error(err?.response?.data?.message || "Đặt phòng thất bại");
    },
  });

  // Kiểm tra mã giảm giá
  // Chỉ kiểm tra và báo lỗi khi ấn nút Áp dụng
  const handleCheckDiscount = async (code?: string) => {
    const codeToCheck = (code ?? promoCode).trim();
    if (!codeToCheck) {
      setDiscountInfo(null);
      return message.warning("Vui lòng nhập mã giảm giá");
    }
    setCheckingDiscount(true);
    try {
      const res = await checkDiscountCode(codeToCheck, totalRoomPrice);
      if (res.ok) {
        setDiscountInfo({
          code: codeToCheck,
          discountAmount: res.discountAmount,
        });
        message.success(
          `Áp dụng mã thành công! Giảm ${formatPrice(res.discountAmount)}`
        );
      } else {
        setDiscountInfo(null);
        // Chỉ báo lỗi khi người dùng thực sự ấn nút Áp dụng
        message.error(res.error || "Mã không hợp lệ");
      }
    } catch (err: any) {
      setDiscountInfo(null);
      message.error(err?.response?.data?.error || "Mã không hợp lệ");
    } finally {
      setCheckingDiscount(false);
    }
  };

  // Submit form
  // Helper: check refund eligibility for all items (dùng refund_policy từ item)
  const checkRefundEligibility = () => {
    const now = new Date();
    const messages: string[] = [];
    let allEligible = true;
    items.forEach((item: any, idx: number) => {
      const refund = item.refund_policy;
      if (!refund) return;
      if (refund.non_refundable) {
        messages.push(`Phòng ${idx + 1}: Không hoàn tiền khi hủy.`);
        allEligible = false;
        return;
      }
      if (
        refund.refundable &&
        refund.refund_deadline_hours &&
        searchParams?.check_in
      ) {
        const checkIn = new Date(searchParams.check_in);
        const diffMs = checkIn.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < refund.refund_deadline_hours) {
          messages.push(
            `Phòng ${idx + 1}: Không đủ điều kiện hoàn tiền (chỉ hoàn nếu hủy trước ${refund.refund_deadline_hours}h).`
          );
          allEligible = false;
        }
      }
    });
    return { eligible: allEligible, messages };
  };

  const handleSubmit = async () => {
    if (!customerInfo.customer_name?.trim()) {
      return message.error("Vui lòng nhập họ tên");
    }
    if (!customerInfo.customer_phone?.trim()) {
      return message.error("Vui lòng nhập số điện thoại");
    }
    if (!customerInfo.customer_email?.trim()) {
      return message.error("Vui lòng nhập email");
    }
    if (!agreePolicy) {
      return message.error("Vui lòng đồng ý với chính sách đặt phòng");
    }
    // Validate refund eligibility before booking
    const refundCheck = checkRefundEligibility();
    if (!refundCheck.eligible) {
      message.warning(
        <div>
          <div>Không đủ điều kiện hoàn tiền cho một số phòng nếu hủy:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {refundCheck.messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
          <div className="mt-1">Bạn vẫn muốn tiếp tục đặt phòng?</div>
        </div>,
        6
      );
      // Optionally: return here to block booking, or allow to continue
      // return;
    }

    // Validate mã giảm giá nếu có nhập
    if (promoCode.trim()) {
      if (!discountInfo) {
        return message.error(
          "Vui lòng kiểm tra và áp dụng mã giảm giá trước khi đặt phòng."
        );
      }
      // Có discountInfo nhưng cần xác thực lại với backend (tránh trường hợp mã hết hạn giữa lúc đặt)
      try {
        const res = await checkDiscountCode(promoCode.trim(), totalRoomPrice);
        if (!res.ok) {
          setDiscountInfo(null);
          return message.error(
            res.error || "Mã giảm giá không hợp lệ hoặc đã hết hạn."
          );
        }
      } catch (err: any) {
        setDiscountInfo(null);
        return message.error(
          "Không thể xác thực mã giảm giá. Vui lòng thử lại."
        );
      }
    }

    // Gom nhóm items theo room_type_id, num_adults, num_children để tạo rooms_config cho backend
    const roomsConfigMap: Record<string, any> = {};

    items.forEach((item: any) => {
      const key = `${item.room_type_id}-${item.num_adults}-${item.num_children}`;
      // Parse base price - use base_price or room_type_price, ensure it's a number
      const basePrice =
        Number(item.base_price) || Number(item.room_type_price) || 0;

      if (!roomsConfigMap[key]) {
        roomsConfigMap[key] = {
          room_type_id: item.room_type_id,
          quantity: 0,
          check_in: searchParams.check_in,
          check_out: searchParams.check_out,
          room_type_price: Math.round(basePrice * nights),
          num_adults: item.num_adults,
          num_children: item.num_children,
          // Khởi tạo các trường phụ phí
          extra_fees: 0,
          extra_adult_fees: 0,
          extra_child_fees: 0,
        };
      }
      roomsConfigMap[key].quantity += 1;
      // Cộng dồn phụ phí cho từng nhóm
      roomsConfigMap[key].extra_fees += Number(item.extra_fees || 0) * nights;
      roomsConfigMap[key].extra_adult_fees +=
        Number(item.extra_adult_fees || 0) * nights;
      roomsConfigMap[key].extra_child_fees +=
        Number(item.extra_child_fees || 0) * nights;
    });

    // Lấy trung bình phụ phí trên mỗi phòng (nếu cần)
    Object.values(roomsConfigMap).forEach((cfg: any) => {
      if (cfg.quantity > 0) {
        cfg.extra_fees = Math.round(cfg.extra_fees / cfg.quantity);
        cfg.extra_adult_fees = Math.round(cfg.extra_adult_fees / cfg.quantity);
        cfg.extra_child_fees = Math.round(cfg.extra_child_fees / cfg.quantity);
      }
    });

    // Truyền đủ các trường phụ phí vào từng item, KHÔNG truyền num_babies
    const itemsWithFees = items.map((item: any) => {
      const key = `${item.room_type_id}-${item.num_adults}-${item.num_children}`;
      const config = roomsConfigMap[key];
      const basePrice =
        Number(item.base_price) || Number(item.room_type_price) || 0;

      return {
        room_id: item.room_id,
        room_type_id: item.room_type_id,
        check_in: searchParams.check_in,
        check_out: searchParams.check_out,
        room_type_price: Math.round(basePrice * nights),
        num_adults: item.num_adults ?? 1,
        num_children: item.num_children ?? 0,
        num_babies: item.num_babies ?? 0,
        extra_fees: Math.round(config?.extra_fees ?? 0),
        extra_adult_fees: Math.round(config?.extra_adult_fees ?? 0),
        extra_child_fees: Math.round(config?.extra_child_fees ?? 0),
      };
    });

    const payload = {
      customer_name: customerInfo.customer_name,
      customer_email: customerInfo.customer_email,
      customer_phone: customerInfo.customer_phone,
      notes: notes || undefined,
      discount_code: discountInfo?.code || undefined,
      discount_amount: discountInfo?.discountAmount || 0,
      total_price: totalAfterDiscount,
      payment_status: "unpaid",
      payment_method: paymentMethod,
      booking_method: "online",
      stay_status_id: 6, // pending
      items: itemsWithFees,
    };

    console.log("📤 Payload gửi backend:", payload);
    createBookingMutation.mutate(payload as any);
  };

  if (!searchParams || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <p>Không có thông tin đặt phòng. Vui lòng quay lại trang tìm kiếm.</p>
          <Button type="primary" onClick={() => navigate("/")}>
            Quay về trang chủ
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            type="text"
          >
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-center mt-2">
            THÔNG TIN ĐẶT PHÒNG
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Row gutter={24}>
          {/* Left Column - Form */}
          <Col xs={24} lg={14}>
            <Card title="Thông tin người đặt phòng">
              <Form form={form} layout="vertical">
                <Form.Item label="Tên" required>
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Nhập họ và tên"
                    value={customerInfo.customer_name}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </Form.Item>

                <Form.Item label="Email" required>
                  <Input
                    prefix={<MailOutlined />}
                    type="email"
                    placeholder="email@example.com"
                    value={customerInfo.customer_email}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_email: e.target.value,
                      })
                    }
                  />
                </Form.Item>

                <Form.Item label="Số điện thoại" required>
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="+84 - 987 654 321"
                    value={customerInfo.customer_phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_phone: e.target.value,
                      })
                    }
                  />
                </Form.Item>

                <Form.Item label="Yêu cầu thêm">
                  <TextArea
                    rows={4}
                    placeholder="Ví dụ: Số tầng, Giường đơn hay Giường đôi cho bạn hoặc kích cỡ giường, đệm thêm hoặc nệm khách..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Form.Item>
              </Form>
            </Card>

            {/* Chính sách */}
            <Card title="Chính sách đặt phòng" className="mt-4">
              <div className="space-y-2 text-sm">
                <p>
                  ✓ Hãy đảm bảo thông tin chính xác, nhất là số điện
                  thoại/email.
                </p>
                <p>
                  ✓ Thanh toán: Thanh toán toàn bộ tiền đặt phòng khi chọn nhận
                  phòng.
                </p>
                <p>✓ Không hoàn tiền khi hủy đặt phòng.</p>
                <p>✓ Đã bao gồm ăn sáng.</p>
              </div>
            </Card>

            {/* Payment Method */}
            <Card title="Phương thức thanh toán" className="mt-4">
              <Select
                value={paymentMethod}
                onChange={setPaymentMethod}
                style={{ width: "100%" }}
              >
                <Option value="vnpay">
                  <div className="flex items-center">
                    <span className="mr-2">💳</span> VNPay (Thẻ ATM)
                  </div>
                </Option>
                <Option value="momo">MoMo</Option>
                <Option value="cash">Tiền mặt khi nhận phòng</Option>
              </Select>
            </Card>
          </Col>

          {/* Right Column - Booking Summary */}
          <Col xs={24} lg={10}>
            <Card title="Yêu cầu đặt phòng của bạn" className="sticky top-4">
              <div className="space-y-4">
                {/* Hotel Info */}
                <div>
                  <h3 className="font-bold text-lg">PenStar Luxury Hotel</h3>
                  <p className="text-sm text-gray-600">
                    Nhận phòng: {searchParams.check_in}
                  </p>
                  <p className="text-sm text-gray-600">
                    Trả phòng: {searchParams.check_out} cho đến 14:00
                  </p>
                  <p className="text-sm text-gray-600">
                    ({nights} đêm | {items.length} phòng)
                  </p>
                </div>

                <Divider />

                {/* Room Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Thông tin phòng:</h4>
                  {items.map((item: any, idx: number) => {
                    const basePrice = Math.round(
                      Number(item.base_price || item.room_type_price) * nights
                    );
                    const extraAdultFees = Math.round(
                      Number(item.extra_adult_fees || 0) * nights
                    );
                    const extraChildFees = Math.round(
                      Number(item.extra_child_fees || 0) * nights
                    );
                    const totalExtraFees = extraAdultFees + extraChildFees;
                    const totalPerRoom = basePrice + totalExtraFees;

                    const refund = item.refund_policy;

                    return (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">
                          Phòng {idx + 1}:{" "}
                          {item.room_type_name || "Phòng Deluxe"}
                        </p>

                        {/* Thông tin khách */}
                        <p className="text-sm text-gray-600 mt-1">
                          Dành cho {item.num_adults} Người lớn -{" "}
                          {item.num_children} Trẻ em
                          {item.num_babies > 0 && ` - ${item.num_babies} Em bé`}
                        </p>

                        {/* Refund Policy Display */}
                        {refund && (
                          <div className="mt-2 p-2 rounded bg-blue-50 border border-blue-200">
                            <div className="font-semibold text-blue-700 mb-1">
                              Chính sách hoàn tiền:
                            </div>
                            {refund.non_refundable ? (
                              <div className="text-red-600 font-bold">
                                Không hoàn tiền khi hủy phòng này.
                              </div>
                            ) : refund.refundable ? (
                              <>
                                <div>
                                  Hoàn tiền{" "}
                                  <span className="font-bold text-green-700">
                                    {refund.refund_percent ?? 100}%
                                  </span>
                                  {refund.refund_deadline_hours && (
                                    <>
                                      {" "}
                                      (nếu hủy trước{" "}
                                      <span className="font-bold">
                                        {refund.refund_deadline_hours}h
                                      </span>{" "}
                                      trước giờ nhận phòng)
                                    </>
                                  )}
                                </div>
                                {refund.notes && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {refund.notes}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-gray-600">
                                Chính sách hoàn tiền không xác định.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Chi tiết phụ phí */}
                        {(extraAdultFees > 0 || extraChildFees > 0) && (
                          <div className="mt-2 space-y-1">
                            {extraAdultFees > 0 && (
                              <p className="text-sm text-orange-600">
                                Phụ thu người lớn:{" "}
                                {formatPrice(extraAdultFees / nights)} VND /đêm
                              </p>
                            )}
                            {extraChildFees > 0 && (
                              <p className="text-sm text-orange-600">
                                Phụ thu trẻ em:{" "}
                                {formatPrice(extraChildFees / nights)} VND /đêm
                              </p>
                            )}
                          </div>
                        )}

                        {/* Giá phòng */}
                        <p className="text-sm text-gray-700 mt-2">
                          Giá phòng: {formatPrice(basePrice)}
                        </p>

                        {/* Tổng */}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                          <span className="font-semibold text-base">Tổng:</span>
                          <span className="font-bold text-lg">
                            {formatPrice(totalPerRoom)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Divider />

                {/* Price Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Giá phòng:</span>
                    <span className="font-semibold">
                      {formatPrice(totalRoomPrice)}
                    </span>
                  </div>
                  {/* Input mã giảm giá */}
                  <div className="flex items-center gap-2 mb-2">
                    <AutoComplete
                      options={suggestedCodes}
                      value={promoCode}
                      onSelect={(val) => {
                        setPromoCode(val);
                        handleCheckDiscount(val);
                      }}
                      onChange={(val) => setPromoCode(val)}
                      placeholder="Nhập hoặc chọn mã giảm giá"
                      style={{
                        minWidth: 180,
                        maxWidth: 320,
                        width: 220,
                        fontWeight: 600,
                        fontStyle: "italic",
                      }}
                      disabled={!!discountInfo}
                      allowClear
                      filterOption={(inputValue, option) => {
                        if (!option || typeof option.value !== "string")
                          return false;
                        return option.value
                          .toLowerCase()
                          .includes(inputValue.toLowerCase());
                      }}
                    />
                    <Button
                      type="primary"
                      onClick={() => handleCheckDiscount()}
                      loading={checkingDiscount}
                      disabled={!!discountInfo}
                    >
                      Áp dụng
                    </Button>
                    {discountInfo && (
                      <Button
                        type="link"
                        danger
                        onClick={() => {
                          setDiscountInfo(null);
                          setPromoCode("");
                        }}
                      >
                        Xóa mã
                      </Button>
                    )}
                    {/* Always show entered code if not yet applied */}
                  </div>
                  {discountInfo && (
                    <div className="flex justify-between text-green-600">
                      <span>Mã khuyến mãi:</span>
                      <span className="font-semibold">
                        {discountInfo.code} (-
                        {formatPrice(discountInfo.discountAmount)})
                      </span>
                    </div>
                  )}
                </div>

                <Divider />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Tổng giá:</span>
                  <span className="text-2xl font-bold text-orange-500">
                    {formatPrice(totalAfterDiscount)}
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  Bao gồm tất cả các loại thuế. Quý khách vui lòng thanh toán
                  theo giá VND.
                </p>

                <Divider />

                {/* Checkbox đồng ý */}
                <Checkbox
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                >
                  Tôi đã đọc và đồng ý với{" "}
                  <span
                    className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                    onClick={(e) => {
                      e.preventDefault();
                      setTermsModalOpen(true);
                    }}
                  >
                    điều khoản đặt phòng
                  </span>{" "}
                  của khách sạn.
                </Checkbox>

                {/* Nút thực hiện */}
                <Button
                  type="primary"
                  size="large"
                  block
                  className="mt-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    border: "none",
                    height: "48px",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                  onClick={handleSubmit}
                  loading={createBookingMutation.isPending}
                >
                  THỰC HIỆN ĐẶT PHÒNG
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Terms Modal */}
      <Modal
        title="Điều khoản đặt phòng"
        open={termsModalOpen}
        onCancel={() => setTermsModalOpen(false)}
        footer={
          <Button type="primary" onClick={() => setTermsModalOpen(false)}>
            Đã hiểu
          </Button>
        }
        width={700}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <section>
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              1. Chính sách đặt phòng
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>
                Quý khách cần cung cấp đầy đủ thông tin chính xác khi đặt phòng.
              </li>
              <li>
                Phòng được giữ đến 18:00 ngày nhận phòng trừ khi có thông báo
                trước.
              </li>
              <li>Thời gian nhận phòng: 14:00 - Trả phòng: 12:00.</li>
              <li>
                Nhận phòng sớm hoặc trả phòng muộn có thể phát sinh phí bổ sung.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              2. Chính sách thanh toán
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>
                Thanh toán trực tuyến qua VNPay, MoMo hoặc tiền mặt khi nhận
                phòng.
              </li>
              <li>
                Thanh toán online được xử lý an toàn qua cổng thanh toán uy tín.
              </li>
              <li>Giá đã bao gồm thuế VAT và phí dịch vụ.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              3. Chính sách hủy phòng & hoàn tiền
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>
                Hủy trước 24 giờ so với ngày nhận phòng: Hoàn 100% tiền phòng.
              </li>
              <li>
                Hủy trong vòng 24 giờ trước ngày nhận phòng: Không hoàn tiền.
              </li>
              <li>Không đến (No-show): Không hoàn tiền.</li>
              <li>Yêu cầu hoàn tiền sẽ được xử lý trong 3-5 ngày làm việc.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              4. Quy định khác
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Cấm hút thuốc trong phòng. Vi phạm sẽ bị phạt 500,000đ.</li>
              <li>
                Không mang vật nuôi vào khách sạn (trừ trường hợp đặc biệt).
              </li>
              <li>Khách phải xuất trình CMND/CCCD/Hộ chiếu khi nhận phòng.</li>
              <li>
                Khách sạn không chịu trách nhiệm về tài sản cá nhân không gửi
                tại két an toàn.
              </li>
              <li>
                Mọi hư hỏng do khách gây ra sẽ được tính phí sửa chữa/bồi
                thường.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg text-gray-800 mb-2">5. Liên hệ</h3>
            <p className="text-gray-600">
              Mọi thắc mắc xin liên hệ: <br />
              📧 Email: info@penstar.example <br />
              📞 Hotline: 0123 456 789 <br />
              🏨 Địa chỉ: Số 1, Đường Chính, Quận Trung tâm
            </p>
          </section>
        </div>
      </Modal>
    </div>
  );
};

export default BookingConfirm;
