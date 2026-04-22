import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  SubmissionFieldHint,
  SubmissionFieldLabel,
  SubmissionGuidePanel,
} from '@/components/submissions/field-meta'
import {
  buildAiDraftPackageSeedFromSubmission,
  buildRuleBasedAiDraftPackageFromSubmission,
  buildSubmissionRawText,
  buildSubmissionTitle,
  convertSubmissionToDraftSeed,
  formatSupplierSubmissionFieldLabel,
  getSupplierSubmissionMissingRequiredFields,
  normalizeSupplierSubmissionValues,
  supplierSubmissionSourceOptions,
  supplierSubmissionStatusOptions,
  type SupplierSubmissionRequiredField,
  type SupplierSubmissionValues,
} from '@/lib/submissions'
import {
  type InventoryAiDraftPackage,
  productTypeOptions,
} from '@/lib/admin-inventory'
import { toSlug } from '@/lib/inventory'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { adminSessionCookieName, isBackofficeAuthenticated } from '@/lib/unlock'

export const dynamic = 'force-dynamic'

const successMessages: Record<string, string> = {
  'submission-updated': '提报已保存。',
  'submission-converted': '提报已转换为库存草稿。',
  'ai-suggestion-generated': 'AI 建议包已生成。',
}

const errorMessages: Record<string, string> = {
  'missing-service-role-key': '缺少 `SUPABASE_SERVICE_ROLE_KEY`，当前无法执行写入操作。',
  'missing-required-fields': '请先补齐最低必填项，再保存或转草稿。',
  'already-converted': '该提报已经关联到库存草稿。',
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function getUniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
    .sort((left, right) => left.localeCompare(right))
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

function buildMissingFieldsRedirect(path: string, fields: string[]) {
  const searchParams = new URLSearchParams({ error: 'missing-required-fields' })

  if (fields.length > 0) {
    searchParams.set('missing_fields', fields.join(','))
  }

  return `${path}?${searchParams.toString()}`
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
  const knownMarkets = getUniqueValues((inventoryOptions ?? []).map((entry) => entry.market))
  const submissionValues = normalizeSupplierSubmissionValues({
    supplierName: item.supplier_name ?? '',
    contactName: item.contact_name ?? '',
    contactChannel: item.contact_channel ?? '',
    sourceType: supplierSubmissionSourceOptions.includes(item.source_type)
      ? item.source_type
      : 'supplier_form',
    brand: item.brand ?? '',
    modelName: item.model_name ?? '',
    productType: item.product_type ?? '',
    unitPriceText: item.unit_price_text ?? '',
    availableQtyText: item.available_qty_text ?? '',
    moqText: item.moq_text ?? '',
    targetMarket: item.target_market ?? '',
    warehouseLocation: item.warehouse_location ?? '',
    puffText: item.puff_text ?? '',
    nicotineText: item.nicotine_text ?? '',
    eLiquidText: item.e_liquid_text ?? '',
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
  const reviewNextStep = requiredFieldCount === 0
    ? item.converted_inventory_id
      ? '最低必填项已齐，当前可直接进入草稿页继续编辑。'
      : '最低必填项已齐，当前可生成 AI 建议或转为库存草稿。'
    : `还差 ${requiredFieldCount} 个最低必填项，先补齐再继续后续动作。`
  const aiSummaryText = aiAssistReady
    ? 'AI 建议已可用，可作为后续草稿编辑的辅助上下文。'
    : 'AI 建议暂不可用，先补齐最低必填项。'

  async function updateSubmissionAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    if (!isBackofficeAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }

    const actionAdminClient = createAdminClient()
    if (!actionAdminClient) {
      redirect(`/admin/submissions/${resolvedParams.id}?error=missing-service-role-key`)
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
      brand: String(formData.get('brand') || '').trim(),
      modelName: String(formData.get('model_name') || '').trim(),
      productType: String(formData.get('product_type') || '').trim(),
      unitPriceText: String(formData.get('unit_price_text') || '').trim(),
      availableQtyText: String(formData.get('available_qty_text') || '').trim(),
      moqText: String(formData.get('moq_text') || '').trim(),
      targetMarket: String(formData.get('target_market') || '').trim(),
      warehouseLocation: String(formData.get('warehouse_location') || '').trim(),
      puffText: String(formData.get('puff_text') || '').trim(),
      nicotineText: String(formData.get('nicotine_text') || '').trim(),
      eLiquidText: String(formData.get('e_liquid_text') || '').trim(),
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
      redirect(buildMissingFieldsRedirect(`/admin/submissions/${resolvedParams.id}`, nextRequiredFieldIssues))
    }

    await actionAdminClient.from('supplier_submissions').update({
      supplier_name: nextValues.supplierName,
      contact_name: nextValues.contactName || null,
      contact_channel: nextValues.contactChannel || null,
      source_type: nextValues.sourceType,
      brand: nextValues.brand,
      model_name: nextValues.modelName,
      product_type: nextValues.productType,
      unit_price_text: nextValues.unitPriceText || null,
      available_qty_text: nextValues.availableQtyText,
      moq_text: nextValues.moqText || null,
      target_market: nextValues.targetMarket,
      warehouse_location: nextValues.warehouseLocation,
      puff_text: nextValues.puffText || null,
      nicotine_text: nextValues.nicotineText || null,
      e_liquid_text: nextValues.eLiquidText || null,
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
    redirect(`/admin/submissions/${resolvedParams.id}?success=submission-updated`)
  }

  async function convertSubmissionAction() {
    'use server'

    const actionCookies = await cookies()
    if (!isBackofficeAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }

    const actionAdminClient = createAdminClient()
    if (!actionAdminClient) {
      redirect(`/admin/submissions/${resolvedParams.id}?error=missing-service-role-key`)
    }

    const { data: latestSubmission } = await actionAdminClient
      .from('supplier_submissions')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (!latestSubmission) {
      redirect('/admin')
    }

    if (latestSubmission.converted_inventory_id) {
      redirect(`/admin/submissions/${resolvedParams.id}?error=already-converted`)
    }

    const latestValues = normalizeSupplierSubmissionValues({
      supplierName: latestSubmission.supplier_name ?? '',
      contactName: latestSubmission.contact_name ?? '',
      contactChannel: latestSubmission.contact_channel ?? '',
      sourceType: supplierSubmissionSourceOptions.includes(latestSubmission.source_type)
        ? latestSubmission.source_type
        : 'supplier_form',
      brand: latestSubmission.brand ?? '',
      modelName: latestSubmission.model_name ?? '',
      productType: latestSubmission.product_type ?? '',
      unitPriceText: latestSubmission.unit_price_text ?? '',
      availableQtyText: latestSubmission.available_qty_text ?? '',
      moqText: latestSubmission.moq_text ?? '',
      targetMarket: latestSubmission.target_market ?? '',
      warehouseLocation: latestSubmission.warehouse_location ?? '',
      puffText: latestSubmission.puff_text ?? '',
      nicotineText: latestSubmission.nicotine_text ?? '',
      eLiquidText: latestSubmission.e_liquid_text ?? '',
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
      redirect(buildMissingFieldsRedirect(`/admin/submissions/${resolvedParams.id}`, nextRequiredFieldIssues))
    }

    const draftSeed = convertSubmissionToDraftSeed(latestValues)
    const inventoryTitle = buildSubmissionTitle(latestValues)
    const slug = await buildUniqueInventorySlug(actionAdminClient, inventoryTitle)
    const { data: createdInventory } = await actionAdminClient
      .from('inventory')
      .insert({
        slug,
        title: draftSeed.title,
        brand: draftSeed.brand,
        product_type: draftSeed.productType || 'Other',
        price: draftSeed.price,
        quantity: draftSeed.quantity,
        moq: draftSeed.moq,
        market: draftSeed.market,
        warehouse_location: draftSeed.warehouseLocation,
        description: draftSeed.description || null,
        images: [draftSeed.imageUrl],
        nicotine: draftSeed.nicotine || null,
        flavor: draftSeed.flavor || null,
        puff: draftSeed.puff ?? null,
        e_liquid: draftSeed.eLiquid || null,
        contact_visibility: 'contact_required',
        status: 'draft',
        is_featured: false,
        is_urgent_clearance: false,
      })
      .select('id')
      .single()

    if (!createdInventory) {
      redirect(`/admin/submissions/${resolvedParams.id}`)
    }

    await actionAdminClient.from('supplier_submissions').update({
      submission_status: 'converted',
      ai_draft_package: buildAiDraftPackageSeedFromSubmission(latestValues),
      converted_inventory_id: createdInventory.id,
      raw_text_snapshot: buildSubmissionRawText(latestValues),
    }).eq('id', resolvedParams.id)

    revalidateSubmissionRoutes(resolvedParams.id, createdInventory.id, slug)
    redirect(`/admin/submissions/${resolvedParams.id}?success=submission-converted`)
  }

  async function generateAiSuggestionAction() {
    'use server'

    const actionCookies = await cookies()
    if (!isBackofficeAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect('/admin')
    }

    const actionAdminClient = createAdminClient()
    if (!actionAdminClient) {
      redirect(`/admin/submissions/${resolvedParams.id}?error=missing-service-role-key`)
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
      brand: latestSubmission.brand ?? '',
      modelName: latestSubmission.model_name ?? '',
      productType: latestSubmission.product_type ?? '',
      unitPriceText: latestSubmission.unit_price_text ?? '',
      availableQtyText: latestSubmission.available_qty_text ?? '',
      moqText: latestSubmission.moq_text ?? '',
      targetMarket: latestSubmission.target_market ?? '',
      warehouseLocation: latestSubmission.warehouse_location ?? '',
      puffText: latestSubmission.puff_text ?? '',
      nicotineText: latestSubmission.nicotine_text ?? '',
      eLiquidText: latestSubmission.e_liquid_text ?? '',
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
      redirect(buildMissingFieldsRedirect(`/admin/submissions/${resolvedParams.id}`, nextRequiredFieldIssues))
    }

    const aiDraftPackage = buildRuleBasedAiDraftPackageFromSubmission(latestValues)

    await actionAdminClient.from('supplier_submissions').update({
      ai_draft_package: aiDraftPackage,
      raw_text_snapshot: buildSubmissionRawText(latestValues),
    }).eq('id', resolvedParams.id)

    revalidateSubmissionRoutes(resolvedParams.id, latestSubmission.converted_inventory_id ?? undefined)
    redirect(`/admin/submissions/${resolvedParams.id}?success=ai-suggestion-generated`)
  }

  const successMessage = success ? successMessages[success] : null
  const errorMessage = error ? errorMessages[error] : null

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Link href="/admin" className="text-sm font-medium text-teal-DEFAULT hover:underline">
              ← 返回后台总控台
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">提报审核</h1>
              <p className="mt-1 text-sm text-muted">
                先补齐最低必填项并统一字段表达，准备好后再转成内部库存草稿。
              </p>
            </div>
          </div>
          {item.converted_inventory_id && (
            <Link
              href={`/admin/edit/${item.converted_inventory_id}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-teal-DEFAULT hover:bg-surface"
            >
              打开已转换草稿 →
            </Link>
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
          <form action={updateSubmissionAction} className="space-y-5 rounded-3xl border border-border bg-surface p-6 sm:p-8">
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

            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
              <SubmissionGuidePanel title="审核规则" defaultOpen>
                <p>先补齐必填项，再统一品牌、市场、仓库和产品字段表达。</p>
                <p>这页只做事实性审核，不把内容改写成销售文案。</p>
                <p>转换后只会生成 draft，不会直接发布上线。</p>
              </SubmissionGuidePanel>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">供应商信息</h2>
                  <p className="text-sm text-muted">
                    在提报继续向下游流转前，先确认货源归属方和回联信息是否清楚。
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    id={reviewFieldAnchorIds.supplierName}
                    className={getReviewFieldWrapperClass(highlightedFields.has('supplierName'))}
                  >
                    <SubmissionFieldLabel label="供应商名称" required />
                    <SubmissionFieldHint>请统一成稳定的供应商主体名称。</SubmissionFieldHint>
                    <input name="supplier_name" defaultValue={submissionValues.supplierName} required placeholder="例如 Shenzhen ABC Trading" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="联系人" />
                    <input name="contact_name" defaultValue={submissionValues.contactName} placeholder="例如 Allen" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="联系渠道 / WhatsApp / Telegram" />
                    <input name="contact_channel" defaultValue={submissionValues.contactChannel} placeholder="例如 WhatsApp +971..." className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm md:col-span-2" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="来源类型" />
                    <select name="source_type" defaultValue={submissionValues.sourceType} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
                      {supplierSubmissionSourceOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="提报状态" />
                    <select name="submission_status" defaultValue={submissionValues.submissionStatus} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">
                      {supplierSubmissionStatusOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">产品基础信息</h2>
                  <p className="text-sm text-muted">
                    先把品牌、型号和产品类型理顺，后续生成草稿时会更干净。
                  </p>
                </div>
                <SubmissionGuidePanel title="标准化规则">
                  <p>品牌和型号要分开填写。</p>
                  <p>产品类型尽量使用标准类型，抛弃式设备统一归到 `Disposable Vape`。</p>
                  <p>仍不确定的技术字段可以先保留供应商原始写法。</p>
                </SubmissionGuidePanel>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    id={reviewFieldAnchorIds.brand}
                    className={getReviewFieldWrapperClass(highlightedFields.has('brand'))}
                  >
                    <SubmissionFieldLabel label="品牌" required />
                    <SubmissionFieldHint>统一品牌大小写和命名方式，避免后续 SEO 命名混乱。</SubmissionFieldHint>
                    <input name="brand" list="brand-options" defaultValue={submissionValues.brand} required placeholder="例如 Vozol" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={reviewFieldAnchorIds.modelName}
                    className={getReviewFieldWrapperClass(highlightedFields.has('modelName'))}
                  >
                    <SubmissionFieldLabel label="型号 / 产品名" required />
                    <SubmissionFieldHint>这里只保留真实型号或产品名。</SubmissionFieldHint>
                    <input name="model_name" defaultValue={submissionValues.modelName} required placeholder="例如 Star 10000" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={reviewFieldAnchorIds.productType}
                    className={getReviewFieldWrapperClass(highlightedFields.has('productType'))}
                  >
                    <SubmissionFieldLabel label="产品类型" required />
                    <SubmissionFieldHint>尽量使用最接近的标准类型。</SubmissionFieldHint>
                    <select
                      name="product_type"
                      defaultValue={submissionValues.productType || 'Disposable Vape'}
                      required
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                    >
                      {currentProductTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口数" />
                    <input name="puff_text" defaultValue={submissionValues.puffText} placeholder="例如 10000" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="尼古丁浓度" />
                    <input name="nicotine_text" defaultValue={submissionValues.nicotineText} placeholder="例如 5% 或 50mg" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="烟油容量" />
                    <input name="e_liquid_text" defaultValue={submissionValues.eLiquidText} placeholder="例如 18ml" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">交易与物流</h2>
                  <p className="text-sm text-muted">
                    重点确认数量、市场和仓库位置，这些字段会直接影响转草稿结果。
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="单价（USD）" />
                    <input name="unit_price_text" defaultValue={submissionValues.unitPriceText} placeholder="例如 3.20" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={reviewFieldAnchorIds.availableQtyText}
                    className={getReviewFieldWrapperClass(highlightedFields.has('availableQtyText'))}
                  >
                    <SubmissionFieldLabel label="可售数量" required />
                    <SubmissionFieldHint>请填写当前最明确的可售库存数量。</SubmissionFieldHint>
                    <input name="available_qty_text" defaultValue={submissionValues.availableQtyText} required placeholder="例如 5000" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="MOQ" />
                    <input name="moq_text" defaultValue={submissionValues.moqText} placeholder="例如 500" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={reviewFieldAnchorIds.targetMarket}
                    className={getReviewFieldWrapperClass(highlightedFields.has('targetMarket'))}
                  >
                    <SubmissionFieldLabel label="目标市场" required />
                    <SubmissionFieldHint>尽量只保留一个主要市场。</SubmissionFieldHint>
                    <input name="target_market" list="market-options" defaultValue={submissionValues.targetMarket} required placeholder="例如 Middle East" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={reviewFieldAnchorIds.warehouseLocation}
                    className={`md:col-span-2 ${getReviewFieldWrapperClass(highlightedFields.has('warehouseLocation'))}`}
                  >
                    <SubmissionFieldLabel label="仓库位置" required />
                    <SubmissionFieldHint>请填写明确的城市/国家或仓库地点。</SubmissionFieldHint>
                    <input name="warehouse_location" defaultValue={submissionValues.warehouseLocation} required placeholder="例如 Dubai, UAE" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm md:col-span-2" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">口味、备注与图片</h2>
                  <p className="text-sm text-muted">
                    原始业务上下文可以保留，系统会在保存时自动清理分隔符噪音。
                  </p>
                </div>
                <SubmissionGuidePanel title="支持格式">
                  <p>`Flavor List` 支持逗号、换行、分号和项目列表。</p>
                  <p>`Flavor Breakdown` 和 `Stock Notes` 在清洗后会按一行一个条目保留。</p>
                  <p>图片链接会被标准化成每行一个链接。</p>
                </SubmissionGuidePanel>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口味列表" />
                    <SubmissionFieldHint>这里只保留概览型口味，分隔符会自动标准化。</SubmissionFieldHint>
                    <textarea name="flavor_list" defaultValue={submissionValues.flavorList} placeholder="例如 Blue Razz Ice, Watermelon Ice, Mint" className="w-full min-h-32 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口味明细" />
                    <SubmissionFieldHint>如果供应商提供了按口味拆分的数量行，可直接粘贴。</SubmissionFieldHint>
                    <textarea name="flavor_breakdown" defaultValue={submissionValues.flavorBreakdown} placeholder="例如 Blue Razz Ice - 300 pcs" className="w-full min-h-40 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="库存备注" />
                    <SubmissionFieldHint>用于记录现货、混装箱、交期和版本差异等信息。</SubmissionFieldHint>
                    <textarea name="stock_notes" defaultValue={submissionValues.stockNotes} placeholder="例如 ready stock, sealed carton" className="w-full min-h-40 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="包装备注" />
                    <textarea name="packaging_notes" defaultValue={submissionValues.packagingNotes} placeholder="例如 10 pcs/box, 200 pcs/carton" className="w-full min-h-32 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="补充备注" />
                    <textarea name="extra_notes" defaultValue={submissionValues.extraNotes} placeholder="例如 clearance batch, no date on device" className="w-full min-h-32 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="图片链接" />
                    <textarea name="image_links" defaultValue={submissionValues.imageLinks} placeholder="每行一个链接，或使用逗号分隔" className="w-full min-h-32 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="内部备注" />
                    <SubmissionFieldHint>这里只写后台审核备注，不写对外文案。</SubmissionFieldHint>
                    <textarea name="internal_notes" defaultValue={submissionValues.internalNotes} placeholder="例如 confirm brand naming before conversion" className="w-full min-h-40 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="rounded-xl bg-teal-DEFAULT px-5 py-3 text-sm font-semibold text-background">
                保存审核
              </button>
              <button
                formAction={convertSubmissionAction}
                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-background"
              >
                转为库存草稿
              </button>
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
          </form>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-border bg-surface p-6">
              <h2 className="text-xl font-bold text-foreground">处理概览</h2>
              <div className="mt-4 space-y-4 text-sm text-muted">
                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 space-y-2">
                  <div>状态：<span className="font-medium uppercase text-foreground">{submissionValues.submissionStatus}</span></div>
                  <div>当前下一步：<span className="text-foreground">{reviewNextStep}</span></div>
                  <div>更新时间：{new Date(item.updated_at).toLocaleString()}</div>
                  <div>创建时间：{new Date(item.created_at).toLocaleString()}</div>
                </div>

                {item.converted_inventory_id && (
                  <div className="rounded-2xl border border-teal-DEFAULT/30 bg-teal-DEFAULT/10 px-4 py-3 space-y-2">
                    <div>已转换草稿 ID：<span className="font-medium text-foreground">{item.converted_inventory_id}</span></div>
                    <Link href={`/admin/edit/${item.converted_inventory_id}`} className="inline-flex text-sm font-medium text-teal-DEFAULT hover:underline">
                      打开草稿编辑 →
                    </Link>
                  </div>
                )}

                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 space-y-2">
                  <div className="font-medium text-foreground">最低必填项</div>
                  {requiredFieldCount === 0 ? (
                    <div className="text-teal-DEFAULT">已满足转草稿的最低审核条件。</div>
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
                  <div>转换只会生成 `draft`，真正发布仍在后续库存流程里处理。</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6">
              <h2 className="text-xl font-bold text-foreground">AI 建议</h2>
              <div className="mt-4 space-y-4 text-sm text-muted">
                <div className={aiAssistReady ? 'text-teal-DEFAULT' : 'text-status-warning'}>
                  {aiSummaryText}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    formAction={generateAiSuggestionAction}
                    disabled={!aiAssistReady}
                    className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    生成 AI 建议
                  </button>
                </div>

                {!aiAssistReady && (
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

                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 space-y-2">
                  <div className="font-medium text-foreground">当前建议草稿</div>
                  <div>建议标题：<span className="text-foreground">{draftSeedPreview.title || '待补齐必填项'}</span></div>
                  <div>建议产品类型：<span className="text-foreground">{draftSeedPreview.productType || '待补齐必填项'}</span></div>
                  <div>建议市场：<span className="text-foreground">{draftSeedPreview.market || '待补齐必填项'}</span></div>
                  <div>建议数量：<span className="text-foreground">{draftSeedPreview.quantity > 0 ? draftSeedPreview.quantity : '待补齐必填项'}</span></div>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">描述草稿种子</div>
                    <div className="whitespace-pre-wrap text-xs leading-6">
                      {draftSeedPreview.description || '请补充更多业务备注，以生成更完整的描述草稿种子。'}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 space-y-2">
                  <div className="font-medium text-foreground">最新建议信号</div>
                  <div>缺失字段：<span className="text-foreground">{aiDraftPackagePreview.missingFields.length > 0 ? aiDraftPackagePreview.missingFields.join(' | ') : '无'}</span></div>
                  <div>风险标记：<span className="text-foreground">{aiDraftPackagePreview.riskFlags.length > 0 ? aiDraftPackagePreview.riskFlags.map((flag: InventoryAiDraftPackage['riskFlags'][number]) => `${flag.severity}: ${flag.message}`).join(' | ') : '无'}</span></div>
                  <div>人工复核重点：<span className="text-foreground">{aiDraftPackagePreview.humanReviewFocus.length > 0 ? aiDraftPackagePreview.humanReviewFocus.map((item: InventoryAiDraftPackage['humanReviewFocus'][number]) => `${item.field}: ${item.reason}`).join(' | ') : '无'}</span></div>
                </div>

                <details className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                  <summary className="cursor-pointer list-none font-medium text-foreground">
                    AI 草稿包预览
                  </summary>
                  <div className="mt-2 text-xs text-muted">保存审核后可刷新这里的预览。</div>
                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs leading-6 text-muted">
                    {JSON.stringify(aiDraftPackagePreview, null, 2)}
                  </pre>
                </details>

                <div className="rounded-2xl border border-status-warning/30 bg-status-warning/10 px-4 py-3 text-xs leading-6 text-foreground">
                  审核页只保留事实性信息，AI 建议只作为草稿编辑辅助，不直接覆盖源字段。
                </div>
              </div>
            </div>

            <details className="rounded-3xl border border-border bg-surface p-6">
              <summary className="cursor-pointer list-none text-xl font-bold text-foreground">
                原始提报快照
              </summary>
              <div className="mt-2 text-sm text-muted">
                仅在需要核对供应商原始描述时展开。
              </div>
              <pre className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted">
                {item.raw_text_snapshot || buildSubmissionRawText(submissionValues)}
              </pre>
            </details>
          </div>
        </section>
      </div>
    </main>
  )
}
