import pg from "pg";
import dotenv from "dotenv";
import { exec } from "child_process";
import util from "util";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const execPromise = util.promisify(exec);

async function reset() {
  const client = await pool.connect();
  try {
    console.log("💣 Dropping all tables...");
    await client.query("DROP SCHEMA public CASCADE;");
    await client.query("CREATE SCHEMA public;");
    await client.query("GRANT ALL ON SCHEMA public TO public;"); // Ensure permissions
    console.log("✅ Database reset complete.");

    // Run migrations
    console.log("🚀 Running migrations...");
    const { stdout: migrateOut, stderr: migrateErr } = await execPromise(
      "node scripts/migrate.js"
    );
    console.log(migrateOut);
    if (migrateErr) console.error(migrateErr);

    // Seed data
    console.log("🌱 Seeding data...");
    const { stdout: seedOut, stderr: seedErr } = await execPromise(
      "node scripts/seed-data.js"
    );
    console.log(seedOut);
    if (seedErr) console.error(seedErr);

    console.log("✨ Full reset completed successfully!");
  } catch (err) {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

reset();
