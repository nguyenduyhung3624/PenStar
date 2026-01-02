-- Thêm trường file_hash vào bảng room_type_images
ALTER TABLE room_type_images ADD COLUMN file_hash VARCHAR(64);
-- Có thể thêm UNIQUE nếu muốn chống trùng tuyệt đối:
-- ALTER TABLE room_type_images ADD CONSTRAINT unique_file_hash UNIQUE (file_hash);