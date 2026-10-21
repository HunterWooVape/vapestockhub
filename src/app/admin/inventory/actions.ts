'use server'

import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminSessionCookieName, getBackofficeRole, normalizeBackofficeReturnTo } from '@/lib/unlock'
import { inventoryPublishIssues, readInventoryEntry } from '@/lib/inventory-entry'
import type { InventoryRecord } from '@/lib/inventory'

export type InventorySaveResult = { errors: string[] }

export async function saveInventoryEntry(_previous: InventorySaveResult, data: FormData): Promise<InventorySaveResult> {
  const role = getBackofficeRole((await cookies()).get(adminSessionCookieName)?.value)
  if (!role) return { errors: ['请重新登录后台。'] }
  const client = createAdminClient()
  if (!client) return { errors: ['后台写入服务暂不可用。'] }
  const idValue = String(data.get('id') ?? '')
  if (idValue && !/^[0-9a-f-]{36}$/i.test(idValue)) return { errors: ['记录编号无效。'] }
  if (!idValue && role !== 'admin') return { errors: ['仅管理员可直接新建库存；请从提报流程转草稿。'] }
  const result = idValue ? await client.from('inventory').select('*').eq('id', idValue).maybeSingle() : null
  if (result?.error || idValue && !result?.data) return { errors: ['未能读取库存，请刷新后重试。'] }
  const current = result?.data as InventoryRecord | null
  let values: ReturnType<typeof readInventoryEntry>
  try { values = readInventoryEntry(data, current) }
  catch (error) { return { errors: [error instanceof SyntaxError ? '清单数据格式无效，请重新核对。' : (error as Error).message] } }
  const publishing = data.get('intent') === 'publish'
  if (role !== 'admin' && (publishing || values.status !== current?.status)) return { errors: ['发布和状态变更请交由管理员处理。'] }
  if (publishing) values.status = 'active'
  if (values.status === 'active') {
    const issues = inventoryPublishIssues(values)
    if (issues.length) return { errors: issues }
  }
  const id = idValue || randomUUID()
  // 旧网址始终沿用；新草稿允许暂时没有标题。
  let slug = current?.slug || values.slug || `inventory-${id}`
  if (!current) {
    const { data: duplicate, error } = await client.from('inventory').select('id').eq('slug', slug).maybeSingle()
    if (error) return { errors: ['未能检查网址，请稍后重试。'] }
    if (duplicate) slug = `${slug}-${id.slice(0, 8)}`
  }
  const payload = { ...values, slug }
  const saved = current
    ? await client.from('inventory').update(payload).eq('id', id)
    : await client.from('inventory').insert({ ...payload, id })
  if (saved.error) return { errors: [saved.error.code === '42703' || saved.error.code === 'PGRST204' ? '请先完成录入字段迁移，再保存草稿。' : '保存失败，输入内容已保留，请稍后重试。'] }
  for (const path of ['/', '/admin', '/inventory', '/brand', '/market', '/price', '/sitemap.xml']) revalidatePath(path)
  for (const path of ['/inventory/[slug]', '/brand/[slug]', '/market/[slug]', '/price/[slug]']) revalidatePath(path, 'page')
  revalidatePath(`/admin/edit/${id}`)
  const returnTo = normalizeBackofficeReturnTo(String(data.get('return_to') ?? ''))
  const query = new URLSearchParams({ success: values.status === 'active' ? 'inventory-published' : 'inventory-updated' })
  if (returnTo) query.set('return_to', returnTo)
  redirect(`/admin/edit/${id}?${query}`)
}
