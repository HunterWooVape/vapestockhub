import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

import { adminSessionCookieName } from '@/lib/unlock'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { toSlug } from '@/lib/inventory'

export const dynamic = 'force-dynamic'

function isAdminAuthenticated(value?: string) {
  return value === 'active'
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = parseInt(params.page as string || '1')
  const ITEMS_PER_PAGE = 10

  const cookieStore = await cookies()
  const isAuthenticated = isAdminAuthenticated(cookieStore.get(adminSessionCookieName)?.value)
  const supabase = await createClient()

  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const { data: inventory, count } = await supabase
    .from('inventory')
    .select('id, slug, title, status, contact_visibility, brand, market, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalItems = count ?? 0
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  async function loginAction(formData: FormData) {
    'use server'

    const username = formData.get('username')
    const password = formData.get('password')

    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const actionCookies = await cookies()
      actionCookies.set(adminSessionCookieName, 'active', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8,
      })
    }

    redirect('/admin')
  }

  async function logoutAction() {
    'use server'

    const actionCookies = await cookies()
    actionCookies.delete(adminSessionCookieName)
    redirect('/admin')
  }

  async function createInventoryAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    if (!isAdminAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect('/admin?error=missing-service-role-key')
    }

    const title = String(formData.get('title') || '').trim()
    const brand = String(formData.get('brand') || '').trim()
    const productType = String(formData.get('product_type') || '').trim()
    const price = Number(formData.get('price') || 0)
    const quantity = Number(formData.get('quantity') || 0)
    const market = String(formData.get('market') || '').trim()
    const warehouseLocation = String(formData.get('warehouse_location') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const imageUrl = String(formData.get('image_url') || '').trim()
    const contactVisibility = String(formData.get('contact_visibility') || 'contact_required')

    if (!title || !brand || !productType || !price || !quantity || !market || !warehouseLocation) {
      redirect('/admin?error=missing-required-fields')
    }

    await adminClient.from('inventory').insert({
      slug: `${toSlug(title)}-${Date.now()}`,
      title,
      brand,
      product_type: productType,
      price,
      quantity,
      moq: Number(formData.get('moq') || 1),
      market,
      warehouse_location: warehouseLocation,
      description: description || null,
      images: imageUrl ? [imageUrl] : ['/images/inventory-placeholder.svg'],
      nicotine: String(formData.get('nicotine') || '').trim() || null,
      flavor: String(formData.get('flavor') || '').trim() || null,
      puff: Number(formData.get('puff') || 0) || null,
      e_liquid: String(formData.get('e_liquid') || '').trim() || null,
      contact_visibility: contactVisibility,
      status: 'active',
      is_featured: formData.get('is_featured') === 'on',
      is_urgent_clearance: formData.get('is_urgent_clearance') === 'on',
    })

    revalidatePath('/admin')
    revalidatePath('/inventory')
    redirect('/admin?success=inventory-created')
  }

  async function updateStatusAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    if (!isAdminAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect('/admin?error=missing-service-role-key')
    }

    const id = String(formData.get('id') || '')
    const status = String(formData.get('status') || 'active')

    await adminClient.from('inventory').update({ status }).eq('id', id)

    revalidatePath('/admin')
    revalidatePath('/inventory')
    redirect('/admin?success=status-updated')
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen py-16 px-4 max-w-md mx-auto">
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
          <h1 className="text-3xl font-bold">Admin Access</h1>
          <form action={loginAction} className="space-y-4">
            <input name="username" placeholder="Username" className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            <input name="password" type="password" placeholder="Password" className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            <button className="w-full rounded-lg bg-teal-DEFAULT text-background font-semibold py-3">Enter Admin</button>
          </form>
        </div>
      </main>
    )
  }

  const serviceKeyReady = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-muted mt-1">Create inventory and update stock status without opening Supabase directly.</p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-lg border border-border px-4 py-2 hover:bg-surface transition-colors">Logout</button>
        </form>
      </div>

      {!serviceKeyReady && (
        <div className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-foreground">
          Add SUPABASE_SERVICE_ROLE_KEY to your environment before using write actions in this admin page.
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-xl font-bold">Add Inventory</h2>
          <form action={createInventoryAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="title" placeholder="Title" className="rounded-lg border border-border bg-background px-4 py-3 md:col-span-2" />
            <input name="brand" placeholder="Brand" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="product_type" placeholder="Product Type" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="price" type="number" step="0.01" placeholder="Price USD" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="quantity" type="number" placeholder="Quantity" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="moq" type="number" placeholder="MOQ" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="puff" type="number" placeholder="Puff" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="nicotine" placeholder="Nicotine" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="e_liquid" placeholder="E-liquid" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="flavor" placeholder="Flavor" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="market" placeholder="Market" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="warehouse_location" placeholder="Warehouse Location" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="image_url" placeholder="Image URL or /images/..." className="rounded-lg border border-border bg-background px-4 py-3 md:col-span-2" />
            <textarea name="description" placeholder="Description" className="rounded-lg border border-border bg-background px-4 py-3 md:col-span-2 min-h-28" />
            <select name="contact_visibility" className="rounded-lg border border-border bg-background px-4 py-3">
              <option value="contact_required">contact_required</option>
              <option value="public">public</option>
            </select>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
              <input type="checkbox" id="is_featured" name="is_featured" className="w-5 h-5" />
              <label htmlFor="is_featured" className="text-sm font-medium">🔥 Set as Featured Deal</label>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
              <input type="checkbox" id="is_urgent_clearance" name="is_urgent_clearance" className="w-5 h-5" />
              <label htmlFor="is_urgent_clearance" className="text-sm font-medium">⚡ Urgent Clearance</label>
            </div>
            <button className="rounded-lg bg-teal-DEFAULT text-background font-semibold py-3 px-4 md:col-span-2">Create Inventory</button>
          </form>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Recent Inventory</h2>
            <span className="text-sm text-muted">Total: {totalItems}</span>
          </div>
          <div className="space-y-4">
            {inventory?.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-muted">{item.brand} · {item.market}</div>
                    <div className="text-xs text-muted mt-1">{item.slug}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{item.status}</div>
                    <div className="text-muted">{item.contact_visibility}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <form action={updateStatusAction} className="flex gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <button name="status" value="active" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">Active</button>
                    <button name="status" value="reserved" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">Reserved</button>
                    <button name="status" value="sold" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">Sold</button>
                  </form>
                  <Link href={`/admin/edit/${item.id}`} className="text-sm text-teal-DEFAULT hover:underline font-medium">
                    Edit Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6 border-t border-border">
              {page > 1 && (
                <Link
                  href={`/admin?page=${page - 1}`}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors text-sm"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/admin?page=${page + 1}`}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors text-sm"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
