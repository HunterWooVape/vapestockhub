-- 第一步：先创建公开视图，再部署使用该视图的前后台代码。
-- 原表收权在部署验证后单独执行 operations/20261013_restrict_inventory_access.sql。
BEGIN;

-- 有意使用 owner 权限：匿名角色不再拥有原表权限。
-- 安全边界由固定字段、固定状态、价格脱敏和 security_barrier 共同构成。
CREATE OR REPLACE VIEW public.public_inventory
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  id, slug, title, brand, product_type, pricing_mode,
  CASE WHEN contact_visibility = 'public' AND pricing_mode = 'exact_price'
    THEN pricing_note ELSE NULL END AS pricing_note,
  description, flavor, nicotine, puff, e_liquid, production_date_text,
  CASE WHEN contact_visibility = 'public' AND pricing_mode = 'exact_price'
    THEN price ELSE NULL END AS price,
  quantity, moq, market, featured_markets, market_access_note,
  warehouse_location, images, status, contact_visibility,
  is_featured, is_urgent_clearance, last_verified_at, created_at, updated_at
FROM public.inventory
WHERE status IN ('active', 'sold');

ALTER VIEW public.public_inventory OWNER TO postgres;
REVOKE ALL ON public.public_inventory FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_inventory TO anon, authenticated, service_role;

COMMENT ON VIEW public.public_inventory IS
  'Public read-only inventory projection. Active/sold only; private prices and pricing notes are masked. Never add supplier or internal fields.';
NOTIFY pgrst, 'reload schema';
COMMIT;
