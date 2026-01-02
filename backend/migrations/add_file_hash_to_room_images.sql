-- Thêm trường file_hash vào bảng room_images
ALTER TABLE room_images ADD COLUMN file_hash VARCHAR(64);
-- Nếu dùng SHA1 thì 40 ký tự, MD5 thì 32 ký tự, dùng 64 cho dư.
-- Có thể thêm UNIQUE nếu muốn chống trùng tuyệt đối:
-- ALTER TABLE room_images ADD CONSTRAINT unique_file_hash UNIQUE (file_hash);