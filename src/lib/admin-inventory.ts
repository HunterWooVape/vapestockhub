import { pickPreferredDisplayValue } from '@/lib/inventory'
import { getImageFileNameRisk } from '@/lib/entry-standards'

export const placeholderInventoryImage = '/images/inventory-placeholder.svg'

export const productTypeOptions = [
  'Disposable Vape',
  'Vape Kits',
  'Pod System',
  'Pod Kit',
  'Pod',
  'E-liquid',
  'Device',
  'Accessory',
  'Other',
] as const

export const pricingModeOptions = [
  'exact_price',
  'inquiry_only',
] as const

export const pricingModeLabels = {
  exact_price: 'Exact Price',
  inquiry_only: 'Inquiry Only',
} as const

export function formatPricingModeLabel(mode: (typeof pricingModeOptions)[number]) {
  return pricingModeLabels[mode]
}

export const inventoryStatusOptions = [
  'draft',
  'active',
  'reserved',
  'sold',
  'expired',
] as const

export const inventoryStatusLabels = {
  draft: '草稿',
  active: '已发布',
  reserved: '已锁货',
  sold: '已售出',
  expired: '已过期',
} as const

export const inventoryStatusActionLabels = {
  draft: '退回草稿',
  active: '发布上线',
  reserved: '标记锁货',
  sold: '标记已售',
  expired: '标记过期',
} as const

export function formatInventoryStatusLabel(status: (typeof inventoryStatusOptions)[number]) {
  return inventoryStatusLabels[status]
}

export function formatInventoryStatusActionLabel(status: (typeof inventoryStatusOptions)[number]) {
  return inventoryStatusActionLabels[status]
}

export const contactVisibilityOptions = [
  'contact_required',
  'public',
] as const

const promotionalTitlePattern =
  /\b(best|cheap|cheapest|hot sale|hottest|premium deal|must buy|limited offer|top quality)\b/i
const genericBrandTermPattern = /\b(e-?liquid|vapes?|disposables?|pods?|devices?|kits?)\b/gi

export const inventoryQualityMessages = {
  'pricing-mode-required': 'Pricing mode is required before publishing.',
  'title-required': 'Title is required before publishing.',
  'brand-required': 'Brand is required before publishing.',
  'product-type-required': 'Product type is required before publishing.',
  'price-invalid': 'Price must be greater than 0 before publishing.',
  'quantity-invalid': 'Quantity must be greater than 0 before publishing.',
  'market-or-warehouse-required': 'Add at least one of market or warehouse location before publishing.',
  'slug-invalid': 'Slug must use lowercase letters, numbers, and hyphens only.',
  'description-required': 'Description is required before publishing.',
  'image-required': 'A valid image is required before publishing.',
  'placeholder-image': 'Replace the placeholder image before publishing.',
  'description-too-short': 'Description is very short and may feel weak for buyers and SEO.',
  'title-too-promotional': 'Title looks too promotional and should stay B2B inventory-focused.',
  'flavor-missing': 'Flavor is empty. Add flavor tags if they are available.',
  'image-recommended-inquiry-only': 'Inquiry-only listings can go live without images, but a real image is still strongly recommended.',
  'pricing-note-recommended-inquiry-only': 'Add a pricing note so buyers understand that live pricing will be confirmed on inquiry.',
  'moq-exceeds-quantity': 'MOQ is higher than quantity and may confuse buyers.',
  'brand-not-standard': 'Brand does not match an existing standard value yet.',
  'brand-contains-generic-terms': 'Brand includes generic product words like "vape" or "disposable". Review whether they are part of the real trademark before publishing.',
  'market-not-standard': 'Market does not match an existing standard value yet.',
  'image-file-name-risk': 'Recommended: use lowercase English words and hyphens for image filenames. Avoid spaces, %20, Chinese characters, and brackets.',
} as const

export type InventoryQualityCode = keyof typeof inventoryQualityMessages

