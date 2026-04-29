export type InventoryRecord = {
  id: string
  slug: string
  title: string
  brand: string
  product_type: string
  pricing_mode: 'exact_price' | 'inquiry_only'
  pricing_note: string | null
  description: string | null
  flavor: string | null
  nicotine: string | null
  puff: number | null
  e_liquid: string | null
  production_date_text: string | null
  price: number
  quantity: number
  moq: number
  market: string
  warehouse_location: string
  images: string[] | null
  status: 'draft' | 'active' | 'reserved' | 'sold' | 'expired'
  contact_visibility: 'public' | 'contact_required'
  is_featured: boolean | null
  is_urgent_clearance: boolean | null
  last_verified_at: string
  created_at: string
}

export type InventoryFacet = {
  label: string
  slug: string
  count: number
}

export function slugToLabel(slug: string) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getInventoryImageSrc(images: string[] | null | undefined) {
  const source = images?.[0]

  if (!source || source.includes('placehold.co')) {
    return '/images/inventory-placeholder.svg'
  }

  return source
}

export function buildInventoryImageAlt({
  title,
  brand,
  productType,
  hasRealImage,
}: {
  title: string
  brand: string
  productType: string
  hasRealImage: boolean
}) {
  if (!hasRealImage) {
    return ''
  }

  const normalizedTitle = title.trim()
  const normalizedBrand = brand.trim()
  const normalizedProductType = productType.trim()

  if (normalizedTitle) {
    return normalizedTitle
  }

  return [normalizedBrand, normalizedProductType, 'product image'].filter(Boolean).join(' ')
}

export function hasRealInventoryImage(images: string[] | null | undefined) {
  const source = images?.[0]
  return Boolean(source && !source.includes('placehold.co') && source !== '/images/inventory-placeholder.svg')
}

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildInventoryFacets(values: Array<string | null | undefined>) {
  const facetMap = new Map<string, InventoryFacet>()

  values.forEach((value) => {
    const label = value?.trim()

    if (!label) {
      return
    }

    const slug = toSlug(label)
    if (!slug) {
      return
    }

    const existingFacet = facetMap.get(slug)
    if (existingFacet) {
      existingFacet.count += 1
      return
    }

    facetMap.set(slug, {
      label,
      slug,
      count: 1,
    })
  })

  return Array.from(facetMap.values()).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count
    }

    return left.label.localeCompare(right.label)
  })
}

export function resolveFacetLabelBySlug(
  values: Array<string | null | undefined>,
  slug: string
) {
  if (!slug) {
    return null
  }

  return buildInventoryFacets(values).find((facet) => facet.slug === slug)?.label ?? null
}
