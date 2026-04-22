import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SubmissionFormDraftSync } from '@/components/submissions/form-draft-sync'
import {
  SubmissionFieldHint,
  SubmissionFieldLabel,
  SubmissionGuidePanel,
} from '@/components/submissions/field-meta'
import { productTypeOptions } from '@/lib/admin-inventory'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  buildSubmissionRawText,
  formatSupplierSubmissionFieldLabel,
  getSupplierSubmissionMissingRequiredFields,
  normalizeSupplierSubmissionValues,
  supplierSubmissionSourceOptions,
  type SupplierSubmissionRequiredField,
  type SupplierSubmissionValues,
} from '@/lib/submissions'

export const dynamic = 'force-dynamic'

const successMessages: Record<string, string> = {
  submitted: 'Submission received. Our team will review and convert it into an internal draft if it fits the current pipeline.',
}

const errorMessages: Record<string, string> = {
  'invalid-access-code': 'Invalid access code. Please use the private submission link or contact our team.',
  'missing-service-role-key': 'Submission is temporarily unavailable. Please contact our team directly.',
  'missing-required-fields': 'Please complete the required fields before submitting.',
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
  const initialAccessCode = getSingleParam(params.code) ?? ''
  const serviceKeyReady = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const accessCodeEnabled = Boolean(process.env.SUPPLIER_SUBMISSION_ACCESS_CODE)

  const supabase = await createClient()
  const { data: inventoryOptions } = await supabase.from('inventory').select('brand, market')
  const knownBrands = getUniqueValues((inventoryOptions ?? []).map((item) => item.brand))
  const knownMarkets = getUniqueValues((inventoryOptions ?? []).map((item) => item.market))

  async function createSubmissionAction(formData: FormData) {
    'use server'

    const adminClient = createAdminClient()
    if (!adminClient) {
      redirect('/submit-stock?error=missing-service-role-key')
    }

    const expectedAccessCode = process.env.SUPPLIER_SUBMISSION_ACCESS_CODE
    const submittedAccessCode = String(formData.get('access_code') || '').trim()

    if (!expectedAccessCode || submittedAccessCode !== expectedAccessCode) {
      redirect('/submit-stock?error=invalid-access-code')
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

    await adminClient.from('supplier_submissions').insert({
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
      warehouse_location: submissionValues.warehouseLocation,
      puff_text: submissionValues.puffText || null,
      nicotine_text: submissionValues.nicotineText || null,
      e_liquid_text: submissionValues.eLiquidText || null,
      flavor_list: submissionValues.flavorList || null,
      flavor_breakdown: submissionValues.flavorBreakdown || null,
      image_links: submissionValues.imageLinks || null,
      stock_notes: submissionValues.stockNotes || null,
      packaging_notes: submissionValues.packagingNotes || null,
      extra_notes: submissionValues.extraNotes || null,
      raw_text_snapshot: buildSubmissionRawText(submissionValues),
      submission_status: 'new',
    })

    revalidatePath('/admin')
    redirect('/submit-stock?success=submitted')
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
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-teal-DEFAULT/30 bg-teal-DEFAULT/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-DEFAULT">
                私有提报入口
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">库存提报</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted">
                  这里用于提交批发库存的结构化资料。所有提报都会先进入内部审核，再决定是否生成 AI 建议和转为草稿。
                </p>
                <p className="max-w-3xl text-sm leading-6 text-muted">
                  建议一条提报对应一个产品型号。如果部分信息暂时缺失，先提交核心字段，后续由内部审核补齐即可。
                </p>
              </div>
            </div>
            <Link href="/inventory" className="text-sm font-medium text-teal-DEFAULT hover:underline">
              返回库存页
            </Link>
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

        {!accessCodeEnabled && (
          <div className="rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-foreground">
            当前尚未配置提报访问码。请先联系内部团队完成私有链接配置后再使用此页。
          </div>
        )}

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
          <form
            id="submit-stock-form"
            action={createSubmissionAction}
            className="space-y-5 rounded-3xl border border-border bg-surface p-6 sm:p-8"
          >
            <SubmissionFormDraftSync formId="submit-stock-form" storageKey="submit-stock-draft-v1" />
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

            {initialAccessCode ? (
              <input type="hidden" name="access_code" value={initialAccessCode} />
            ) : (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
                <div className="space-y-2">
                  <SubmissionFieldLabel htmlFor="access_code" label="访问码" required />
                  <SubmissionFieldHint>请输入内部使用的私有提报访问码。</SubmissionFieldHint>
                  <input
                    id="access_code"
                    name="access_code"
                    type="password"
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
                    placeholder="请输入私有提报访问码"
                  />
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">供应商信息</h2>
                  <p className="text-sm text-muted">
                    填写货源归属方和最可靠的回联方式，方便后续审核跟进。
                  </p>
                </div>
                <SubmissionGuidePanel title="填写规则" defaultOpen>
                  <p>带 * 的字段是首轮审核所需的最低必填项。</p>
                  <p>供应商名称尽量使用稳定的公司名或主体名，不要只写昵称。</p>
                  <p>一个可靠的联系渠道比多个不稳定渠道更有价值。</p>
                </SubmissionGuidePanel>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    id={submitFieldAnchorIds.supplierName}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('supplierName'))}
                  >
                    <SubmissionFieldLabel label="供应商名称" required />
                    <SubmissionFieldHint>请填写公司名或稳定供应商主体名。</SubmissionFieldHint>
                    <input name="supplier_name" required placeholder="例如 Shenzhen ABC Trading" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="联系人" />
                    <input name="contact_name" placeholder="例如 Allen" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="联系渠道 / WhatsApp / Telegram" />
                    <input name="contact_channel" placeholder="例如 WhatsApp +971..." className="rounded-xl border border-border bg-background px-4 py-3 text-sm md:col-span-2" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <SubmissionFieldLabel label="来源类型" />
                    <select name="source_type" defaultValue="supplier_form" className="rounded-xl border border-border bg-background px-4 py-3 text-sm md:col-span-2">
                      {supplierSubmissionSourceOptions.map((option) => (
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
                    品牌、型号、产品类型尽量填写清楚，可以显著提升后续审核效率。
                  </p>
                </div>
                <SubmissionGuidePanel title="填写规则">
                  <p>品牌和型号请分开填写。</p>
                  <p>产品类型尽量使用标准分类，抛弃式设备统一归到 `Disposable Vape`。</p>
                  <p>可选技术字段允许先保留供应商原始写法。</p>
                </SubmissionGuidePanel>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    id={submitFieldAnchorIds.brand}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('brand'))}
                  >
                    <SubmissionFieldLabel label="品牌" required />
                    <SubmissionFieldHint>这里只填品牌，不要混入型号、口数或口味。</SubmissionFieldHint>
                    <input name="brand" list="brand-options" required placeholder="例如 Vozol" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={submitFieldAnchorIds.modelName}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('modelName'))}
                  >
                    <SubmissionFieldLabel label="型号 / 产品名" required />
                    <SubmissionFieldHint>请填写真实型号或产品名。</SubmissionFieldHint>
                    <input name="model_name" required placeholder="例如 Star 10000" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={submitFieldAnchorIds.productType}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('productType'))}
                  >
                    <SubmissionFieldLabel label="产品类型" required />
                    <SubmissionFieldHint>尽量选择最接近的标准类型，方便后续统一处理。</SubmissionFieldHint>
                    <select
                      name="product_type"
                      required
                      defaultValue="Disposable Vape"
                      className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
                    >
                      {productTypeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口数" />
                    <input name="puff_text" placeholder="例如 10000" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="尼古丁浓度" />
                    <input name="nicotine_text" placeholder="例如 5% 或 50mg" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="烟油容量" />
                    <input name="e_liquid_text" placeholder="例如 18ml" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">交易与物流</h2>
                  <p className="text-sm text-muted">
                    优先填写最能代表这批货的市场、现货数量和仓库位置。
                  </p>
                </div>
                <SubmissionGuidePanel title="填写规则">
                  <p>价格如果尚未确认，可以暂时留空。</p>
                  <p>目标市场尽量只填写一个主要市场，不要混写多个区域。</p>
                  <p>仓库位置请填写真实备货地或发货地。</p>
                </SubmissionGuidePanel>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="单价（USD）" />
                    <input name="unit_price_text" placeholder="例如 3.20" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={submitFieldAnchorIds.availableQtyText}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('availableQtyText'))}
                  >
                    <SubmissionFieldLabel label="可售数量" required />
                    <SubmissionFieldHint>请填写当前真实可售库存。</SubmissionFieldHint>
                    <input name="available_qty_text" required placeholder="例如 5000" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="MOQ" />
                    <input name="moq_text" placeholder="例如 500" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={submitFieldAnchorIds.targetMarket}
                    className={getSubmitFieldWrapperClass(highlightedFields.has('targetMarket'))}
                  >
                    <SubmissionFieldLabel label="目标市场" required />
                    <SubmissionFieldHint>请填写这批货对应的主要市场。</SubmissionFieldHint>
                    <input name="target_market" list="market-options" required placeholder="例如 Middle East" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div
                    id={submitFieldAnchorIds.warehouseLocation}
                    className={`md:col-span-2 ${getSubmitFieldWrapperClass(highlightedFields.has('warehouseLocation'))}`}
                  >
                    <SubmissionFieldLabel label="仓库位置" required />
                    <SubmissionFieldHint>请填写明确的城市/国家或仓库地点。</SubmissionFieldHint>
                    <input name="warehouse_location" required placeholder="例如 Dubai, UAE" className="rounded-xl border border-border bg-background px-4 py-3 text-sm md:col-span-2" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">口味与备注</h2>
                  <p className="text-sm text-muted">
                    可以直接粘贴原始业务备注，系统会在保存时自动清理混乱分隔符。
                  </p>
                </div>
                <SubmissionGuidePanel title="支持格式">
                  <p>`Flavor List` 支持逗号、换行、分号和项目列表。</p>
                  <p>`Flavor Breakdown` 适合粘贴按口味拆分的数量明细。</p>
                  <p>`Stock Notes` 可以保留物流、现货、交期等原始备注。</p>
                </SubmissionGuidePanel>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口味列表" />
                    <SubmissionFieldHint>支持逗号分隔、每行一个，或项目符号列表。</SubmissionFieldHint>
                    <textarea name="flavor_list" placeholder="例如 Blue Razz Ice, Watermelon Ice, Mint" className="min-h-24 rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="口味明细" />
                    <SubmissionFieldHint>如果供应商提供了按口味拆分的数量行，可直接粘贴。</SubmissionFieldHint>
                    <textarea name="flavor_breakdown" placeholder="例如 Blue Razz Ice - 300 pcs" className="min-h-32 rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="库存备注" />
                    <SubmissionFieldHint>用于填写现货情况、混装箱、交期、版本差异等信息。</SubmissionFieldHint>
                    <textarea name="stock_notes" placeholder="例如 Ready stock, mixed carton, dispatch in 48h" className="min-h-32 rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="包装备注" />
                    <textarea name="packaging_notes" placeholder="例如 10 pcs/box, 200 pcs/carton" className="min-h-24 rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="补充备注" />
                    <textarea name="extra_notes" placeholder="例如 clearance batch, no date on device" className="min-h-24 rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/40 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">图片与提交</h2>
                  <p className="text-sm text-muted">
                    图片链接不是首轮必填项，只要核心结构化字段齐全即可先进入审核。
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <SubmissionFieldLabel label="图片链接" />
                    <SubmissionFieldHint>建议每行一个链接，逗号分隔也可以识别。</SubmissionFieldHint>
                    <textarea name="image_links" placeholder="每行一个链接，或使用逗号分隔" className="min-h-24 rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted">
                    v1 最低必填项：供应商名称、品牌、型号 / 产品名、产品类型、可售数量、目标市场、仓库位置。
                  </div>
                  <button
                    disabled={!serviceKeyReady || !accessCodeEnabled}
                    className="rounded-xl bg-teal-DEFAULT px-5 py-3 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    提交进入内部审核
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

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-border bg-surface p-6">
              <h2 className="text-xl font-bold text-foreground">提报流程</h2>
              <div className="mt-4 space-y-3 text-sm text-muted">
                <p>第 1 步：先提交一条结构化提报，不要直接发散乱表格。</p>
                <p>第 2 步：内部审核补齐缺失项并统一字段表达。</p>
                <p>第 3 步：审核通过后再进入 AI 建议和 inventory draft 流程。</p>
                <p>提报本身不会直接发布成 inventory。</p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6">
              <h2 className="text-xl font-bold text-foreground">填写建议</h2>
              <div className="mt-4 space-y-3 text-sm text-muted">
                <p>尽量一条提报对应一个产品型号。</p>
                <p>品牌和型号请分开填写。</p>
                <p>目标市场和仓库位置尽量只保留一个主信息。</p>
                <p>可以直接填写原始业务备注，不需要先写成销售文案。</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
