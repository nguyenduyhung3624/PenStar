import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 30, // Tăng số lượng kết nối tối đa (pool size)
  // Nếu đã có sslmode=require trong DATABASE_URL thì không cần truyền ssl ở đây
});

pool
  .connect()
  .then(() => console.log("PostgreSQL connected successfully"))
  .catch((err) => console.error("❌ Connection error:", err));
export default pool;