export type InventoryFormValues = {
  title: string
  slug: string
  brand: string
  productType: string
  pricingMode: typeof pricingModeOptions[number]
  pricingNote: string
  price: number
  quantity: number
  moq: number
  market: string
  featuredMarkets: string[]
  marketAccessNote: string
  warehouseLocation: string
  description: string
  imageUrl: string
  contactVisibility: typeof contactVisibilityOptions[number]
  flavor: string
  nicotine: string
  puff: number | null
  eLiquid: string
  productionDateText: string
  isFeatured: boolean
  isUrgentClearance: boolean
  status: typeof inventoryStatusOptions[number]
}

export const aiDraftInputSourceOptions = [
  'supplier_template',
  'excel',
  'text',
  'chat',
  'other',
] as const

export const aiDraftRiskSeverityOptions = [
  'high',
  'medium',
  'low',
] as const

export const aiDraftReviewFieldOptions = [
  'title',
  'brand',
  'product_type',
  'price',
  'quantity',
  'moq',
  'market',
  'warehouse_location',
  'production_date_text',
  'flavor_breakdown',
  'description',
  'images',
  'contact_visibility',
] as const

export type AiDraftInputSource = typeof aiDraftInputSourceOptions[number]
export type AiDraftRiskSeverity = typeof aiDraftRiskSeverityOptions[number]
export type AiDraftReviewField = typeof aiDraftReviewFieldOptions[number]

export type InventoryAiDraftRawInput = {
  sourceType: AiDraftInputSource
  supplierName: string | null
  submittedAt: string | null
  sourceLabel: string | null
  rawText: string
}

export type InventoryAiDraftFieldSet = {
  title: string
  slug: string
  brand: string
  product_type: string
  pricing_mode: typeof pricingModeOptions[number]
  pricing_note: string
  price: string
  quantity: string
  moq: string
  market: string
  featured_markets: string[]
  market_access_note: string
  warehouse_location: string
  nicotine: string
  puff: string
  e_liquid: string
  production_date_text: string
  contact_visibility: typeof contactVisibilityOptions[number]
  images: string[]
  flavor_tags: string[]
  flavor_breakdown: string
  description_summary: string
  manifest_notes: string
}

export type InventoryAiDraftRiskFlag = {
  code: string
  severity: AiDraftRiskSeverity
  message: string
}

export type InventoryAiDraftReviewFocus = {
  field: AiDraftReviewField
  reason: string
}

export type InventoryAiDraftPackage = {
  version: 'v1'
  rawInput: InventoryAiDraftRawInput
  normalizedFields: InventoryAiDraftFieldSet
  missingFields: string[]
  riskFlags: InventoryAiDraftRiskFlag[]
  humanReviewFocus: InventoryAiDraftReviewFocus[]
}

export type InventoryAiPromptAsset = {
  version: 'v1'
  systemPrompt: string
  userPromptTemplate: string
  outputContract: string
}

export function isValidInventorySlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function isPlaceholderInventoryImage(imageUrl: string) {
  if (!imageUrl) {
    return true
  }

  return (
    imageUrl === placeholderInventoryImage ||
    imageUrl.includes('placehold.co') ||
    imageUrl.includes('inventory-placeholder.svg')
  )
}

export function normalizeKnownValue(value: string, knownValues: string[]) {
  const normalizedValue = value.trim()
  const matchedValues = knownValues.filter(
    (knownValue) => knownValue.trim().toLowerCase() === normalizedValue.toLowerCase()
  )

  if (matchedValues.length === 0) {
    return normalizedValue
  }

  if (matchedValues.some((knownValue) => knownValue.trim() === normalizedValue)) {
    return normalizedValue
  }

  const preferredKnownValue = pickPreferredDisplayValue(matchedValues)
  const knownValueIsAllLowercase =
    Boolean(preferredKnownValue) &&
    preferredKnownValue === preferredKnownValue.toLowerCase() &&
    preferredKnownValue !== preferredKnownValue.toUpperCase()
  const inputIsAllLowercase =
    normalizedValue === normalizedValue.toLowerCase() &&
    normalizedValue !== normalizedValue.toUpperCase()

  // 中文注释：当旧数据只剩全小写脏值，而操作者明确输入了更规范的大小写时，优先信任当前输入。
  if (knownValueIsAllLowercase && !inputIsAllLowercase) {
    return normalizedValue
  }

  return preferredKnownValue || normalizedValue
}

