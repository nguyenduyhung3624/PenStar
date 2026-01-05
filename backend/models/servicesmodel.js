import pool from "../db.js";

export const getServices = async () => {
  const result = await pool.query(`
    SELECT * FROM services ORDER BY id
  `);
  // Đảm bảo thumbnail luôn là đường dẫn đầy đủ
  return result.rows.map((row) => {
    let thumbnail = row.thumbnail;
    if (thumbnail && !thumbnail.startsWith("/uploads/services/")) {
      // Nếu chỉ là tên file hoặc thiếu prefix, thêm prefix
      if (thumbnail.startsWith("/")) {
        // Trường hợp /abc.jpg nhưng không đúng folder
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
  if (thumbnail && !thumbnail.startsWith("/uploads/services/")) {
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
  const {
    name,
    description,
    price,
    thumbnail = null,
    thumbnail_hash = null,
  } = data;

  // Chỉ lưu tên file (không lưu cả đường dẫn)
  let thumbnailName = thumbnail;
  if (thumbnailName && thumbnailName.startsWith("/uploads/services/")) {
    thumbnailName = thumbnailName.replace("/uploads/services/", "");
  } else if (thumbnailName && thumbnailName.startsWith("/")) {
    thumbnailName = thumbnailName.substring(thumbnailName.lastIndexOf("/") + 1);
  }

  const result = await pool.query(
    `INSERT INTO services (name, description, price, thumbnail, thumbnail_hash) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, description, price, thumbnailName, thumbnail_hash]
  );
  return result.rows[0];
};

export const updateService = async (id, data) => {
  console.log("[updateService] id:", id, "data:", data);

  // ✅ FIX: Lấy service hiện tại để merge với data mới
  const current = await getServiceById(id);
  if (!current) {
    throw new Error("Service not found");
  }

  // ✅ Merge data: ưu tiên data mới, fallback về current
  let {
    name = current.name,
    description = current.description,
    price = current.price,
    thumbnail = current.thumbnail,
    thumbnail_hash = current.thumbnail_hash,
  } = data;

  // Chỉ lưu tên file (không lưu cả đường dẫn)
  if (thumbnail && thumbnail.startsWith("/uploads/services/")) {
    thumbnail = thumbnail.replace("/uploads/services/", "");
  } else if (thumbnail && thumbnail.startsWith("/")) {
    thumbnail = thumbnail.substring(thumbnail.lastIndexOf("/") + 1);
  }

  try {
    const result = await pool.query(
      `UPDATE services 
       SET name = $1, 
           description = $2, 
           price = $3, 
           thumbnail = $4, 
           thumbnail_hash = $5, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING *`,
      [name, description, price, thumbnail, thumbnail_hash, id]
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
