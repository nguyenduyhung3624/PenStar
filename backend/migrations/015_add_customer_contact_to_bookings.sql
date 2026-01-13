-- Migration: Add customer contact fields to bookings table
-- Created: 2026-01-13
-- Purpose: Store customer email and phone directly in bookings for walk-in bookings

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

COMMENT ON COLUMN bookings.customer_email IS 'Email của khách hàng (cho walk-in booking)';
COMMENT ON COLUMN bookings.customer_phone IS 'Số điện thoại khách hàng (cho walk-in booking)';