function normalizeGenericBrandTerm(term: string) {
  const lowerTerm = term.toLowerCase()

  if (lowerTerm === 'eliquid') {
    return 'e-liquid'
  }

  return lowerTerm
}

// 中文注释：品牌字段只保留真实商标名，这里轻量识别常见通用品类词，供后台提醒人工复核。
export function getBrandNamingRiskTerms(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return [] as string[]
  }

  return Array.from(
    new Set(
      Array.from(normalizedValue.matchAll(genericBrandTermPattern)).map((match) =>
        normalizeGenericBrandTerm(match[0])
      )
    )
  )
}

// 中文注释：这里只做软提醒，不强制删除命中的通用品类词，因为部分真实品牌名本身就会包含 vape / vapes。
export function getBrandNamingRiskHint(value: string) {
  const matchedTerms = getBrandNamingRiskTerms(value)

  if (matchedTerms.length === 0) {
    return ''
  }

  return `当前品牌命中了通用词：${matchedTerms.join('、')}。请人工确认这些词是否属于品牌商标本身；若本来就是正式品牌名，请保留原样，不要强删。`
}

const warehouseLocationAbbreviations = new Set([
  'UAE',
  'USA',
  'US',
  'UK',
  'EU',
  'KSA',
  'HK',
  'CN',
  'QC',
  'WH',
  'FTZ',
  'GMT',
])

function formatCompactNumber(value: string) {
  const parsedValue = Number.parseFloat(value)

  if (!Number.isFinite(parsedValue)) {
    return value
  }

  return String(parsedValue)
}

