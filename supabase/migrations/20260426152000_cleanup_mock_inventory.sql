-- 清理历史 mock 库存，保留真实上传到 Supabase Storage 的图片数据。
DELETE FROM inventory
WHERE
  slug LIKE 'mock-vape-stock-%'
  OR EXISTS (
    SELECT 1
    FROM unnest(COALESCE(images, ARRAY[]::text[])) AS image_url
    WHERE
      image_url LIKE '%placehold.co%'
      OR image_url LIKE '%inventory-placeholder.svg%'
  );
