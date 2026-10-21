import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import InventoryEntryForm from '@/components/inventory/InventoryEntryForm'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminSessionCookieName, getBackofficeRole, normalizeBackofficeReturnTo } from '@/lib/unlock'
import type { InventoryRecord } from '@/lib/inventory'
import DeleteButton from './DeleteButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '编辑库存', robots: { index: false, follow: false } }

export default async function EditInventoryPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  const role = getBackofficeRole((await cookies()).get(adminSessionCookieName)?.value)
  if (!role) redirect('/admin')
  const client = createAdminClient()
  if (!client) redirect('/admin?error=missing-service-role-key')
  const [{ data: item }, { data: options }, { data: source }] = await Promise.all([
    client.from('inventory').select('*').eq('id', id).maybeSingle(),
    client.from('inventory').select('brand'),
    client.from('supplier_submissions').select('id,supplier_name').eq('converted_inventory_id', id).maybeSingle(),
  ])
  if (!item) redirect('/admin?error=item-not-found')
  const returnTo = normalizeBackofficeReturnTo(typeof query.return_to === 'string' ? query.return_to : '')
  const knownBrands = [...new Set<string>((options ?? []).map((entry) => String(entry.brand)).filter(Boolean))].sort()
  async function deleteInventory() {
    'use server'
    const currentRole = getBackofficeRole((await cookies()).get(adminSessionCookieName)?.value)
    if (currentRole !== 'admin') redirect('/admin?error=insufficient-role')
    const admin = createAdminClient()
    if (!admin) redirect('/admin?error=missing-service-role-key')
    const { error } = await admin.from('inventory').delete().eq('id', id)
    if (error) redirect(`/admin/edit/${id}?error=delete-failed`)
    for (const path of ['/', '/admin', '/inventory', '/sitemap.xml']) revalidatePath(path)
    for (const path of ['/inventory/[slug]', '/brand/[slug]', '/market/[slug]', '/price/[slug]']) revalidatePath(path, 'page')
    redirect('/admin')
  }
  return <main lang="zh-CN" className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><Link href={returnTo || '/admin'} className="text-sm text-teal-DEFAULT">返回工作台</Link><h1 className="mt-3 text-2xl font-semibold">编辑库存</h1></div><div className="flex items-center gap-4 text-sm">{['active','sold'].includes(item.status) && <Link href={`/inventory/${item.slug}`} className="text-muted hover:text-teal-DEFAULT">查看正式页</Link>}{role === 'admin' && <form action={deleteInventory}><DeleteButton /></form>}</div></header>
    {query.success && <p role="status" className="rounded-xl border border-teal-DEFAULT/40 bg-teal-DEFAULT/5 p-4 text-sm">{query.success === 'inventory-published' ? '已发布。' : '已保存。'}</p>}
    {query.error && <p role="alert" className="rounded-xl border border-red-400/40 p-4 text-sm">操作未完成，请稍后重试。</p>}
    <InventoryEntryForm key={`${item.id}:${item.updated_at}`} item={item as InventoryRecord} isAdmin={role === 'admin'} knownBrands={knownBrands} returnTo={returnTo ?? ''} />
    {(source || item.entry_version === 1 && item.description) && <details className="rounded-xl border border-border p-4 text-sm"><summary className="cursor-pointer">内部资料</summary>{source && <div className="mt-3 flex flex-wrap gap-4 text-muted"><span>{source.supplier_name || '未填写来源'}</span><Link href={`/admin/submissions/${source.id}`} className="text-teal-DEFAULT">查看来源提报</Link></div>}{item.entry_version === 1 && item.description && <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-muted">{item.description}</pre>}</details>}
  </main>
}
