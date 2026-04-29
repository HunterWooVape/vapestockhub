import { createClient } from '@/lib/supabase/server'
import InventoryCard from '@/components/inventory/InventoryCard'
import { buildInventoryFacets, InventoryRecord, resolveFacetLabelBySlug } from '@/lib/inventory'
import Link from 'next/link'
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/site'

type InventorySearchParams = {
  [key: string]: string | string[] | undefined
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getPageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(getSingleParam(value) || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function buildInventoryHref({
  brand,
  market,
  sort,
  page,
}: {
  brand?: string
  market?: string
  sort?: string
  page?: number
}) {
  const searchParams = new URLSearchParams()

  if (brand) {
    searchParams.set('brand', brand)
  }

  if (market) {
    searchParams.set('market', market)
  }

  if (sort && sort !== 'newest') {
    searchParams.set('sort', sort)
  }

  if (page && page > 1) {
    searchParams.set('page', page.toString())
  }

  const query = searchParams.toString()
  return query ? `/inventory?${query}` : '/inventory'
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<InventorySearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  const hasQueryModifiers = Boolean(
    getSingleParam(params.brand) ||
    getSingleParam(params.market) ||
    getSingleParam(params.sort) ||
    getPageNumber(params.page) > 1
  )

  return {
    title: 'Active Wholesale Vape Inventory | VapeStockHub',
    description: 'Browse verified active wholesale vape listings by brand, market, and price range. Move quickly from inventory discovery to direct inquiry.',
    alternates: {
      canonical: `${siteConfig.url}/inventory`,
    },
    robots: {
      index: !hasQueryModifiers,
      follow: true,
    },
  }
}

const ITEMS_PER_PAGE = 12

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<InventorySearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: facetOptions } = await supabase
    .from('inventory')
    .select('brand, market')
    .eq('status', 'active')

  const brandSlug = getSingleParam(params.brand)
  const marketSlug = getSingleParam(params.market)
  const sort = getSingleParam(params.sort)
  const page = getPageNumber(params.page)

  const availableBrands = buildInventoryFacets((facetOptions ?? []).map((item) => item.brand))
  const availableMarkets = buildInventoryFacets((facetOptions ?? []).map((item) => item.market))
  const brand = brandSlug
    ? resolveFacetLabelBySlug((facetOptions ?? []).map((item) => item.brand), brandSlug) ?? undefined
    : undefined
  const market = marketSlug
    ? resolveFacetLabelBySlug((facetOptions ?? []).map((item) => item.market), marketSlug) ?? undefined
    : undefined

  let query = supabase
    .from('inventory')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  if (brand) {
    query = query.eq('brand', brand)
  }

  if (market) {
    query = query.eq('market', market)
  }

  if (sort === 'price_asc') {
    query = query
      .order('pricing_mode', { ascending: true })
      .order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query
      .order('pricing_mode', { ascending: true })
      .order('price', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1
  query = query.range(from, to)

  const { data: inventory, count, error } = await query

  if (error) {
    console.error('Error fetching inventory:', error)
  }

  const items = (inventory ?? []) as InventoryRecord[]
  const totalItems = count ?? 0
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / ITEMS_PER_PAGE) : 1
  const newestHref = buildInventoryHref({ brand: brandSlug, market: marketSlug })
  const priceAscHref = buildInventoryHref({ brand: brandSlug, market: marketSlug, sort: 'price_asc' })
  const clearFiltersHref = '/inventory'
  const clearBrandHref = buildInventoryHref({ market: marketSlug, sort })
  const clearMarketHref = buildInventoryHref({ brand: brandSlug, sort })

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 shrink-0 space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Filters</h2>

          {(brand || market) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {brand && (
                <span className="text-xs bg-surface border border-border px-2 py-1 rounded-md flex items-center gap-1">
                  Brand: {brand}
                  <Link href={clearBrandHref} className="text-muted hover:text-foreground ml-1">×</Link>
                </span>
              )}
              {market && (
                <span className="text-xs bg-surface border border-border px-2 py-1 rounded-md flex items-center gap-1">
                  Market: {market}
                  <Link href={clearMarketHref} className="text-muted hover:text-foreground ml-1">×</Link>
                </span>
              )}
              <Link href={clearFiltersHref} className="text-xs text-teal-DEFAULT hover:underline py-1">Clear all</Link>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Top Brands</h3>
              <ul className="space-y-2">
                {availableBrands.slice(0, 8).map((facet) => (
                  <li key={facet.slug}>
                    <Link
                      href={buildInventoryHref({ brand: facet.slug, market: marketSlug, sort })}
                      className={`text-sm hover:text-teal-DEFAULT ${brandSlug === facet.slug ? 'text-teal-DEFAULT font-bold' : ''}`}
                    >
                      {facet.label} ({facet.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Top Markets</h3>
              <ul className="space-y-2">
                {availableMarkets.slice(0, 8).map((facet) => (
                  <li key={facet.slug}>
                    <Link
                      href={buildInventoryHref({ brand: brandSlug, market: facet.slug, sort })}
                      className={`text-sm hover:text-teal-DEFAULT ${marketSlug === facet.slug ? 'text-teal-DEFAULT font-bold' : ''}`}
                    >
                      {facet.label} ({facet.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-bold">Browse Active Wholesale Vape Inventory</h1>
          <p className="text-muted mt-3 max-w-3xl">
            Explore verified wholesale vape listings across brands, markets, and price ranges. Use filters to find active stock and move quickly into product-level inquiries.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-border pb-4">
          <div>
            <p className="text-lg font-semibold">{totalItems} Active Listings</p>
            <p className="text-sm text-muted mt-1">Use filters to narrow inventory by brand or target market before opening product-level inquiries.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted">Sort by:</span>
            <div className="flex gap-2">
              <Link href={newestHref} className={`text-sm px-3 py-1 rounded-md border ${!sort || sort === 'newest' ? 'bg-surface border-teal-DEFAULT text-teal-DEFAULT' : 'border-border hover:bg-surface'}`}>Newest</Link>
              <Link href={priceAscHref} className={`text-sm px-3 py-1 rounded-md border ${sort === 'price_asc' ? 'bg-surface border-teal-DEFAULT text-teal-DEFAULT' : 'border-border hover:bg-surface'}`}>Price: Low to High</Link>
            </div>
          </div>
        </div>

        {items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <InventoryCard key={item.id} item={item} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pt-8 border-t border-border">
                {page > 1 && (
                  <Link
                    href={buildInventoryHref({ brand: brandSlug, market: marketSlug, sort, page: page - 1 })}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-muted px-4">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildInventoryHref({ brand: brandSlug, market: marketSlug, sort, page: page + 1 })}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-surface rounded-xl border border-border">
            <h3 className="text-lg font-bold mb-2">No inventory found</h3>
            <p className="text-muted mb-6">Adjust your filters or return to the full inventory index to review all active listings.</p>
            <Link href={clearFiltersHref} className="px-6 py-2 bg-teal-DEFAULT text-background rounded-lg font-medium hover:bg-teal-hover transition-colors">
              Clear Filters
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
