-- Seed sample refund policies for room_types
-- Ví dụ: room_type_id 1 hoàn 80% trước 48h, room_type_id 2 không hoàn

INSERT INTO refund_policies (room_type_id, refundable, refund_percent, refund_deadline_hours, non_refundable, notes)
VALUES
  (1, TRUE, 80, 48, FALSE, 'Hoàn 80% nếu hủy trước 48h'),
  (2, FALSE, NULL, NULL, TRUE, 'Không hoàn tiền khi hủy'),
  (3, TRUE, 100, 24, FALSE, 'Hoàn toàn bộ nếu hủy trước 24h'),
  (10, TRUE, 80, 24, FALSE, 'Hoàn 80% nếu hủy trước 24h'),
  (11, TRUE, 80, 24, FALSE, 'Hoàn 80% nếu hủy trước 24h'),
  (12, TRUE, 80, 24, FALSE, 'Hoàn 80% nếu hủy trước 24h')
ON CONFLICT (room_type_id) DO UPDATE SET
  refundable = EXCLUDED.refundable,
  refund_percent = EXCLUDED.refund_percent,
  refund_deadline_hours = EXCLUDED.refund_deadline_hours,
  non_refundable = EXCLUDED.non_refundable,
  notes = EXCLUDED.notes;
  (10, TRUE, 80, 24, FALSE, 'Hoàn 80% nếu hủy trước 24h'),
  (11, TRUE, 80, 24, FALSE, 'Hoàn 80% nếu hủy trước 24h'),
  (12, TRUE, 80, 24, FALSE, 'Hoàn 80% nếu hủy trước 24h')
ON CONFLICT (room_type_id) DO NOTHING;
