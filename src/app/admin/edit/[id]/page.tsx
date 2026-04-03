import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  contactVisibilityOptions,
  formatInventoryQualityMessage,
  getInventoryQualityReport,
  inventoryStatusOptions,
  normalizeKnownValue,
  placeholderInventoryImage,
  productTypeOptions,
} from '@/lib/admin-inventory'
import { toSlug } from '@/lib/inventory'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { adminSessionCookieName } from '@/lib/unlock'
import DeleteButton from './DeleteButton'

export const dynamic = 'force-dynamic'

const successMessages: Record<string, string> = {
  'inventory-updated': 'Inventory saved successfully.',
}

const errorMessages: Record<string, string> = {
  'missing-service-role-key': 'SUPABASE_SERVICE_ROLE_KEY is missing, so write actions are disabled.',
  'missing-required-fields': 'Fill in the required fields before saving.',
  'publish-blocked': 'This inventory cannot move to active yet. Resolve the blocking issues first.',
}

function isAdminAuthenticated(value?: string) {
  return value === 'active'
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function getUniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
    .sort((left, right) => left.localeCompare(right))
}

function getSelectedValue<T extends readonly string[]>(
  value: string,
  options: T,
  fallback: T[number]
) {
  return options.includes(value as T[number]) ? (value as T[number]) : fallback
}

function buildIssueRedirect(path: string, issues: string[]) {
  const searchParams = new URLSearchParams({ error: 'publish-blocked' })

  if (issues.length > 0) {
    searchParams.set('issues', issues.join(','))
  }

  return `${path}?${searchParams.toString()}`
}

function revalidateInventoryRoutes(currentSlug: string, nextSlug: string) {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/inventory')
  revalidatePath('/inventory/[slug]', 'page')
  revalidatePath('/market')
  revalidatePath('/market/[slug]', 'page')
  revalidatePath('/brand')
  revalidatePath('/brand/[slug]', 'page')
  revalidatePath('/price')
  revalidatePath('/price/[slug]', 'page')
  revalidatePath('/sitemap.xml')
  revalidatePath(`/inventory/${currentSlug}`)
  revalidatePath(`/inventory/${nextSlug}`)
}

