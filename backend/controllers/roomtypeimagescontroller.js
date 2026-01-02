import {
  getRoomTypeImages,
  getRoomTypeImageById,
  getRoomTypeImagesByRoomTypeId,
  createRoomTypeImage,
  updateRoomTypeImage,
  deleteRoomTypeImage,
} from "../models/room_type_images.js";
import fs from "fs";
import path from "path";
import multer from "multer";
import pool from "../db.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Luôn lưu vào uploads/room_types/
    const uploadDir = path.join(process.cwd(), "uploads", "room_types");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Đặt tên file: {timestamp}_{random}.{ext}
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

export const uploadMiddleware = multer({ storage });

// GET all room type images
export const getAllRoomTypeImages = async (req, res) => {
  try {
    const images = await getRoomTypeImages();
    res.json({
      success: true,
      message: "✅ Fetched all room type images",
      data: images,
    });
  } catch (error) {
    console.error(
      "roomtypeimagescontroller.getAllRoomTypeImages error:",
      error
    );
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET image by id
export const getRoomTypeImage = async (req, res) => {
  const { id } = req.params;
  try {
    const image = await getRoomTypeImageById(Number(id));
    if (!image) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }
    res.json({
      success: true,
      message: "✅ Fetched room type image",
      data: image,
    });
  } catch (error) {
    console.error("roomtypeimagescontroller.getRoomTypeImage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET images by room type id
export const getImagesByRoomType = async (req, res) => {
  const { roomTypeId } = req.params;
  try {
    const images = await getRoomTypeImagesByRoomTypeId(Number(roomTypeId));
    res.json({
      success: true,
      message: "✅ Fetched images for room type",
      data: images,
    });
  } catch (error) {
    console.error("roomtypeimagescontroller.getImagesByRoomType error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create image
export const createImage = async (req, res) => {
  try {
    const newImage = await createRoomTypeImage(req.body);
    res.status(201).json({
      success: true,
      message: "✅ Created room type image",
      data: newImage,
    });
  } catch (error) {
    console.error("roomtypeimagescontroller.createImage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST upload image for room type
export const uploadImageForRoomType = async (req, res) => {
  const { roomTypeId } = req.params;
  const isThumbnail =
    req.body.is_thumbnail === "true" || req.body.is_thumbnail === true;

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  const filename = req.file.filename;
  const filePath = path.join(process.cwd(), "uploads", "room_types", filename);
  const crypto = await import("crypto");
  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash("sha1").update(fileBuffer).digest("hex");
  const client = await pool.connect();
  try {
    // Kiểm tra hash trên toàn bảng room_type_images
    const checkRes = await client.query(
      "SELECT * FROM room_type_images WHERE file_hash = $1",
      [fileHash]
    );
    if (checkRes.rows.length > 0) {
      // Đã có file vật lý, không lưu file mới, chỉ insert bản ghi DB trỏ tới file cũ
      fs.unlinkSync(filePath);
      const oldImage = checkRes.rows[0];
      await client.query("BEGIN");
      if (isThumbnail) {
        await client.query(
          "UPDATE room_type_images SET is_thumbnail = FALSE WHERE room_type_id = $1 AND is_thumbnail = TRUE",
          [Number(roomTypeId)]
        );
      }
      const result = await client.query(
        "INSERT INTO room_type_images (room_type_id, image_url, is_thumbnail, file_hash) VALUES ($1, $2, $3, $4) RETURNING *",
        [Number(roomTypeId), oldImage.image_url, isThumbnail, fileHash]
      );
      const newImage = result.rows[0];
      if (isThumbnail) {
        await client.query(
          "UPDATE room_types SET thumbnail = $1 WHERE id = $2",
          [oldImage.image_url, Number(roomTypeId)]
        );
      }
      await client.query("COMMIT");
      return res
        .status(201)
        .json({
          success: true,
          message: "Đã dùng lại file ảnh cũ.",
          data: newImage,
        });
    }

    // Nếu chưa có file vật lý, lưu file như bình thường
    const imageUrl = `/uploads/room_types/${filename}`;
    await client.query("BEGIN");
    if (isThumbnail) {
      await client.query(
        "UPDATE room_type_images SET is_thumbnail = FALSE WHERE room_type_id = $1 AND is_thumbnail = TRUE",
        [Number(roomTypeId)]
      );
    }
    const result = await client.query(
      "INSERT INTO room_type_images (room_type_id, image_url, is_thumbnail, file_hash) VALUES ($1, $2, $3, $4) RETURNING *",
      [Number(roomTypeId), imageUrl, isThumbnail, fileHash]
    );
    const newImage = result.rows[0];
    if (isThumbnail) {
      await client.query("UPDATE room_types SET thumbnail = $1 WHERE id = $2", [
        imageUrl,
        Number(roomTypeId),
      ]);
    }
    await client.query("COMMIT");
    res.status(201).json({
      success: true,
      message: "✅ Uploaded image",
      data: newImage,
    });
  } catch (e) {
    await client.query("ROLLBACK");
    // Remove uploaded file if transaction fails
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (unlinkErr) {
      console.warn("Failed to unlink uploaded file:", unlinkErr.message);
    }
    throw e;
  } finally {
    client.release();
  }
};

// PUT update image
export const updateImage = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await updateRoomTypeImage(Number(id), req.body);
    res.json({
      success: true,
      message: "✅ Updated room type image",
      data: updated,
    });
  } catch (error) {
    console.error("roomtypeimagescontroller.updateImage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE image
export const deleteImage = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteRoomTypeImage(Number(id));
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    // Try to delete physical file
    try {
      const urlPath = deleted.image_url.replace(/^\//, "");
      const filePath = path.join(process.cwd(), urlPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn("Failed to delete physical file:", e.message);
    }

    res.json({
      success: true,
      message: "✅ Deleted room type image",
      data: deleted,
    });
  } catch (error) {
    console.error("roomtypeimagescontroller.deleteImage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
