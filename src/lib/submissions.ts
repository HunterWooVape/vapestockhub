import {
  createEmptyInventoryAiDraftPackage,
  getBrandNamingRiskTerms,
  normalizeELiquidValue,
  normalizeNicotineValue,
  normalizeWarehouseLocation,
} from '@/lib/admin-inventory'

export const supplierSubmissionStatusOptions = [
  'new',
  'reviewing',
  'converted',
  'rejected',
] as const

export type SupplierSubmissionStatus = typeof supplierSubmissionStatusOptions[number]

export const supplierSubmissionSourceOptions = [
  'supplier_form',
  'internal_form',
  'chat',
  'excel',
  'other',
] as const

export type SupplierSubmissionSource = typeof supplierSubmissionSourceOptions[number]

export type SupplierSubmissionValues = {
  supplierName: string
  contactName: string
  contactChannel: string
  sourceType: SupplierSubmissionSource
  brand: string
  modelName: string
  productType: string
  unitPriceText: string
  availableQtyText: string
  moqText: string
  targetMarket: string
  marketAccessNote: string
  warehouseLocation: string
  puffText: string
  nicotineText: string
  eLiquidText: string
  productionDateText: string
  flavorList: string
  flavorBreakdown: string
  imageLinks: string
  stockNotes: string
  packagingNotes: string
  extraNotes: string
  internalNotes: string
  submissionStatus: SupplierSubmissionStatus
}

export const supplierSubmissionRequiredFields = [
  'supplierName',
  'brand',
  'modelName',
  'productType',
  'availableQtyText',
  'targetMarket',
  'warehouseLocation',
] as const

export type SupplierSubmissionRequiredField = typeof supplierSubmissionRequiredFields[number]

const supplierSubmissionFieldLabels: Record<SupplierSubmissionRequiredField, string> = {
  supplierName: '供应商名称',
  brand: '品牌',
  modelName: '型号 / 产品名',
  productType: '产品类型',
  availableQtyText: '可售数量',
  targetMarket: '目标市场',
  warehouseLocation: '仓库位置',
}

export function formatSupplierSubmissionFieldLabel(field: SupplierSubmissionRequiredField) {
  return supplierSubmissionFieldLabels[field]
}

const supplierSubmissionSourceLabels: Record<SupplierSubmissionSource, string> = {
  supplier_form: '供应商表单',
  internal_form: '内部录入',
  chat: '聊天记录',
  excel: 'Excel 清单',
  other: '其他来源',
}

export function formatSupplierSubmissionSourceLabel(source: SupplierSubmissionSource) {
  return supplierSubmissionSourceLabels[source]
}

export function getSupplierSubmissionMissingRequiredFields(values: SupplierSubmissionValues) {
  return supplierSubmissionRequiredFields.filter((field) => !values[field].trim())
}

export function parseSubmissionNumber(value: string) {
  const normalizedValue = value.replace(/,/g, '').trim()
  const match = normalizedValue.match(/-?\d+(?:\.\d+)?/)

  if (!match) {
    return null
  }

  const parsedValue = Number(match[0])
  return Number.isFinite(parsedValue) ? parsedValue : null
}

export function parseSubmissionInteger(value: string) {
  const parsedValue = parseSubmissionNumber(value)

  if (parsedValue === null) {
    return null
  }

  return Math.round(parsedValue)
}

