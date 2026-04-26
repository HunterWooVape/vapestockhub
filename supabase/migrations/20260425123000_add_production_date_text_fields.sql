ALTER TABLE supplier_submissions
    ADD COLUMN IF NOT EXISTS production_date_text TEXT;

ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS production_date_text TEXT;
