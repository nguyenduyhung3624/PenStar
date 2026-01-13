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
import { ERROR_MESSAGES } from "../utils/constants.js";

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
    res.success(images, "Lấy danh sách ảnh loại phòng thành công");
  } catch (error) {
    console.error(
      "roomtypeimagescontroller.getAllRoomTypeImages error:",
      error
    );
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// GET image by id
export const getRoomTypeImage = async (req, res) => {
  const { id } = req.params;
  try {
    const image = await getRoomTypeImageById(Number(id));
    if (!image) {
      return res.error("Không tìm thấy ảnh", null, 404);
    }
    res.success(image, "Lấy ảnh loại phòng thành công");
  } catch (error) {
    console.error("roomtypeimagescontroller.getRoomTypeImage error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// GET images by room type id
export const getImagesByRoomType = async (req, res) => {
  const { roomTypeId } = req.params;
  try {
    const images = await getRoomTypeImagesByRoomTypeId(Number(roomTypeId));
    res.success(images, "Lấy ảnh loại phòng thành công");
  } catch (error) {
    console.error("roomtypeimagescontroller.getImagesByRoomType error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// POST create image
export const createImage = async (req, res) => {
  try {
    const newImage = await createRoomTypeImage(req.body);
    res.success(newImage, "Tạo ảnh loại phòng thành công", 201);
  } catch (error) {
    console.error("roomtypeimagescontroller.createImage error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// POST upload image for room type
export const uploadImageForRoomType = async (req, res) => {
  const { roomTypeId } = req.params;
  const isThumbnail =
    req.body.is_thumbnail === "true" || req.body.is_thumbnail === true;

  if (!req.file) {
    return res.error("Không có file được tải lên", null, 400);
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
      return res.success(newImage, "Đã dùng lại file ảnh cũ.", 201);
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
    res.success(newImage, "Tải ảnh lên thành công", 201);
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
    res.success(updated, "Cập nhật ảnh thành công");
  } catch (error) {
    console.error("roomtypeimagescontroller.updateImage error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// DELETE image
export const deleteImage = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteRoomTypeImage(Number(id));
    if (!deleted) {
      return res.error("Không tìm thấy ảnh", null, 404);
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

    res.success(deleted, "Xóa ảnh thành công");
  } catch (error) {
    console.error("roomtypeimagescontroller.deleteImage error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
