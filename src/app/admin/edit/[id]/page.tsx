import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

import { adminSessionCookieName } from '@/lib/unlock'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import DeleteButton from './DeleteButton'

export const dynamic = 'force-dynamic'

function isAdminAuthenticated(value?: string) {
  return value === 'active'
}

export default async function EditInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const cookieStore = await cookies()
  const isAuthenticated = isAdminAuthenticated(cookieStore.get(adminSessionCookieName)?.value)

  if (!isAuthenticated) {
    redirect('/admin')
  }

  const supabase = await createClient()
  const { data: item } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!item) {
    redirect('/admin?error=item-not-found')
  }

  async function updateInventoryAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    if (!isAdminAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect(`/admin/edit/${resolvedParams.id}?error=missing-service-role-key`)
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
    const slug = String(formData.get('slug') || '').trim()

    if (!title || !brand || !productType || !price || !quantity || !market || !warehouseLocation || !slug) {
      redirect(`/admin/edit/${resolvedParams.id}?error=missing-required-fields`)
    }

    await adminClient.from('inventory').update({
      slug,
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
      is_featured: formData.get('is_featured') === 'on',
      is_urgent_clearance: formData.get('is_urgent_clearance') === 'on',
    }).eq('id', resolvedParams.id)

    revalidatePath('/admin')
    revalidatePath('/inventory')
    revalidatePath(`/inventory/${slug}`)
    redirect('/admin?success=inventory-updated')
  }

  async function deleteInventoryAction() {
    'use server'

    const actionCookies = await cookies()
    if (!isAdminAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect(`/admin/edit/${resolvedParams.id}?error=missing-service-role-key`)
    }

    await adminClient.from('inventory').delete().eq('id', resolvedParams.id)

    revalidatePath('/admin')
    revalidatePath('/inventory')
    redirect('/admin?success=inventory-deleted')
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 text-sm text-muted">
        <Link href="/admin" className="hover:text-foreground transition-colors">← Back to Admin</Link>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Inventory</h1>
          <p className="text-muted mt-1">ID: {item.id}</p>
        </div>
        <form action={deleteInventoryAction}>
          <DeleteButton />
        </form>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <form action={updateInventoryAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-muted mb-1 block">Title</label>
            <input name="title" defaultValue={item.title} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted mb-1 block">Slug (URL)</label>
            <input name="slug" defaultValue={item.slug} required className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm" />
          </div>
          
          <div>
            <label className="text-sm text-muted mb-1 block">Brand</label>
            <input name="brand" defaultValue={item.brand} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>
          <div>
            <label className="text-sm text-muted mb-1 block">Product Type</label>
            <input name="product_type" defaultValue={item.product_type} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>
          
          <div>
            <label className="text-sm text-muted mb-1 block">Price USD</label>
            <input name="price" type="number" step="0.01" defaultValue={item.price} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>
          <div>
            <label className="text-sm text-muted mb-1 block">Quantity</label>
            <input name="quantity" type="number" defaultValue={item.quantity} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>
          
          <div>
            <label className="text-sm text-muted mb-1 block">MOQ</label>
            <input name="moq" type="number" defaultValue={item.moq} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>
          <div>
            <label className="text-sm text-muted mb-1 block">Puff</label>
            <input name="puff" type="number" defaultValue={item.puff || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Nicotine</label>
            <input name="nicotine" defaultValue={item.nicotine || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>
          <div>
            <label className="text-sm text-muted mb-1 block">E-liquid</label>
            <input name="e_liquid" defaultValue={item.e_liquid || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-muted mb-1 block">Flavor (Comma separated)</label>
            <input name="flavor" defaultValue={item.flavor || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Market</label>
            <input name="market" defaultValue={item.market} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>
          <div>
            <label className="text-sm text-muted mb-1 block">Warehouse Location</label>
            <input name="warehouse_location" defaultValue={item.warehouse_location} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-muted mb-1 block">Image URL</label>
            <input name="image_url" defaultValue={item.images?.[0] || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-muted mb-1 block">Description / Manifest</label>
            <textarea name="description" defaultValue={item.description || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3 min-h-48 font-mono text-sm" />
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Contact Visibility</label>
              <select name="contact_visibility" defaultValue={item.contact_visibility} className="w-full rounded-lg border border-border bg-background px-4 py-3">
                <option value="contact_required">contact_required</option>
                <option value="public">public</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
              <input type="checkbox" id="is_featured" name="is_featured" defaultChecked={item.is_featured} className="w-5 h-5" />
              <label htmlFor="is_featured" className="text-sm font-medium">🔥 Set as Featured Deal</label>
            </div>
            
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
              <input type="checkbox" id="is_urgent_clearance" name="is_urgent_clearance" defaultChecked={item.is_urgent_clearance} className="w-5 h-5" />
              <label htmlFor="is_urgent_clearance" className="text-sm font-medium">⚡ Urgent Clearance</label>
            </div>
          </div>

          <button className="rounded-lg bg-teal-DEFAULT text-background font-semibold py-4 px-4 md:col-span-2 mt-4 hover:bg-teal-hover transition-colors">
            Save Changes
          </button>
        </form>
      </div>
    </main>
  )
}
