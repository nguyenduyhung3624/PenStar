const length = 6;
export function genCode(prefix: string = "") {
  const charset = "abcdefghijklmnopqrstuvwxyz123456789";

  // Random phần ký tự
  let randomPart = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * charset.length);
    randomPart += charset[idx];
  }

  // Lấy 3 số đầu của ngày hiện tại theo định dạng DDMMYYYY
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const dateString = `${day}${month}${year}`;   // "06122025"
  const datePrefix3 = dateString.slice(0, 3);   // "061"

  const result = `${prefix}_${datePrefix3}${randomPart}`;
  return result.toUpperCase();
}
