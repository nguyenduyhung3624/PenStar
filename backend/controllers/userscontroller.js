import {
  createUser,
  getUsers,
  getUserByEmail,
  getUserById,
} from "../models/usersmodel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ERROR_MESSAGES } from "../utils/constants.js";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;
    if (!email || !password) {
      return res.error("Email và mật khẩu là bắt buộc", null, 400);
    }
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.error("Email đã được sử dụng", null, 409);
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({
      full_name,
      email,
      password: hashed,
      phone,
    });
    delete user.password;
    return res.success({ user }, "Đăng ký thành công", 201);
  } catch (err) {
    console.error("register error:", err);
    return res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.error("Email và mật khẩu là bắt buộc", null, 400);
    }
    const user = await getUserByEmail(email);
    if (!user) {
      return res.error("Thông tin đăng nhập không hợp lệ", null, 401);
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.error("Thông tin đăng nhập không hợp lệ", null, 401);
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role_id: user.role_id,
        role: user.role_name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("[backend] login: generated token, length:", token.length);
    return res.success({ token }, "Đăng nhập thành công");
  } catch (err) {
    console.error("login error:", err);
    return res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};
export const listUsers = async (req, res) => {
  try {
    const users = await getUsers();
    const safe = users.map((u) => {
      const { password, ...rest } = u;
      return rest;
    });
    return res.success(safe, "Lấy danh sách người dùng thành công");
  } catch (err) {
    console.error("listUsers error:", err);
    return res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};
export const getCurrentUser = async (req, res) => {
  try {
    console.log("[backend] getCurrentUser headers:", req.headers.authorization);
    const userId = req.user?.id;
    if (!userId) {
      return res.error(ERROR_MESSAGES.UNAUTHORIZED, null, 401);
    }
    const user = await getUserById(userId);
    if (!user) {
      return res.error("Người dùng không tồn tại", null, 404);
    }
    delete user.password;
    return res.success({ user }, "Lấy thông tin người dùng thành công");
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};
export const updateUserController = async (req, res) => {
  const { id } = req.params;
  const userId = String(id);
  const currentUserId = String(req.user?.id);
  if (userId === currentUserId && req.body.role_id !== undefined) {
    return res.error("Bạn không thể thay đổi quyền của chính mình", null, 403);
  }
  if (req.body.role_id !== undefined || req.body.status !== undefined) {
    const userRole = (req.user.role || req.user.role_name || "")
      .toString()
      .toLowerCase();
    const targetUser = await getUserById(userId);
    const targetRole = (targetUser?.role_name || "").toLowerCase();
    if (userRole === "admin" && targetRole === "admin") {
      return res.error(
        "Admin không thể thay đổi quyền hoặc chặn admin khác",
        null,
        403
      );
    }
    if (userRole !== "admin") {
      return res.error(
        "Chỉ admin mới có thể thay đổi quyền hoặc chặn người dùng",
        null,
        403
      );
    }
  }
  try {
    const { updateUser } = await import("../models/usersmodel.js");
    const updated = await updateUser(id, req.body);
    if (!updated) {
      return res.error("Người dùng không tồn tại", null, 404);
    }
    delete updated.password;
    return res.success({ user: updated }, "Cập nhật người dùng thành công");
  } catch (err) {
    console.error("updateUserController error:", err);
    return res.error(ERROR_MESSAGES.INTERNAL_ERROR, err.message, 500);
  }
};
