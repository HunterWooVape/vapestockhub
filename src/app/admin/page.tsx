import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  convertAiDraftPackageToInventoryDraft,
  contactVisibilityOptions,
  formatInventoryQualityMessage,
  getInventoryQualityReport,
  inventoryStatusOptions,
  normalizeKnownValue,
  parseInventoryAiDraftPackage,
  placeholderInventoryImage,
  productTypeOptions,
} from '@/lib/admin-inventory'
import { toSlug } from '@/lib/inventory'
import {
  formatSupplierSubmissionFieldLabel,
  getSupplierSubmissionMissingRequiredFields,
  supplierSubmissionStatusOptions,
  type SupplierSubmissionValues,
} from '@/lib/submissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  adminSessionCookieName,
  getBackofficeRole,
  isAdminRole,
  isBackofficeAuthenticated,
  isBackofficeSessionSigningReady,
  serializeBackofficeSession,
  type BackofficeRole,
} from '@/lib/unlock'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 10

const successMessages: Record<string, string> = {
  'inventory-created-draft': 'Inventory draft created successfully.',
  'ai-draft-imported': 'AI Draft Package imported into a new inventory draft.',
  'status-updated': 'Inventory status updated successfully.',
}

const errorMessages: Record<string, string> = {
  'invalid-credentials': '用户名或密码不正确。',
  'invalid-ai-draft-package': 'AI Draft Package is invalid. Fix the JSON and required fields first.',
  'missing-service-role-key': 'SUPABASE_SERVICE_ROLE_KEY is missing, so write actions are disabled.',
  'missing-session-secret': '缺少 BACKOFFICE_SESSION_SECRET，后台登录已被禁用。',
  'missing-required-fields': 'Fill in the required inventory fields before saving the draft.',
  'publish-blocked': 'This inventory cannot be published yet. Resolve the blocking issues first.',
  'invalid-status': 'The selected status is not allowed.',
  'insufficient-role': '当前角色无权使用该后台入口或动作。',
}

