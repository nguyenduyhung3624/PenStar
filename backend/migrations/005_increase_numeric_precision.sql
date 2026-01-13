-- Migration: 005_increase_numeric_precision
-- Description: Increase numeric field precision for price columns to support larger values
-- Created: 2026-01-09

-- The current NUMERIC(10,2) only supports up to 99,999,999.99 (8 integer digits)
-- But VND prices can be much larger (e.g., 102,598,091 = 9 digits)
-- Increase to NUMERIC(15,2) to support up to 999,999,999,999.99

-- Bookings table
ALTER TABLE bookings
  ALTER COLUMN total_price TYPE NUMERIC(15, 2);

-- Room types table
ALTER TABLE room_types
  ALTER COLUMN price TYPE NUMERIC(15, 2);

ALTER TABLE room_types
  ALTER COLUMN extra_adult_fee TYPE NUMERIC(15, 2);

ALTER TABLE room_types
  ALTER COLUMN extra_child_fee TYPE NUMERIC(15, 2);

-- Booking items table
ALTER TABLE booking_items
  ALTER COLUMN room_type_price TYPE NUMERIC(15, 2);

ALTER TABLE booking_items
  ALTER COLUMN extra_adult_fees TYPE NUMERIC(15, 2);

ALTER TABLE booking_items
  ALTER COLUMN extra_child_fees TYPE NUMERIC(15, 2);

ALTER TABLE booking_items
  ALTER COLUMN extra_fees TYPE NUMERIC(15, 2);

ALTER TABLE booking_items
  ALTER COLUMN refund_amount TYPE NUMERIC(15, 2);

-- Services table
ALTER TABLE services
  ALTER COLUMN price TYPE NUMERIC(15, 2);

-- Booking services table
ALTER TABLE booking_services
  ALTER COLUMN total_service_price TYPE NUMERIC(15, 2);

-- Confirm changes
SELECT 'Migration 005_increase_numeric_precision completed successfully' AS status;
