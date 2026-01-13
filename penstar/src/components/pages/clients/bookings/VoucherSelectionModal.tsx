import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Modal, List, Tag, Empty, Spin, Typography, Progress } from "antd";
import {
  CheckCircleOutlined,
  TagOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getAvailableVouchers } from "@/services/discountApi";
import { Input } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

interface Voucher {
  id: number;
  code: string;
  name?: string;
  description: string;
  type: "percentage" | "percent" | "fixed";
  value: number;
  min_total?: number;
  max_discount_amount?: number;
  start_date?: string;
  end_date?: string;
  max_uses?: number;
  max_uses_per_user?: number;
  status: "active" | "inactive" | "expired";
  total_usage?: number;
  remaining_uses?: number | null;
}

interface VoucherWithDiscount extends Voucher {
  potential_discount: number;
}

interface VoucherSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (voucher: Voucher) => void;
  totalPrice: number;
  selectedCode?: string;
}

export default function VoucherSelectionModal({
  open,
  onClose,
  onSelect,
  totalPrice,
  selectedCode,
}: VoucherSelectionModalProps) {
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(
    selectedCode || null
  );

  const { data, isLoading } = useQuery({
    queryKey: ["availableVouchers"],
    queryFn: getAvailableVouchers,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setSelectedVoucher(selectedCode || null);
    }
  }, [open, selectedCode]);

  const calculateDiscount = useCallback(
    (voucher: Voucher): number => {
      if (voucher.min_total && totalPrice < voucher.min_total) return 0;
      if (voucher.type === "percentage" || voucher.type === "percent") {
        const discount = (totalPrice * voucher.value) / 100;
        return voucher.max_discount_amount
          ? Math.min(discount, voucher.max_discount_amount)
          : discount;
      }
      return Math.min(voucher.value, totalPrice);
    },
    [totalPrice]
  );

  const vouchers = useMemo<VoucherWithDiscount[]>(() => {
    if ((!data?.success && !data?.ok) || !Array.isArray(data.data)) return [];

    return data.data
      .map((v: any) => {
        const value = Number(v.value);
        const min_total = v.min_total ? Number(v.min_total) : 0;
        const max_discount_amount = v.max_discount_amount
          ? Number(v.max_discount_amount)
          : 0;
        const total_usage = Number(v.total_usage || 0);

        const voucherWithNumbers = {
          ...v,
          value,
          min_total,
          max_discount_amount,
          total_usage,
        };

        return {
          ...voucherWithNumbers,
          potential_discount: calculateDiscount(voucherWithNumbers),
        };
      })
      .sort((a: any, b: any) => b.potential_discount - a.potential_discount);
  }, [data, calculateDiscount]);

  const handleSelectVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher.code);
    onSelect(voucher);
    onClose();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const [searchText, setSearchText] = useState("");

  const isVoucherDisabled = useCallback(
    (voucher: Voucher) => {
      return voucher.min_total && totalPrice < voucher.min_total;
    },
    [totalPrice]
  );

  const filteredVouchers = useMemo(() => {
    if (!searchText) return vouchers;
    const lowerText = searchText.toLowerCase();
    return vouchers.filter(
      (v) =>
        v.code.toLowerCase().includes(lowerText) ||
        (v.name && v.name.toLowerCase().includes(lowerText))
    );
  }, [vouchers, searchText]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg">
          <TagOutlined className="text-yellow-500" />
          <span>Voucher của bạn</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      className="voucher-modal"
      style={{ top: 20 }}
    >
      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm theo mã hoặc tên voucher..."
          prefix={<SearchOutlined className="text-gray-400" />}
          className="rounded-lg py-2"
          value={searchText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchText(e.target.value)
          }
          allowClear
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">
            Đang tìm voucher tốt nhất cho bạn...
          </p>
        </div>
      ) : vouchers.length === 0 ? (
        <Empty
          description="Hiện chưa có voucher nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={filteredVouchers}
          className="max-h-[70vh] overflow-y-auto pr-1"
          renderItem={(voucher) => {
            const disabled = isVoucherDisabled(voucher);
            const isSelected = selectedVoucher === voucher.code;
            const percentUsed = voucher.max_uses
              ? Math.min(
                  100,
                  Math.round(
                    ((voucher.total_usage || 0) / voucher.max_uses) * 100
                  )
                )
              : 0;

            const itemClassName = `transition-all duration-200 mb-3 rounded-lg border-2 ${
              isSelected
                ? "border-yellow-500 bg-yellow-50"
                : "border-gray-100 bg-white hover:border-yellow-200"
            } ${disabled ? "opacity-60 bg-gray-50" : "cursor-pointer"}`;

            return (
              <List.Item
                className={itemClassName}
                style={{ padding: 16 }}
                onClick={() => !disabled && handleSelectVoucher(voucher)}
              >
                <div className="w-full">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Text strong className="text-lg">
                          {voucher.name || voucher.code}
                        </Text>
                        {isSelected && (
                          <CheckCircleOutlined className="text-green-500 text-lg" />
                        )}
                      </div>
                      <div className="inline-block bg-gray-100 px-2 py-0.5 rounded text-sm text-gray-600 font-mono mb-2">
                        {voucher.code}
                      </div>
                    </div>
                    <div className="text-right">
                      <Tag
                        color={
                          voucher.type === "percentage" ||
                          voucher.type === "percent"
                            ? "geekblue"
                            : "green"
                        }
                        className="text-sm px-2 py-1 mr-0"
                      >
                        {voucher.type === "percentage" ||
                        voucher.type === "percent"
                          ? `Giảm ${voucher.value}%`
                          : `Giảm ${formatPrice(voucher.value)}`}
                      </Tag>
                    </div>
                  </div>

                  <div className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {voucher.description}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
                    {voucher.min_total ? (
                      <span
                        className={`bg-gray-100 px-2 py-1 rounded inline-flex items-center gap-1 ${disabled ? "text-red-500 bg-red-50" : ""}`}
                      >
                        <InfoCircleOutlined />
                        Đơn tối thiểu: {formatPrice(voucher.min_total)}
                      </span>
                    ) : (
                      <span className="bg-green-50 text-green-600 px-2 py-1 rounded inline-flex items-center gap-1">
                        <CheckCircleOutlined /> Áp dụng mọi đơn hàng
                      </span>
                    )}

                    {voucher.max_discount_amount &&
                      voucher.type === "percentage" && (
                        <span className="bg-gray-100 px-2 py-1 rounded inline-flex items-center gap-1">
                          <TagOutlined />
                          Giảm tối đa:{" "}
                          {formatPrice(voucher.max_discount_amount)}
                        </span>
                      )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      {voucher.end_date && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <ClockCircleOutlined />
                          HSD: {dayjs(voucher.end_date).format("DD/MM/YYYY")}
                        </span>
                      )}
                    </div>

                    {voucher.max_uses && (
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <span className="whitespace-nowrap">Đã dùng:</span>
                        <div className="flex-1 w-24">
                          <Progress
                            percent={percentUsed}
                            showInfo={false}
                            size="small"
                            strokeColor={
                              percentUsed > 90 ? "#ff4d4f" : "#1890ff"
                            }
                          />
                        </div>
                        <span className="text-xs w-8 text-right">
                          {percentUsed}%
                        </span>
                      </div>
                    )}
                  </div>

                  {voucher.potential_discount > 0 && !disabled && (
                    <div className="mt-3 text-right">
                      <Text type="success" strong>
                        Tiết kiệm được:{" "}
                        {formatPrice(voucher.potential_discount)}
                      </Text>
                    </div>
                  )}
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Modal>
  );
}
