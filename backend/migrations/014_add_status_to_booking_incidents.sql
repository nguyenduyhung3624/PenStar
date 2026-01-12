-- Migration: 014_add_status_to_booking_incidents
-- Description: Add status column to booking_incidents table
-- Created: 2026-01-13

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_incidents' AND column_name = 'status') THEN
        ALTER TABLE booking_incidents ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;
