import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  contactVisibilityOptions,
  convertAiDraftPackageToInventoryDraft,
  formatPricingModeLabel,
  normalizeELiquidValue,
  normalizeKnownValue,
  normalizeNicotineValue,
  normalizeWarehouseLocation,
  parseInventoryAiDraftPackage,
  pricingModeOptions,
  productTypeOptions,
} from '@/lib/admin-inventory'
import { dataEntryGuidelines, normalizeMarketLabel } from '@/lib/entry-standards'
import { toSlug } from '@/lib/inventory'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  adminSessionCookieName,
  buildBackofficeLoginRedirect,
  isAdminRole,
  isBackofficeAuthenticated,
} from '@/lib/unlock'
import {
  isMonitoringWebhookConfigured,
  triggerMonitoringWebhookTest,
} from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

const successMessages: Record<string, string> = {
  'inventory-created-draft': '已创建新的库存草稿。',
  'ai-draft-imported': 'AI 草稿包已导入为新草稿。',
  'monitoring-webhook-test-sent': '测试告警已发送，请立即检查 webhook 接收端。',
  'monitoring-webhook-test-cooldown': '测试告警刚发送过，请等待冷却后重试。',
}

const errorMessages: Record<string, string> = {
  'invalid-ai-draft-package': 'AI 草稿包格式不正确，请先修正 JSON。',
  'missing-service-role-key': '缺少 `SUPABASE_SERVICE_ROLE_KEY`，当前无法执行写入操作。',
  'missing-required-fields': '请先补齐最低必填项。',
  'insufficient-role': '当前角色无权使用该入口。',
  'monitoring-webhook-disabled': '当前环境未配置 `MONITORING_WEBHOOK_URL`。',
  'monitoring-webhook-send-failed': '测试告警发送失败，请检查 webhook 地址或接收端是否可用。',
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

function buildToolsPageRedirect(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `/admin/tools?${queryString}` : '/admin/tools'
}

function revalidateInventoryRoutes(slug?: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/tools')
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
  value: string
) {
  const baseSlug = toSlug(value) || `inventory-${Date.now()}`
  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const { data } = await adminClient
      .from('inventory')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (!data) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const success = getSingleParam(params.success)
  const error = getSingleParam(params.error)
  const importErrors = (getSingleParam(params.import_errors) ?? '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)

  const cookieStore = await cookies()
  const sessionValue = cookieStore.get(adminSessionCookieName)?.value

  if (!isBackofficeAuthenticated(sessionValue)) {
    redirect(buildBackofficeLoginRedirect('/admin/tools'))
  }

  if (!isAdminRole(sessionValue)) {
    redirect('/admin?error=insufficient-role')
  }

  const supabase = await createClient()
  const { data: inventoryOptions } = await supabase.from('inventory').select('brand, market')
  const knownBrands = getUniqueValues((inventoryOptions ?? []).map((item) => item.brand))
  const knownMarkets = getUniqueValues((inventoryOptions ?? []).map((item) => item.market))
  const successMessage = success ? successMessages[success] : null
  const errorMessage = error ? errorMessages[error] : null
  const serviceKeyReady = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const monitoringWebhookReady = isMonitoringWebhookConfigured()

  async function createInventoryAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    const actionSessionValue = actionCookies.get(adminSessionCookieName)?.value

    if (!isBackofficeAuthenticated(actionSessionValue)) {
      redirect(buildBackofficeLoginRedirect('/admin/tools'))
    }

    if (!isAdminRole(actionSessionValue)) {
      redirect('/admin?error=insufficient-role')
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect('/admin/tools?error=missing-service-role-key')
    }

    const title = String(formData.get('title') || '').trim()
    const brand = normalizeKnownValue(String(formData.get('brand') || '').trim(), knownBrands)
    const productType = getSelectedValue(
      String(formData.get('product_type') || '').trim(),
      productTypeOptions,
      'Other'
    )
    const pricingMode = getSelectedValue(
      String(formData.get('pricing_mode') || 'exact_price').trim(),
      pricingModeOptions,
      'exact_price'
    )
    const pricingNote = String(formData.get('pricing_note') || '').trim()
    const price = Number(formData.get('price') || 0)
    const quantity = Number(formData.get('quantity') || 0)
    const market = normalizeKnownValue(normalizeMarketLabel(String(formData.get('market') || '')), knownMarkets)
    const warehouseLocation = normalizeWarehouseLocation(String(formData.get('warehouse_location') || ''))

    if (!title || !brand || !productType || quantity <= 0 || (!market && !warehouseLocation)) {
      redirect('/admin/tools?error=missing-required-fields')
    }

    const slug = await buildUniqueInventorySlug(adminClient, title)

    // 工具页只保留最低必填项，图片为空时不再写入占位图，避免制造假数据。
    await adminClient.from('inventory').insert({
      slug,
      title,
      brand,
      product_type: productType,
      pricing_mode: pricingMode,
      pricing_note: pricingNote || null,
      price,
      quantity,
      moq: 1,
      market,
      warehouse_location: warehouseLocation,
      description: null,
      images: [],
      nicotine: null,
      flavor: null,
      puff: null,
      e_liquid: null,
      production_date_text: null,
      contact_visibility: 'contact_required',
      status: 'draft',
      is_featured: false,
      is_urgent_clearance: false,
    })

    revalidateInventoryRoutes(slug)
    redirect('/admin/tools?success=inventory-created-draft')
  }

  async function importAiDraftPackageAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    const actionSessionValue = actionCookies.get(adminSessionCookieName)?.value

    if (!isBackofficeAuthenticated(actionSessionValue)) {
      redirect(buildBackofficeLoginRedirect('/admin/tools'))
    }

    if (!isAdminRole(actionSessionValue)) {
      redirect('/admin?error=insufficient-role')
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect('/admin/tools?error=missing-service-role-key')
    }

    const draftPackageInput = String(formData.get('ai_draft_package_json') || '').trim()
    const parsedDraftPackage = parseInventoryAiDraftPackage(draftPackageInput)

    if (!parsedDraftPackage.success) {
      redirect(buildToolsPageRedirect({
        error: 'invalid-ai-draft-package',
        import_errors: parsedDraftPackage.errors.join('|'),
      }))
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
    const imageUrl = draftValues.imageUrl?.trim() || ''

    // AI 导入直接生成 draft，但仍然要求后续进入编辑页做人审。
    // 没有真实图片链接时保持空数组，避免落库存占位图。
    await adminClient.from('inventory').insert({
      slug,
      title,
      brand,
      product_type: productType,
      pricing_mode: draftValues.pricingMode ?? 'exact_price',
      pricing_note: draftValues.pricingNote?.trim() || null,
      price: draftValues.price ?? 0,
      quantity: draftValues.quantity ?? 0,
      moq: draftValues.moq ?? 1,
      market,
      featured_markets: draftValues.featuredMarkets ?? [],
      market_access_note: draftValues.marketAccessNote?.trim() || null,
      warehouse_location: normalizeWarehouseLocation(draftValues.warehouseLocation || ''),
      description: draftValues.description?.trim() || null,
      images: imageUrl ? [imageUrl] : [],
      nicotine: normalizeNicotineValue(draftValues.nicotine || '') || null,
      flavor: draftValues.flavor?.trim() || null,
      puff: draftValues.puff ?? null,
      e_liquid: normalizeELiquidValue(draftValues.eLiquid || '') || null,
      production_date_text: draftValues.productionDateText?.trim() || null,
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
    redirect('/admin/tools?success=ai-draft-imported')
  }

  async function sendMonitoringWebhookTestAction() {
    'use server'

    const actionCookies = await cookies()
    const actionSessionValue = actionCookies.get(adminSessionCookieName)?.value

    if (!isBackofficeAuthenticated(actionSessionValue)) {
      redirect(buildBackofficeLoginRedirect('/admin/tools'))
    }

    if (!isAdminRole(actionSessionValue)) {
      redirect('/admin?error=insufficient-role')
    }

    // 中文注释：测试告警只允许 Admin 主动触发，避免普通操作误发到生产告警通道。
    const result = await triggerMonitoringWebhookTest('admin-tools')

    if (result === 'disabled') {
      redirect('/admin/tools?error=monitoring-webhook-disabled')
    }

    if (result === 'cooldown') {
      redirect('/admin/tools?success=monitoring-webhook-test-cooldown')
    }

    if (result === 'failed') {
      redirect('/admin/tools?error=monitoring-webhook-send-failed')
    }

    redirect('/admin/tools?success=monitoring-webhook-test-sent')
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold tracking-[0.18em] text-muted">
            Admin Tools
          </div>
          <h1 className="text-3xl font-bold">低频工具</h1>
          <p className="text-sm text-muted">这里只放补录和特殊导入，日常操作请回到总控台。</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-teal-DEFAULT hover:bg-surface"
        >
          返回总控台 →
        </Link>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-teal-DEFAULT/40 bg-teal-DEFAULT/10 p-4 text-sm text-foreground">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-status-danger/40 bg-status-danger/10 p-4 text-sm text-foreground space-y-3">
          <div>{errorMessage}</div>
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

      <section className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">监控告警测试</h2>
            <p className="text-sm text-muted">
              接通 `MONITORING_WEBHOOK_URL` 后，可在这里主动发送一条测试告警，避免靠制造真实错误验证。
            </p>
          </div>
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            monitoringWebhookReady
              ? 'border-teal-DEFAULT/30 bg-teal-DEFAULT/10 text-foreground'
              : 'border-status-warning/40 bg-status-warning/10 text-foreground'
          }`}>
            {monitoringWebhookReady ? '当前环境已检测到 webhook 配置。' : '当前环境尚未配置 webhook。'}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-4 text-sm text-muted space-y-2">
          <p>发送内容：`backoffice.monitoring.webhook_test`</p>
          <p>冷却规则：同一测试事件 `5` 分钟内不重复发送</p>
          <p>推荐顺序：先部署配置，再点击发送，最后去 webhook 接收端确认消息。</p>
        </div>

        <form action={sendMonitoringWebhookTestAction}>
          <button
            className="rounded-lg bg-teal-DEFAULT px-4 py-3 font-semibold text-background disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!monitoringWebhookReady}
          >
            发送测试 webhook
          </button>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">手动新建草稿</h2>
            <p className="text-sm text-muted">只填最低必填项，创建后再进入编辑页补全。</p>
          </div>

          <form action={createInventoryAction} className="grid grid-cols-1 gap-4">
            <input name="title" placeholder="标题" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="brand" list="brand-options" placeholder="品牌" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <select name="product_type" defaultValue="Disposable Vape" className="rounded-lg border border-border bg-background px-4 py-3">
              {productTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select name="pricing_mode" defaultValue="exact_price" className="rounded-lg border border-border bg-background px-4 py-3">
              {pricingModeOptions.map((option) => (
                <option key={option} value={option}>{formatPricingModeLabel(option)}</option>
              ))}
            </select>
            <input name="price" type="number" step="0.01" placeholder="价格 USD（Inquiry Only 可留空）" className="rounded-lg border border-border bg-background px-4 py-3" />
            <textarea name="pricing_note" placeholder="报价备注（可选）" className="min-h-24 rounded-lg border border-border bg-background px-4 py-3 text-sm" />
            <input name="quantity" type="number" placeholder="库存数量" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="market" list="market-options" placeholder="目标市场" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <input name="warehouse_location" placeholder="仓库位置" required className="rounded-lg border border-border bg-background px-4 py-3" />
            <div className="rounded-xl border border-border bg-background/60 px-4 py-3 text-xs text-muted">
              <p>{dataEntryGuidelines.brand}</p>
              <p className="mt-1">{dataEntryGuidelines.market}</p>
              <p className="mt-1">{dataEntryGuidelines.imageFileName}</p>
            </div>
            <button className="rounded-lg bg-teal-DEFAULT px-4 py-3 font-semibold text-background">创建草稿</button>

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

        <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">导入 AI 草稿包</h2>
            <p className="text-sm text-muted">只在没有提报记录时使用，导入后仍需进入编辑页做人审。</p>
          </div>

          <form action={importAiDraftPackageAction} className="space-y-4">
            <textarea
              name="ai_draft_package_json"
              placeholder={'{\n  "version": "v1",\n  "rawInput": { "sourceType": "excel", "rawText": "..." },\n  "normalizedFields": { "title": "...", "brand": "...", "market": "...", "product_type": "Disposable Vape", "description_summary": "...", "manifest_notes": "..." },\n  "missingFields": [],\n  "riskFlags": [],\n  "humanReviewFocus": []\n}'}
              className="min-h-80 w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm"
            />
            <button className="rounded-lg bg-teal-DEFAULT px-4 py-3 font-semibold text-background">
              导入 AI 草稿
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