// 中文注释：把供应商乱格式的口味输入尽量清洗成稳定标签，便于后续展示与 AI 处理。
export function splitSubmissionFlavorTags(value: string) {
  const seen = new Set<string>()

  return value
    .replace(/\r\n/g, '\n')
    .replace(/[•·▪◦●]/g, '\n')
    .split(/[\n,;|，；、]+/)
    .map((item) => item.replace(/^[\s\-*]+/, '').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

// 中文注释：保留原始业务文本，但去掉多余空行和首部项目符号，避免后台内容过脏。
export function normalizeSubmissionMultilineText(value: string, options?: { stripBulletPrefix?: boolean }) {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((item) => item.trim())
    .map((item) => (options?.stripBulletPrefix ? item.replace(/^[•·▪◦●\-\*]+\s*/, '').trim() : item))
    .filter(Boolean)
    .join('\n')
}

export function getSubmissionImageList(imageLinks: string) {
  return imageLinks
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeSupplierSubmissionValues(values: SupplierSubmissionValues): SupplierSubmissionValues {
  return {
    ...values,
    supplierName: values.supplierName.trim(),
    contactName: values.contactName.trim(),
    contactChannel: values.contactChannel.trim(),
    brand: values.brand.trim(),
    modelName: values.modelName.trim(),
    productType: values.productType.trim(),
    unitPriceText: values.unitPriceText.trim(),
    availableQtyText: values.availableQtyText.trim(),
    moqText: values.moqText.trim(),
    targetMarket: values.targetMarket.trim(),
    marketAccessNote: normalizeSubmissionMultilineText(values.marketAccessNote),
    warehouseLocation: normalizeWarehouseLocation(values.warehouseLocation),
    puffText: values.puffText.trim(),
    nicotineText: normalizeNicotineValue(values.nicotineText),
    eLiquidText: normalizeELiquidValue(values.eLiquidText),
    productionDateText: normalizeSubmissionMultilineText(values.productionDateText),
    flavorList: splitSubmissionFlavorTags(values.flavorList).join(', '),
    flavorBreakdown: normalizeSubmissionMultilineText(values.flavorBreakdown),
    imageLinks: getSubmissionImageList(values.imageLinks).join('\n'),
    stockNotes: normalizeSubmissionMultilineText(values.stockNotes),
    packagingNotes: normalizeSubmissionMultilineText(values.packagingNotes),
    extraNotes: normalizeSubmissionMultilineText(values.extraNotes),
    internalNotes: normalizeSubmissionMultilineText(values.internalNotes),
  }
}

export function buildSubmissionTitle(values: Pick<SupplierSubmissionValues, 'brand' | 'modelName' | 'productType'>) {
  const baseTitle = `${values.brand.trim()} ${values.modelName.trim()}`.trim()

  if (!values.productType.trim()) {
    return baseTitle
  }

  if (baseTitle.toLowerCase().includes(values.productType.trim().toLowerCase())) {
    return baseTitle
  }

  return `${baseTitle} ${values.productType.trim()}`.trim()
}

export function buildSubmissionDescription(values: Pick<
  SupplierSubmissionValues,
  'stockNotes' | 'flavorBreakdown' | 'packagingNotes' | 'extraNotes' | 'marketAccessNote'
>) {
  return [
    values.stockNotes,
    values.marketAccessNote ? `Market Access Note:\n${values.marketAccessNote}` : '',
    values.flavorBreakdown,
    values.packagingNotes,
    values.extraNotes,
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .join('\n\n')
}

export function buildSubmissionRawText(values: SupplierSubmissionValues) {
  const normalizedValues = normalizeSupplierSubmissionValues(values)

  return [
    `Supplier Name: ${normalizedValues.supplierName}`,
    normalizedValues.contactName ? `Contact Name: ${normalizedValues.contactName}` : '',
    normalizedValues.contactChannel ? `Contact Channel: ${normalizedValues.contactChannel}` : '',
    `Source Type: ${normalizedValues.sourceType}`,
    `Brand: ${normalizedValues.brand}`,
    `Model / Product Name: ${normalizedValues.modelName}`,
    `Product Type: ${normalizedValues.productType}`,
    normalizedValues.unitPriceText ? `Unit Price (USD): ${normalizedValues.unitPriceText}` : '',
    `Available Qty: ${normalizedValues.availableQtyText}`,
    normalizedValues.moqText ? `MOQ: ${normalizedValues.moqText}` : '',
    `Target Market: ${normalizedValues.targetMarket}`,
    normalizedValues.marketAccessNote ? `Market Access Note:\n${normalizedValues.marketAccessNote}` : '',
    `Warehouse Location: ${normalizedValues.warehouseLocation}`,
    normalizedValues.puffText ? `Puff Count: ${normalizedValues.puffText}` : '',
    normalizedValues.nicotineText ? `Nicotine Strength: ${normalizedValues.nicotineText}` : '',
    normalizedValues.eLiquidText ? `E-liquid Capacity: ${normalizedValues.eLiquidText}` : '',
    normalizedValues.productionDateText ? `Production Date: ${normalizedValues.productionDateText}` : '',
    normalizedValues.flavorList ? `Flavor List: ${normalizedValues.flavorList}` : '',
    normalizedValues.flavorBreakdown ? `Flavor Breakdown:\n${normalizedValues.flavorBreakdown}` : '',
    normalizedValues.imageLinks ? `Image Links:\n${normalizedValues.imageLinks}` : '',
    normalizedValues.stockNotes ? `Stock Notes:\n${normalizedValues.stockNotes}` : '',
    normalizedValues.packagingNotes ? `Packaging Notes:\n${normalizedValues.packagingNotes}` : '',
    normalizedValues.extraNotes ? `Extra Notes:\n${normalizedValues.extraNotes}` : '',
    normalizedValues.internalNotes ? `Internal Notes:\n${normalizedValues.internalNotes}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function convertSubmissionToDraftSeed(values: SupplierSubmissionValues) {
  const normalizedValues = normalizeSupplierSubmissionValues(values)
  const title = buildSubmissionTitle(normalizedValues)
  const description = buildSubmissionDescription(normalizedValues)
  const imageList = getSubmissionImageList(normalizedValues.imageLinks)

  return {
    title,
    brand: normalizedValues.brand,
    productType: normalizedValues.productType,
    price: parseSubmissionNumber(normalizedValues.unitPriceText) ?? 0,
    quantity: parseSubmissionInteger(normalizedValues.availableQtyText) ?? 0,
    moq: parseSubmissionInteger(normalizedValues.moqText) ?? 1,
    market: normalizedValues.targetMarket,
    warehouseLocation: normalizedValues.warehouseLocation,
    description,
    imageUrl: imageList[0] ?? '',
    flavor: normalizedValues.flavorList,
    nicotine: normalizedValues.nicotineText,
    puff: parseSubmissionInteger(normalizedValues.puffText),
    eLiquid: normalizedValues.eLiquidText,
    productionDateText: normalizedValues.productionDateText,
  }
}

export function buildAiDraftPackageSeedFromSubmission(values: SupplierSubmissionValues) {
  const normalizedValues = normalizeSupplierSubmissionValues(values)
  const draftSeed = convertSubmissionToDraftSeed(normalizedValues)
  const imageList = getSubmissionImageList(normalizedValues.imageLinks)
  const draftPackage = createEmptyInventoryAiDraftPackage({
    sourceType: normalizedValues.sourceType === 'supplier_form' ? 'supplier_template' : 'other',
    supplierName: normalizedValues.supplierName || null,
    rawText: buildSubmissionRawText(normalizedValues),
  })

  draftPackage.normalizedFields.title = draftSeed.title
  draftPackage.normalizedFields.brand = draftSeed.brand
  draftPackage.normalizedFields.product_type = draftSeed.productType || 'Other'
  draftPackage.normalizedFields.price = normalizedValues.unitPriceText
  draftPackage.normalizedFields.quantity = normalizedValues.availableQtyText
  draftPackage.normalizedFields.moq = normalizedValues.moqText || '1'
  draftPackage.normalizedFields.market = normalizedValues.targetMarket
  draftPackage.normalizedFields.warehouse_location = normalizedValues.warehouseLocation
  draftPackage.normalizedFields.nicotine = normalizedValues.nicotineText
  draftPackage.normalizedFields.puff = normalizedValues.puffText
  draftPackage.normalizedFields.e_liquid = normalizedValues.eLiquidText
  draftPackage.normalizedFields.production_date_text = normalizedValues.productionDateText
  draftPackage.normalizedFields.images = imageList
  draftPackage.normalizedFields.flavor_tags = splitSubmissionFlavorTags(normalizedValues.flavorList)
  draftPackage.normalizedFields.flavor_breakdown = normalizedValues.flavorBreakdown
  draftPackage.normalizedFields.description_summary = normalizedValues.stockNotes
  draftPackage.normalizedFields.manifest_notes = buildSubmissionDescription(normalizedValues)
  draftPackage.missingFields = getSupplierSubmissionMissingRequiredFields(normalizedValues).map((field) =>
    formatSupplierSubmissionFieldLabel(field)
  )

  return draftPackage
}

export function buildRuleBasedAiDraftPackageFromSubmission(values: SupplierSubmissionValues) {
  const normalizedValues = normalizeSupplierSubmissionValues(values)
  const draftPackage = buildAiDraftPackageSeedFromSubmission(normalizedValues)
  const brandNamingRiskTerms = getBrandNamingRiskTerms(normalizedValues.brand)

  // 中文注释：这里先用规则型候选代替真实 LLM 输出，保证流程先跑通且可审查。
  if (!normalizedValues.unitPriceText.trim()) {
    draftPackage.riskFlags.push({
      code: 'price-missing',
      severity: 'medium',
      message: 'Unit price is still missing. Confirm pricing before moving the draft closer to publish.',
    })
    draftPackage.humanReviewFocus.push({
      field: 'price',
      reason: 'Add or confirm supplier price so the draft does not move forward with a zero-value placeholder.',
    })
  }

  if (!draftPackage.normalizedFields.images.length) {
    draftPackage.riskFlags.push({
      code: 'images-missing',
      severity: 'medium',
      message: 'No image links were provided. The downstream draft will still need real product images.',
    })
    draftPackage.humanReviewFocus.push({
      field: 'images',
      reason: 'Collect at least one valid image link before publish review.',
    })
  }

  if (
    !draftPackage.normalizedFields.flavor_tags.length &&
    !draftPackage.normalizedFields.flavor_breakdown.trim()
  ) {
    draftPackage.riskFlags.push({
      code: 'flavor-context-thin',
      severity: 'low',
      message: 'Flavor context is thin. Add flavor tags or a flavor breakdown if available.',
    })
    draftPackage.humanReviewFocus.push({
      field: 'flavor_breakdown',
      reason: 'Flavor detail is still weak and may reduce listing clarity for buyers.',
    })
  }

  if (
    draftPackage.normalizedFields.description_summary.trim().length < 40 &&
    draftPackage.normalizedFields.manifest_notes.trim().length < 80
  ) {
    draftPackage.riskFlags.push({
      code: 'description-context-thin',
      severity: 'medium',
      message: 'Operational notes are short. AI can only produce a thin draft without more stock context.',
    })
    draftPackage.humanReviewFocus.push({
      field: 'description',
      reason: 'Add more stock, packaging, or readiness notes before generating richer draft copy.',
    })
  }

  if (!normalizedValues.contactChannel.trim()) {
    draftPackage.humanReviewFocus.push({
      field: 'contact_visibility',
      reason: 'Supplier callback channel is empty. Keep traceability notes elsewhere before handoff.',
    })
  }

  if (brandNamingRiskTerms.length > 0) {
    draftPackage.riskFlags.push({
      code: 'brand-generic-terms',
      severity: 'low',
      message: `Brand still contains generic terms (${brandNamingRiskTerms.join(', ')}). Keep only the actual trademark name.`,
    })
    draftPackage.humanReviewFocus.push({
      field: 'brand',
      reason: 'Remove generic category words from brand and keep the real brand name only.',
    })
  }

  return draftPackage
}
