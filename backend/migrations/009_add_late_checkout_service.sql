-- Migration: 009_add_late_checkout_service
-- Description: Add a system service for Late Checkout Fees
-- Created: 2026-01-10

INSERT INTO services (name, price, description, is_included, unit, note)
VALUES (
    'Phụ thu checkout muộn',
    100000,
    'Phí phụ thu khi checkout muộn (sau 12:00, trước 15:00)',
    FALSE,
    'Giờ',
    'System Service - Do not delete'
)
ON CONFLICT (id) DO NOTHING; -- Note: ID isn't fixed, but name isn't unique constraint in schema, only ID.
-- Ideally we should check if exists by name to avoid dupes if run multiple times without strict migration tracking?
-- But migration logic usually prevents re-run.
-- Let's stick to simple insert.
