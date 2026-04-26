import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BackofficeFlowBar } from '@/components/submissions/backoffice-flow-bar'
import {
  contactVisibilityOptions,
  formatInventoryStatusLabel,
  formatInventoryQualityMessage,
  getInventoryQualityReport,
  type InventoryAiDraftPackage,
  inventoryStatusOptions,
  normalizeKnownValue,
  placeholderInventoryImage,
  productTypeOptions,
} from '@/lib/admin-inventory'
import { toSlug } from '@/lib/inventory'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  adminSessionCookieName,
  getBackofficeRole,
  isAdminRole,
  isBackofficeAuthenticated,
  normalizeBackofficeReturnTo,
} from '@/lib/unlock'
import DeleteButton from './DeleteButton'

export const dynamic = 'force-dynamic'

const successMessages: Record<string, string> = {
  'inventory-updated': '库存草稿已保存，可继续发布检查。',
  'draft-created-from-submission': '已完成转草稿，当前进入发布前确认。',
}

const errorMessages: Record<string, string> = {
  'missing-service-role-key': '缺少 SUPABASE_SERVICE_ROLE_KEY，当前无法执行写入操作。',
  'missing-required-fields': '请先补齐必填字段再保存。',
  'publish-blocked': '当前记录还不能切换为 active，请先处理发布阻塞项。',
  'insufficient-role': '当前角色无权执行该动作。',
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

function appendReturnTo(path: string, returnTo?: string | null) {
  const normalizedReturnTo = normalizeBackofficeReturnTo(returnTo)

  if (!normalizedReturnTo) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}return_to=${encodeURIComponent(normalizedReturnTo)}`
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
  const returnTo = normalizeBackofficeReturnTo(getSingleParam(resolvedSearchParams.return_to))
  const issues = (getSingleParam(resolvedSearchParams.issues) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get(adminSessionCookieName)?.value
  const isAuthenticated = isBackofficeAuthenticated(sessionValue)
  const currentRole = getBackofficeRole(sessionValue)
  const isAdminUser = currentRole === 'admin'
  const roleBadgeLabel = isAdminUser ? 'Admin 视图' : 'Staff 视图'

  if (!isAuthenticated) {
    redirect('/admin')
  }

  const supabase = await createClient()
  const [{ data: item }, { data: inventoryOptions }, { data: linkedSubmission }] = await Promise.all([
    supabase
      .from('inventory')
      .select('*')
      .eq('id', resolvedParams.id)
      .single(),
    supabase.from('inventory').select('brand, market'),
    supabase
      .from('supplier_submissions')
      .select('id, supplier_name, submission_status, ai_draft_package, updated_at')
      .eq('converted_inventory_id', resolvedParams.id)
      .maybeSingle(),
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
  // 中文注释：如果该 inventory 来自 submission，这里把 AI 审查上下文带到 edit 页，避免编辑时断链。
  const linkedAiDraftPackage: InventoryAiDraftPackage | null =
    linkedSubmission?.ai_draft_package && typeof linkedSubmission.ai_draft_package === 'object'
      ? (linkedSubmission.ai_draft_package as InventoryAiDraftPackage)
      : null

  async function updateInventoryAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    const actionSessionValue = actionCookies.get(adminSessionCookieName)?.value
    if (!isBackofficeAuthenticated(actionSessionValue)) {
      redirect('/admin')
    }
    const actionIsAdmin = isAdminRole(actionSessionValue)

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect(appendReturnTo(`/admin/edit/${resolvedParams.id}?error=missing-service-role-key`, returnTo))
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
    const productionDateText = String(formData.get('production_date_text') || '').trim()
    const contactVisibility = getSelectedValue(
      String(formData.get('contact_visibility') || 'contact_required').trim(),
      contactVisibilityOptions,
      'contact_required'
    )
    const requestedStatus = getSelectedValue(
      String(formData.get('status') || item.status).trim(),
      inventoryStatusOptions,
      item.status
    )
    // 中文注释：Staff 允许保存内容，但不允许借由表单提交切换 inventory 状态。
    if (!actionIsAdmin && requestedStatus !== item.status) {
      redirect(appendReturnTo(`/admin/edit/${resolvedParams.id}?error=insufficient-role`, returnTo))
    }
    const status = actionIsAdmin ? requestedStatus : item.status
    const slug = await buildUniqueInventorySlug(
      adminClient,
      String(formData.get('slug') || '').trim() || title,
      resolvedParams.id
    )

    if (!title || !brand || !productType || price <= 0 || quantity <= 0 || !market || !warehouseLocation || !slug) {
      redirect(appendReturnTo(`/admin/edit/${resolvedParams.id}?error=missing-required-fields`, returnTo))
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
      redirect(appendReturnTo(
        buildIssueRedirect(`/admin/edit/${resolvedParams.id}`, nextQualityReport.blockingIssues),
        returnTo
      ))
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
      production_date_text: productionDateText || null,
      contact_visibility: contactVisibility,
      status,
      is_featured: formData.get('is_featured') === 'on',
      is_urgent_clearance: formData.get('is_urgent_clearance') === 'on',
    }).eq('id', resolvedParams.id)

    revalidateInventoryRoutes(item.slug, slug)
    redirect(appendReturnTo('/admin/edit/' + resolvedParams.id + '?success=inventory-updated', returnTo))
  }

  async function deleteInventoryAction() {
    'use server'

    const actionCookies = await cookies()
    const actionSessionValue = actionCookies.get(adminSessionCookieName)?.value
    if (!isBackofficeAuthenticated(actionSessionValue)) {
      redirect('/admin')
    }
    if (!isAdminRole(actionSessionValue)) {
      redirect(appendReturnTo(`/admin/edit/${resolvedParams.id}?error=insufficient-role`, returnTo))
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect(appendReturnTo(`/admin/edit/${resolvedParams.id}?error=missing-service-role-key`, returnTo))
    }

    await adminClient.from('inventory').delete().eq('id', resolvedParams.id)

    revalidateInventoryRoutes(item.slug, item.slug)
    redirect(backHref)
  }

  const successMessage = success ? successMessages[success] : null
  const errorMessage = error ? errorMessages[error] : null
  const currentProductTypeOptions = productTypeOptions.includes(item.product_type)
    ? productTypeOptions
    : [item.product_type, ...productTypeOptions]
  const hasBlockingIssues = qualityReport.blockingIssues.length > 0
  const hasWarnings = qualityReport.warnings.length > 0
  const readinessLabel = hasBlockingIssues ? `阻塞 ${qualityReport.blockingIssues.length} 项` : '可进入发布判断'
  const blockingSummaryText = hasBlockingIssues
    ? `还有 ${qualityReport.blockingIssues.length} 个发布阻塞项。`
    : '当前没有发布阻塞项。'
  const nextActionSummaryText = hasBlockingIssues
    ? '先处理阻塞项，再保存修改。'
    : isAdminUser
      ? '确认无误后，可切换为 active 并保存。'
      : '确认内容无误后，交由 Admin 发布。'
  const publishDecisionText = hasBlockingIssues
    ? '当前不能发布，请先处理阻塞项。'
    : isAdminUser
      ? '已满足发布检查，可改成 active 后保存。'
      : '已满足发布检查，需由 Admin 切换为 active。'
  const backHref = returnTo ?? '/admin'
  const backLabel = returnTo?.startsWith('/admin/submissions/')
    ? '来源审核'
    : returnTo?.startsWith('/admin/submissions')
      ? '审核队列'
      : '后台总控台'
  const currentEditHref = appendReturnTo(`/admin/edit/${resolvedParams.id}`, returnTo)

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <Link href={backHref} className="font-medium text-teal-DEFAULT hover:underline">
                  {backLabel}
                </Link>
                <span>/</span>
                <span className="text-foreground">发布前确认</span>
              </div>
              <div className="inline-flex rounded-full border border-teal-DEFAULT/30 bg-teal-DEFAULT/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-teal-DEFAULT">
                {roleBadgeLabel}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">发布前确认</h1>
                <p className="mt-1 text-sm text-muted">
                  这里只处理最终发布值，重点确认这条草稿现在能不能进入 `active`。
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted">
                <div className="font-medium text-foreground">主动作</div>
                <div className="mt-1">保存修改</div>
              </div>
              {isAdminUser ? (
                <form action={deleteInventoryAction}>
                  <DeleteButton />
                </form>
              ) : (
                <div className="rounded-xl border border-border bg-background px-4 py-2 text-sm text-muted">
                  仅 Admin 可删除
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted">当前状态</div>
              <div className="mt-2 text-sm font-medium text-foreground">{formatInventoryStatusLabel(item.status)}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted">当前阻塞</div>
              <div className={`mt-2 text-sm font-medium ${hasBlockingIssues ? 'text-status-danger' : 'text-foreground'}`}>
                {blockingSummaryText}
              </div>
              <div className="mt-1 text-xs text-muted">
                {hasBlockingIssues ? readinessLabel : '当前已达到发布检查门槛。'}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted">下一步动作</div>
              <div className="mt-2 text-sm text-foreground">{nextActionSummaryText}</div>
              {linkedSubmission && (
                <Link
                  href={appendReturnTo(`/admin/submissions/${linkedSubmission.id}`, currentEditHref)}
                  className="mt-2 inline-flex text-xs font-medium text-teal-DEFAULT hover:underline"
                >
                  回到来源审核
                </Link>
              )}
            </div>
          </div>
          <BackofficeFlowBar currentStep="edit" />
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

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">发布内容</h2>
              <p className="text-sm text-muted">只保留最终发布值，来源原文和 AI 上下文在右侧查看。</p>
            </div>

            <form action={updateInventoryAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted">标题</label>
                <input name="title" defaultValue={item.title} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted">Slug（URL）</label>
                <input name="slug" defaultValue={item.slug} required className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm" />
              </div>

            <div>
              <label className="text-sm text-muted mb-1 block">品牌</label>
              <input name="brand" list="brand-options-edit" defaultValue={item.brand} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">产品类型</label>
              <select name="product_type" defaultValue={item.product_type} className="w-full rounded-lg border border-border bg-background px-4 py-3">
                {currentProductTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">价格 USD</label>
              <input name="price" type="number" step="0.01" defaultValue={item.price} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">库存数量</label>
              <input name="quantity" type="number" defaultValue={item.quantity} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">MOQ</label>
              <input name="moq" type="number" defaultValue={item.moq} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">口数 Puff</label>
              <input name="puff" type="number" defaultValue={item.puff || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">尼古丁</label>
              <input name="nicotine" defaultValue={item.nicotine || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">烟油容量</label>
              <input name="e_liquid" defaultValue={item.e_liquid || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted mb-1 block">生产时间</label>
              <input name="production_date_text" defaultValue={item.production_date_text || ''} placeholder="例如 2026-03 / 2026 Q1 / Batch 2403" className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-muted mb-1 block">口味（逗号分隔）</label>
              <input name="flavor" defaultValue={item.flavor || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">目标市场</label>
              <input name="market" list="market-options-edit" defaultValue={item.market} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">仓库位置</label>
              <input name="warehouse_location" defaultValue={item.warehouse_location} required className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-muted mb-1 block">图片链接</label>
              <input name="image_url" defaultValue={item.images?.[0] || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3" />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-muted mb-1 block">描述 / 清单备注</label>
              <textarea name="description" defaultValue={item.description || ''} className="w-full rounded-lg border border-border bg-background px-4 py-3 min-h-48 font-mono text-sm" />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block">联系方式可见性</label>
                <select name="contact_visibility" defaultValue={item.contact_visibility} className="w-full rounded-lg border border-border bg-background px-4 py-3">
                  {contactVisibilityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">库存状态</label>
                {isAdminUser ? (
                  <select name="status" defaultValue={item.status} className="w-full rounded-lg border border-border bg-background px-4 py-3">
                    {inventoryStatusOptions.map((option) => (
                      <option key={option} value={option}>{formatInventoryStatusLabel(option)}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input type="hidden" name="status" value={item.status} />
                    <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground">
                      {formatInventoryStatusLabel(item.status)}
                    </div>
                    <p className="text-xs text-muted">
                      `Staff` 保存时会维持当前状态；如需切换库存状态，请由 `Admin` 处理。
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
              <input type="checkbox" id="is_featured" name="is_featured" defaultChecked={item.is_featured} className="w-5 h-5" />
              <label htmlFor="is_featured" className="text-sm font-medium">🔥 设为重点推荐</label>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
              <input type="checkbox" id="is_urgent_clearance" name="is_urgent_clearance" defaultChecked={item.is_urgent_clearance} className="w-5 h-5" />
              <label htmlFor="is_urgent_clearance" className="text-sm font-medium">⚡ 紧急清仓</label>
            </div>

            <button className="rounded-lg bg-teal-DEFAULT text-background font-semibold py-4 px-4 md:col-span-2 mt-4 hover:bg-teal-hover transition-colors">
              保存修改
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

        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-surface p-6">
          <div className="space-y-3 rounded-2xl border border-border bg-background px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">发布判断</div>
                <div className="mt-1 text-xs text-muted">先看是否能发布，再处理补充动作。</div>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${hasBlockingIssues ? 'bg-status-danger/10 text-status-danger' : 'bg-teal-DEFAULT/10 text-teal-DEFAULT'}`}>
                {hasBlockingIssues ? '不可发布' : '可发布'}
              </div>
            </div>
            <div className="text-sm text-foreground">{publishDecisionText}</div>
            <div className="text-xs text-muted">
              警告项 {qualityReport.warnings.length} 条，阻塞项明细在下方查看。
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-foreground">发布阻塞项</div>
              <div className={`text-xs ${hasBlockingIssues ? 'text-status-danger' : 'text-teal-DEFAULT'}`}>
                {hasBlockingIssues ? '需先处理' : '已通过'}
              </div>
            </div>
            {hasBlockingIssues ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-status-danger">
                {qualityReport.blockingIssues.map((issue) => (
                  <li key={issue}>{formatInventoryQualityMessage(issue)}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted">当前没有发布阻塞项。</div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-foreground">警告项</div>
              <div className={`text-xs ${hasWarnings ? 'text-status-warning' : 'text-muted'}`}>
                {hasWarnings ? '建议复核' : '无'}
              </div>
            </div>
            {hasWarnings ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-status-warning">
                {qualityReport.warnings.map((issue) => (
                  <li key={issue}>{formatInventoryQualityMessage(issue)}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted">当前没有警告项。</div>
            )}
          </div>

          {linkedSubmission && (
            <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-foreground">来源提报</div>
                <Link
                  href={`/admin/submissions/${linkedSubmission.id}`}
                  className="text-xs font-medium text-teal-DEFAULT hover:underline"
                >
                  去来源审核
                </Link>
              </div>
              <div className="space-y-1 text-sm text-muted">
                <div>提报 ID：<span className="text-foreground">{linkedSubmission.id}</span></div>
                <div>供应商：<span className="text-foreground">{linkedSubmission.supplier_name || '未知'}</span></div>
                <div>状态：<span className="text-foreground uppercase">{linkedSubmission.submission_status}</span></div>
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm text-muted">
                <details className="group">
                  <summary className="cursor-pointer list-none font-medium text-foreground">
                    展开规则整理上下文
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      缺失字段：{' '}
                      <span className="text-foreground">
                        {linkedAiDraftPackage?.missingFields?.length
                          ? linkedAiDraftPackage.missingFields.join(' | ')
                          : '无'}
                      </span>
                    </div>
                    <div>
                      风险标记：{' '}
                      <span className="text-foreground">
                        {linkedAiDraftPackage?.riskFlags?.length
                          ? linkedAiDraftPackage.riskFlags
                            .map((flag) => `${flag.severity}: ${flag.message}`)
                            .join(' | ')
                          : '无'}
                      </span>
                    </div>
                    <div>
                      人工复核重点：{' '}
                      <span className="text-foreground">
                        {linkedAiDraftPackage?.humanReviewFocus?.length
                          ? linkedAiDraftPackage.humanReviewFocus
                            .map((focus) => `${focus.field}: ${focus.reason}`)
                            .join(' | ')
                          : '无'}
                      </span>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          )}
        </aside>
      </section>
      </div>
    </main>
  )
}
