const length = 6;
export function genCode(prefix: string = "") {
  const charset = "abcdefghijklmnopqrstuvwxyz123456789";
  let randomPart = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * charset.length);
    randomPart += charset[idx];
  }
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const dateString = `${day}${month}${year}`;   
  const datePrefix3 = dateString.slice(0, 3);   
  const result = `${prefix}_${datePrefix3}${randomPart}`;
  return result.toUpperCase();
}
