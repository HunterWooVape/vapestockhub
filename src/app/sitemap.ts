import { MetadataRoute } from 'next'

import { blogArticles } from '@/lib/blog'
import { buildInventoryFacets } from '@/lib/inventory'
import { buildFeaturedMarketFacetsFromInventory, inventoryTargetsFeaturedMarket } from '@/lib/inventory-markets'
import { siteConfig } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

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

  // Fetch all active inventory slugs
  const { data: inventory } = await supabase
    .from('inventory')
    .select('slug, updated_at')
    .eq('status', 'active')

  if (inventory) {
    const inventoryRoutes = inventory.map((item) => ({
      url: `${siteConfig.url}/inventory/${item.slug}`,
      lastModified: new Date(item.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
    routes.push(...inventoryRoutes)
  }

  const { data: brandInventory } = await supabase
    .from('inventory')
    .select('brand, updated_at')
    .eq('status', 'active')

  if (brandInventory) {
    const brandFacets = buildInventoryFacets(brandInventory.map((item) => item.brand))
    const brandRoutes = brandFacets
      .filter((brand) => brand.count >= 3)
      .map((brand) => {
        const latestUpdate = brandInventory
          .filter((item) => item.brand === brand.label)
          .map((item) => item.updated_at)
          .filter(Boolean)
          .sort()
          .at(-1)

        return {
          url: `${siteConfig.url}/brand/${brand.slug}`,
          lastModified: latestUpdate ? new Date(latestUpdate) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }
      })

    routes.push(...brandRoutes)
  }

  const { data: marketInventory } = await supabase
    .from('inventory')
    .select('market, featured_markets, updated_at')
    .eq('status', 'active')

  if (marketInventory) {
    const marketFacets = buildFeaturedMarketFacetsFromInventory(marketInventory)
    const marketRoutes = marketFacets
      .filter((market) => market.count >= 3)
      .map((market) => {
        const latestUpdate = marketInventory
          .filter((item) => inventoryTargetsFeaturedMarket(item, market.label))
          .map((item) => item.updated_at)
          .filter(Boolean)
          .sort()
          .at(-1)

        return {
          url: `${siteConfig.url}/market/${market.slug}`,
          lastModified: latestUpdate ? new Date(latestUpdate) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }
      })

    routes.push(...marketRoutes)
  }

  return routes
}
