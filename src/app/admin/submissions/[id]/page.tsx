import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  BackofficeFlowBar,
} from '@/components/submissions/backoffice-flow-bar'
import {
  SubmissionDraftCleanup,
} from '@/components/submissions/submission-draft-cleanup'
import {
  SubmissionFieldHint,
  SubmissionFieldLabel,
} from '@/components/submissions/field-meta'
import {
  buildAiDraftPackageSeedFromSubmission,
  buildRuleBasedAiDraftPackageFromSubmission,
  buildSubmissionRawText,
  buildSubmissionTitle,
  convertSubmissionToDraftSeed,
  formatSupplierSubmissionFieldLabel,
  formatSupplierSubmissionSourceLabel,
  getSupplierSubmissionMissingRequiredFields,
  normalizeSupplierSubmissionValues,
  splitSubmissionMarketTags,
  submissionMoqFieldHint,
  submissionQuantityFieldHint,
  supplierSubmissionSourceOptions,
  supplierSubmissionStatusOptions,
  type SupplierSubmissionRequiredField,
  type SupplierSubmissionValues,
} from '@/lib/submissions'
import {
  formatPricingModeLabel,
  pricingModeOptions,
  getBrandNamingRiskHint,
  type InventoryAiDraftPackage,
  productTypeOptions,
} from '@/lib/admin-inventory'
import { toSlug } from '@/lib/inventory'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  adminSessionCookieName,
  isBackofficeAuthenticated,
  normalizeBackofficeReturnTo,
} from '@/lib/unlock'
import { dataEntryGuidelines, featuredMarketPresetGroups } from '@/lib/entry-standards'

export const dynamic = 'force-dynamic'

const submitStockDraftStorageKey = 'submit-stock-draft-v1'

const successMessages: Record<string, string> = {
  'submission-created': '提报已录入成功，当前页面就是这条记录的审核入口。',
  'submission-updated': '提报已保存，可继续审核。',
  'submission-converted': '已完成转草稿，下一步去草稿继续编辑。',
}

const errorMessages: Record<string, string> = {
  'missing-service-role-key': '缺少 `SUPABASE_SERVICE_ROLE_KEY`，当前无法执行写入操作。',
  'missing-required-fields': '请先补齐最低必填项，再保存或转草稿。',
  'already-converted': '该提报已经关联到库存草稿。',
}

const submissionStatusLabels: Record<(typeof supplierSubmissionStatusOptions)[number], string> = {
  new: '新录入',
  reviewing: '审核中',
  converted: '已转草稿',
  rejected: '已驳回',
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function getUniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
    .sort((left, right) => left.localeCompare(right))
}

function formatSubmissionStatusLabel(status: (typeof supplierSubmissionStatusOptions)[number]) {
  return submissionStatusLabels[status]
}

const reviewFieldAnchorIds: Record<SupplierSubmissionRequiredField, string> = {
  supplierName: 'field-supplier-name',
  brand: 'field-brand',
  modelName: 'field-model-name',
  productType: 'field-product-type',
  availableQtyText: 'field-available-qty',
  targetMarket: 'field-target-market',
  warehouseLocation: 'field-warehouse-location',
}

function getReviewFieldWrapperClass(isHighlighted: boolean) {
  return isHighlighted
    ? 'space-y-2 rounded-2xl border border-status-warning/50 bg-status-warning/10 p-3'
    : 'space-y-2'
}

const reviewInputClassName = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm'
const reviewSelectClassName = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm'
const reviewTextareaClassName = 'w-full min-h-32 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm'

