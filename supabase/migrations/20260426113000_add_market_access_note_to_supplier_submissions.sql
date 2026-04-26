ALTER TABLE supplier_submissions
    ADD COLUMN IF NOT EXISTS market_access_note TEXT;
