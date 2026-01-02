-- Thêm các trường deleted_at, deleted_by, deleted_reason vào bảng booking_incidents để hỗ trợ soft delete và log xóa
ALTER TABLE booking_incidents
ADD COLUMN deleted_at TIMESTAMP,
ADD COLUMN deleted_by INTEGER,
ADD COLUMN deleted_reason TEXT;