function resolveBackofficeRoleByCredentials(username: string, password: string): BackofficeRole | null {
  if (
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD &&
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return 'admin'
  }

  if (
    process.env.STAFF_USERNAME &&
    process.env.STAFF_PASSWORD &&
    username === process.env.STAFF_USERNAME &&
    password === process.env.STAFF_PASSWORD
  ) {
    return 'staff'
  }

  return null
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
  const importErrors = (getSingleParam(params.import_errors) ?? '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)

  const cookieStore = await cookies()
  const sessionValue = cookieStore.get(adminSessionCookieName)?.value
  const isAuthenticated = isBackofficeAuthenticated(sessionValue)
  const currentRole = getBackofficeRole(sessionValue)
  const isAdminUser = currentRole === 'admin'
  const roleBadgeLabel = isAdminUser ? 'Admin 视图' : 'Staff 视图'
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

    const username = String(formData.get('username') || '').trim()
    const password = String(formData.get('password') || '').trim()
    const role = resolveBackofficeRoleByCredentials(username, password)

    if (!role) {
      redirect('/admin?error=invalid-credentials')
    }

    const sessionValue = serializeBackofficeSession(role)
    if (!sessionValue) {
      redirect('/admin?error=missing-session-secret')
    }

    const actionCookies = await cookies()
    actionCookies.set(adminSessionCookieName, sessionValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
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
    if (!isBackofficeAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }
    if (!isAdminRole(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin?error=insufficient-role')
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
    const actionSessionValue = actionCookies.get(adminSessionCookieName)?.value
    if (!isBackofficeAuthenticated(actionSessionValue)) {
      redirect('/admin')
    }
    if (!isAdminRole(actionSessionValue)) {
      redirect('/admin?error=insufficient-role')
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

  async function importAiDraftPackageAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    if (!isBackofficeAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }
    if (!isAdminRole(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin?error=insufficient-role')
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect('/admin?error=missing-service-role-key')
    }

    const draftPackageInput = String(formData.get('ai_draft_package_json') || '').trim()
    const parsedDraftPackage = parseInventoryAiDraftPackage(draftPackageInput)

    if (!parsedDraftPackage.success) {
      const searchParams = new URLSearchParams({ error: 'invalid-ai-draft-package' })
      searchParams.set('import_errors', parsedDraftPackage.errors.join('|'))
      redirect(`/admin?${searchParams.toString()}`)
    }

    const draftValues = convertAiDraftPackageToInventoryDraft(parsedDraftPackage.draftPackage)
    const title = draftValues.title?.trim() || parsedDraftPackage.draftPackage.normalizedFields.title.trim()
    const brand = normalizeKnownValue(draftValues.brand?.trim() || '', knownBrands)
    const productType = getSelectedValue(
      draftValues.productType?.trim() || '',
      productTypeOptions,
      'Other'
    )
    const market = normalizeKnownValue(draftValues.market?.trim() || '', knownMarkets)
    const slugSeed = draftValues.slug?.trim() || title
    const slug = await buildUniqueInventorySlug(adminClient, slugSeed)
    const imageUrl = draftValues.imageUrl?.trim() || placeholderInventoryImage

    await adminClient.from('inventory').insert({
      slug,
      title,
      brand,
      product_type: productType,
      price: draftValues.price ?? 0,
      quantity: draftValues.quantity ?? 0,
      moq: draftValues.moq ?? 1,
      market,
      warehouse_location: draftValues.warehouseLocation?.trim() || '',
      description: draftValues.description?.trim() || null,
      images: [imageUrl],
      nicotine: draftValues.nicotine?.trim() || null,
      flavor: draftValues.flavor?.trim() || null,
      puff: draftValues.puff ?? null,
      e_liquid: draftValues.eLiquid?.trim() || null,
      contact_visibility: getSelectedValue(
        draftValues.contactVisibility || 'contact_required',
        contactVisibilityOptions,
        'contact_required'
      ),
      status: 'draft',
      is_featured: false,
      is_urgent_clearance: false,
    })

    revalidateInventoryRoutes(slug)
    redirect('/admin?success=ai-draft-imported')
  }

  const successMessage = success ? successMessages[success] : null
  const errorMessage = error ? errorMessages[error] : null

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen py-16 px-4 max-w-md mx-auto">
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
          <h1 className="text-3xl font-bold">后台登录</h1>
          {!isBackofficeSessionSigningReady() && (
            <div className="rounded-xl border border-status-danger/40 bg-status-danger/10 px-4 py-3 text-sm text-foreground">
              缺少 `BACKOFFICE_SESSION_SECRET`，当前环境无法创建安全后台会话。
            </div>
          )}
          {errorMessage && (
            <div className="rounded-xl border border-status-danger/40 bg-status-danger/10 px-4 py-3 text-sm text-foreground">
              {errorMessage}
            </div>
          )}
          <form action={loginAction} className="space-y-4">
            <input name="username" placeholder="用户名" className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            <input name="password" type="password" placeholder="密码" className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            <button className="w-full rounded-lg bg-teal-DEFAULT text-background font-semibold py-3">进入后台</button>
          </form>
        </div>
      </main>
    )
  }

  const serviceKeyReady = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const adminClient = serviceKeyReady ? createAdminClient() : null
  const { data: recentSubmissions } = adminClient
    ? await adminClient
        .from('supplier_submissions')
        .select('id, supplier_name, brand, model_name, product_type, available_qty_text, target_market, warehouse_location, submission_status, converted_inventory_id, created_at')
        .order('created_at', { ascending: false })
        .limit(8)
    : { data: null }
  const submissionRows = (recentSubmissions ?? []).map((item) => {
    const submissionValues: SupplierSubmissionValues = {
      supplierName: item.supplier_name ?? '',
      contactName: '',
      contactChannel: '',
      sourceType: 'supplier_form',
      brand: item.brand ?? '',
      modelName: item.model_name ?? '',
      productType: item.product_type ?? '',
      unitPriceText: '',
      availableQtyText: item.available_qty_text ?? '',
      moqText: '',
      targetMarket: item.target_market ?? '',
      warehouseLocation: item.warehouse_location ?? '',
      puffText: '',
      nicotineText: '',
      eLiquidText: '',
      flavorList: '',
      flavorBreakdown: '',
      imageLinks: '',
      stockNotes: '',
      packagingNotes: '',
      extraNotes: '',
      internalNotes: '',
      submissionStatus: supplierSubmissionStatusOptions.includes(item.submission_status) ? item.submission_status : 'new',
    }

    return {
      ...item,
      missingRequiredFields: getSupplierSubmissionMissingRequiredFields(submissionValues),
    }
  })
  const workflowPrimaryHref = isAdminUser ? '#recent-inventory' : '/admin/submissions'
  const workflowPrimaryLabel = isAdminUser ? '查看草稿与发布检查 →' : '进入提报队列 →'
  const workflowSecondaryHref = isAdminUser ? '/admin/submissions' : '/submit-stock'
  const workflowSecondaryLabel = isAdminUser ? '进入提报队列 →' : '打开库存提报 →'
  const roleSummary = isAdminUser
    ? '你当前看到的是 Admin 完整总控台，可继续处理发布检查与高级入口。'
    : '你当前看到的是 Staff 精简总控台，默认优先处理提报审核与草稿衔接。'

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div className="space-y-2">
          <div className="inline-flex rounded-full border border-teal-DEFAULT/30 bg-teal-DEFAULT/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-teal-DEFAULT">
            {roleBadgeLabel}
          </div>
          <h1 className="text-3xl font-bold">后台总控台</h1>
          <p className="text-muted mt-1">{roleSummary}</p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-lg border border-border px-4 py-2 hover:bg-surface transition-colors">退出登录</button>
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
          {importErrors.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 text-muted">
              {importErrors.map((importError) => (
                <li key={importError}>{importError}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!serviceKeyReady && (
        <div className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-foreground">
          当前环境缺少 `SUPABASE_SERVICE_ROLE_KEY`，后台写入类操作暂时不可用。
        </div>
      )}

      <section className="rounded-3xl border border-border bg-surface p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">今日工作流</h2>
            <p className="max-w-3xl text-sm text-muted">
              默认顺序是：先提报，再审核，再编辑草稿，最后发布。
            </p>
            <p className="max-w-3xl text-sm text-muted">
              {isAdminUser
                ? 'Admin 可继续处理草稿、发布检查和低频高级导入，但日常仍建议先关注提报队列。'
                : 'Staff 默认先进入提报队列，不建议从总控台直接执行高级录入或导入动作。'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={workflowPrimaryHref}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-teal-DEFAULT hover:bg-background"
            >
              {workflowPrimaryLabel}
            </Link>
            <Link
              href={workflowSecondaryHref}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-background"
            >
              {workflowSecondaryLabel}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-background p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">步骤 1</div>
            <div className="font-medium text-foreground">录入原始提报</div>
            <div className="text-sm text-muted">
              当供应商或内部人员需要录入原始库存资料时，统一使用 `submit-stock`。
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">步骤 2</div>
            <div className="font-medium text-foreground">审核提报</div>
            <div className="text-sm text-muted">
              在 `/admin/submissions` 处理缺失字段、标准化字段表达，并决定是否转草稿。
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">步骤 3</div>
            <div className="font-medium text-foreground">编辑草稿</div>
            <div className="text-sm text-muted">
              在草稿页处理标题、描述、SEO 细节和发布前阻塞项。
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">步骤 4</div>
            <div className="font-medium text-foreground">发布上线</div>
            <div className="text-sm text-muted">
              只有在草稿通过质量检查、图片检查和联系可见性检查后才允许上线。
            </div>
          </div>
        </div>

        {isAdminUser ? (
          <div className="rounded-2xl border border-status-warning/30 bg-status-warning/10 p-4 space-y-2 text-sm text-foreground">
            <div className="font-medium">高级入口</div>
            <div>
              `Import AI Draft Package` 不是后台日常主流程，只适合把外部已清洗好的 AI JSON 导入为新草稿。
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-background p-4 space-y-2 text-sm text-muted">
            <div className="font-medium text-foreground">当前角色已隐藏高级入口</div>
            <div>
              `手动新建草稿` 与 `导入 AI 草稿包` 已按 `Staff` 角色隐藏。请优先处理提报审核、AI 建议和草稿衔接。
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="space-y-8">
          {isAdminUser && (
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">手动新建草稿</h2>
                <p className="text-sm text-muted">所有新建条目都会先以 draft 进入系统，发布前仍需完成 slug、描述和图片检查。</p>
              </div>
              <form action={createInventoryAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="title" placeholder="标题" required className="rounded-lg border border-border bg-background px-4 py-3 md:col-span-2" />
                <input name="brand" list="brand-options" placeholder="品牌" required className="rounded-lg border border-border bg-background px-4 py-3" />
                <select name="product_type" defaultValue="Disposable Vape" className="rounded-lg border border-border bg-background px-4 py-3">
                  {productTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <input name="price" type="number" step="0.01" placeholder="价格 USD" required className="rounded-lg border border-border bg-background px-4 py-3" />
                <input name="quantity" type="number" placeholder="库存数量" required className="rounded-lg border border-border bg-background px-4 py-3" />
                <input name="moq" type="number" placeholder="MOQ" defaultValue="1" className="rounded-lg border border-border bg-background px-4 py-3" />
                <input name="puff" type="number" placeholder="口数 Puff" className="rounded-lg border border-border bg-background px-4 py-3" />
                <input name="nicotine" placeholder="尼古丁" className="rounded-lg border border-border bg-background px-4 py-3" />
                <input name="e_liquid" placeholder="烟油容量" className="rounded-lg border border-border bg-background px-4 py-3" />
                <input name="flavor" placeholder="口味标签" className="rounded-lg border border-border bg-background px-4 py-3" />
                <input name="market" list="market-options" placeholder="目标市场" required className="rounded-lg border border-border bg-background px-4 py-3" />
                <input name="warehouse_location" placeholder="仓库位置" required className="rounded-lg border border-border bg-background px-4 py-3" />
                <input name="image_url" placeholder="图片链接或 /images/..." className="rounded-lg border border-border bg-background px-4 py-3 md:col-span-2" />
                <textarea name="description" placeholder="描述 / 清单备注" className="rounded-lg border border-border bg-background px-4 py-3 md:col-span-2 min-h-28" />
                <select name="contact_visibility" defaultValue="contact_required" className="rounded-lg border border-border bg-background px-4 py-3">
                  {contactVisibilityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
                  <input type="checkbox" id="is_featured" name="is_featured" className="w-5 h-5" />
                  <label htmlFor="is_featured" className="text-sm font-medium">🔥 设为重点推荐</label>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 md:col-span-2">
                  <input type="checkbox" id="is_urgent_clearance" name="is_urgent_clearance" className="w-5 h-5" />
                  <label htmlFor="is_urgent_clearance" className="text-sm font-medium">⚡ 紧急清仓</label>
                </div>
                <button className="rounded-lg bg-teal-DEFAULT text-background font-semibold py-3 px-4 md:col-span-2">创建草稿</button>
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
          )}

          {isAdminUser && (
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">高级入口：导入 AI 草稿包</h2>
                <p className="text-sm text-muted">
                  仅当你已经拿到外部清洗后的结构化 AI JSON 时，才使用这里导入。
                </p>
                <p className="text-sm text-muted">
                  该入口会跳过提报流程，直接创建新的 draft，因此不建议作为日常主流程使用。
                </p>
              </div>
              <form action={importAiDraftPackageAction} className="space-y-4">
                <textarea
                  name="ai_draft_package_json"
                  placeholder={'{\n  "version": "v1",\n  "rawInput": { "sourceType": "excel", "rawText": "..." },\n  "normalizedFields": { "title": "...", "brand": "...", "market": "...", "product_type": "Disposable Vape", "description_summary": "...", "manifest_notes": "..." },\n  "missingFields": [],\n  "riskFlags": [],\n  "humanReviewFocus": []\n}'}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 min-h-72 font-mono text-sm"
                />
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-muted space-y-1">
                  <div>必需 JSON 路径：rawInput.rawText、normalizedFields.title、normalizedFields.brand、normalizedFields.market、normalizedFields.product_type，以及至少一个描述字段。</div>
                  <div>导入结果始终先落成 draft，后续仍需经过发布检查。</div>
                  <div>仅在没有 supplier submission 记录，或数据来自独立 AI 预处理工具时使用。</div>
                </div>
                <button className="rounded-lg bg-teal-DEFAULT text-background font-semibold py-3 px-4">
                  导入 AI 草稿
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">最近提报</h2>
                <p className="text-sm text-muted mt-1">供应商或内部录入的结构化提报会先进入这里，再进入审核与转草稿流程。</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/admin/submissions" className="text-sm text-muted hover:text-teal-DEFAULT hover:underline font-medium">
                  查看全部 →
                </Link>
                <Link href="/submit-stock" className="text-sm text-teal-DEFAULT hover:underline font-medium">
                  打开提报 →
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              {submissionRows.length === 0 ? (
                <div className="rounded-xl border border-border/70 bg-background px-4 py-5 text-sm text-muted">
                  暂无提报记录。可先通过私有提报入口开始录入真实库存数据。
                </div>
              ) : (
                submissionRows.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="font-semibold">{item.brand || '待补品牌'} · {item.model_name || '待补型号'}</div>
                        <div className="text-sm text-muted">{item.supplier_name || '待补供应商'} · {item.target_market || '待补市场'}</div>
                        <div className="text-xs text-muted mt-1">{item.warehouse_location || '待补仓库'}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium uppercase tracking-wide">{item.submission_status}</div>
                        <div className="text-muted">{new Date(item.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background px-4 py-3 space-y-1">
                      {item.missingRequiredFields.length > 0 ? (
                        <div className="text-sm text-status-warning">
                          仍有 {item.missingRequiredFields.length} 个最低必填项待补齐
                        </div>
                      ) : (
                        <div className="text-sm text-teal-DEFAULT">可以进入提报审核</div>
                      )}
                      {item.missingRequiredFields.length > 0 && (
                        <div className="text-xs text-muted">
                          {item.missingRequiredFields.slice(0, 3).map((field) => formatSupplierSubmissionFieldLabel(field)).join(' · ')}
                        </div>
                      )}
                      {item.converted_inventory_id && (
                        <div className="text-xs text-teal-DEFAULT">
                          已转草稿：{item.converted_inventory_id}
                        </div>
                      )}
                    </div>
                    <Link href={`/admin/submissions/${item.id}`} className="text-sm text-teal-DEFAULT hover:underline font-medium">
                      进入审核 →
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div id="recent-inventory" className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">最近草稿 / 库存</h2>
              <span className="text-sm text-muted">总数：{totalItems}</span>
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
                        {item.qualityReport.blockingIssues.length} 个发布阻塞项
                      </div>
                    ) : (
                      <div className="text-sm text-teal-DEFAULT">可以进入发布检查</div>
                    )}
                    {item.qualityReport.warnings.length > 0 && (
                      <div className="text-xs text-status-warning">
                        {item.qualityReport.warnings.length} 个警告待处理
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    {isAdminUser ? (
                      <form action={updateStatusAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="id" value={item.id} />
                        <button name="status" value="draft" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">设为 Draft</button>
                        <button name="status" value="active" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">发布上线</button>
                        <button name="status" value="reserved" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">设为 Reserved</button>
                        <button name="status" value="sold" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">设为 Sold</button>
                      </form>
                    ) : (
                      <div className="text-xs text-muted">
                        `Staff` 角色在总控台默认不执行状态切换，请进入草稿页继续处理内容。
                      </div>
                    )}
                    <Link href={`/admin/edit/${item.id}`} className="text-sm text-teal-DEFAULT hover:underline font-medium">
                      编辑草稿 →
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
                    上一页
                  </Link>
                )}
                <span className="text-sm text-muted">
                  第 {page} / {totalPages} 页
                </span>
                {page < totalPages && (
                  <Link
                    href={`/admin?page=${page + 1}`}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors text-sm"
                  >
                    下一页
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
