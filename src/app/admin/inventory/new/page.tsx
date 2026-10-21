import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import InventoryEntryForm from '@/components/inventory/InventoryEntryForm'
import { adminSessionCookieName, getBackofficeRole } from '@/lib/unlock'
export const metadata: Metadata = { title: '新建库存', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
export default async function NewInventory() {
  const role = getBackofficeRole((await cookies()).get(adminSessionCookieName)?.value)
  if (role !== 'admin') redirect('/admin')
  return <main lang="zh-CN" className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6"><header><Link href="/admin" className="text-sm text-teal-DEFAULT">返回工作台</Link><h1 className="mt-3 text-2xl font-semibold">新建库存</h1></header><InventoryEntryForm isAdmin /></main>
}
