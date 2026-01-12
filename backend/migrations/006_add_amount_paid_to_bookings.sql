-- Add amount_paid column to bookings table
ALTER TABLE bookings ADD COLUMN amount_paid NUMERIC(10, 2) DEFAULT 0;

-- Backfill amount_paid for existing bookings
-- If payment_status is 'paid', assume full amount is paid
UPDATE bookings SET amount_paid = total_price WHERE payment_status = 'paid';
