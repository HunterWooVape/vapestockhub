ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS featured_markets TEXT[] DEFAULT '{}'::TEXT[];

ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS market_access_note TEXT;

UPDATE inventory
SET featured_markets = ARRAY[market]
WHERE
    (featured_markets IS NULL OR cardinality(featured_markets) = 0)
    AND COALESCE(TRIM(market), '') <> ''
    AND LOWER(TRIM(market)) <> 'global';

UPDATE inventory
SET featured_markets = '{}'::TEXT[]
WHERE featured_markets IS NULL;

ALTER TABLE inventory
    ALTER COLUMN featured_markets SET DEFAULT '{}'::TEXT[];

ALTER TABLE inventory
    ALTER COLUMN featured_markets SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_featured_markets
    ON inventory
    USING GIN (featured_markets);

ALTER TABLE supplier_submissions
    ADD COLUMN IF NOT EXISTS featured_markets_text TEXT;
