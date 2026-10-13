-- 第二步：仅在正式站已切换 public_inventory、后台已切换鉴权服务端读取后执行。
-- 执行前保存 pg_policies 和 grants 基线；不要为了回滚旧代码重新开放原表。
BEGIN;

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory FROM PUBLIC, anon, authenticated;

-- 清除可能存在的列级授权，防止表级 REVOKE 后仍能挑列读取。
DO $$
DECLARE column_name text;
BEGIN
  FOR column_name IN
    SELECT attname FROM pg_attribute
    WHERE attrelid = 'public.inventory'::regclass AND attnum > 0 AND NOT attisdropped
  LOOP
    EXECUTE format('REVOKE ALL (%I) ON public.inventory FROM PUBLIC, anon, authenticated', column_name);
  END LOOP;
END $$;

-- 限制性策略也拦住未来误加的原表授权；不影响 postgres 视图 owner 与 service_role。
DROP POLICY IF EXISTS inventory_no_direct_public_access ON public.inventory;
CREATE POLICY inventory_no_direct_public_access ON public.inventory
AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