async function buildUniqueInventorySlug(
  adminClient: NonNullable<ReturnType<typeof createAdminClient>>,
  value: string,
  currentId: string
) {
  const baseSlug = toSlug(value) || `inventory-${Date.now()}`
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const { data } = await adminClient
      .from('inventory')
      .select('id')
      .eq('slug', candidate)
      .neq('id', currentId)
      .maybeSingle()

    if (!data) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

export default async function EditInventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const success = getSingleParam(resolvedSearchParams.success)
  const error = getSingleParam(resolvedSearchParams.error)
  const issues = (getSingleParam(resolvedSearchParams.issues) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const cookieStore = await cookies()
  const isAuthenticated = isAdminAuthenticated(cookieStore.get(adminSessionCookieName)?.value)

  if (!isAuthenticated) {
    redirect('/admin')
  }

  const supabase = await createClient()
  const [{ data: item }, { data: inventoryOptions }] = await Promise.all([
    supabase
      .from('inventory')
      .select('*')
      .eq('id', resolvedParams.id)
      .single(),
    supabase.from('inventory').select('brand, market'),
  ])

  if (!item) {
    redirect('/admin?error=item-not-found')
  }

  const knownBrands = getUniqueValues((inventoryOptions ?? []).map((entry) => entry.brand))
  const knownMarkets = getUniqueValues((inventoryOptions ?? []).map((entry) => entry.market))
  const qualityReport = getInventoryQualityReport(
    {
      title: item.title,
      slug: item.slug,
      brand: item.brand,
      productType: item.product_type,
      price: item.price,
      quantity: item.quantity,
      moq: item.moq ?? 1,
      market: item.market,
      warehouseLocation: item.warehouse_location,
      description: item.description ?? '',
      imageUrl: item.images?.[0] ?? placeholderInventoryImage,
      contactVisibility: item.contact_visibility,
      flavor: item.flavor ?? '',
    },
    {
      knownBrands,
      knownMarkets,
    }
  )

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
    const brand = normalizeKnownValue(String(formData.get('brand') || '').trim(), knownBrands)
    const productType = getSelectedValue(
      String(formData.get('product_type') || '').trim(),
      productTypeOptions,
      'Other'
    )
    const price = Number(formData.get('price') || 0)
    const quantity = Number(formData.get('quantity') || 0)
    const market = normalizeKnownValue(String(formData.get('market') || '').trim(), knownMarkets)
    const warehouseLocation = String(formData.get('warehouse_location') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const imageUrl = String(formData.get('image_url') || '').trim()
    const contactVisibility = getSelectedValue(
      String(formData.get('contact_visibility') || 'contact_required').trim(),
      contactVisibilityOptions,
      'contact_required'
    )
    const status = getSelectedValue(
      String(formData.get('status') || 'draft').trim(),
      inventoryStatusOptions,
      'draft'
    )
    const slug = await buildUniqueInventorySlug(
      adminClient,
      String(formData.get('slug') || '').trim() || title,
      resolvedParams.id
    )

    if (!title || !brand || !productType || price <= 0 || quantity <= 0 || !market || !warehouseLocation || !slug) {
      redirect(`/admin/edit/${resolvedParams.id}?error=missing-required-fields`)
    }

    const nextQualityReport = getInventoryQualityReport(
      {
        title,
        slug,
        brand,
        productType,
        price,
        quantity,
        moq: Number(formData.get('moq') || 1),
        market,
        warehouseLocation,
        description,
        imageUrl: imageUrl || placeholderInventoryImage,
        contactVisibility,
        flavor: String(formData.get('flavor') || '').trim(),
      },
      {
        knownBrands,
        knownMarkets,
      }
    )

    if (status === 'active' && nextQualityReport.blockingIssues.length > 0) {
      redirect(buildIssueRedirect(`/admin/edit/${resolvedParams.id}`, nextQualityReport.blockingIssues))
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
      status,
      is_featured: formData.get('is_featured') === 'on',
      is_urgent_clearance: formData.get('is_urgent_clearance') === 'on',
    }).eq('id', resolvedParams.id)

    revalidateInventoryRoutes(item.slug, slug)
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

    revalidateInventoryRoutes(item.slug, item.slug)
    redirect('/admin?success=inventory-deleted')
  }

  const successMessage = success ? successMessages[success] : null
  const errorMessage = error ? errorMessages[error] : null
  const currentProductTypeOptions = productTypeOptions.includes(item.product_type)
    ? productTypeOptions
    : [item.product_type, ...productTypeOptions]

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

      {successMessage && (
        <div className="rounded-2xl border border-teal-DEFAULT/40 bg-teal-DEFAULT/10 p-4 text-sm text-foreground">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-status-danger/40 bg-status-danger/10 p-4 text-sm text-foreground space-y-3">
          <div>{errorMessage}</div>
          {issues.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 text-muted">
              {issues.map((issue) => (
                <li key={issue}>{formatInventoryQualityMessage(issue)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Edit Inventory</h2>
            <p className="text-muted mt-1">ID: {item.id}</p>
          </div>

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
              <input name="brand" list="brand-options-edit" defaultValue={item.brand} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Product Type</label>
              <select name="product_type" defaultValue={item.product_type} className="w-full rounded-lg border border-border bg-background px-4 py-3">
                {currentProductTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
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
              <input name="market" list="market-options-edit" defaultValue={item.market} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
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

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Contact Visibility</label>
                <select name="contact_visibility" defaultValue={item.contact_visibility} className="w-full rounded-lg border border-border bg-background px-4 py-3">
                  {contactVisibilityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Status</label>
                <select name="status" defaultValue={item.status} className="w-full rounded-lg border border-border bg-background px-4 py-3">
                  {inventoryStatusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
              <input type="checkbox" id="is_featured" name="is_featured" defaultChecked={item.is_featured} className="w-5 h-5" />
              <label htmlFor="is_featured" className="text-sm font-medium">🔥 Set as Featured Deal</label>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
              <input type="checkbox" id="is_urgent_clearance" name="is_urgent_clearance" defaultChecked={item.is_urgent_clearance} className="w-5 h-5" />
              <label htmlFor="is_urgent_clearance" className="text-sm font-medium">⚡ Urgent Clearance</label>
            </div>

            <button className="rounded-lg bg-teal-DEFAULT text-background font-semibold py-4 px-4 md:col-span-2 mt-4 hover:bg-teal-hover transition-colors">
              Save Changes
            </button>

            <datalist id="brand-options-edit">
              {knownBrands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
            <datalist id="market-options-edit">
              {knownMarkets.map((market) => (
                <option key={market} value={market} />
              ))}
            </datalist>
          </form>
        </div>

        <aside className="bg-surface border border-border rounded-2xl p-6 space-y-4 h-fit">
          <h2 className="text-xl font-bold">Publish Readiness</h2>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <div className="text-sm text-muted">Current status</div>
            <div className="mt-1 text-lg font-semibold uppercase tracking-wide">{item.status}</div>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2">
            <div className="text-sm font-medium">
              {qualityReport.blockingIssues.length > 0 ? 'Blocking issues' : 'No blocking issues'}
            </div>
            {qualityReport.blockingIssues.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-status-danger">
                {qualityReport.blockingIssues.map((issue) => (
                  <li key={issue}>{formatInventoryQualityMessage(issue)}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-teal-DEFAULT">This item can move to active once you are ready.</div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2">
            <div className="text-sm font-medium">Warnings</div>
            {qualityReport.warnings.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-status-warning">
                {qualityReport.warnings.map((issue) => (
                  <li key={issue}>{formatInventoryQualityMessage(issue)}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted">No warnings right now.</div>
            )}
          </div>
        </aside>
      </section>
    </main>
  )
}
