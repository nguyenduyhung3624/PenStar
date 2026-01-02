-- Seed sample refund policies for room_types
-- Ví dụ: room_type_id 1 hoàn 80% trước 48h, room_type_id 2 không hoàn

INSERT INTO refund_policies (room_type_id, refundable, refund_percent, refund_deadline_hours, non_refundable, notes)
VALUES
  (1, TRUE, 80, 48, FALSE, 'Hoàn 80% nếu hủy trước 48h'),
  (2, FALSE, NULL, NULL, TRUE, 'Không hoàn tiền khi hủy'),
  (3, TRUE, 100, 24, FALSE, 'Hoàn toàn bộ nếu hủy trước 24h');
