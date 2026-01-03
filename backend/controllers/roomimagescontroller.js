import pool from "../db.js";
import {
  getRoomImages,
  getRoomImageById,
  getRoomImagesByRoomId,
  createRoomImage,
  updateRoomImage,
  deleteRoomImage,
} from "../models/room_images.js";
import fs from "fs";
import path from "path";
import multer from "multer";
import crypto from "crypto";
import { ERROR_MESSAGES } from "../utils/constants.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Luôn lưu vào uploads/rooms/
    const uploadDir = path.join(process.cwd(), "uploads", "rooms");
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

// GET all room images
export const getAllRoomImages = async (req, res) => {
  try {
    const images = await getRoomImages();
    res.success(images, "Lấy danh sách ảnh phòng thành công");
  } catch (error) {
    console.error("roomimagescontroller.getAllRoomImages error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// GET image by id
export const getRoomImage = async (req, res) => {
  const { id } = req.params;
  try {
    const image = await getRoomImageById(Number(id));
    if (!image) {
      return res.error("Không tìm thấy ảnh", null, 404);
    }
    res.success(image, "Lấy ảnh thành công");
  } catch (error) {
    console.error("roomimagescontroller.getRoomImage error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// GET images by room id
export const getImagesByRoom = async (req, res) => {
  const { roomId } = req.params;
  try {
    const images = await getRoomImagesByRoomId(Number(roomId));
    res.success(images, "Lấy ảnh phòng thành công");
  } catch (error) {
    console.error("roomimagescontroller.getImagesByRoom error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// POST create image
export const createImage = async (req, res) => {
  try {
    const newImage = await createRoomImage(req.body);
    res.success(newImage, "Tạo ảnh phòng thành công", 201);
  } catch (error) {
    console.error("roomimagescontroller.createImage error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
// POST upload file for a room: multipart/form-data -> file field 'file'
export const uploadImageForRoom = async (req, res) => {
  try {
    // Debug: log incoming file info
    console.log(
      "[uploadImageForRoom] req.file:",
      req.file && {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      }
    );

    if (!req.file) {
      console.warn("[uploadImageForRoom] No req.file received");
      return res.error("Không có file được tải lên", null, 400);
    }
    const { roomId } = req.params;
    const { is_thumbnail } = req.body;
    const filename = req.file.filename;
    const filePath = path.join(process.cwd(), "uploads", "rooms", filename);
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash("sha1").update(fileBuffer).digest("hex");
    const client = await pool.connect();
    try {
      // Kiểm tra hash trên toàn bảng room_images
      const checkRes = await client.query(
        "SELECT * FROM room_images WHERE file_hash = $1",
        [fileHash]
      );
      if (checkRes.rows.length > 0) {
        // Đã có file vật lý, không lưu file mới, chỉ insert bản ghi DB trỏ tới file cũ
        fs.unlinkSync(filePath);
        // Lấy image_url và file_hash từ bản ghi cũ
        const oldImage = checkRes.rows[0];
        // Tạo bản ghi mới cho phòng này, trỏ tới file vật lý cũ
        await client.query("BEGIN");
        if (String(is_thumbnail) === "true" || is_thumbnail === true) {
          await client.query(
            "UPDATE room_images SET is_thumbnail = false WHERE room_id = $1 AND is_thumbnail = true",
            [Number(roomId)]
          );
        }
        const insertRes = await client.query(
          `INSERT INTO room_images (room_id, image_url, is_thumbnail, file_hash) VALUES ($1,$2,$3,$4) RETURNING id, room_id, image_url, is_thumbnail, created_at, file_hash`,
          [
            Number(roomId),
            oldImage.image_url,
            String(is_thumbnail) === "true" || is_thumbnail === true,
            fileHash,
          ]
        );
        const newImage = insertRes.rows[0];
        if (newImage.is_thumbnail) {
          await client.query("UPDATE rooms SET thumbnail = $1 WHERE id = $2", [
            oldImage.image_url,
            Number(roomId),
          ]);
        }
        await client.query("COMMIT");
        return res.success(newImage, "Đã dùng lại file ảnh cũ.", 201);
      }

      const imageUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/rooms/${filename}`;
      await client.query("BEGIN");
      if (String(is_thumbnail) === "true" || is_thumbnail === true) {
        await client.query(
          "UPDATE room_images SET is_thumbnail = false WHERE room_id = $1 AND is_thumbnail = true",
          [Number(roomId)]
        );
      }
      const insertRes = await client.query(
        `INSERT INTO room_images (room_id, image_url, is_thumbnail, file_hash) VALUES ($1,$2,$3,$4) RETURNING id, room_id, image_url, is_thumbnail, created_at, file_hash`,
        [
          Number(roomId),
          imageUrl,
          String(is_thumbnail) === "true" || is_thumbnail === true,
          fileHash,
        ]
      );
      const newImage = insertRes.rows[0];
      if (newImage.is_thumbnail) {
        await client.query("UPDATE rooms SET thumbnail = $1 WHERE id = $2", [
          imageUrl,
          Number(roomId),
        ]);
      }
      await client.query("COMMIT");
      res.success(newImage, "Tải ảnh lên thành công", 201);
    } catch (e) {
      await client.query("ROLLBACK");
      // attempt to remove uploaded file if transaction fails
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn(
          "Failed to unlink uploaded file after transaction failure:",
          unlinkErr.message
        );
      }
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("roomimagescontroller.uploadImageForRoom error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// PUT update image
export const updateImage = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await updateRoomImage(Number(id), req.body);
    res.success(updated, "Cập nhật ảnh thành công");
  } catch (error) {
    console.error("roomimagescontroller.updateImage error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

// DELETE image
export const deleteImage = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteRoomImage(Number(id));
    if (!deleted) {
      return res.error("Không tìm thấy ảnh", null, 404);
    }
    res.success(deleted, "Xóa ảnh thành công");
  } catch (error) {
    console.error("roomimagescontroller.deleteImage error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
