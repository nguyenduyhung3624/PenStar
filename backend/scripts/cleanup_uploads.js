// Script: cleanup_uploads.js
// Xóa các file ảnh trong uploads không còn được tham chiếu trong DB
// Chạy: node backend/scripts/cleanup_uploads.js

import fs from "fs";
import path from "path";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "hoteldb",
  password: "1",
  port: 5432,
});

// Các bảng và cột chứa đường dẫn ảnh
const imageTables = [
  { table: "room_images", column: "image_url" },
  { table: "room_type_images", column: "image_url" },
  // Thêm bảng khác nếu có
];

const uploadsDir = path.join(process.cwd(), "backend", "uploads");

async function getAllImagePaths() {
  let allPaths = new Set();
  for (const { table, column } of imageTables) {
    const res = await pool.query(`SELECT ${column} FROM ${table}`);
    for (const row of res.rows) {
      if (row[column]) {
        // Lấy phần đường dẫn sau /uploads/
        const match = row[column].match(/uploads[\\/](.+)$/);
        if (match) allPaths.add(match[1].replace(/\\/g, "/"));
      }
    }
  }
  return allPaths;
}

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else {
      // Lấy đường dẫn tương đối từ uploads/
      results.push(path.relative(uploadsDir, filePath).replace(/\\/g, "/"));
    }
  });
  return results;
}

async function main() {
  try {
    const usedPaths = await getAllImagePaths();
    const allFiles = walkDir(uploadsDir);
    let deleted = 0;
    for (const relPath of allFiles) {
      if (!usedPaths.has(relPath)) {
        const absPath = path.join(uploadsDir, relPath);
        fs.unlinkSync(absPath);
        console.log("Deleted:", relPath);
        deleted++;
      }
    }
    console.log(`Done. Deleted ${deleted} unused files.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
