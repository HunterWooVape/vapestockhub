import type { PublicInventoryRecord } from '@/lib/inventory'
import { hasPublicPrice } from '@/lib/inventory-lifecycle'

export const PRICE_TIER_SLUGS = ['under-3', '3-to-5', '5-to-8', 'over-8'] as const

export function getPriceTierItems(items: PublicInventoryRecord[], slug: string) {
  return items.filter((item) => {
    if (!hasPublicPrice(item) || item.price === null) return false
    switch (slug) {
      case 'under-3': return item.price <= 3
      case '3-to-5': return item.price >= 3 && item.price <= 5
      case '5-to-8': return item.price >= 5 && item.price <= 8
      case 'over-8': return item.price > 8
      default: return false
    }
  })
}
