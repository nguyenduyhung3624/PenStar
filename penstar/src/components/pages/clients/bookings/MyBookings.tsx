import React from "react";
import { cancelBooking, getMyBookings } from "@/services/bookingsApi";
import useAuth from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { BookingShort } from "@/types/bookings";
import RefundRequestModal from "./RefundRequestModal";

const MyBookings: React.FC = () => {
  const [data, setData] = React.useState<BookingShort[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = React.useState(false);
  const [selectedBookingForRefund, setSelectedBookingForRefund] =
    React.useState<BookingShort | null>(null);

  // --- State phân trang ---
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5; // Số lượng dòng mỗi trang (bạn có thể đổi thành 10)

  const auth = useAuth() as unknown as { user?: { id?: number } };
  const nav = useNavigate();

  const fetchBookings = async () => {
    if (!auth?.user) return;
    setLoading(true);
    try {
      const bookings = await getMyBookings();
      setData(bookings);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  // --- Logic tính toán phân trang ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Helper render badge trạng thái
  const renderStatusBadge = (statusId?: number, statusName?: string) => {
    const id = statusId || 0;
    const name = statusName || "-";
    let className = "px-2 py-1 text-xs font-semibold rounded-full ";
    let label = name;

    switch (id) {
      case 6:
        className += "bg-yellow-100 text-yellow-800";
        label = "Chờ xác nhận";
        break;
      case 1:
        className += "bg-blue-100 text-blue-800";
        label = "Đã xác nhận";
        break;
      case 2:
        className += "bg-green-100 text-green-800";
        label = "Đã Check-in";
        break;
      case 3:
        className += "bg-cyan-100 text-cyan-800";
        label = "Đã Check-out";
        break;
      case 4:
        className += "bg-red-100 text-red-800";
        label = "Đã hủy";
        break;
      case 5:
        className += "bg-purple-100 text-purple-800";
        label = "No show";
        break;
      default:
        className += "bg-gray-100 text-gray-800";
        break;
    }
    return <span className={className}>{label}</span>;
  };

  // Helper render badge thanh toán
  const renderPaymentBadge = (status?: string, isRefunded?: boolean) => {
    let className = "px-2 py-1 text-xs font-semibold rounded-md border ";
    const label = status?.toUpperCase() || "-";

    if (status === "paid")
      className += "bg-green-50 text-green-700 border-green-200";
    else if (status === "pending")
      className += "bg-yellow-50 text-yellow-700 border-yellow-200";
    else if (status === "failed" || status === "cancelled")
      className += "bg-red-50 text-red-700 border-red-200";
    else if (status === "refunded")
      className += "bg-purple-50 text-purple-700 border-purple-200";
    else className += "bg-gray-50 text-gray-700 border-gray-200";

    return (
      <div className="flex flex-col items-start gap-1">
        <span className={className}>{label}</span>
        {isRefunded && (
          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1 rounded border border-purple-100">
            ✓ Đã hoàn tiền
          </span>
        )}
      </div>
    );
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (
      window.confirm(
        "Bạn có chắc muốn hủy booking này?\nNếu hủy trước 24h check-in, bạn sẽ được hoàn tiền 100%."
      )
    ) {
      setUpdating(true);
      try {
        await cancelBooking(bookingId);
        alert("Đã hủy booking thành công! Bạn có thể yêu cầu hoàn tiền.");
        fetchBookings();
      } catch (error) {
        console.error("Cancel booking error:", error);
        const err = error as { response?: { data?: { message?: string } } };
        alert(err.response?.data?.message || "Lỗi hủy booking");
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleOpenRefundModal = (booking: BookingShort) => {
    setSelectedBookingForRefund(booking);
    setRefundModalOpen(true);
  };

  const formatPrice = (price?: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);
  };

  // Check if booking can request refund
  const canRequestRefund = (b: BookingShort) => {
    // Cancelled (4) or No-show (5) and paid but not refunded
    const isCancelledOrNoShow =
      b.stay_status_id === 4 || b.stay_status_id === 5;
    const isPaid = b.payment_status === "paid";
    const notRefunded = !b.is_refunded;
    return isCancelledOrNoShow && isPaid && notRefunded;
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Booking của tôi</h2>
          {loading && (
            <span className="text-sm text-gray-500 animate-pulse">
              Đang tải...
            </span>
          )}
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold border-b">Mã</th>
                <th className="px-6 py-3 font-semibold border-b">Khách hàng</th>
                <th className="px-6 py-3 font-semibold border-b">Tổng tiền</th>
                <th className="px-6 py-3 font-semibold border-b">Trạng thái</th>
                <th className="px-6 py-3 font-semibold border-b">Thanh toán</th>
                <th className="px-6 py-3 font-semibold border-b text-center">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map((b) => {
                  const canCancel =
                    b.stay_status_id === 6 || b.stay_status_id === 1;
                  const showRefundBtn = canRequestRefund(b);
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        #{b.id}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {b.customer_name}
                      </td>
                      <td className="px-6 py-4 font-semibold text-blue-600">
                        {formatPrice(b.total_price)}
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(
                          b.stay_status_id,
                          b.stay_status_name
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {renderPaymentBadge(b.payment_status, b.is_refunded)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 flex-wrap">
                          <button
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                            onClick={() => nav(`/bookings/success/${b.id}`)}
                          >
                            Chi tiết
                          </button>
                          {canCancel && (
                            <button
                              className={`px-3 py-1.5 text-white text-xs font-medium rounded shadow-sm transition-colors ${
                                updating
                                  ? "bg-red-300 cursor-not-allowed"
                                  : "bg-red-500 hover:bg-red-600"
                              }`}
                              onClick={() => handleCancelBooking(b.id)}
                              disabled={updating}
                            >
                              {updating ? "..." : "Hủy"}
                            </button>
                          )}
                          {showRefundBtn && (
                            <button
                              className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded shadow-sm transition-colors"
                              onClick={() => handleOpenRefundModal(b)}
                            >
                              Yêu cầu hoàn tiền
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {loading
                      ? "Đang tải dữ liệu..."
                      : "Bạn chưa có booking nào."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PHẦN PHÂN TRANG (PAGINATION) --- */}
        {data.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-medium">{indexOfFirstItem + 1}</span> đến{" "}
              <span className="font-medium">
                {Math.min(indexOfLastItem, data.length)}
              </span>{" "}
              trong tổng số <span className="font-medium">{data.length}</span>{" "}
              booking
            </span>
            <div className="flex gap-1">
              {/* Nút Previous */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-sm border rounded ${
                  currentPage === 1
                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                    : "text-gray-700 bg-white hover:bg-gray-100"
                }`}
              >
                Trước
              </button>

              {/* Các nút số trang */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "text-gray-700 bg-white hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Nút Next */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-sm border rounded ${
                  currentPage === totalPages
                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                    : "text-gray-700 bg-white hover:bg-gray-100"
                }`}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Request Modal */}
      <RefundRequestModal
        open={refundModalOpen}
        bookingId={selectedBookingForRefund?.id}
        refundAmount={selectedBookingForRefund?.total_price || 0}
        onClose={() => {
          setRefundModalOpen(false);
          setSelectedBookingForRefund(null);
        }}
        onSuccess={() => {
          fetchBookings();
        }}
      />
    </div>
  );
};

export default MyBookings;
