ALTER TABLE inventory
ALTER COLUMN status SET DEFAULT 'draft'::inventory_status;
