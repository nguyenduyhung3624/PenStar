-- Migration: Add refund_amount columns to bookings and booking_items
-- Date: 2026-01-01

-- Add refund_amount to bookings table (total refund amount for the booking)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12,2) DEFAULT NULL;

-- Add refund_amount to booking_items table (refund amount per room item)
ALTER TABLE booking_items 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12,2) DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN bookings.refund_amount IS 'Total refund amount for cancelled booking';
COMMENT ON COLUMN booking_items.refund_amount IS 'Refund amount for this specific room item';
