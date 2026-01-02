-- Migration: booking_bill_logs table
CREATE TABLE IF NOT EXISTS booking_bill_logs (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(id),
  user_id INT,
  printed_at TIMESTAMP DEFAULT NOW(),
  bill_number TEXT,
  note TEXT
);