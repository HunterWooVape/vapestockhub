import { buildInventoryFacets, toSlug } from '@/lib/inventory'

export type InventoryMarketSource = {
  market?: string | null
  featured_markets?: string[] | null
}

export function getInventoryFeaturedMarkets(item: InventoryMarketSource) {
  const labels = new Map<string, string>()

  item.featured_markets?.forEach((value) => {
    const label = value?.trim()
    const slug = label ? toSlug(label) : ''

    if (!label || !slug || labels.has(slug)) {
      return
    }

    labels.set(slug, label)
  })

  const fallbackMarket = item.market?.trim()
  const fallbackSlug = fallbackMarket ? toSlug(fallbackMarket) : ''

  // 中文注释：Global 保留为“可售范围”语义，不直接进入 market SEO 聚合。
  if (labels.size === 0 && fallbackMarket && fallbackSlug && fallbackSlug !== 'global') {
    labels.set(fallbackSlug, fallbackMarket)
  }

  return Array.from(labels.values())
}

export function buildFeaturedMarketFacetsFromInventory(items: InventoryMarketSource[]) {
  return buildInventoryFacets(items.flatMap((item) => getInventoryFeaturedMarkets(item)))
}

export function resolveFeaturedMarketLabelBySlug(items: InventoryMarketSource[], slug: string) {
  if (!slug) {
    return null
  }

  return buildFeaturedMarketFacetsFromInventory(items).find((facet) => facet.slug === slug)?.label ?? null
}

export function inventoryTargetsFeaturedMarket(item: InventoryMarketSource, marketLabel: string) {
  const targetSlug = toSlug(marketLabel)

  if (!targetSlug) {
    return false
  }

  return getInventoryFeaturedMarkets(item).some((label) => toSlug(label) === targetSlug)
}
