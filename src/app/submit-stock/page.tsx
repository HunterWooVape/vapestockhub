import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SubmissionFormDraftSync } from '@/components/submissions/form-draft-sync'
import { BackofficeFlowBar } from '@/components/submissions/backoffice-flow-bar'
import {
  SubmissionFieldHint,
  SubmissionFieldLabel,
} from '@/components/submissions/field-meta'
import { productTypeOptions } from '@/lib/admin-inventory'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  adminSessionCookieName,
  buildBackofficeLoginRedirect,
  isBackofficeAuthenticated,
} from '@/lib/unlock'
import {
  buildSubmissionRawText,
  formatSupplierSubmissionFieldLabel,
  formatSupplierSubmissionSourceLabel,
  getSupplierSubmissionMissingRequiredFields,
  normalizeSupplierSubmissionValues,
  supplierSubmissionSourceOptions,
  type SupplierSubmissionRequiredField,
  type SupplierSubmissionValues,
} from '@/lib/submissions'

export const dynamic = 'force-dynamic'

const successMessages: Record<string, string> = {
  submitted: '录入已提交，内容已进入内部审核队列。下一步在审核页继续补齐、标准化并转草稿。',
}

const errorMessages: Record<string, string> = {
  'missing-service-role-key': '当前录入功能暂时不可用，请联系内部管理员处理。',
  'missing-required-fields': '请先补齐最低必填项后再提交。',
  'submission-create-failed': '本次录入未写入成功，请重试或联系内部管理员检查数据库字段和服务端配置。',
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function getUniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]))
    .sort((left, right) => left.localeCompare(right))
}

const submitFieldAnchorIds: Record<SupplierSubmissionRequiredField, string> = {
  supplierName: 'field-supplier-name',
  brand: 'field-brand',
  modelName: 'field-model-name',
  productType: 'field-product-type',
  availableQtyText: 'field-available-qty',
  targetMarket: 'field-target-market',
  warehouseLocation: 'field-warehouse-location',
}

function getSubmitFieldWrapperClass(isHighlighted: boolean) {
  return isHighlighted
    ? 'space-y-2 rounded-2xl border border-status-warning/50 bg-status-warning/10 p-3'
    : 'space-y-2'
}

const submitInputClassName = 'h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground'
const submitSelectClassName = 'h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground'
const submitTextareaClassName = 'min-h-32 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground'

