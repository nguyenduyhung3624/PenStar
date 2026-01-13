-- Migration: 002_enhance_voucher
-- Description: Enhance voucher/discount_codes with new fields from MongoDB schema
-- Created: 2026-01-08

-- =============================================
-- ADD NEW COLUMNS TO discount_codes
-- =============================================

-- Add name column
ALTER TABLE discount_codes
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Add is_only_for_new_user flag
ALTER TABLE discount_codes
ADD COLUMN IF NOT EXISTS is_only_for_new_user BOOLEAN DEFAULT FALSE;

-- Add max_discount_amount (for percentage type - caps the discount amount)
ALTER TABLE discount_codes
ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC(15, 2) DEFAULT 0;

-- Add updated_at timestamp
ALTER TABLE discount_codes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- =============================================
-- ENHANCE discount_code_usages TABLE
-- =============================================

-- Add usage_count column to track how many times a user used a specific code
ALTER TABLE discount_code_usages
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 1;

-- Create unique constraint for (discount_code_id, user_id)
-- This ensures one record per user per voucher
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_discount_code_user'
    ) THEN
        -- First, remove duplicates if any
        DELETE FROM discount_code_usages a
        USING discount_code_usages b
        WHERE a.id < b.id
        AND a.discount_code_id = b.discount_code_id
        AND a.user_id = b.user_id;

        -- Then add the unique constraint
        ALTER TABLE discount_code_usages
        ADD CONSTRAINT unique_discount_code_user UNIQUE (discount_code_id, user_id);
    END IF;
END $$;

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_discount_codes_status ON discount_codes(status);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_code_usages_user ON discount_code_usages(user_id);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN discount_codes.name IS 'Tên hiển thị của voucher';
COMMENT ON COLUMN discount_codes.is_only_for_new_user IS 'Chỉ áp dụng cho khách hàng mới (chưa có booking nào)';
COMMENT ON COLUMN discount_codes.max_discount_amount IS 'Số tiền giảm tối đa (cho loại percent)';
COMMENT ON COLUMN discount_code_usages.usage_count IS 'Số lần user đã sử dụng voucher này';
