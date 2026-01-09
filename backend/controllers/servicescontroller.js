import {
  getServices as modelGetServices,
  getServiceById as modelGetServicesId,
  createService as modelCreateService,
  updateService as modelUpdateService,
  deleteService as modelDeleteService,
} from "../models/servicesmodel.js";
import { ERROR_MESSAGES } from "../utils/constants.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const getServices = async (req, res) => {
  try {
    const data = await modelGetServices();
    res.success(data, "Lấy danh sách dịch vụ thành công");
  } catch (error) {
    console.error("getServices error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const getServiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await modelGetServicesId(id);
    if (!data) {
      return res.error("Dịch vụ không tồn tại", null, 404);
    }
    res.success(data, "Lấy thông tin dịch vụ thành công");
  } catch (error) {
    console.error("getServiceById error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const createService = async (req, res) => {
  try {
    const { existsServiceWithName } = await import(
      "../models/servicesmodel.js"
    );
    const { name } = req.body;

    if (await existsServiceWithName(String(name))) {
      return res.error("Tên dịch vụ đã tồn tại", null, 400);
    }

    let thumbnail = null;

    // ✅ XỬ LÝ FILE THUMBNAIL
    if (req.files && req.files.thumbnail_file && req.files.thumbnail_file[0]) {
      const file = req.files.thumbnail_file[0];
      thumbnail = `/uploads/services/${file.filename}`;
    }

    const newService = await modelCreateService({
      ...req.body,
      thumbnail,
    });

    res.success(newService, "Tạo dịch vụ thành công", 201);
  } catch (error) {
    console.error("createService error:", error);
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const updateService = async (req, res) => {
  const { id } = req.params;
  console.log(
    "[updateService] Controller called. id:",
    id,
    "body:",
    req.body,
    "files:",
    req.files
  );

  try {
    const { existsServiceWithName } = await import(
      "../models/servicesmodel.js"
    );
    const { name } = req.body;

    if (name && (await existsServiceWithName(String(name), Number(id)))) {
      return res.error("Tên dịch vụ đã tồn tại", null, 400);
    }

    // ✅ LẤY THÔNG TIN HIỆN TẠI TỪ DB
    const currentService = await modelGetServicesId(id);
    if (!currentService) {
      return res.error("Dịch vụ không tồn tại", null, 404);
    }

    let thumbnail = req.body.thumbnail || currentService.thumbnail;

    // ✅ XỬ LÝ FILE THUMBNAIL MỚI
    if (req.files && req.files.thumbnail_file && req.files.thumbnail_file[0]) {
      const file = req.files.thumbnail_file[0];
      thumbnail = `/uploads/services/${file.filename}`;
    }

    const updateData = {
      ...req.body,
      thumbnail,
    };

    const updated = await modelUpdateService(id, updateData);

    if (!updated) {
      return res.error("Dịch vụ không tồn tại", null, 404);
    }

    res.success(updated, "Cập nhật dịch vụ thành công");
  } catch (error) {
    console.error(
      "[updateService] ERROR:",
      error && error.stack ? error.stack : error
    );
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};

export const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await modelDeleteService(id);
    if (!deleted) {
      return res.error("Dịch vụ không tồn tại", null, 404);
    }
    res.success(deleted, "Xóa dịch vụ thành công");
  } catch (error) {
    console.error(
      "[deleteService] ERROR:",
      error && error.stack ? error.stack : error
    );
    res.error(ERROR_MESSAGES.INTERNAL_ERROR, error.message, 500);
  }
};