function toTitleCaseWord(value: string) {
  if (!/^[A-Za-z]+$/.test(value)) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

// 中文注释：仓库位置统一做轻量标准化，既保留原地名语义，也减少大小写和空格噪音。
export function normalizeWarehouseLocation(value: string) {
  const normalizedValue = value.trim().replace(/\s+/g, ' ')

  if (!normalizedValue) {
    return ''
  }

  return normalizedValue
    .split(/(\s+|,|\/|-|\(|\))/)
    .map((segment) => {
      if (!segment || /^(?:\s+|,|\/|-|\(|\))$/.test(segment)) {
        return segment
      }

      const upperSegment = segment.toUpperCase().replace(/\./g, '')
      if (warehouseLocationAbbreviations.has(upperSegment)) {
        return upperSegment
      }

      return toTitleCaseWord(segment)
    })
    .join('')
}

// 中文注释：Nicotine 纯数字默认补成百分比，其它常见单位只做轻量格式统一。
export function normalizeNicotineValue(value: string) {
  const normalizedValue = value.trim().replace(/\s+/g, ' ')

  if (!normalizedValue) {
    return ''
  }

  if (/^\d+(?:\.\d+)?$/.test(normalizedValue)) {
    return `${formatCompactNumber(normalizedValue)}%`
  }

  const percentMatch = normalizedValue.match(/^(\d+(?:\.\d+)?)\s*%$/)
  if (percentMatch) {
    return `${formatCompactNumber(percentMatch[1])}%`
  }

  const mgPerMlMatch = normalizedValue.match(/^(\d+(?:\.\d+)?)\s*mg\s*\/\s*ml$/i)
  if (mgPerMlMatch) {
    return `${formatCompactNumber(mgPerMlMatch[1])}mg/ml`
  }

  const mgMatch = normalizedValue.match(/^(\d+(?:\.\d+)?)\s*mg$/i)
  if (mgMatch) {
    return `${formatCompactNumber(mgMatch[1])}mg`
  }

  return normalizedValue
}

// 中文注释：烟油容量纯数字默认补 ml，已有 ml 只统一紧凑写法。
export function normalizeELiquidValue(value: string) {
  const normalizedValue = value.trim().replace(/\s+/g, ' ')

  if (!normalizedValue) {
    return ''
  }

  if (/^\d+(?:\.\d+)?$/.test(normalizedValue)) {
    return `${formatCompactNumber(normalizedValue)}ml`
  }

  const mlMatch = normalizedValue.match(/^(\d+(?:\.\d+)?)\s*ml$/i)
  if (mlMatch) {
    return `${formatCompactNumber(mlMatch[1])}ml`
  }

  return normalizedValue
}

export function getInventoryQualityReport(
  values: Pick<
    InventoryFormValues,
    | 'title'
    | 'slug'
    | 'brand'
    | 'productType'
    | 'pricingMode'
    | 'pricingNote'
    | 'price'
    | 'quantity'
    | 'moq'
    | 'market'
    | 'warehouseLocation'
    | 'description'
    | 'imageUrl'
    | 'contactVisibility'
    | 'flavor'
  >,
  options?: {
    knownBrands?: string[]
    knownMarkets?: string[]
  }
) {
  const blockingIssues: InventoryQualityCode[] = []
  const warnings: InventoryQualityCode[] = []
  const knownBrands = options?.knownBrands ?? []
  const knownMarkets = options?.knownMarkets ?? []

  if (!values.title.trim()) {
    blockingIssues.push('title-required')
  }

  if (!values.brand.trim()) {
    blockingIssues.push('brand-required')
  }

  if (getBrandNamingRiskTerms(values.brand).length > 0) {
    warnings.push('brand-contains-generic-terms')
  }

  if (!values.productType.trim()) {
    blockingIssues.push('product-type-required')
  }

  if (!values.pricingMode.trim()) {
    blockingIssues.push('pricing-mode-required')
  }

  if (values.pricingMode === 'exact_price' && values.price <= 0) {
    blockingIssues.push('price-invalid')
  }

  if (values.quantity <= 0) {
    blockingIssues.push('quantity-invalid')
  }

  if (!values.market.trim() && !values.warehouseLocation.trim()) {
    blockingIssues.push('market-or-warehouse-required')
  }

  if (!isValidInventorySlug(values.slug.trim())) {
    blockingIssues.push('slug-invalid')
  }

  if (!values.description.trim()) {
    blockingIssues.push('description-required')
  }

  if (!values.imageUrl.trim()) {
    if (values.pricingMode === 'inquiry_only') {
      warnings.push('image-recommended-inquiry-only')
    } else {
      blockingIssues.push('image-required')
    }
  } else if (isPlaceholderInventoryImage(values.imageUrl)) {
    if (values.pricingMode === 'inquiry_only') {
      warnings.push('image-recommended-inquiry-only')
    } else {
      blockingIssues.push('placeholder-image')
    }
  }

  if (values.imageUrl.trim() && getImageFileNameRisk(values.imageUrl)) {
    warnings.push('image-file-name-risk')
  }

  if (values.description.trim() && values.description.trim().length < 120) {
    warnings.push('description-too-short')
  }

  if (promotionalTitlePattern.test(values.title)) {
    warnings.push('title-too-promotional')
  }

  if (!values.flavor.trim()) {
    warnings.push('flavor-missing')
  }

  if (values.pricingMode === 'inquiry_only' && !values.pricingNote.trim()) {
    warnings.push('pricing-note-recommended-inquiry-only')
  }

  if (values.moq > 0 && values.quantity > 0 && values.moq > values.quantity) {
    warnings.push('moq-exceeds-quantity')
  }

  if (
    values.brand.trim() &&
    knownBrands.length > 0 &&
    !knownBrands.some((brand) => brand.trim().toLowerCase() === values.brand.trim().toLowerCase())
  ) {
    warnings.push('brand-not-standard')
  }

  if (
    values.market.trim() &&
    knownMarkets.length > 0 &&
    !knownMarkets.some((market) => market.trim().toLowerCase() === values.market.trim().toLowerCase())
  ) {
    warnings.push('market-not-standard')
  }

  return {
    blockingIssues,
    warnings,
  }
}

export function formatInventoryQualityMessage(code: string) {
  return inventoryQualityMessages[code as InventoryQualityCode] ?? 'Unknown admin validation issue.'
}

export function createEmptyInventoryAiDraftPackage(
  rawInput?: Partial<InventoryAiDraftRawInput>
): InventoryAiDraftPackage {
  return {
    version: 'v1',
    rawInput: {
      sourceType: rawInput?.sourceType ?? 'other',
      supplierName: rawInput?.supplierName ?? null,
      submittedAt: rawInput?.submittedAt ?? null,
      sourceLabel: rawInput?.sourceLabel ?? null,
      rawText: rawInput?.rawText ?? '',
    },
    normalizedFields: {
      title: '',
      slug: '',
      brand: '',
      product_type: 'Disposable Vape',
      pricing_mode: 'exact_price',
      pricing_note: '',
      price: '',
      quantity: '',
      moq: '1',
      market: '',
      featured_markets: [],
      market_access_note: '',
      warehouse_location: '',
      nicotine: '',
      puff: '',
      e_liquid: '',
      production_date_text: '',
      contact_visibility: 'contact_required',
      images: [],
      flavor_tags: [],
      flavor_breakdown: '',
      description_summary: '',
      manifest_notes: '',
    },
    missingFields: [],
    riskFlags: [],
    humanReviewFocus: [],
  }
}

export function getInventoryAiDraftPackageExample() {
  return JSON.stringify(createEmptyInventoryAiDraftPackage(), null, 2)
}

export function buildInventoryAiPromptAsset(options?: {
  knownBrands?: string[]
  knownMarkets?: string[]
  productTypes?: readonly string[]
}) {
  const knownBrands = options?.knownBrands?.filter(Boolean) ?? []
  const knownMarkets = options?.knownMarkets?.filter(Boolean) ?? []
  const productTypes = options?.productTypes ?? productTypeOptions
  const systemPrompt = [
    'You are the inventory-ingestion AI for VapeStockHub.',
    'Your job is to convert messy supplier inventory material into one AI Draft Package JSON object.',
    'The site is a B2B wholesale vape inventory marketplace focused on stock visibility and lead generation.',
    'Always write frontend-facing content in English.',
    'Use a B2B inventory tone, not a retail ecommerce tone.',
    'Be SEO-aware but truth-first.',
    'Do not invent brands, quantities, warehouses, flavors, or images that are not supported by the source.',
    'Do not use language such as retail shop, best deal, cheapest, must buy, hot sale, or other consumer-style promotion.',
    'Preserve ambiguity through missingFields, riskFlags, and humanReviewFocus instead of hallucinating.',
    `Allowed contact_visibility values: ${contactVisibilityOptions.join(', ')}.`,
    `Allowed pricing_mode values: ${pricingModeOptions.join(', ')}.`,
    `Preferred product_type values: ${productTypes.join(', ')}.`,
    knownBrands.length > 0 ? `Known brand references: ${knownBrands.join(', ')}.` : '',
    knownMarkets.length > 0 ? `Known market references: ${knownMarkets.join(', ')}.` : '',
    'description_summary should be a short English B2B stock summary.',
    'manifest_notes should preserve inventory detail, flavor split, packaging notes, or trade notes in factual English.',
    'flavor_tags are short tags for quick display.',
    'flavor_breakdown keeps detailed flavor-by-quantity information when available.',
    'Return JSON only. Do not wrap it in markdown fences.',
  ]
    .filter(Boolean)
    .join('\n')

  const userPromptTemplate = [
    'Convert the following raw supplier material into one AI Draft Package JSON object.',
    'If a field is uncertain, leave the field empty when appropriate and explain the uncertainty in riskFlags or humanReviewFocus.',
    'Always preserve the original source context in rawInput.',
    '',
    'Raw supplier material:',
    '{{RAW_INPUT}}',
    '',
    'Known brand references:',
    knownBrands.length > 0 ? knownBrands.join(', ') : 'None provided',
    '',
    'Known market references:',
    knownMarkets.length > 0 ? knownMarkets.join(', ') : 'None provided',
  ].join('\n')

  const outputContract = [
    'Output must be one JSON object with this structure:',
    getInventoryAiDraftPackageExample(),
    'Field rules:',
    '- version must be "v1".',
    '- rawInput.rawText must contain the original source text.',
    '- normalizedFields.title, brand, market, and product_type should be filled when the source supports them.',
    '- normalizedFields.pricing_mode must be exact_price or inquiry_only.',
    '- normalizedFields.contact_visibility must be contact_required or public.',
    '- missingFields is an array of field names that are still absent.',
    '- riskFlags contains factual risk notes with severity high, medium, or low.',
    '- humanReviewFocus contains fields the admin should check first and why.',
  ].join('\n')

  return {
    version: 'v1' as const,
    systemPrompt,
    userPromptTemplate,
    outputContract,
  } satisfies InventoryAiPromptAsset
}

export function buildInventoryAiPromptInput(rawInput: string) {
  return rawInput.trim()
}

export function renderInventoryAiUserPrompt(
  promptAsset: InventoryAiPromptAsset,
  rawInput: string
) {
  return promptAsset.userPromptTemplate.replace('{{RAW_INPUT}}', buildInventoryAiPromptInput(rawInput))
}

export function buildInventoryDescriptionFromDraftPackage(
  draftPackage: Pick<InventoryAiDraftPackage, 'normalizedFields'>
) {
  const sections = [
    draftPackage.normalizedFields.description_summary.trim(),
    draftPackage.normalizedFields.manifest_notes.trim(),
  ].filter(Boolean)

  return sections.join('\n\n')
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getNullableStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function getStringArrayValue(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : []
}

export function parseInventoryAiDraftPackage(input: string):
  | { success: true; draftPackage: InventoryAiDraftPackage }
  | { success: false; errors: string[] } {
  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(input)
  } catch {
    return {
      success: false,
      errors: ['AI Draft Package must be valid JSON.'],
    }
  }

  if (!isPlainObject(parsedValue)) {
    return {
      success: false,
      errors: ['AI Draft Package root value must be a JSON object.'],
    }
  }

  const rawInput = isPlainObject(parsedValue.rawInput) ? parsedValue.rawInput : {}
  const normalizedFields = isPlainObject(parsedValue.normalizedFields) ? parsedValue.normalizedFields : {}
  const riskFlagsInput = Array.isArray(parsedValue.riskFlags) ? parsedValue.riskFlags : []
  const reviewFocusInput = Array.isArray(parsedValue.humanReviewFocus) ? parsedValue.humanReviewFocus : []
  const missingFields = getStringArrayValue(parsedValue.missingFields)

  const sourceType = aiDraftInputSourceOptions.includes(rawInput.sourceType as AiDraftInputSource)
    ? (rawInput.sourceType as AiDraftInputSource)
    : 'other'

  const contactVisibility = contactVisibilityOptions.includes(
    normalizedFields.contact_visibility as typeof contactVisibilityOptions[number]
  )
    ? (normalizedFields.contact_visibility as typeof contactVisibilityOptions[number])
    : 'contact_required'
  const pricingMode = pricingModeOptions.includes(
    normalizedFields.pricing_mode as typeof pricingModeOptions[number]
  )
    ? (normalizedFields.pricing_mode as typeof pricingModeOptions[number])
    : 'exact_price'

  const draftPackage: InventoryAiDraftPackage = {
    version: parsedValue.version === 'v1' ? 'v1' : 'v1',
    rawInput: {
      sourceType,
      supplierName: getNullableStringValue(rawInput.supplierName),
      submittedAt: getNullableStringValue(rawInput.submittedAt),
      sourceLabel: getNullableStringValue(rawInput.sourceLabel),
      rawText: getStringValue(rawInput.rawText),
    },
    normalizedFields: {
      title: getStringValue(normalizedFields.title),
      slug: getStringValue(normalizedFields.slug),
      brand: getStringValue(normalizedFields.brand),
      product_type: getStringValue(normalizedFields.product_type) || 'Disposable Vape',
      pricing_mode: pricingMode,
      pricing_note: getStringValue(normalizedFields.pricing_note),
      price: getStringValue(normalizedFields.price),
      quantity: getStringValue(normalizedFields.quantity),
      moq: getStringValue(normalizedFields.moq) || '1',
      market: getStringValue(normalizedFields.market),
      featured_markets: getStringArrayValue(normalizedFields.featured_markets),
      market_access_note: getStringValue(normalizedFields.market_access_note),
      warehouse_location: getStringValue(normalizedFields.warehouse_location),
      nicotine: getStringValue(normalizedFields.nicotine),
      puff: getStringValue(normalizedFields.puff),
      e_liquid: getStringValue(normalizedFields.e_liquid),
      production_date_text: getStringValue(normalizedFields.production_date_text),
      contact_visibility: contactVisibility,
      images: getStringArrayValue(normalizedFields.images),
      flavor_tags: getStringArrayValue(normalizedFields.flavor_tags),
      flavor_breakdown: getStringValue(normalizedFields.flavor_breakdown),
      description_summary: getStringValue(normalizedFields.description_summary),
      manifest_notes: getStringValue(normalizedFields.manifest_notes),
    },
    missingFields,
    riskFlags: riskFlagsInput
      .filter(isPlainObject)
      .map((item) => ({
        code: getStringValue(item.code),
        severity: aiDraftRiskSeverityOptions.includes(item.severity as AiDraftRiskSeverity)
          ? (item.severity as AiDraftRiskSeverity)
          : 'medium',
        message: getStringValue(item.message),
      }))
      .filter((item) => item.code || item.message),
    humanReviewFocus: reviewFocusInput
      .filter(isPlainObject)
      .map((item) => ({
        field: aiDraftReviewFieldOptions.includes(item.field as AiDraftReviewField)
          ? (item.field as AiDraftReviewField)
          : 'description',
        reason: getStringValue(item.reason),
      }))
      .filter((item) => item.reason),
  }

  const errors: string[] = []

  if (!draftPackage.normalizedFields.title.trim()) {
    errors.push('normalizedFields.title is required.')
  }

  if (!draftPackage.normalizedFields.brand.trim()) {
    errors.push('normalizedFields.brand is required.')
  }

  if (!draftPackage.normalizedFields.product_type.trim()) {
    errors.push('normalizedFields.product_type is required.')
  }

  if (!draftPackage.normalizedFields.market.trim()) {
    errors.push('normalizedFields.market is required.')
  }

  if (!draftPackage.rawInput.rawText.trim()) {
    errors.push('rawInput.rawText is required.')
  }

  if (
    !draftPackage.normalizedFields.description_summary.trim() &&
    !draftPackage.normalizedFields.manifest_notes.trim()
  ) {
    errors.push('At least one of description_summary or manifest_notes is required.')
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    }
  }

  return {
    success: true,
    draftPackage,
  }
}