export default async function SubmitStockPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const success = getSingleParam(params.success)
  const error = getSingleParam(params.error)
  const missingFields = (getSingleParam(params.missing_fields) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const serviceKeyReady = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const cookieStore = await cookies()

  if (!isBackofficeAuthenticated(cookieStore.get(adminSessionCookieName)?.value)) {
    redirect(buildBackofficeLoginRedirect('/submit-stock'))
  }

  const supabase = await createClient()
  const { data: inventoryOptions } = await supabase.from('inventory').select('brand, market')
  const knownBrands = getUniqueValues((inventoryOptions ?? []).map((item) => item.brand))
  const knownMarkets = getUniqueValues(['Global', ...((inventoryOptions ?? []).map((item) => item.market))])

  async function createSubmissionAction(formData: FormData) {
    'use server'

    const actionCookies = await cookies()
    if (!isBackofficeAuthenticated(actionCookies.get(adminSessionCookieName)?.value)) {
      redirect(buildBackofficeLoginRedirect('/submit-stock'))
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect('/submit-stock?error=missing-service-role-key')
    }

    const submittedSourceType = String(formData.get('source_type') || '').trim()

    const submissionValues = normalizeSupplierSubmissionValues({
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
      internalNotes: '',
      submissionStatus: 'new',
    })

    const requiredFieldIssues = getSupplierSubmissionMissingRequiredFields(submissionValues)

    if (requiredFieldIssues.length > 0) {
      const query = new URLSearchParams({
        error: 'missing-required-fields',
        missing_fields: requiredFieldIssues.join(','),
      })
      redirect(`/submit-stock?${query.toString()}`)
    }

    const { data: createdSubmission, error: insertError } = await adminClient.from('supplier_submissions').insert({
      supplier_name: submissionValues.supplierName,
      contact_name: submissionValues.contactName || null,
      contact_channel: submissionValues.contactChannel || null,
      source_type: submissionValues.sourceType,
      brand: submissionValues.brand,
      model_name: submissionValues.modelName,
      product_type: submissionValues.productType,
      unit_price_text: submissionValues.unitPriceText || null,
      available_qty_text: submissionValues.availableQtyText,
      moq_text: submissionValues.moqText || null,
      target_market: submissionValues.targetMarket,
      market_access_note: submissionValues.marketAccessNote || null,
      warehouse_location: submissionValues.warehouseLocation,
      puff_text: submissionValues.puffText || null,
      nicotine_text: submissionValues.nicotineText || null,
      e_liquid_text: submissionValues.eLiquidText || null,
      production_date_text: submissionValues.productionDateText || null,
      flavor_list: submissionValues.flavorList || null,
      flavor_breakdown: submissionValues.flavorBreakdown || null,
      image_links: submissionValues.imageLinks || null,
      stock_notes: submissionValues.stockNotes || null,
      packaging_notes: submissionValues.packagingNotes || null,
      extra_notes: submissionValues.extraNotes || null,
      raw_text_snapshot: buildSubmissionRawText(submissionValues),
      submission_status: 'new',
    }).select('id').single()

    if (insertError || !createdSubmission) {
      redirect('/submit-stock?error=submission-create-failed')
    }

    revalidatePath('/admin')
    revalidatePath('/admin/submissions')
    redirect(`/admin/submissions/${createdSubmission.id}?success=submission-created&return_to=${encodeURIComponent('/submit-stock')}`)
  }

  const successMessage = success ? successMessages[success] : null
  const errorMessage = error ? errorMessages[error] : null
  const highlightedFields = new Set<SupplierSubmissionRequiredField>(
    missingFields.filter((field): field is SupplierSubmissionRequiredField =>
      [
        'supplierName',
        'brand',
        'modelName',
        'productType',
        'availableQtyText',
        'targetMarket',
        'warehouseLocation',
      ].includes(field)
    )
  )

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-teal-DEFAULT/30 bg-teal-DEFAULT/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-DEFAULT">
                内部录入台
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">库存提报</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted">
                  把 Excel、聊天记录或供应商清单快速录成一条内部提报。先录核心字段，再去审核页补齐和标准化。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/admin/submissions" className="font-medium text-teal-DEFAULT hover:underline">
                去审核队列
              </Link>
              <Link href="/inventory" className="font-medium text-muted hover:text-teal-DEFAULT hover:underline">
                查看前台库存
              </Link>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted">
            <div className="rounded-full border border-border bg-background px-3 py-1.5">
              最低必填 7 项
            </div>
            <div className="rounded-full border border-border bg-background px-3 py-1.5">
              一条记录对应一个型号
            </div>
            <div className="rounded-full border border-border bg-background px-3 py-1.5">
              价格、图片可后补
            </div>
          </div>
          <div className="mt-5">
            <BackofficeFlowBar currentStep="submit" />
          </div>
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
                  <li key={field}>
                    <a
                      href={`#${submitFieldAnchorIds[field as SupplierSubmissionRequiredField]}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {formatSupplierSubmissionFieldLabel(field as SupplierSubmissionRequiredField)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!serviceKeyReady && (
          <div className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-foreground">
            当前服务端尚未配置 service role key，提报功能暂时不可用。
          </div>
        )}

        <section>
          <form
            id="submit-stock-form"
            action={createSubmissionAction}
            className="space-y-5 rounded-3xl border border-border bg-surface p-6 sm:p-8"
          >
            <SubmissionFormDraftSync formId="submit-stock-form" storageKey="submit-stock-draft-v1" />
            <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">
                    快速录入
                  </div>
                  <p className="text-sm text-muted">
                    本页会自动保留本地草稿。先完成最低必填字段，再补图片、价格和原始备注。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a href="#section-supplier" className="rounded-full border border-border bg-background px-3 py-1.5 text-muted hover:text-foreground">
                    供应商信息
                  </a>
                  <a href="#section-product" className="rounded-full border border-border bg-background px-3 py-1.5 text-muted hover:text-foreground">
                    产品基础
                  </a>
                  <a href="#section-trade" className="rounded-full border border-border bg-background px-3 py-1.5 text-muted hover:text-foreground">
                    交易与物流
                  </a>
                  <a href="#section-notes" className="rounded-full border border-border bg-background px-3 py-1.5 text-muted hover:text-foreground">
                    口味与备注
                  </a>
                  <a href="#section-media" className="rounded-full border border-border bg-background px-3 py-1.5 text-muted hover:text-foreground">
                    图片与提交
                  </a>
                </div>
              </div>
            </div>
            {highlightedFields.size > 0 && (
              <div className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-foreground">
                <div className="font-medium">
                  仍有 {highlightedFields.size} 个必填字段未完成。
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from(highlightedFields).map((field) => (
                    <a
                      key={field}
                      href={`#${submitFieldAnchorIds[field]}`}
                      className="rounded-full border border-status-warning/40 px-3 py-1 text-xs font-medium text-foreground hover:bg-background"
                    >
                      {formatSupplierSubmissionFieldLabel(field)}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div id="section-supplier" className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">01</div>
                  <h2 className="text-xl font-bold text-foreground">供应商信息</h2>
                  <p className="text-sm text-muted">先保留货源归属和回联线索。</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    id={submitFieldAnchorIds.supplierName}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('supplierName'))}
                  >
                    <SubmissionFieldLabel label="供应商名称" required />
                    <SubmissionFieldHint>优先填写公司名或稳定主体名。</SubmissionFieldHint>
                    <input name="supplier_name" required placeholder="例如 Shenzhen ABC Trading" className={submitInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="联系人" />
                    <input name="contact_name" placeholder="例如 Allen" className={submitInputClassName} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="联系渠道 / WhatsApp / Telegram" />
                    <input name="contact_channel" placeholder="例如 WhatsApp +971..." className={submitInputClassName} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="来源类型" />
                    <select name="source_type" defaultValue="supplier_form" className={submitSelectClassName}>
                      {supplierSubmissionSourceOptions.map((option) => (
                        <option key={option} value={option}>{formatSupplierSubmissionSourceLabel(option)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div id="section-product" className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">02</div>
                  <h2 className="text-xl font-bold text-foreground">产品基础信息</h2>
                  <p className="text-sm text-muted">品牌、型号、类型分开填，后续更好整理。</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    id={submitFieldAnchorIds.brand}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('brand'))}
                  >
                    <SubmissionFieldLabel label="品牌" required />
                    <SubmissionFieldHint>只填品牌，不混型号。</SubmissionFieldHint>
                    <input name="brand" list="brand-options" required placeholder="例如 Vozol" className={submitInputClassName} />
                  </div>
                  <div
                    id={submitFieldAnchorIds.modelName}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('modelName'))}
                  >
                    <SubmissionFieldLabel label="型号 / 产品名" required />
                    <SubmissionFieldHint>请填写真实型号或产品名。</SubmissionFieldHint>
                    <input name="model_name" required placeholder="例如 Star 10000" className={submitInputClassName} />
                  </div>
                  <div
                    id={submitFieldAnchorIds.productType}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('productType'))}
                  >
                    <SubmissionFieldLabel label="产品类型" required />
                    <select
                      name="product_type"
                      required
                      defaultValue="Disposable Vape"
                      className={submitSelectClassName}
                    >
                      {productTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口数" />
                    <input name="puff_text" placeholder="例如 10000" className={submitInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="尼古丁浓度" />
                    <input name="nicotine_text" placeholder="例如 5% 或 50mg" className={submitInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="烟油容量" />
                    <input name="e_liquid_text" placeholder="例如 18ml" className={submitInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="生产时间" />
                    <SubmissionFieldHint>支持月份、季度或供应商原文批次时间。</SubmissionFieldHint>
                    <input name="production_date_text" placeholder="例如 2026-03 / 2026 Q1 / Batch 2403" className={submitInputClassName} />
                  </div>
                </div>
              </div>
            </div>

            <div id="section-trade" className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">03</div>
                  <h2 className="text-xl font-bold text-foreground">交易与物流</h2>
                  <p className="text-sm text-muted">优先保证数量、市场、仓库可判断。</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="单价（USD）" />
                    <input name="unit_price_text" placeholder="例如 3.20" className={submitInputClassName} />
                  </div>
                  <div
                    id={submitFieldAnchorIds.availableQtyText}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('availableQtyText'))}
                  >
                    <SubmissionFieldLabel label="可售数量" required />
                    <input name="available_qty_text" required placeholder="例如 5000" className={submitInputClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="MOQ" />
                    <input name="moq_text" placeholder="例如 500" className={submitInputClassName} />
                  </div>
                  <div
                    id={submitFieldAnchorIds.targetMarket}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('targetMarket'))}
                  >
                    <SubmissionFieldLabel label="目标市场" required />
                    <SubmissionFieldHint>主市场用于聚合与筛选，可直接填写 `Global`。</SubmissionFieldHint>
                    <input name="target_market" list="market-options" required defaultValue="Global" placeholder="例如 Global / Middle East" className={submitInputClassName} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="市场限制说明" />
                    <SubmissionFieldHint>用于记录 `Except UAE`、`Not for Saudi Arabia` 等限制说明。</SubmissionFieldHint>
                    <textarea name="market_access_note" placeholder="例如 Except UAE / Not for Saudi Arabia" className={submitTextareaClassName} />
                  </div>
                  <div
                    id={submitFieldAnchorIds.warehouseLocation}
                    className={`md:col-span-2 ${getSubmitFieldWrapperClass(highlightedFields.has('warehouseLocation'))}`}
                  >
                    <SubmissionFieldLabel label="仓库位置" required />
                    <SubmissionFieldHint>写城市 / 国家或仓库地即可。</SubmissionFieldHint>
                    <input name="warehouse_location" required placeholder="例如 Dubai, UAE" className={submitInputClassName} />
                  </div>
                </div>
              </div>
            </div>

            <div id="section-notes" className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">04</div>
                  <h2 className="text-xl font-bold text-foreground">口味与备注</h2>
                  <p className="text-sm text-muted">支持直接粘贴原始备注，不需要先改成销售文案。</p>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口味列表" />
                    <SubmissionFieldHint>支持逗号或换行。</SubmissionFieldHint>
                    <textarea name="flavor_list" placeholder="例如 Blue Razz Ice, Watermelon Ice, Mint" className={submitTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口味明细" />
                    <textarea name="flavor_breakdown" placeholder="例如 Blue Razz Ice - 300 pcs" className={submitTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="库存备注" />
                    <textarea name="stock_notes" placeholder="例如 Ready stock, mixed carton, dispatch in 48h" className={submitTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="包装备注" />
                    <textarea name="packaging_notes" placeholder="例如 10 pcs/box, 200 pcs/carton" className={submitTextareaClassName} />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="补充备注" />
                    <textarea name="extra_notes" placeholder="例如 clearance batch, no date on device" className={submitTextareaClassName} />
                  </div>
                </div>
              </div>
            </div>

            <div id="section-media" className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-DEFAULT">05</div>
                  <h2 className="text-xl font-bold text-foreground">图片与提交</h2>
                  <p className="text-sm text-muted">图片不是首轮必填，先把结构化字段录进去。</p>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="图片链接" />
                    <SubmissionFieldHint>每行一个链接，或直接逗号分隔。</SubmissionFieldHint>
                    <textarea name="image_links" placeholder="每行一个链接，或使用逗号分隔" className={submitTextareaClassName} />
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">提交前检查</div>
                        <div className="text-sm text-muted">
                          最低必填项：供应商名称、品牌、型号 / 产品名、产品类型、可售数量、目标市场、仓库位置。
                        </div>
                      </div>
                      <div className="text-xs text-muted">
                        提交后直接去审核页
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={!serviceKeyReady}
                    className="rounded-xl bg-teal-DEFAULT px-5 py-3 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    提交并去审核
                  </button>
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
          </form>
        </section>
      </div>
    </main>
  )
}
