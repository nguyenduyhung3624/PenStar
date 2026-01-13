-- Migration: 004_refund_requests
-- Description: Add booking_items status and create refund_requests table
-- Created: 2026-01-09

-- =============================================
-- ADD STATUS COLUMN TO BOOKING_ITEMS
-- =============================================
-- Allows individual room cancellation within a booking

ALTER TABLE booking_items
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_booking_items_status ON booking_items(status);

-- Add cancelled_at timestamp
ALTER TABLE booking_items
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Add cancel_reason
ALTER TABLE booking_items
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

COMMENT ON COLUMN booking_items.status IS 'active, cancelled';

-- =============================================
-- CREATE REFUND_REQUESTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS refund_requests (
    id SERIAL PRIMARY KEY,

    -- References
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    booking_item_id INTEGER REFERENCES booking_items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),

    -- Refund amount
    amount NUMERIC(15, 2) NOT NULL,

    -- Bank information
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(100) NOT NULL,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending',
    -- pending: waiting for admin
    -- approved: admin approved, waiting for transfer
    -- completed: money transferred
    -- rejected: admin rejected

    -- Admin processing
    receipt_image TEXT,
    admin_notes TEXT,
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_booking_id ON refund_requests(booking_id);

-- Comments
COMMENT ON TABLE refund_requests IS 'Customer refund requests with bank information';
COMMENT ON COLUMN refund_requests.status IS 'pending, approved, completed, rejected';
COMMENT ON COLUMN refund_requests.receipt_image IS 'Bank transfer receipt image URL';
