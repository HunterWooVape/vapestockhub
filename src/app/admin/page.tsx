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

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 10

const successMessages: Record<string, string> = {
  'inventory-created-draft': 'Inventory draft created successfully.',
  'status-updated': 'Inventory status updated successfully.',
}

const errorMessages: Record<string, string> = {
  'missing-service-role-key': 'SUPABASE_SERVICE_ROLE_KEY is missing, so write actions are disabled.',
  'missing-required-fields': 'Fill in the required inventory fields before saving the draft.',
  'publish-blocked': 'This inventory cannot be published yet. Resolve the blocking issues first.',
  'invalid-status': 'The selected status is not allowed.',
}

function isAdminAuthenticated(value?: string) {
  return value === 'active'
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function getPageNumber(value?: string | string[]) {
  const parsedValue = Number.parseInt(getSingleParam(value) ?? '1', 10)

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1
  }

  return parsedValue
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

function revalidateInventoryRoutes(slug?: string) {
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

  if (slug) {
    revalidatePath(`/inventory/${slug}`)
  }
}

async function buildUniqueInventorySlug(
  adminClient: NonNullable<ReturnType<typeof createAdminClient>>,
  value: string,
  currentId?: string
) {
  const baseSlug = toSlug(value) || `inventory-${Date.now()}`
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const query = currentId
      ? adminClient.from('inventory').select('id').eq('slug', candidate).neq('id', currentId).maybeSingle()
      : adminClient.from('inventory').select('id').eq('slug', candidate).maybeSingle()

    const { data } = await query

    if (!data) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = getPageNumber(params.page)
  const success = getSingleParam(params.success)
  const error = getSingleParam(params.error)
  const issues = (getSingleParam(params.issues) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const cookieStore = await cookies()
  const isAuthenticated = isAdminAuthenticated(cookieStore.get(adminSessionCookieName)?.value)
  const supabase = await createClient()

  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const [{ data: inventory, count }, { data: inventoryOptions }] = await Promise.all([
    supabase
      .from('inventory')
      .select(
        'id, slug, title, status, contact_visibility, brand, market, created_at, product_type, price, quantity, moq, warehouse_location, description, images, flavor',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase.from('inventory').select('brand, market'),
  ])

  const knownBrands = getUniqueValues((inventoryOptions ?? []).map((item) => item.brand))
  const knownMarkets = getUniqueValues((inventoryOptions ?? []).map((item) => item.market))
  const inventoryRows = (inventory ?? []).map((item) => ({
    ...item,
    qualityReport: getInventoryQualityReport(
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
    ),
  }))

  const totalItems = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))

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

    if (!title || !brand || !productType || price <= 0 || quantity <= 0 || !market || !warehouseLocation) {
      redirect('/admin?error=missing-required-fields')
    }

    const slug = await buildUniqueInventorySlug(adminClient, title)

    await adminClient.from('inventory').insert({
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
      images: imageUrl ? [imageUrl] : [placeholderInventoryImage],
      nicotine: String(formData.get('nicotine') || '').trim() || null,
      flavor: String(formData.get('flavor') || '').trim() || null,
      puff: Number(formData.get('puff') || 0) || null,
      e_liquid: String(formData.get('e_liquid') || '').trim() || null,
      contact_visibility: contactVisibility,
      status: 'draft',
      is_featured: formData.get('is_featured') === 'on',
      is_urgent_clearance: formData.get('is_urgent_clearance') === 'on',
    })

    revalidateInventoryRoutes(slug)
    redirect('/admin?success=inventory-created-draft')
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
    const status = getSelectedValue(
      String(formData.get('status') || 'draft').trim(),
      inventoryStatusOptions,
      'draft'
    )

    if (!inventoryStatusOptions.includes(status)) {
      redirect('/admin?error=invalid-status')
    }

    const { data: item } = await adminClient
      .from('inventory')
      .select('id, slug, title, brand, product_type, price, quantity, moq, market, warehouse_location, description, images, contact_visibility, flavor')
      .eq('id', id)
      .single()

    if (status === 'active' && item) {
      const report = getInventoryQualityReport(
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

      if (report.blockingIssues.length > 0) {
        redirect(buildIssueRedirect('/admin', report.blockingIssues))
      }
    }

    await adminClient.from('inventory').update({ status }).eq('id', id)

    revalidateInventoryRoutes(item?.slug)
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
  const successMessage = success ? successMessages[success] : null
  const errorMessage = error ? errorMessages[error] : null

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-muted mt-1">Create inventory drafts, review publish blockers, and push approved stock live.</p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-lg border border-border px-4 py-2 hover:bg-surface transition-colors">Logout</button>
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

      {!serviceKeyReady && (
        <div className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-foreground">
          Add SUPABASE_SERVICE_ROLE_KEY to your environment before using write actions in this admin page.
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Add Inventory</h2>
            <p className="text-sm text-muted">Every new item starts as a draft. Publishing requires a valid slug, description, and a non-placeholder image.</p>
          </div>
          <form action={createInventoryAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="title" placeholder="Title" required className="rounded-lg border border-border bg-background px-4 py-3 md:col-span-2" />
            <input name="brand" list="brand-options" placeholder="Brand" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <select name="product_type" defaultValue="Disposable" className="rounded-lg border border-border bg-background px-4 py-3">
              {productTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <input name="price" type="number" step="0.01" placeholder="Price USD" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="quantity" type="number" placeholder="Quantity" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="moq" type="number" placeholder="MOQ" defaultValue="1" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="puff" type="number" placeholder="Puff" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="nicotine" placeholder="Nicotine" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="e_liquid" placeholder="E-liquid" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="flavor" placeholder="Flavor tags" className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="market" list="market-options" placeholder="Market" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="warehouse_location" placeholder="Warehouse Location" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="image_url" placeholder="Image URL or /images/..." className="rounded-lg border border-border bg-background px-4 py-3 md:col-span-2" />
            <textarea name="description" placeholder="Description / Manifest" className="rounded-lg border border-border bg-background px-4 py-3 md:col-span-2 min-h-28" />
            <select name="contact_visibility" defaultValue="contact_required" className="rounded-lg border border-border bg-background px-4 py-3">
              {contactVisibilityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
              <input type="checkbox" id="is_featured" name="is_featured" className="w-5 h-5" />
              <label htmlFor="is_featured" className="text-sm font-medium">🔥 Set as Featured Deal</label>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 md:col-span-2">
              <input type="checkbox" id="is_urgent_clearance" name="is_urgent_clearance" className="w-5 h-5" />
              <label htmlFor="is_urgent_clearance" className="text-sm font-medium">⚡ Urgent Clearance</label>
            </div>
            <button className="rounded-lg bg-teal-DEFAULT text-background font-semibold py-3 px-4 md:col-span-2">Create Draft</button>
            <datalist id="brand-options">
              {knownBrands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
            <datalist id="market-options">
              {knownMarkets.map((market) => (
                <option key={market} value={market} />
              ))}
            </datalist>
          </form>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Recent Inventory</h2>
            <span className="text-sm text-muted">Total: {totalItems}</span>
          </div>
          <div className="space-y-4">
            {inventoryRows.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-muted">{item.brand} · {item.market}</div>
                    <div className="text-xs text-muted mt-1">{item.slug}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium uppercase tracking-wide">{item.status}</div>
                    <div className="text-muted">{item.contact_visibility}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3 space-y-1">
                  {item.qualityReport.blockingIssues.length > 0 ? (
                    <div className="text-sm text-status-danger">
                      {item.qualityReport.blockingIssues.length} publish blocker{item.qualityReport.blockingIssues.length > 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div className="text-sm text-teal-DEFAULT">Ready for publish review</div>
                  )}
                  {item.qualityReport.warnings.length > 0 && (
                    <div className="text-xs text-status-warning">
                      {item.qualityReport.warnings.length} warning{item.qualityReport.warnings.length > 1 ? 's' : ''} to review
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <form action={updateStatusAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <button name="status" value="draft" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">Draft</button>
                    <button name="status" value="active" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">Publish</button>
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
