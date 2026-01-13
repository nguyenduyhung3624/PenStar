export const formatPrice = (price: number | string | undefined | null): string => {
  if (price == null || price === "") return "0 ₫";
  const numPrice = typeof price === "string" ? parseFloat(price.replace(/[^\d.-]/g, "")) : Number(price);
  if (isNaN(numPrice) || numPrice < 0) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numPrice);
};
export const formatPriceNumber = (price: number | string | undefined | null): string => {
  if (price == null || price === "") return "0";
  const numPrice = typeof price === "string" ? parseFloat(price.replace(/[^\d.-]/g, "")) : Number(price);
  if (isNaN(numPrice) || numPrice < 0) return "0";
  return new Intl.NumberFormat("vi-VN").format(numPrice);
};
