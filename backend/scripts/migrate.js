import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, "../.env") });
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
async function migrate() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting migration...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const { rows: executedMigrations } = await client.query(
      "SELECT name FROM migrations",
    );
    const executedMigrationNames = new Set(
      executedMigrations.map((row) => row.name),
    );
    const migrationsDir = path.join(__dirname, "../migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();
    for (const file of files) {
      if (!executedMigrationNames.has(file)) {
        console.log(`➡️  Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf8");
        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query("INSERT INTO migrations (name) VALUES ($1)", [
            file,
          ]);
          await client.query("COMMIT");
          console.log(`✅ Completed: ${file}`);
        } catch (err) {
          await client.query("ROLLBACK");
          console.error(`❌ Failed: ${file}`);
          throw err;
        }
      } else {
        console.log(`⏭️  Skipping (already run): ${file}`);
      }
    }
    console.log("✨ All migrations finished successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}
migrate();
