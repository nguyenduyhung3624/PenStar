import pool from "../db.js";

async function checkDB() {
  const client = await pool.connect();
  try {
    console.log("Connected to database");

    // Simple count query
    const countResult = await client.query(
      "SELECT COUNT(*) FROM discount_codes"
    );
    console.log(`Total discount codes: ${countResult.rows[0].count}`);

    // Get all vouchers
    const result = await client.query("SELECT * FROM discount_codes LIMIT 5");
    console.log(`\nFound ${result.rowCount} vouchers:\n`);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error("Database error:", err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDB().catch(console.error);