function buildSubmissionDetailHref(
  id: string,
  params: Record<string, string | null | undefined> = {},
  returnTo?: string | null
) {
  const searchParams = new URLSearchParams()

  if (returnTo) {
    searchParams.set('return_to', returnTo)
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `/admin/submissions/${id}?${queryString}` : `/admin/submissions/${id}`
}

function buildMissingFieldsRedirect(id: string, fields: string[], returnTo?: string | null) {
  const searchParams: Record<string, string> = {
    error: 'missing-required-fields',
  }

  if (fields.length > 0) {
    searchParams.missing_fields = fields.join(',')
  }

  return buildSubmissionDetailHref(id, searchParams, returnTo)
}

function appendReturnTo(path: string, returnTo?: string | null) {
  const normalizedReturnTo = normalizeBackofficeReturnTo(returnTo)

  if (!normalizedReturnTo) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}return_to=${encodeURIComponent(normalizedReturnTo)}`
}

function revalidateSubmissionRoutes(id: string, inventoryId?: string, inventorySlug?: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/submissions/[id]', 'page')
  revalidatePath(`/admin/submissions/${id}`)

  if (inventoryId) {
    revalidatePath(`/admin/edit/${inventoryId}`)
  }

  if (inventorySlug) {
    revalidatePath('/')
    revalidatePath('/inventory')
    revalidatePath('/inventory/[slug]', 'page')
    revalidatePath(`/inventory/${inventorySlug}`)
    revalidatePath('/market')
    revalidatePath('/market/[slug]', 'page')
    revalidatePath('/brand')
    revalidatePath('/brand/[slug]', 'page')
    revalidatePath('/price')
    revalidatePath('/price/[slug]', 'page')
    revalidatePath('/sitemap.xml')
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

export default async function EditSubmissionPage({
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
  const shouldCleanupSubmitStockDraft =
    success === 'submission-created' && returnTo === '/submit-stock'
  const missingFields = (getSingleParam(resolvedSearchParams.missing_fields) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const cookieStore = await cookies()
  if (!isBackofficeAuthenticated(cookieStore.get(adminSessionCookieName)?.value)) {
    redirect('/admin')
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    redirect('/admin?error=missing-service-role-key')
  }

  const supabase = await createClient()
  const [{ data: item }, { data: inventoryOptions }] = await Promise.all([
    adminClient.from('supplier_submissions').select('*').eq('id', resolvedParams.id).single(),
    supabase.from('inventory').select('brand, market'),
  ])

  if (!item) {
    redirect('/admin')
  }

  const knownBrands = getUniqueValues((inventoryOptions ?? []).map((entry) => entry.brand))
  const knownMarkets = getUniqueValues(['Global', ...((inventoryOptions ?? []).map((entry) => entry.market))])
  const submissionValues = normalizeSupplierSubmissionValues({
    supplierName: item.supplier_name ?? '',
    contactName: item.contact_name ?? '',
    contactChannel: item.contact_channel ?? '',
    sourceType: supplierSubmissionSourceOptions.includes(item.source_type)
      ? item.source_type
      : 'supplier_form',
    pricingMode: pricingModeOptions.includes(item.pricing_mode)
      ? item.pricing_mode
      : 'exact_price',
    pricingNote: item.pricing_note ?? '',
    brand: item.brand ?? '',
    modelName: item.model_name ?? '',
    productType: item.product_type ?? '',
    unitPriceText: item.unit_price_text ?? '',
    availableQtyText: item.available_qty_text ?? '',
    moqText: item.moq_text ?? '',
    targetMarket: item.target_market ?? '',
    featuredMarketsText: item.featured_markets_text ?? '',
    marketAccessNote: item.market_access_note ?? '',
    warehouseLocation: item.warehouse_location ?? '',
    puffText: item.puff_text ?? '',
    nicotineText: item.nicotine_text ?? '',
    eLiquidText: item.e_liquid_text ?? '',
    productionDateText: item.production_date_text ?? '',
    flavorList: item.flavor_list ?? '',
    flavorBreakdown: item.flavor_breakdown ?? '',
    imageLinks: item.image_links ?? '',
    stockNotes: item.stock_notes ?? '',
    packagingNotes: item.packaging_notes ?? '',
    extraNotes: item.extra_notes ?? '',
    internalNotes: item.internal_notes ?? '',
    submissionStatus: supplierSubmissionStatusOptions.includes(item.submission_status)
      ? item.submission_status
      : 'new',
  })
  const normalizedModelName = submissionValues.modelName.trim()
  const { data: sameModelSubmissionMatches } = normalizedModelName
    ? await adminClient
        .from('supplier_submissions')
        .select('id, supplier_name, brand, model_name, submission_status, converted_inventory_id, created_at')
        .ilike('model_name', normalizedModelName)
        .neq('id', resolvedParams.id)
        .order('created_at', { ascending: false })
        .limit(6)
    : { data: [] }
  const requiredFieldIssues = getSupplierSubmissionMissingRequiredFields(submissionValues)
  const highlightedFields = new Set<SupplierSubmissionRequiredField>([
    ...requiredFieldIssues,
    ...missingFields.filter((field): field is SupplierSubmissionRequiredField =>
      [
        'supplierName',
        'brand',
        'modelName',
        'productType',
        'availableQtyText',
        'targetMarket',
        'warehouseLocation',
      ].includes(field)
    ),
  ])
  const aiAssistReady = requiredFieldIssues.length === 0
  const draftSeedPreview = convertSubmissionToDraftSeed(submissionValues)
  const aiDraftPackagePreview: InventoryAiDraftPackage = item.ai_draft_package && typeof item.ai_draft_package === 'object'
    ? (item.ai_draft_package as InventoryAiDraftPackage)
    : buildAiDraftPackageSeedFromSubmission(submissionValues)
  const currentProductTypeOptions = productTypeOptions.includes(submissionValues.productType as typeof productTypeOptions[number])
    ? productTypeOptions
    : submissionValues.productType.trim()
      ? [submissionValues.productType, ...productTypeOptions]
      : productTypeOptions
  const requiredFieldCount = requiredFieldIssues.length
  const hasConvertedDraft = Boolean(item.converted_inventory_id)
  const aiSummaryText = aiAssistReady
    ? 'LLM 处理已可用，可直接生成草稿辅助上下文。'
    : 'LLM 处理暂不可用，先补齐最低必填项。'
  const selectedFeaturedMarkets = new Set(splitSubmissionMarketTags(submissionValues.featuredMarketsText))
  const primaryActionLabel = hasConvertedDraft
    ? '去草稿继续编辑'
    : aiAssistReady
      ? 'LLM 完善并生成草稿'
      : '保存审核'
  const statusSummaryText = formatSubmissionStatusLabel(submissionValues.submissionStatus)
  const brandNamingRiskHint = getBrandNamingRiskHint(submissionValues.brand) || null
  const blockingSummaryText = hasConvertedDraft
    ? '这条录入已经转成草稿。'
    : requiredFieldCount === 0
      ? '最低必填项已补齐。'
      : `还缺 ${requiredFieldCount} 项最低必填。`
  const nextStepSummaryText = hasConvertedDraft
    ? '去草稿继续编辑，并准备发布。'
    : aiAssistReady
      ? '可直接执行标准化并转成草稿。'
      : '先补齐高亮字段，再保存审核。'
  const duplicateModelHintRows = (sameModelSubmissionMatches ?? []).filter((match) => match.model_name?.trim())
  const duplicateModelSummaryText = duplicateModelHintRows.length > 0
    ? `发现 ${duplicateModelHintRows.length} 条同型号记录，转草稿前先确认是否重复。`
    : '当前没有发现同型号记录。'
  const queueHref = returnTo ?? '/admin/submissions'
  const queueLabel = returnTo?.startsWith('/submit-stock') ? '内部录入' : '提报队列'
  const currentDetailHref = buildSubmissionDetailHref(resolvedParams.id, {}, returnTo)

  async function updateSubmissionAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    if (!isBackofficeAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }

    const actionAdminClient = createAdminClient()
    if (!actionAdminClient) {
      redirect(buildSubmissionDetailHref(
        resolvedParams.id,
        { error: 'missing-service-role-key' },
        returnTo
      ))
    }

    const submittedSourceType = String(formData.get('source_type') || '').trim()
    const submittedStatus = String(formData.get('submission_status') || '').trim()
    const nextValues = normalizeSupplierSubmissionValues({
      supplierName: String(formData.get('supplier_name') || '').trim(),
      contactName: String(formData.get('contact_name') || '').trim(),
      contactChannel: String(formData.get('contact_channel') || '').trim(),
      sourceType: supplierSubmissionSourceOptions.includes(submittedSourceType as SupplierSubmissionValues['sourceType'])
        ? (submittedSourceType as SupplierSubmissionValues['sourceType'])
        : 'supplier_form',
      pricingMode: pricingModeOptions.includes(formData.get('pricing_mode') as typeof pricingModeOptions[number])
        ? (formData.get('pricing_mode') as typeof pricingModeOptions[number])
        : 'exact_price',
      pricingNote: String(formData.get('pricing_note') || '').trim(),
      brand: String(formData.get('brand') || '').trim(),
      modelName: String(formData.get('model_name') || '').trim(),
      productType: String(formData.get('product_type') || '').trim(),
      unitPriceText: String(formData.get('unit_price_text') || '').trim(),
      availableQtyText: String(formData.get('available_qty_text') || '').trim(),
      moqText: String(formData.get('moq_text') || '').trim(),
      targetMarket: String(formData.get('target_market') || '').trim(),
      featuredMarketsText: formData.getAll('featured_markets').map((item) => String(item).trim()).filter(Boolean).join(', '),
      marketAccessNote: String(formData.get('market_access_note') || '').trim(),
      warehouseLocation: String(formData.get('warehouse_location') || '').trim(),
      puffText: String(formData.get('puff_text') || '').trim(),
      nicotineText: String(formData.get('nicotine_text') || '').trim(),
      eLiquidText: String(formData.get('e_liquid_text') || '').trim(),
      productionDateText: String(formData.get('production_date_text') || '').trim(),
      flavorList: String(formData.get('flavor_list') || '').trim(),
      flavorBreakdown: String(formData.get('flavor_breakdown') || '').trim(),
      imageLinks: String(formData.get('image_links') || '').trim(),
      stockNotes: String(formData.get('stock_notes') || '').trim(),
      packagingNotes: String(formData.get('packaging_notes') || '').trim(),
      extraNotes: String(formData.get('extra_notes') || '').trim(),
      internalNotes: String(formData.get('internal_notes') || '').trim(),
      submissionStatus: supplierSubmissionStatusOptions.includes(submittedStatus as SupplierSubmissionValues['submissionStatus'])
        ? (submittedStatus as SupplierSubmissionValues['submissionStatus'])
        : 'new',
    })

    const nextRequiredFieldIssues = getSupplierSubmissionMissingRequiredFields(nextValues)

    if (nextRequiredFieldIssues.length > 0) {
      redirect(buildMissingFieldsRedirect(resolvedParams.id, nextRequiredFieldIssues, returnTo))
    }

    await actionAdminClient.from('supplier_submissions').update({
      supplier_name: nextValues.supplierName,
      contact_name: nextValues.contactName || null,
      contact_channel: nextValues.contactChannel || null,
      source_type: nextValues.sourceType,
      pricing_mode: nextValues.pricingMode,
      pricing_note: nextValues.pricingNote || null,
      brand: nextValues.brand,
      model_name: nextValues.modelName,
      product_type: nextValues.productType,
      unit_price_text: nextValues.unitPriceText || null,
      available_qty_text: nextValues.availableQtyText,
      moq_text: nextValues.moqText || null,
      target_market: nextValues.targetMarket,
      featured_markets_text: nextValues.featuredMarketsText || null,
      market_access_note: nextValues.marketAccessNote || null,
      warehouse_location: nextValues.warehouseLocation,
      puff_text: nextValues.puffText || null,
      nicotine_text: nextValues.nicotineText || null,
      e_liquid_text: nextValues.eLiquidText || null,
      production_date_text: nextValues.productionDateText || null,
      flavor_list: nextValues.flavorList || null,
      flavor_breakdown: nextValues.flavorBreakdown || null,
      image_links: nextValues.imageLinks || null,
      stock_notes: nextValues.stockNotes || null,
      packaging_notes: nextValues.packagingNotes || null,
      extra_notes: nextValues.extraNotes || null,
      raw_text_snapshot: buildSubmissionRawText(nextValues),
      submission_status: nextValues.submissionStatus,
      internal_notes: nextValues.internalNotes || null,
    }).eq('id', resolvedParams.id)

    revalidateSubmissionRoutes(resolvedParams.id, item.converted_inventory_id ?? undefined)
    redirect(buildSubmissionDetailHref(
      resolvedParams.id,
      { success: 'submission-updated' },
      returnTo
    ))
  }

  async function generateDraftFromSubmissionAction() {
    'use server'

    const actionCookies = await cookies()
    if (!isBackofficeAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }

    const actionAdminClient = createAdminClient()
    if (!actionAdminClient) {
      redirect(buildSubmissionDetailHref(
        resolvedParams.id,
        { error: 'missing-service-role-key' },
        returnTo
      ))
    }

    const { data: latestSubmission } = await actionAdminClient
      .from('supplier_submissions')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (!latestSubmission) {
      redirect('/admin')
    }

    const latestValues = normalizeSupplierSubmissionValues({
      supplierName: latestSubmission.supplier_name ?? '',
      contactName: latestSubmission.contact_name ?? '',
      contactChannel: latestSubmission.contact_channel ?? '',
      sourceType: supplierSubmissionSourceOptions.includes(latestSubmission.source_type)
        ? latestSubmission.source_type
        : 'supplier_form',
      pricingMode: pricingModeOptions.includes(latestSubmission.pricing_mode)
        ? latestSubmission.pricing_mode
        : 'exact_price',
      pricingNote: latestSubmission.pricing_note ?? '',
      brand: latestSubmission.brand ?? '',
      modelName: latestSubmission.model_name ?? '',
      productType: latestSubmission.product_type ?? '',
      unitPriceText: latestSubmission.unit_price_text ?? '',
      availableQtyText: latestSubmission.available_qty_text ?? '',
      moqText: latestSubmission.moq_text ?? '',
      targetMarket: latestSubmission.target_market ?? '',
      featuredMarketsText: latestSubmission.featured_markets_text ?? '',
      marketAccessNote: latestSubmission.market_access_note ?? '',
      warehouseLocation: latestSubmission.warehouse_location ?? '',
      puffText: latestSubmission.puff_text ?? '',
      nicotineText: latestSubmission.nicotine_text ?? '',
      eLiquidText: latestSubmission.e_liquid_text ?? '',
      productionDateText: latestSubmission.production_date_text ?? '',
      flavorList: latestSubmission.flavor_list ?? '',
      flavorBreakdown: latestSubmission.flavor_breakdown ?? '',
      imageLinks: latestSubmission.image_links ?? '',
      stockNotes: latestSubmission.stock_notes ?? '',
      packagingNotes: latestSubmission.packaging_notes ?? '',
      extraNotes: latestSubmission.extra_notes ?? '',
      internalNotes: latestSubmission.internal_notes ?? '',
      submissionStatus: supplierSubmissionStatusOptions.includes(latestSubmission.submission_status)
        ? latestSubmission.submission_status
        : 'new',
    })
    const nextRequiredFieldIssues = getSupplierSubmissionMissingRequiredFields(latestValues)

    if (nextRequiredFieldIssues.length > 0) {
      redirect(buildMissingFieldsRedirect(resolvedParams.id, nextRequiredFieldIssues, returnTo))
    }

    const aiDraftPackage = buildRuleBasedAiDraftPackageFromSubmission(latestValues)

    if (latestSubmission.converted_inventory_id) {
      await actionAdminClient.from('supplier_submissions').update({
        ai_draft_package: aiDraftPackage,
        raw_text_snapshot: buildSubmissionRawText(latestValues),
      }).eq('id', resolvedParams.id)

      revalidateSubmissionRoutes(
        resolvedParams.id,
        latestSubmission.converted_inventory_id ?? undefined
      )
      redirect(
        appendReturnTo(
          `/admin/edit/${latestSubmission.converted_inventory_id}?success=draft-created-from-submission`,
          currentDetailHref
        )
      )
    }

    const draftSeed = convertSubmissionToDraftSeed(latestValues)
    const inventoryImages = draftSeed.imageUrl ? [draftSeed.imageUrl] : []
    const inventoryTitle = buildSubmissionTitle(latestValues)
    const slug = await buildUniqueInventorySlug(actionAdminClient, inventoryTitle)
    const { data: createdInventory } = await actionAdminClient
      .from('inventory')
      .insert({
        slug,
        title: draftSeed.title,
        brand: draftSeed.brand,
        product_type: draftSeed.productType || 'Other',
        pricing_mode: draftSeed.pricingMode,
        pricing_note: draftSeed.pricingNote || null,
        price: draftSeed.price,
        quantity: draftSeed.quantity,
        moq: draftSeed.moq,
        market: draftSeed.market,
        featured_markets: draftSeed.featuredMarkets,
        market_access_note: draftSeed.marketAccessNote || null,
        warehouse_location: draftSeed.warehouseLocation,
        description: draftSeed.description || null,
        images: inventoryImages,
        nicotine: draftSeed.nicotine || null,
        flavor: draftSeed.flavor || null,
        puff: draftSeed.puff ?? null,
        e_liquid: draftSeed.eLiquid || null,
        production_date_text: draftSeed.productionDateText || null,
        contact_visibility: 'contact_required',
        status: 'draft',
        is_featured: false,
        is_urgent_clearance: false,
      })
      .select('id')
      .single()

    if (!createdInventory) {
      redirect(currentDetailHref)
    }

    await actionAdminClient.from('supplier_submissions').update({
      submission_status: 'converted',
      ai_draft_package: aiDraftPackage,
      converted_inventory_id: createdInventory.id,
      raw_text_snapshot: buildSubmissionRawText(latestValues),
    }).eq('id', resolvedParams.id)

    revalidateSubmissionRoutes(resolvedParams.id, createdInventory.id, slug)
    redirect(
      appendReturnTo(
        `/admin/edit/${createdInventory.id}?success=draft-created-from-submission`,
        currentDetailHref
      )
    )
  }

  const successMessage = success ? successMessages[success] : null
  const errorMessage = error ? errorMessages[error] : null

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      {shouldCleanupSubmitStockDraft && (
        <SubmissionDraftCleanup storageKey={submitStockDraftStorageKey} />
      )}
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <Link href="/admin" className="font-medium text-teal-DEFAULT hover:underline">
                  后台总控台
                </Link>
                <span>/</span>
                <Link href={queueHref} className="font-medium text-teal-DEFAULT hover:underline">
                  {queueLabel}
                </Link>
                <span>/</span>
                <span className="text-foreground">提报审核</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground">提报审核</h1>
              <p className="text-sm text-muted">
                {submissionValues.brand || '待补品牌'} · {submissionValues.modelName || '待补型号'} · {submissionValues.supplierName || '待补来源主体'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted">当前状态</div>
              <div className="mt-2 text-sm font-medium text-foreground">{statusSummaryText}</div>
              <div className="mt-1 text-xs text-muted">当前主动作：{primaryActionLabel}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted">当前阻塞</div>
              <div className={`mt-2 text-sm ${requiredFieldCount > 0 && !hasConvertedDraft ? 'text-status-warning' : 'text-foreground'}`}>
                {blockingSummaryText}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted">下一步动作</div>
              <div className="mt-2 text-sm text-foreground">{nextStepSummaryText}</div>
            </div>
          </div>
          <BackofficeFlowBar currentStep="review" />

          {normalizedModelName && (
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted">同型号提示</div>
                  <div className={`text-sm ${duplicateModelHintRows.length > 0 ? 'text-status-warning' : 'text-foreground'}`}>
                    {duplicateModelSummaryText}
                  </div>
                  <div className="text-xs text-muted">
                    当前按型号 `{normalizedModelName}` 检查，不以同供应商或同品牌单独判重。
                  </div>
                </div>
              </div>

              {duplicateModelHintRows.length > 0 && (
                <div className="mt-3 space-y-2">
                  {duplicateModelHintRows.map((match) => (
                    <div key={match.id} className="flex flex-col gap-2 rounded-xl border border-border bg-surface px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {match.brand || '待补品牌'} · {match.model_name || '待补型号'}
                        </div>
                        <div className="text-xs text-muted">
                          {match.supplier_name || '待补来源主体'} · {formatSubmissionStatusLabel(
                            supplierSubmissionStatusOptions.includes(match.submission_status)
                              ? match.submission_status
                              : 'new'
                          )} · {new Date(match.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <Link
                          href={appendReturnTo(`/admin/submissions/${match.id}`, currentDetailHref)}
                          className="font-medium text-teal-DEFAULT hover:underline"
                        >
                          打开记录 →
                        </Link>
                        {match.converted_inventory_id && (
                          <Link
                            href={appendReturnTo(`/admin/edit/${match.converted_inventory_id}`, currentDetailHref)}
                            className="font-medium text-teal-DEFAULT hover:underline"
                          >
                            打开草稿 →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {successMessage && (
          <div className="rounded-2xl border border-teal-DEFAULT/40 bg-teal-DEFAULT/10 p-4 text-sm text-foreground">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="space-y-3 rounded-2xl border border-status-danger/40 bg-status-danger/10 p-4 text-sm text-foreground">
            <div>{errorMessage}</div>
            {missingFields.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {missingFields.map((field) => (
                  <li key={field}>{formatSupplierSubmissionFieldLabel(field as SupplierSubmissionRequiredField)}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
          <form action={updateSubmissionAction} className="contents">
            <div className="space-y-5 rounded-3xl border border-border bg-surface p-6 sm:p-8">
            {highlightedFields.size > 0 && (
              <div className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-foreground">
                <div className="font-medium">
                  仍有 {highlightedFields.size} 个必填字段未完成。
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from(highlightedFields).map((field) => (
                    <a
                      key={field}
                      href={`#${reviewFieldAnchorIds[field]}`}
                      className="rounded-full border border-status-warning/40 px-3 py-1 text-xs font-medium text-foreground hover:bg-background"
                    >
                      {formatSupplierSubmissionFieldLabel(field)}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {brandNamingRiskHint && (
              <div className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-foreground">
                {brandNamingRiskHint}
              </div>
            )}

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">01 产品识别与规格</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    id={reviewFieldAnchorIds.brand}
                    className={getReviewFieldWrapperClass(highlightedFields.has('brand'))}
                  >
                    <SubmissionFieldLabel label="品牌" required />
                    <SubmissionFieldHint>{dataEntryGuidelines.brand}</SubmissionFieldHint>
                    <input name="brand" list="brand-options" defaultValue={submissionValues.brand} required placeholder="例如 Vozol" className={reviewInputClassName} />
                    {brandNamingRiskHint && (
                      <div className="text-xs text-status-warning">
                        {brandNamingRiskHint}
                      </div>
                    )}
                  </div>
                  <div
                    id={reviewFieldAnchorIds.modelName}
                    className={getReviewFieldWrapperClass(highlightedFields.has('modelName'))}
                  >
                    <SubmissionFieldLabel label="型号 / 产品名" required />
                    <input name="model_name" defaultValue={submissionValues.modelName} required placeholder="例如 Star 10000" className={reviewInputClassName} />
                  </div>
                  <div
                    id={reviewFieldAnchorIds.productType}
                    className={getReviewFieldWrapperClass(highlightedFields.has('productType'))}
                  >
                    <SubmissionFieldLabel label="产品类型" required />
                    <select
                      name="product_type"
                      defaultValue={submissionValues.productType || 'Disposable Vape'}
                      required
                      className={reviewSelectClassName}
                    >
                      {currentProductTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口数" />
                    <input name="puff_text" defaultValue={submissionValues.puffText} placeholder="例如 10000" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="尼古丁浓度" />
                    <input name="nicotine_text" defaultValue={submissionValues.nicotineText} placeholder="例如 5% 或 50mg" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="烟油容量" />
                    <input name="e_liquid_text" defaultValue={submissionValues.eLiquidText} placeholder="例如 18ml" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="生产时间" />
                    <input name="production_date_text" defaultValue={submissionValues.productionDateText} placeholder="例如 2026-03 / 2026 Q1 / Batch 2403" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="口味列表" />
                    <textarea name="flavor_list" defaultValue={submissionValues.flavorList} placeholder="例如 Blue Razz Ice, Watermelon Ice, Mint" className={reviewTextareaClassName} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="口味明细" />
                    <textarea name="flavor_breakdown" defaultValue={submissionValues.flavorBreakdown} placeholder="例如 Blue Razz Ice - 300 pcs" className={reviewTextareaClassName} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">02 核心交易</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="报价策略" />
                    <SubmissionFieldHint>不方便录精确价格时，改用 Inquiry Only。</SubmissionFieldHint>
                    <select name="pricing_mode" defaultValue={submissionValues.pricingMode} className={reviewSelectClassName}>
                      {pricingModeOptions.map((option) => (
                        <option key={option} value={option}>{formatPricingModeLabel(option)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="单价（USD）" />
                    <input name="unit_price_text" defaultValue={submissionValues.unitPriceText} placeholder="例如 3.20" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="报价备注" />
                    <textarea name="pricing_note" defaultValue={submissionValues.pricingNote} placeholder="例如 Pricing on request / Large order negotiable" className={reviewTextareaClassName} />
                  </div>
                  <div
                    id={reviewFieldAnchorIds.availableQtyText}
                    className={getReviewFieldWrapperClass(highlightedFields.has('availableQtyText'))}
                  >
                    <SubmissionFieldLabel label="可售数量" required />
                    <SubmissionFieldHint>{submissionQuantityFieldHint}</SubmissionFieldHint>
                    <input name="available_qty_text" defaultValue={submissionValues.availableQtyText} required placeholder="例如 5000" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="MOQ" />
                    <SubmissionFieldHint>{submissionMoqFieldHint}</SubmissionFieldHint>
                    <input name="moq_text" defaultValue={submissionValues.moqText} placeholder="例如 500" className={reviewInputClassName} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">03 市场与履约</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    id={reviewFieldAnchorIds.targetMarket}
                    className={getReviewFieldWrapperClass(highlightedFields.has('targetMarket'))}
                  >
                    <SubmissionFieldLabel label="目标市场" required />
                    <SubmissionFieldHint>{dataEntryGuidelines.market}</SubmissionFieldHint>
                    <input name="target_market" list="market-options" defaultValue={submissionValues.targetMarket} placeholder="例如 Global" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="主推市场" />
                    <SubmissionFieldHint>只选预设区域；国家特例仅保留 USA、UK、UAE。</SubmissionFieldHint>
                    <div className="space-y-3 rounded-xl border border-border bg-background px-4 py-4">
                      {featuredMarketPresetGroups.map((group) => (
                        <div key={group.label} className="space-y-2">
                          <div className="text-xs font-medium text-muted">{group.label}</div>
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((option) => (
                              <label key={option} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground hover:border-teal-DEFAULT/40">
                                <input
                                  type="checkbox"
                                  name="featured_markets"
                                  value={option}
                                  defaultChecked={selectedFeaturedMarkets.has(option)}
                                  className="h-3.5 w-3.5 accent-[#22C7A9]"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    id={reviewFieldAnchorIds.warehouseLocation}
                    className={getReviewFieldWrapperClass(highlightedFields.has('warehouseLocation'))}
                  >
                    <SubmissionFieldLabel label="仓库位置" required />
                    <input name="warehouse_location" defaultValue={submissionValues.warehouseLocation} placeholder="例如 Dubai, UAE" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="市场限制说明" />
                    <textarea name="market_access_note" defaultValue={submissionValues.marketAccessNote} placeholder="例如 Except UAE / Not for Saudi Arabia" className={reviewTextareaClassName} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">04 图片与库存说明</h2>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="库存备注" />
                    <textarea name="stock_notes" defaultValue={submissionValues.stockNotes} placeholder="例如 ready stock, sealed carton" className={reviewTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="包装备注" />
                    <textarea name="packaging_notes" defaultValue={submissionValues.packagingNotes} placeholder="例如 10 pcs/box, 200 pcs/carton" className={reviewTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="补充备注" />
                    <textarea name="extra_notes" defaultValue={submissionValues.extraNotes} placeholder="例如 clearance batch, no date on device" className={reviewTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="图片链接" />
                    <SubmissionFieldHint>{`每行一个链接，或使用逗号分隔。${dataEntryGuidelines.imageFileName}`}</SubmissionFieldHint>
                    <textarea name="image_links" defaultValue={submissionValues.imageLinks} placeholder="每行一个链接，或使用逗号分隔" className={reviewTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="内部备注" />
                    <textarea name="internal_notes" defaultValue={submissionValues.internalNotes} placeholder="例如 confirm brand naming before conversion" className={reviewTextareaClassName} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {hasConvertedDraft ? (
                <Link
                  href={appendReturnTo(`/admin/edit/${item.converted_inventory_id}`, currentDetailHref)}
                  className="inline-flex items-center justify-center rounded-xl bg-teal-DEFAULT px-5 py-3 text-sm font-semibold text-background"
                >
                  去草稿继续编辑
                </Link>
              ) : aiAssistReady ? (
                <button
                  formAction={generateDraftFromSubmissionAction}
                  className="rounded-xl bg-teal-DEFAULT px-5 py-3 text-sm font-semibold text-background"
                >
                  LLM 完善并生成草稿
                </button>
              ) : (
                <button
                  className="rounded-xl bg-teal-DEFAULT px-5 py-3 text-sm font-semibold text-background"
                >
                  保存审核
                </button>
              )}
              {(hasConvertedDraft || aiAssistReady) && (
                <button className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-background">
                  保存审核
                </button>
              )}
            </div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold text-foreground">处理提醒</h2>
                <div className="mt-4 space-y-4 text-sm text-muted">
                  {item.converted_inventory_id && (
                    <div className="rounded-2xl border border-teal-DEFAULT/30 bg-teal-DEFAULT/10 px-4 py-3 space-y-2">
                      <div>已关联草稿：<span className="font-medium text-foreground">{item.converted_inventory_id}</span></div>
                      <Link href={appendReturnTo(`/admin/edit/${item.converted_inventory_id}`, currentDetailHref)} className="inline-flex text-sm font-medium text-teal-DEFAULT hover:underline">
                        去草稿继续编辑 →
                      </Link>
                    </div>
                  )}

                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 space-y-2">
                    <div className="font-medium text-foreground">处理重点</div>
                    {requiredFieldCount === 0 ? (
                      <div className="text-teal-DEFAULT">最低必填已齐，可继续下一步。</div>
                    ) : (
                      <ul className="list-disc space-y-1 pl-5">
                        {requiredFieldIssues.map((field) => (
                          <li key={field}>
                            <a href={`#${reviewFieldAnchorIds[field]}`} className="hover:text-foreground hover:underline">
                              {formatSupplierSubmissionFieldLabel(field)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="text-xs text-muted">
                    最后更新：{new Date(item.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold text-foreground">来源与回联</h2>
                <div className="mt-4 grid gap-4">
                  <div
                    id={reviewFieldAnchorIds.supplierName}
                    className={getReviewFieldWrapperClass(highlightedFields.has('supplierName'))}
                  >
                    <SubmissionFieldLabel label="库存来源主体" required />
                    <input name="supplier_name" defaultValue={submissionValues.supplierName} required placeholder="例如 Shenzhen ABC Trading" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="联系人" />
                    <input name="contact_name" defaultValue={submissionValues.contactName} placeholder="例如 Allen" className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="联系渠道 / WhatsApp / Telegram" />
                    <input name="contact_channel" defaultValue={submissionValues.contactChannel} placeholder="例如 WhatsApp +971..." className={reviewInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="来源类型" />
                    <select name="source_type" defaultValue={submissionValues.sourceType} className={reviewSelectClassName}>
                      {supplierSubmissionSourceOptions.map((option) => (
                        <option key={option} value={option}>{formatSupplierSubmissionSourceLabel(option)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="提报状态" />
                    <select name="submission_status" defaultValue={submissionValues.submissionStatus} className={reviewSelectClassName}>
                      {supplierSubmissionStatusOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

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
            <details className="rounded-3xl border border-border bg-surface p-6">
              <summary className="cursor-pointer list-none text-xl font-bold text-foreground">
                AI 参考
              </summary>
              <div className="mt-4 space-y-4 text-sm text-muted">
                <div className={aiAssistReady ? 'text-teal-DEFAULT' : 'text-status-warning'}>
                  {aiSummaryText}
                </div>

                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 space-y-2">
                  <div className="font-medium text-foreground">草稿建议</div>
                  <div>标题：<span className="text-foreground">{draftSeedPreview.title || '待补齐必填项'}</span></div>
                  <div>产品类型：<span className="text-foreground">{draftSeedPreview.productType || '待补齐必填项'}</span></div>
                  <div>目标市场：<span className="text-foreground">{draftSeedPreview.market || '待补齐必填项'}</span></div>
                  <div>主推市场：<span className="text-foreground">{draftSeedPreview.featuredMarkets.join(' / ') || '暂未设置'}</span></div>
                  <div>库存数量：<span className="text-foreground">{draftSeedPreview.quantity > 0 ? draftSeedPreview.quantity : '待补齐必填项'}</span></div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 space-y-2">
                  <div className="font-medium text-foreground">AI 信号</div>
                  <div>缺失字段：<span className="text-foreground">{aiDraftPackagePreview.missingFields.length > 0 ? aiDraftPackagePreview.missingFields.join(' | ') : '无'}</span></div>
                  <div>风险标记：<span className="text-foreground">{aiDraftPackagePreview.riskFlags.length > 0 ? aiDraftPackagePreview.riskFlags.map((flag: InventoryAiDraftPackage['riskFlags'][number]) => `${flag.severity}: ${flag.message}`).join(' | ') : '无'}</span></div>
                  <div>人工复核重点：<span className="text-foreground">{aiDraftPackagePreview.humanReviewFocus.length > 0 ? aiDraftPackagePreview.humanReviewFocus.map((item: InventoryAiDraftPackage['humanReviewFocus'][number]) => `${item.field}: ${item.reason}`).join(' | ') : '无'}</span></div>
                </div>

                <details className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                  <summary className="cursor-pointer list-none font-medium text-foreground">
                    AI 草稿包
                  </summary>
                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs leading-6 text-muted">
                    {JSON.stringify(aiDraftPackagePreview, null, 2)}
                  </pre>
                </details>
              </div>
            </details>

            <details className="rounded-3xl border border-border bg-surface p-6">
              <summary className="cursor-pointer list-none text-xl font-bold text-foreground">
                原始提报快照
              </summary>
              <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted">
                {item.raw_text_snapshot || buildSubmissionRawText(submissionValues)}
              </pre>
            </details>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
