-- 新录入独立保存已核对的公开内容；不保存原始附件或 OCR 原文。
BEGIN;
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS entry_version smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model_name text,
  ADD COLUMN IF NOT EXISTS product_highlight text,
  ADD COLUMN IF NOT EXISTS stock_rows jsonb,
  ADD COLUMN IF NOT EXISTS stock_notes text,
  ADD COLUMN IF NOT EXISTS product_parameters jsonb,
  ADD COLUMN IF NOT EXISTS moq_public boolean NOT NULL DEFAULT true;

-- 先保留旧行的 0 / true，再修改新行默认值；不改历史内容与可见性。
ALTER TABLE public.inventory
  ALTER COLUMN entry_version SET DEFAULT 1,
  ALTER COLUMN moq_public SET DEFAULT false,
  ALTER COLUMN moq DROP DEFAULT,
  ALTER COLUMN price DROP NOT NULL;

CREATE OR REPLACE VIEW public.public_inventory
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  id, slug, title, brand, product_type, pricing_mode,
  CASE WHEN contact_visibility = 'public' AND pricing_mode = 'exact_price'
    THEN pricing_note ELSE NULL END AS pricing_note,
  CASE WHEN entry_version = 0 THEN description ELSE NULL END AS description,
  flavor, nicotine, puff, e_liquid, production_date_text,
  CASE WHEN contact_visibility = 'public' AND pricing_mode = 'exact_price'
    THEN price ELSE NULL END AS price,
  quantity, CASE WHEN moq_public THEN moq ELSE NULL END AS moq,
  market, featured_markets, market_access_note, warehouse_location, images,
  status, contact_visibility, is_featured, is_urgent_clearance,
  last_verified_at, created_at, updated_at,
  entry_version, model_name, product_highlight,
  CASE WHEN jsonb_typeof(stock_rows) = 'array' THEN
    (SELECT jsonb_agg(jsonb_build_object(
      'flavor', row->>'flavor', 'configuration', row->>'configuration',
      'nicotine', row->>'nicotine', 'quantity', row->'quantity'
    )) FROM jsonb_array_elements(stock_rows) AS row)
    ELSE NULL END AS stock_rows,
  stock_notes,
  CASE WHEN jsonb_typeof(product_parameters) = 'array' THEN
    (SELECT jsonb_agg(jsonb_build_object('name', pair->>'name', 'value', pair->>'value'))
      FROM jsonb_array_elements(product_parameters) AS pair)
    ELSE NULL END AS product_parameters,
  moq_public
FROM public.inventory WHERE status IN ('active', 'sold');

ALTER VIEW public.public_inventory OWNER TO postgres;
REVOKE ALL ON public.public_inventory FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_inventory TO anon, authenticated, service_role;
COMMENT ON VIEW public.public_inventory IS
  'Public inventory only: reviewed fields; prices and MOQ masked; no source documents or internal fields. Legacy content remains compatible.';
NOTIFY pgrst, 'reload schema';
COMMIT;
