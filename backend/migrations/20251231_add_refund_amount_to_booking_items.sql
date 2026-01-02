-- Thêm trường refund_amount vào booking_items để lưu số tiền hoàn lại từng phòng
ALTER TABLE booking_items ADD COLUMN refund_amount INTEGER DEFAULT 0;
