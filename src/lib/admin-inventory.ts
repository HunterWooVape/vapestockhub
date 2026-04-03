export const placeholderInventoryImage = '/images/inventory-placeholder.svg'

export const productTypeOptions = [
  'Disposable',
  'Pod System',
  'Pod',
  'E-liquid',
  'Device',
  'Accessory',
  'Other',
] as const

export const inventoryStatusOptions = [
  'draft',
  'active',
  'reserved',
  'sold',
  'expired',
] as const

export const contactVisibilityOptions = [
  'contact_required',
  'public',
] as const

const promotionalTitlePattern =
  /\b(best|cheap|cheapest|hot sale|hottest|premium deal|must buy|limited offer|top quality)\b/i

export const inventoryQualityMessages = {
  'title-required': 'Title is required before publishing.',
  'brand-required': 'Brand is required before publishing.',
  'product-type-required': 'Product type is required before publishing.',
  'price-invalid': 'Price must be greater than 0 before publishing.',
  'quantity-invalid': 'Quantity must be greater than 0 before publishing.',
  'market-required': 'Market is required before publishing.',
  'warehouse-required': 'Warehouse location is required before publishing.',
  'slug-invalid': 'Slug must use lowercase letters, numbers, and hyphens only.',
  'description-required': 'Description is required before publishing.',
  'image-required': 'A valid image is required before publishing.',
  'placeholder-image': 'Replace the placeholder image before publishing.',
  'description-too-short': 'Description is very short and may feel weak for buyers and SEO.',
  'title-too-promotional': 'Title looks too promotional and should stay B2B inventory-focused.',
  'flavor-missing': 'Flavor is empty. Add flavor tags if they are available.',
  'moq-exceeds-quantity': 'MOQ is higher than quantity and may confuse buyers.',
  'brand-not-standard': 'Brand does not match an existing standard value yet.',
  'market-not-standard': 'Market does not match an existing standard value yet.',
} as const

export type InventoryQualityCode = keyof typeof inventoryQualityMessages

export type InventoryFormValues = {
  title: string
  slug: string
  brand: string
  productType: string
  price: number
  quantity: number
  moq: number
  market: string
  warehouseLocation: string
  description: string
  imageUrl: string
  contactVisibility: typeof contactVisibilityOptions[number]
  flavor: string
  nicotine: string
  puff: number | null
  eLiquid: string
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
  price: string
  quantity: string
  moq: string
  market: string
  warehouse_location: string
  nicotine: string
  puff: string
  e_liquid: string
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
  const matchedValue = knownValues.find(
    (knownValue) => knownValue.trim().toLowerCase() === normalizedValue.toLowerCase()
  )

  return matchedValue ?? normalizedValue
}

export function getInventoryQualityReport(
  values: Pick<
    InventoryFormValues,
    | 'title'
    | 'slug'
    | 'brand'
    | 'productType'
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

  if (!values.productType.trim()) {
    blockingIssues.push('product-type-required')
  }

  if (values.price <= 0) {
    blockingIssues.push('price-invalid')
  }

  if (values.quantity <= 0) {
    blockingIssues.push('quantity-invalid')
  }

  if (!values.market.trim()) {
    blockingIssues.push('market-required')
  }

  if (!values.warehouseLocation.trim()) {
    blockingIssues.push('warehouse-required')
  }

  if (!isValidInventorySlug(values.slug.trim())) {
    blockingIssues.push('slug-invalid')
  }

  if (!values.description.trim()) {
    blockingIssues.push('description-required')
  }

  if (!values.imageUrl.trim()) {
    blockingIssues.push('image-required')
  } else if (isPlaceholderInventoryImage(values.imageUrl)) {
    blockingIssues.push('placeholder-image')
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
      product_type: 'Disposable',
      price: '',
      quantity: '',
      moq: '1',
      market: '',
      warehouse_location: '',
      nicotine: '',
      puff: '',
      e_liquid: '',
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

export function buildInventoryDescriptionFromDraftPackage(
  draftPackage: Pick<InventoryAiDraftPackage, 'normalizedFields'>
) {
  const sections = [
    draftPackage.normalizedFields.description_summary.trim(),
    draftPackage.normalizedFields.manifest_notes.trim(),
  ].filter(Boolean)

  return sections.join('\n\n')
}

export function convertAiDraftPackageToInventoryDraft(
  draftPackage: InventoryAiDraftPackage
): Partial<InventoryFormValues> {
  return {
    title: draftPackage.normalizedFields.title.trim(),
    slug: draftPackage.normalizedFields.slug.trim(),
    brand: draftPackage.normalizedFields.brand.trim(),
    productType: draftPackage.normalizedFields.product_type.trim(),
    price: Number(draftPackage.normalizedFields.price) || 0,
    quantity: Number(draftPackage.normalizedFields.quantity) || 0,
    moq: Number(draftPackage.normalizedFields.moq) || 1,
    market: draftPackage.normalizedFields.market.trim(),
    warehouseLocation: draftPackage.normalizedFields.warehouse_location.trim(),
    description: buildInventoryDescriptionFromDraftPackage(draftPackage),
    imageUrl: draftPackage.normalizedFields.images[0] ?? '',
    contactVisibility: draftPackage.normalizedFields.contact_visibility,
    flavor: draftPackage.normalizedFields.flavor_tags.join(', '),
    nicotine: draftPackage.normalizedFields.nicotine.trim(),
    puff: Number(draftPackage.normalizedFields.puff) || null,
    eLiquid: draftPackage.normalizedFields.e_liquid.trim(),
    isFeatured: false,
    isUrgentClearance: false,
    status: 'draft',
  }
}
