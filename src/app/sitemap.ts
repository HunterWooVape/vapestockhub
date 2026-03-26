import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { siteConfig } from '@/lib/site'

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

  // Define static category slugs for now (can be made dynamic later)
  const brands = ['vozol', 'elf-bar', 'geek-bar', 'lost-mary']
  const brandRoutes = brands.map((brand) => ({
    url: `${siteConfig.url}/brand/${brand}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
  routes.push(...brandRoutes)

  const markets = ['middle-east', 'latin-america', 'eastern-europe', 'north-america']
  const marketRoutes = markets.map((market) => ({
    url: `${siteConfig.url}/market/${market}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
  routes.push(...marketRoutes)

  return routes
}
