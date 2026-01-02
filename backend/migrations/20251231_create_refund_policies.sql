-- Migration: Create refund_policies table and add relation to room_types

CREATE TABLE refund_policies (
    id SERIAL PRIMARY KEY,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    refundable BOOLEAN NOT NULL DEFAULT FALSE,
    refund_percent INTEGER,
    refund_deadline_hours INTEGER,
    non_refundable BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
);

CREATE UNIQUE INDEX idx_refund_policies_room_type_id ON refund_policies(room_type_id);
