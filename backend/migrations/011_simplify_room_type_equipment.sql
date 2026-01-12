ALTER TABLE room_type_equipments ADD COLUMN quantity INTEGER DEFAULT 1;
UPDATE room_type_equipments SET quantity = min_quantity;
ALTER TABLE room_type_equipments DROP COLUMN min_quantity;
ALTER TABLE room_type_equipments DROP COLUMN max_quantity;
