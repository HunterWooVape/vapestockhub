import 'server-only'

import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { connection } from 'next/server'

import type { PublicInventoryRecord } from '@/lib/inventory'

// 仅使用公开视图；不能回退到原表或 service role。
export const getPublicInventory = cache(async (): Promise<PublicInventoryRecord[]> => {
  await connection()
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  )
  const items: PublicInventoryRecord[] = []
  const pageSize = 500
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from('public_inventory')
      .select('*')
      .order('id')
      .range(offset, offset + pageSize - 1)

    if (error) {
      // 数据库异常不能伪装成空库存，否则会误删发现入口和网站地图。
      throw new Error('Public inventory is temporarily unavailable.')
    }
    items.push(...(data as PublicInventoryRecord[]))
    if (data.length < pageSize) break
  }
  return items
})
