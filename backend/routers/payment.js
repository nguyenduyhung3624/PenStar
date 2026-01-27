import { Router } from "express";
import qs from "querystring";
import crypto from "crypto";
import moment from "moment";
import axios from "axios";
const paymentRouter = Router();
function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}
paymentRouter.get("/create_payment", (req, res) => {
  const { amount } = req.query;
  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum < 5000 || amountNum > 1000000000) {
    return res.status(400).json({
      error: "Số tiền không hợp lệ. Số tiền phải từ 5,000 đến dưới 1 tỷ VNĐ.",
    });
  }
  const tmnCode = "1QN514ZX";
  const secretKey = "OC9XPP932WGHC29PZEX46NXITSHZKLX9";
  let returnUrl =
    req.query.returnUrl ||
    `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-result`;
  if (req.query.bookingId) {
    const urlObj = new URL(returnUrl);
    urlObj.searchParams.set("bookingId", req.query.bookingId);
    returnUrl = urlObj.toString();
  }
  const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  let ipAddr = req.ip;
  let orderId = moment().format("YYYYMMDDHHmmss");
  let bankCode = req.query.bankCode || "NCB";
  let createDate = moment().format("YYYYMMDDHHmmss");
  let orderInfo = "Thanh_toan_don_hang";
  let locale = req.query.language || "vn";
  let currCode = "VND";
  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "billpayment",
    vnp_Amount: amountNum * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };
  if (bankCode !== "") {
    vnp_Params["vnp_BankCode"] = bankCode;
  }
  vnp_Params = sortObject(vnp_Params);
  let signData = qs.stringify(vnp_Params);
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  let paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params);
  res.json({ paymentUrl });
});
paymentRouter.get("/check_payment", async (req, res) => {
  const query = req.query;
  const secretKey = "OC9XPP932WGHC29PZEX46NXITSHZKLX9";
  const vnp_SecureHash = query.vnp_SecureHash;
  delete query.vnp_SecureHash;
  const signData = qs.stringify(query);
  const hmac = crypto.createHmac("sha512", secretKey);
  const checkSum = hmac.update(signData).digest("hex");
  console.log("[VNPay] Check payment query:", query);
  if (vnp_SecureHash === checkSum) {
    if (query.vnp_ResponseCode === "00") {
      const orderId = query.vnp_TxnRef;
      let bookingId = null;
      if (orderId) {
        if (!isNaN(parseInt(orderId))) {
          bookingId = parseInt(orderId);
        }
      }
      if (bookingId) {
        try {
          const { modelGetBookingById } =
            await import("../models/bookingsmodel.js");
          const booking = await modelGetBookingById(bookingId);
          if (booking && booking.notes) {
            const discountMatch = booking.notes.match(
              /\[Discount: ({[^}]+})\]/,
            );
            if (discountMatch) {
              const discountInfo = JSON.parse(discountMatch[1]);
              if (discountInfo.promo_code) {
                const { incrementUsageCount } =
                  await import("../models/discountcodesmodel.js");
                const updatedDiscount = await incrementUsageCount(
                  discountInfo.promo_code,
                );
                console.log(
                  `[VNPay] Incremented usage count for discount code: ${discountInfo.promo_code}`,
                );
                console.log(
                  `[VNPay] New usage count: ${
                    updatedDiscount?.used_count || "N/A"
                  }`,
                );
              }
            }
          }
        } catch (discountErr) {
          console.error("[VNPay] Error incrementing usage count:", discountErr);
        }
      }
      res.json({ message: "Thanh toán thành công", data: query });
    } else {
      res.json({ message: "Thanh toán thất bại", data: query });
    }
  } else {
    res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }
});
paymentRouter.get("/create_momo_payment", async (req, res) => {
  const { amount, orderId, orderInfo } = req.query;
  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum < 1000 || amountNum > 100000000) {
    return res.status(400).json({
      error: "Số tiền không hợp lệ. Số tiền phải từ 1,000 đến 100 triệu VNĐ.",
    });
  }
  const momoEnv = process.env.MOMO_ENV || "test";
  const isTestMode = momoEnv === "test" || momoEnv === "mock";
  const isProduction = momoEnv === "production";
  const returnUrl =
    req.query.returnUrl ||
    `${req.protocol}://${req.get("host")}/payment-result`;
  const notifyUrl =
    req.query.notifyUrl ||
    `${req.protocol}://${req.get("host")}/api/payment/momo-callback`;
  const orderIdFinal =
    orderId || `BOOKING_${moment().format("YYYYMMDDHHmmss")}`;
  const requestId = moment().format("YYYYMMDDHHmmss");
  const orderInfoFinal = orderInfo || "Thanh_toan_don_hang";
  if (isTestMode) {
    console.log("[MoMo] Running in TEST/MOCK mode - creating mock payment URL");
    let frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    try {
      const returnUrlObj = new URL(returnUrl);
      frontendBaseUrl = `${returnUrlObj.protocol}//${returnUrlObj.host}`;
    } catch (e) {
      console.warn(
        "[MoMo] Could not parse returnUrl, using default frontend URL:",
        frontendBaseUrl,
      );
    }
    const mockPaymentUrl = `${frontendBaseUrl}/momo-mock-payment?orderId=${encodeURIComponent(
      orderIdFinal,
    )}&amount=${amountNum}&orderInfo=${encodeURIComponent(
      orderInfoFinal,
    )}&returnUrl=${encodeURIComponent(returnUrl)}`;
    return res.json({
      paymentUrl: mockPaymentUrl,
      orderId: orderIdFinal,
      requestId,
      message: "Tạo yêu cầu thanh toán MoMo thành công (TEST MODE)",
      testMode: true,
      warning:
        "Đang sử dụng chế độ test. Để sử dụng API thực tế, cấu hình MOMO_ENV=production và thêm credentials vào .env",
    });
  }
  const momoApiUrl =
    process.env.MOMO_API_URL ||
    (isProduction
      ? "https://payment.momo.vn/v2/gateway/api/create"
      : "https://test-payment.momo.vn/gw_payment/transactionProcessor");
  const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
  const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
  const secretKey =
    process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const requestType = process.env.MOMO_REQUEST_TYPE || "captureMoMoWallet";
  if (
    !process.env.MOMO_PARTNER_CODE ||
    !process.env.MOMO_ACCESS_KEY ||
    !process.env.MOMO_SECRET_KEY
  ) {
    console.warn(
      "[MoMo] Missing credentials in .env - falling back to test mode",
    );
    let frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    try {
      const returnUrlObj = new URL(returnUrl);
      frontendBaseUrl = `${returnUrlObj.protocol}//${returnUrlObj.host}`;
    } catch (e) {
      console.warn(
        "[MoMo] Could not parse returnUrl, using default frontend URL:",
        frontendBaseUrl,
      );
    }
    const mockPaymentUrl = `${frontendBaseUrl}/momo-mock-payment?orderId=${encodeURIComponent(
      orderIdFinal,
    )}&amount=${amountNum}&orderInfo=${encodeURIComponent(
      orderInfoFinal,
    )}&returnUrl=${encodeURIComponent(returnUrl)}`;
    return res.json({
      paymentUrl: mockPaymentUrl,
      orderId: orderIdFinal,
      requestId,
      message:
        "Tạo yêu cầu thanh toán MoMo thành công (TEST MODE - No credentials)",
      testMode: true,
      warning:
        "Chưa có MoMo credentials trong .env. Đang sử dụng chế độ test. Để sử dụng API thực tế, thêm MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY vào .env",
    });
  }
  const extraData = "";
  const rawSignature = `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${requestId}&amount=${amountNum}&orderId=${orderIdFinal}&orderInfo=${orderInfoFinal}&returnUrl=${returnUrl}&notifyUrl=${notifyUrl}&extraData=${extraData}`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount: amountNum.toString(),
    orderId: orderIdFinal,
    orderInfo: orderInfoFinal,
    returnUrl,
    notifyUrl,
    extraData,
    requestType: requestType,
    signature,
    lang: "vi",
  };
  try {
    console.log("[MoMo] Calling API:", momoApiUrl);
    console.log("[MoMo] Request body:", JSON.stringify(requestBody, null, 2));
    const response = await axios.post(momoApiUrl, requestBody, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
    console.log("[MoMo] API Response:", response.data);
    if (response.data && response.data.payUrl) {
      res.json({
        paymentUrl: response.data.payUrl,
        orderId: orderIdFinal,
        requestId,
        message: "Tạo yêu cầu thanh toán MoMo thành công",
      });
    } else {
      console.error("[MoMo] No payUrl in response:", response.data);
      const errorMessage =
        response.data?.message || "Không nhận được payment URL từ MoMo";
      return res.status(500).json({
        error: errorMessage,
        details: response.data,
        message:
          "Không thể tạo yêu cầu thanh toán MoMo. Vui lòng kiểm tra cấu hình MoMo credentials trong .env",
      });
    }
  } catch (error) {
    console.error("[MoMo] API error:", error.response?.data || error.message);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Lỗi kết nối đến MoMo API";
    const errorCode = error.response?.status || 500;
    return res.status(errorCode).json({
      error: errorMessage,
      details: error.response?.data || { message: error.message },
      message:
        "Không thể tạo yêu cầu thanh toán MoMo. Vui lòng kiểm tra:\n" +
        "1. MoMo credentials trong file .env (MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY)\n" +
        "2. Kết nối mạng đến MoMo API\n" +
        "3. Đăng ký tài khoản MoMo Business tại https://business.momo.vn/",
    });
  }
});
paymentRouter.post("/momo-callback", async (req, res) => {
  try {
    const {
      partnerCode,
      accessKey,
      amount,
      orderId,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message: momoMessage,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;
    console.log("[MoMo Callback] Received:", JSON.stringify(req.body, null, 2));
    const secretKey =
      process.env.MOMO_SECRET_KEY || "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
    const rawSignature = `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${orderId}&amount=${amount}&orderId=${orderId}&orderInfo=${
      orderInfo || ""
    }&orderType=${orderType || ""}&transId=${
      transId || ""
    }&resultCode=${resultCode}&message=${momoMessage || ""}&payType=${
      payType || ""
    }&responseTime=${responseTime}&extraData=${extraData || ""}`;
    const checkSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");
    if (signature !== checkSignature) {
      console.error(
        "[MoMo Callback] Invalid signature. Expected:",
        checkSignature,
        "Received:",
        signature,
      );
      return res.status(400).json({
        resultCode: 1001,
        message: "Chữ ký không hợp lệ",
      });
    }
    let bookingId = null;
    if (orderId) {
      const match = orderId.toString().match(/BOOKING_(\d+)/);
      if (match) {
        bookingId = parseInt(match[1]);
      } else if (!isNaN(parseInt(orderId))) {
        bookingId = parseInt(orderId);
      }
    }
    if (resultCode === "0" || resultCode === 0) {
      console.log(
        "[MoMo Callback] Payment successful. OrderId:",
        orderId,
        "BookingId:",
        bookingId,
      );
      if (bookingId) {
        try {
          const pool = (await import("../db.js")).default;
          const { setBookingStatus: modelSetBookingStatus } =
            await import("../models/bookingsmodel.js");
          await modelSetBookingStatus(bookingId, {
            payment_status: "paid",
            payment_method: "momo",
          });
          console.log(`[MoMo Callback] Updated booking #${bookingId} to paid`);
          try {
            const { modelGetBookingById } =
              await import("../models/bookingsmodel.js");
            const booking = await modelGetBookingById(bookingId);
            if (booking && booking.notes) {
              const discountMatch = booking.notes.match(
                /\[Discount: ({[^}]+})\]/,
              );
              if (discountMatch) {
                const discountInfo = JSON.parse(discountMatch[1]);
                if (discountInfo.promo_code) {
                  const { incrementUsageCount } =
                    await import("../models/discountcodesmodel.js");
                  const updatedDiscount = await incrementUsageCount(
                    discountInfo.promo_code,
                  );
                  console.log(
                    `[MoMo Callback] Incremented usage count for discount code: ${discountInfo.promo_code}`,
                  );
                  console.log(
                    `[MoMo Callback] New usage count: ${
                      updatedDiscount?.used_count || "N/A"
                    }`,
                  );
                }
              }
            }
          } catch (discountErr) {
            console.error(
              "[MoMo Callback] Error incrementing usage count:",
              discountErr,
            );
          }
          try {
            const { modelGetBookingById } =
              await import("../models/bookingsmodel.js");
            const booking = await modelGetBookingById(bookingId);
            if (booking && booking.email) {
              const { sendBookingConfirmationEmail } =
                await import("../utils/mailer.js");
              await sendBookingConfirmationEmail(booking.email, bookingId);
              console.log(
                `[MoMo Callback] Sent confirmation email to ${booking.email}`,
              );
            }
          } catch (emailErr) {
            console.error("[MoMo Callback] Error sending email:", emailErr);
          }
        } catch (updateErr) {
          console.error("[MoMo Callback] Error updating booking:", updateErr);
        }
      }
      res.json({
        resultCode: 0,
        message: "Success",
        data: req.body,
      });
    } else {
      console.log(
        "[MoMo Callback] Payment failed. ResultCode:",
        resultCode,
        "Message:",
        momoMessage,
      );
      res.json({
        resultCode: resultCode || 1000,
        message: momoMessage || "Thanh toán thất bại",
        data: req.body,
      });
    }
  } catch (error) {
    console.error("[MoMo Callback] Error:", error);
    res.status(500).json({
      resultCode: 1002,
      message: "Lỗi xử lý callback",
      error: error.message,
    });
  }
});
export default paymentRouter;