export function convertAiDraftPackageToInventoryDraft(
  draftPackage: InventoryAiDraftPackage
): Partial<InventoryFormValues> {
  return {
    title: draftPackage.normalizedFields.title.trim(),
    slug: draftPackage.normalizedFields.slug.trim(),
    brand: draftPackage.normalizedFields.brand.trim(),
    productType: draftPackage.normalizedFields.product_type.trim(),
    pricingMode: draftPackage.normalizedFields.pricing_mode,
    pricingNote: draftPackage.normalizedFields.pricing_note.trim(),
    price: Number(draftPackage.normalizedFields.price) || 0,
    quantity: Number(draftPackage.normalizedFields.quantity) || 0,
    moq: Number(draftPackage.normalizedFields.moq) || 1,
    market: draftPackage.normalizedFields.market.trim(),
    featuredMarkets: draftPackage.normalizedFields.featured_markets,
    marketAccessNote: draftPackage.normalizedFields.market_access_note.trim(),
    warehouseLocation: normalizeWarehouseLocation(draftPackage.normalizedFields.warehouse_location),
    description: buildInventoryDescriptionFromDraftPackage(draftPackage),
    imageUrl: draftPackage.normalizedFields.images[0] ?? '',
    contactVisibility: draftPackage.normalizedFields.contact_visibility,
    flavor: draftPackage.normalizedFields.flavor_tags.join(', '),
    nicotine: normalizeNicotineValue(draftPackage.normalizedFields.nicotine),
    puff: Number(draftPackage.normalizedFields.puff) || null,
    eLiquid: normalizeELiquidValue(draftPackage.normalizedFields.e_liquid),
    productionDateText: draftPackage.normalizedFields.production_date_text.trim(),
    isFeatured: false,
    isUrgentClearance: false,
    status: 'draft',
  }
}
