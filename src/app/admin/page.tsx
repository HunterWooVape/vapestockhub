import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BackofficeFlowBar } from '@/components/submissions/backoffice-flow-bar'
import {
  formatInventoryStatusActionLabel,
  formatInventoryQualityMessage,
  getInventoryQualityReport,
  inventoryStatusOptions,
  placeholderInventoryImage,
} from '@/lib/admin-inventory'
import {
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
  normalizeBackofficeReturnTo,
  serializeBackofficeSession,
  type BackofficeRole,
} from '@/lib/unlock'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 10

const successMessages: Record<string, string> = {
  'status-updated': '库存状态已更新。',
}

const errorMessages: Record<string, string> = {
  'invalid-credentials': '用户名或密码不正确。',
  'missing-service-role-key': '缺少 `SUPABASE_SERVICE_ROLE_KEY`，当前无法执行写入动作。',
  'missing-session-secret': '缺少 BACKOFFICE_SESSION_SECRET，后台登录已被禁用。',
  'missing-required-fields': '请先补齐库存必填字段，再保存草稿。',
  'publish-blocked': '当前库存还不能发布，请先处理发布阻塞项。',
  'invalid-status': '当前状态切换不被允许。',
  'insufficient-role': '当前角色无权使用该后台入口或动作。',
}

const submissionStatusLabels: Record<(typeof supplierSubmissionStatusOptions)[number], string> = {
  new: '新录入',
  reviewing: '审核中',
  converted: '已转草稿',
  rejected: '已驳回',
}

function formatSubmissionStatusLabel(status: (typeof supplierSubmissionStatusOptions)[number]) {
  return submissionStatusLabels[status]
}

function getSubmissionPriorityMeta(item: {
  missingRequiredFields: string[]
}) {
  if (item.missingRequiredFields.length > 0) {
    return {
      label: '优先补齐',
      className: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
      hint: `先补齐 ${item.missingRequiredFields.length} 项最低必填`,
    }
  }

  return {
    label: '优先转草稿',
    className: 'border-teal-DEFAULT/30 bg-teal-DEFAULT/10 text-teal-DEFAULT',
    hint: '最低必填已齐，可继续审核并转草稿',
  }
}

