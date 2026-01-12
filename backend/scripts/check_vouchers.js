import pool from "../db.js";

const checkVouchers = async () => {
  try {
    const res = await pool.query(`
      SELECT id, code, name, type, value, status, start_date, end_date, min_total, max_uses
      FROM discount_codes
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log("\n=== DISCOUNT CODES IN DATABASE ===");
    console.log(`Total vouchers: ${res.rowCount}`);
    console.log("\nVouchers:");
    res.rows.forEach((v, i) => {
      console.log(`\n${i + 1}. ${v.code} (${v.name})`);
      console.log(`   Type: ${v.type} | Value: ${v.value}`);
      console.log(`   Status: ${v.status}`);
      console.log(`   Start: ${v.start_date} | End: ${v.end_date}`);
      console.log(`   Min Total: ${v.min_total} | Max Uses: ${v.max_uses}`);
    });

    // Check active vouchers
    const now = new Date();
    const activeRes = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM discount_codes
      WHERE status = 'active'
        AND (start_date IS NULL OR start_date <= $1)
        AND (end_date IS NULL OR end_date >= $1)
    `,
      [now]
    );

    console.log(`\n=== ACTIVE VOUCHERS ===`);
    console.log(`Active vouchers available now: ${activeRes.rows[0].count}`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    pool.end();
  }
};

checkVouchers();
