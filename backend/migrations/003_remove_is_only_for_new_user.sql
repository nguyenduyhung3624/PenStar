-- Migration: 003_remove_is_only_for_new_user
-- Description: Remove is_only_for_new_user column from discount_codes table
-- Created: 2026-01-08

-- =============================================
-- DROP COLUMN is_only_for_new_user
-- =============================================

ALTER TABLE discount_codes
DROP COLUMN IF EXISTS is_only_for_new_user;

-- Remove the comment as well (if exists)
-- COMMENT ON COLUMN discount_codes.is_only_for_new_user IS NULL;