function getDraftPriorityMeta(item: {
  qualityReport: { blockingIssues: string[] }
}) {
  if (item.qualityReport.blockingIssues.length > 0) {
    return {
      label: '先清阻塞',
      className: 'border-status-danger/30 bg-status-danger/10 text-status-danger',
      hint: `先处理 ${item.qualityReport.blockingIssues.length} 个发布阻塞项`,
    }
  }

  return {
    label: '可进入发布',
    className: 'border-teal-DEFAULT/30 bg-teal-DEFAULT/10 text-teal-DEFAULT',
    hint: '阻塞项已清空，可继续发布检查',
  }
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

function buildAdminPageRedirect(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `/admin?${queryString}` : '/admin'
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = getPageNumber(params.page)
  const success = getSingleParam(params.success)
  const error = getSingleParam(params.error)
  const returnTo = normalizeBackofficeReturnTo(getSingleParam(params.return_to))
  const issues = (getSingleParam(params.issues) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const cookieStore = await cookies()
  const sessionValue = cookieStore.get(adminSessionCookieName)?.value
  const isAuthenticated = isBackofficeAuthenticated(sessionValue)
  const currentRole = getBackofficeRole(sessionValue)
  const isAdminUser = currentRole === 'admin'
  const roleBadgeLabel = isAdminUser ? 'Admin 视图' : 'Staff 视图'

  if (isAuthenticated && returnTo && !success && !error) {
    redirect(returnTo)
  }

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
      .eq('status', 'draft')
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
    const returnTo = normalizeBackofficeReturnTo(String(formData.get('return_to') || '').trim())
    const role = resolveBackofficeRoleByCredentials(username, password)

    if (!role) {
      redirect(buildAdminPageRedirect({
        error: 'invalid-credentials',
        return_to: returnTo,
      }))
    }

    const sessionValue = serializeBackofficeSession(role)
    if (!sessionValue) {
      redirect(buildAdminPageRedirect({
        error: 'missing-session-secret',
        return_to: returnTo,
      }))
    }

    const actionCookies = await cookies()
    actionCookies.set(adminSessionCookieName, sessionValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    redirect(returnTo ?? '/admin')
  }

  async function logoutAction() {
    'use server'

    const actionCookies = await cookies()
    actionCookies.delete(adminSessionCookieName)
    redirect('/admin')
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
          {returnTo && (
            <div className="rounded-xl border border-teal-DEFAULT/30 bg-teal-DEFAULT/10 px-4 py-3 text-sm text-foreground">
              登录成功后会返回你刚才要打开的后台页面。
            </div>
          )}
          <form action={loginAction} className="space-y-4">
            {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
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
        .select('id, supplier_name, brand, model_name, product_type, available_qty_text, target_market, warehouse_location, production_date_text, submission_status, converted_inventory_id, created_at')
        .is('converted_inventory_id', null)
        .in('submission_status', ['new', 'reviewing'])
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
      marketAccessNote: '',
      warehouseLocation: item.warehouse_location ?? '',
      puffText: '',
      nicotineText: '',
      eLiquidText: '',
      productionDateText: item.production_date_text ?? '',
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
  const workflowPrimaryHref = '/admin/submissions'
  const workflowPrimaryLabel = '去审核队列 →'
  const workflowSecondaryHref = '/submit-stock'
  const workflowSecondaryLabel = '去内部录入 →'
  const roleSummary = isAdminUser
    ? 'Admin 负责审核推进、草稿终审和发布判断。'
    : 'Staff 负责内部录入、审核处理和草稿衔接。'

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
            <h2 className="text-xl font-bold text-foreground">主工作流</h2>
            <p className="max-w-3xl text-sm text-muted">
              日常只看这条主链路：内部录入、审核队列、发布前确认。
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
            {isAdminUser && (
              <Link
                href="/admin/tools"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-background"
              >
                Admin 工具 →
              </Link>
            )}
          </div>
        </div>
        {isAdminUser && (
          <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted">
            低频操作已移到独立工具页，首页只保留主流程。
          </div>
        )}
        <BackofficeFlowBar currentStep="admin" />
      </section>

      <section className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">待审核录入</h2>
                <p className="text-sm text-muted mt-1">先补最低必填，再把可推进的记录送进草稿。</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/admin/submissions?return_to=%2Fadmin" className="text-sm text-teal-DEFAULT hover:underline font-medium">
                  去审核队列 →
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              {submissionRows.length === 0 ? (
                <div className="rounded-xl border border-border/70 bg-background px-4 py-5 text-sm text-muted">
                  <div>当前没有待审核录入。</div>
                  <div className="mt-2">先去内部录入台新增提报，再回到这里推进审核。</div>
                  <div className="mt-4">
                    <Link href="/submit-stock?return_to=%2Fadmin" className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-teal-DEFAULT hover:bg-surface">
                      去内部录入 →
                    </Link>
                  </div>
                </div>
              ) : (
                submissionRows.map((item) => {
                  const priorityMeta = getSubmissionPriorityMeta(item)

                  return (
                    <div key={item.id} className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex justify-between gap-3">
                        <div>
                          <div className="font-semibold">{item.brand || '待补品牌'} · {item.model_name || '待补型号'}</div>
                          <div className="text-sm text-muted">{item.supplier_name || '待补供应商'}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{formatSubmissionStatusLabel(item.submission_status)}</div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-background px-4 py-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted">处理优先级</span>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${priorityMeta.className}`}>
                            {priorityMeta.label}
                          </span>
                        </div>
                        <div className="text-xs text-muted">{priorityMeta.hint}</div>
                        {item.missingRequiredFields.length > 0 ? (
                          <div className="text-sm text-status-warning">
                            下一步：补齐 {item.missingRequiredFields.length} 项
                          </div>
                        ) : (
                          <div className="text-sm text-teal-DEFAULT">下一步：去审核并转草稿</div>
                        )}
                      </div>
                      <Link href={`/admin/submissions/${item.id}?return_to=%2Fadmin`} className="inline-flex text-sm text-teal-DEFAULT hover:underline font-medium">
                        去审核 →
                      </Link>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div id="recent-inventory" className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">待发布草稿</h2>
                <p className="mt-1 text-sm text-muted">先清发布阻塞，再决定是否直接上线。</p>
              </div>
              <span className="text-sm text-muted">草稿数：{totalItems}</span>
            </div>
            <div className="space-y-4">
              {inventoryRows.length === 0 ? (
                <div className="rounded-xl border border-border/70 bg-background px-4 py-5 text-sm text-muted">
                  <div>当前没有待发布草稿。</div>
                  <div className="mt-2">审核队列转出草稿后，会自动回到这里继续发布检查。</div>
                </div>
              ) : (
                inventoryRows.map((item) => {
                  const priorityMeta = getDraftPriorityMeta(item)

                  return (
                    <div key={item.id} className="rounded-xl border border-border p-4 space-y-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-sm text-muted">{item.brand} · {item.market}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium tracking-wide text-muted">待发布</div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-background px-4 py-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted">处理优先级</span>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${priorityMeta.className}`}>
                            {priorityMeta.label}
                          </span>
                        </div>
                        <div className="text-xs text-muted">{priorityMeta.hint}</div>
                        {item.qualityReport.blockingIssues.length > 0 ? (
                          <div className="text-sm text-status-danger">
                            下一步：先处理 {item.qualityReport.blockingIssues.length} 个发布阻塞项
                          </div>
                        ) : (
                          <div className="text-sm text-teal-DEFAULT">下一步：可以直接发布</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <Link href={`/admin/edit/${item.id}?return_to=%2Fadmin`} className="text-sm text-teal-DEFAULT hover:underline font-medium">
                          去发布检查 →
                        </Link>
                        {isAdminUser ? (
                          <form action={updateStatusAction} className="flex flex-wrap gap-2 xl:justify-end">
                            <input type="hidden" name="id" value={item.id} />
                            <button name="status" value="active" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition-colors">{formatInventoryStatusActionLabel('active')}</button>
                          </form>
                        ) : (
                          <div className="text-xs text-muted">
                            `Staff` 角色请进入草稿页继续处理内容。
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
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
