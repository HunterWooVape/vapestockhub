import { MetadataRoute } from 'next'

import { blogArticles } from '@/lib/blog'
import { buildInventoryFacets, toSlug } from '@/lib/inventory'
import { buildFeaturedMarketFacetsFromInventory, inventoryTargetsFeaturedMarket } from '@/lib/inventory-markets'
import { siteConfig } from '@/lib/site'
import { getPublicInventory } from '@/lib/public-inventory'
import { getPriceTierItems, PRICE_TIER_SLUGS } from '@/lib/inventory-price'
import { TAXONOMY_INDEX_THRESHOLDS } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const inventory = await getPublicInventory()

  // Base static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteConfig.url}/inventory`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/market`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/brand`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/price`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/shipping-returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  const indexableBlogArticles = blogArticles.filter((article) => article.indexable)

  if (indexableBlogArticles.length > 0) {
    routes.push({
      url: `${siteConfig.url}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  routes.push(
    ...indexableBlogArticles.map((article) => ({
      url: `${siteConfig.url}/blog/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  )

  routes.push(...inventory.map((item) => ({
    url: `${siteConfig.url}/inventory/${item.slug}`,
    lastModified: new Date(item.updated_at || item.created_at),
    changeFrequency: item.status === 'sold' ? 'monthly' as const : 'weekly' as const,
    priority: 0.7,
  })))

  const brandFacets = buildInventoryFacets(inventory.map((item) => item.brand))
  for (const brand of brandFacets.filter((facet) => facet.count >= TAXONOMY_INDEX_THRESHOLDS.brand)) {
    const lastUpdate = inventory.filter((item) => toSlug(item.brand) === brand.slug)
      .map((item) => item.updated_at || item.created_at).sort().at(-1)
    routes.push({url:`${siteConfig.url}/brand/${brand.slug}`,lastModified:lastUpdate,changeFrequency:'weekly',priority:0.6})
  }

  const marketFacets = buildFeaturedMarketFacetsFromInventory(inventory)
  for (const market of marketFacets.filter((facet) => facet.count >= TAXONOMY_INDEX_THRESHOLDS.market)) {
    const lastUpdate = inventory.filter((item) => inventoryTargetsFeaturedMarket(item, market.label))
      .map((item) => item.updated_at || item.created_at).sort().at(-1)
    routes.push({url:`${siteConfig.url}/market/${market.slug}`,lastModified:lastUpdate,changeFrequency:'weekly',priority:0.6})
  }

  for (const slug of PRICE_TIER_SLUGS) {
    const items = getPriceTierItems(inventory, slug)
    if (items.length < TAXONOMY_INDEX_THRESHOLDS.price) continue
    const lastUpdate = items.map((item) => item.updated_at || item.created_at).sort().at(-1)
    routes.push({url:`${siteConfig.url}/price/${slug}`,lastModified:lastUpdate,changeFrequency:'weekly',priority:0.6})
  }

  return routes
}
