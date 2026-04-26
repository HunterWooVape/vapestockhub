export type InventoryRecord = {
  id: string
  slug: string
  title: string
  brand: string
  product_type: string
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

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
