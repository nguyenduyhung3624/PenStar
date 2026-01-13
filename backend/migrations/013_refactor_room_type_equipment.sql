-- Migration: 013_refactor_room_type_equipment
-- Description: Refactor room_type_equipments to be independent of master_equipments
-- Created: 2026-01-12

-- 1. Add new columns
ALTER TABLE room_type_equipments ADD COLUMN name VARCHAR(255);
ALTER TABLE room_type_equipments ADD COLUMN price NUMERIC(15, 2) DEFAULT 0;

-- 2. Migrate existing data from master_equipments
UPDATE room_type_equipments rte
SET
    name = me.name,
    price = 0 -- Default price to 0 since we do not track it in master_equipments logic for now, or fetch from there if needed
FROM master_equipments me
WHERE rte.equipment_type_id = me.id;

-- 3. Drop constraints and old columns
ALTER TABLE room_type_equipments DROP CONSTRAINT unique_room_type_equipment;
ALTER TABLE room_type_equipments DROP CONSTRAINT room_type_equipments_equipment_type_id_fkey;
ALTER TABLE room_type_equipments DROP COLUMN equipment_type_id;

-- 4. Add index for room_type_id
CREATE INDEX idx_room_type_equipments_room_type_id ON room_type_equipments(room_type_id);
