-- Thêm trường mã giảm giá và số tiền giảm vào bảng bookings
ALTER TABLE bookings
ADD COLUMN discount_code VARCHAR(32),
ADD COLUMN discount_amount NUMERIC DEFAULT 0;
