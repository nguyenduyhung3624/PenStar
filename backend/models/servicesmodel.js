import pool from "../db.js";
export const getServices = async () => {
  const result = await pool.query(`
    SELECT * FROM services ORDER BY id DESC
  `);
  return result.rows.map((row) => {
    let thumbnail = row.thumbnail;
    if (
      thumbnail &&
      !thumbnail.startsWith("/uploads/services/") &&
      !thumbnail.startsWith("http")
    ) {
      if (thumbnail.startsWith("/")) {
        thumbnail = `/uploads/services${thumbnail}`;
      } else {
        thumbnail = `/uploads/services/${thumbnail}`;
      }
    }
    return {
      ...row,
      thumbnail,
    };
  });
};
export const getServiceById = async (id) => {
  const result = await pool.query(`SELECT * FROM services WHERE id = $1`, [id]);
  const row = result.rows[0];
  if (!row) return null;
  let thumbnail = row.thumbnail;
  if (
    thumbnail &&
    !thumbnail.startsWith("/uploads/services/") &&
    !thumbnail.startsWith("http")
  ) {
    if (thumbnail.startsWith("/")) {
      thumbnail = `/uploads/services${thumbnail}`;
    } else {
      thumbnail = `/uploads/services/${thumbnail}`;
    }
  }
  return {
    ...row,
    thumbnail,
  };
};
export const createService = async (data) => {
  const { name, description, price, thumbnail = null } = data;
  let thumbnailName = thumbnail;
  // Always strip path to get just the filename if it looks like a path or URL
  if (
    thumbnailName &&
    (thumbnailName.includes("/") || thumbnailName.includes("\\"))
  ) {
    thumbnailName = thumbnailName.split(/[/\\]/).pop();
  }
  const result = await pool.query(
    `INSERT INTO services (name, description, price, thumbnail, unit)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, description, price, thumbnailName, data.unit || "Cái"]
  );
  return result.rows[0];
};
export const updateService = async (id, data) => {
  console.log("[updateService] id:", id, "data:", data);
  const current = await getServiceById(id);
  if (!current) {
    throw new Error("Service not found");
  }
  let {
    name = current.name,
    description = current.description,
    price = current.price,
    thumbnail = current.thumbnail,
  } = data;

  // Always strip path to get just the filename if it looks like a path or URL
  if (thumbnail && (thumbnail.includes("/") || thumbnail.includes("\\"))) {
    thumbnail = thumbnail.split(/[/\\]/).pop();
  }
  try {
    const result = await pool.query(
      `UPDATE services
        SET name = $1,
            description = $2,
            price = $3,
            thumbnail = $4,
            unit = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *`,
      [
        name,
        description,
        price,
        thumbnail,
        data.unit || current.unit || "Cái",
        id,
      ]
    );
    console.log("[updateService] result:", result.rows);
    return result.rows[0];
  } catch (err) {
    console.error("[updateService] ERROR:", err);
    throw err;
  }
};
export const deleteService = async (id) => {
  console.log("[deleteService] id:", id);
  try {
    const result = await pool.query(
      "DELETE FROM services WHERE id = $1 RETURNING *",
      [id]
    );
    console.log("[deleteService] result:", result.rows);
    return result.rows[0];
  } catch (err) {
    console.error("[deleteService] ERROR:", err);
    throw err;
  }
};
export const existsServiceWithName = async (name, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM services WHERE name = $1 AND id <> $2 LIMIT 1",
      [name, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query(
    "SELECT 1 FROM services WHERE name = $1 LIMIT 1",
    [name]
  );
  return res.rowCount > 0;
};
