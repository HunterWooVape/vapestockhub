ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS pricing_mode TEXT,
    ADD COLUMN IF NOT EXISTS pricing_note TEXT;

UPDATE inventory
SET pricing_mode = CASE
    WHEN COALESCE(price, 0) > 0 THEN 'exact_price'
    ELSE 'inquiry_only'
END
WHERE pricing_mode IS NULL;

ALTER TABLE inventory
    ALTER COLUMN pricing_mode SET DEFAULT 'exact_price',
    ALTER COLUMN pricing_mode SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'inventory_pricing_mode_check'
    ) THEN
        ALTER TABLE inventory
            ADD CONSTRAINT inventory_pricing_mode_check
            CHECK (pricing_mode IN ('exact_price', 'inquiry_only'));
    END IF;
END $$;

ALTER TABLE supplier_submissions
    ADD COLUMN IF NOT EXISTS pricing_mode TEXT,
    ADD COLUMN IF NOT EXISTS pricing_note TEXT;

UPDATE supplier_submissions
SET pricing_mode = CASE
    WHEN COALESCE(BTRIM(unit_price_text), '') <> '' THEN 'exact_price'
    ELSE 'inquiry_only'
END
WHERE pricing_mode IS NULL;

ALTER TABLE supplier_submissions
    ALTER COLUMN pricing_mode SET DEFAULT 'exact_price',
    ALTER COLUMN pricing_mode SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'supplier_submissions_pricing_mode_check'
    ) THEN
        ALTER TABLE supplier_submissions
            ADD CONSTRAINT supplier_submissions_pricing_mode_check
            CHECK (pricing_mode IN ('exact_price', 'inquiry_only'));
    END IF;
END $$;
