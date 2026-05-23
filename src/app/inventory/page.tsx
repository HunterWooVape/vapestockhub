import { createClient } from '@/lib/supabase/server'
import InventoryCard from '@/components/inventory/InventoryCard'
import {
  buildInventoryFacets,
  InventoryRecord,
  resolveFacetLabelBySlug,
} from '@/lib/inventory'
import {
  buildFeaturedMarketFacetsFromInventory,
  inventoryTargetsFeaturedMarket,
  resolveFeaturedMarketLabelBySlug,
} from '@/lib/inventory-markets'
import Link from 'next/link'
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/site'

type InventorySearchParams = {
  [key: string]: string | string[] | undefined
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeSearchQuery(value: string | string[] | undefined) {
  return getSingleParam(value)?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? ''
}

function getPageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(getSingleParam(value) || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function buildInventoryHref({
  q,
  brand,
  market,
  sort,
  page,
}: {
  q?: string
  brand?: string
  market?: string
  sort?: string
  page?: number
}) {
  const searchParams = new URLSearchParams()

  if (q) {
    searchParams.set('q', q)
  }

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

// 中文注释：首版搜索用轻量关键词匹配，优先覆盖买家最常搜的字段，不引入复杂相关度系统。
function inventoryMatchesSearchQuery(item: InventoryRecord, searchQuery: string) {
  if (!searchQuery) {
    return true
  }

  const queryTokens = searchQuery
    .toLowerCase()
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)

  if (queryTokens.length === 0) {
    return true
  }

  const haystack = [
    item.title,
    item.brand,
    item.product_type,
    item.flavor,
    item.market,
    item.warehouse_location,
    item.pricing_note,
    ...(item.featured_markets ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return queryTokens.every((token) => haystack.includes(token))
}

function FacetList({
  title,
  items,
  activeSlug,
  buildHref,
  emptyLabel,
}: {
  title: string
  items: Array<{ label: string; slug: string; count: number }>
  activeSlug?: string
  buildHref: (slug: string) => string
  emptyLabel: string
}) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-muted mb-3">{title}</h3>
        <p className="text-sm text-muted">{emptyLabel}</p>
      </div>
    )
  }

  const primaryItems = items.slice(0, 8)
  const secondaryItems = items.slice(8)

  const renderFacetLinks = (facets: Array<{ label: string; slug: string; count: number }>) => (
    <ul className="space-y-2">
      {facets.map((facet) => (
        <li key={facet.slug}>
          <Link
            href={buildHref(facet.slug)}
            className={`text-sm hover:text-teal-DEFAULT ${activeSlug === facet.slug ? 'text-teal-DEFAULT font-bold' : ''}`}
          >
            {facet.label} ({facet.count})
          </Link>
        </li>
      ))}
    </ul>
  )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-muted">{title}</h3>
        <span className="text-[11px] text-muted">{items.length}</span>
      </div>
      {renderFacetLinks(primaryItems)}
      {secondaryItems.length > 0 ? (
        <details className="mt-3">
          <summary className="list-none cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-teal-DEFAULT hover:border-teal-DEFAULT/40 hover:text-teal-hover">
            View all {title.toLowerCase()} ({items.length})
          </summary>
          <div className="mt-3 border-t border-border pt-3">
            {renderFacetLinks(secondaryItems)}
          </div>
        </details>
      ) : null}
    </div>
  )
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<InventorySearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  const hasQueryModifiers = Boolean(
    normalizeSearchQuery(params.q) ||
    getSingleParam(params.brand) ||
    getSingleParam(params.market) ||
    getSingleParam(params.sort) ||
    getPageNumber(params.page) > 1
  )

  return {
    title: 'Active Wholesale Disposable Vape Inventory | VapeStockHub',
    description: 'Browse verified wholesale disposable vape listings by brand, market, and price band. Review MOQ, stock level, and inquiry options before buying vapes in bulk.',
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
    .select('brand, market, featured_markets')
    .eq('status', 'active')

  const searchQuery = normalizeSearchQuery(params.q)
  const brandSlug = getSingleParam(params.brand)
  const marketSlug = getSingleParam(params.market)
  const sort = getSingleParam(params.sort)
  const page = getPageNumber(params.page)

  const availableBrands = buildInventoryFacets((facetOptions ?? []).map((item) => item.brand))
  const availableMarkets = buildFeaturedMarketFacetsFromInventory(facetOptions ?? [])
  const brand = brandSlug
    ? resolveFacetLabelBySlug((facetOptions ?? []).map((item) => item.brand), brandSlug) ?? undefined
    : undefined
  const market = marketSlug
    ? resolveFeaturedMarketLabelBySlug(facetOptions ?? [], marketSlug) ?? undefined
    : undefined

  let query = supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')

  if (brand) {
    query = query.eq('brand', brand)
  }

  const { data: inventory, error } = await query

  if (error) {
    console.error('Error fetching inventory:', error)
  }

  const filteredItems = ((inventory ?? []) as InventoryRecord[])
    .filter((item) => inventoryMatchesSearchQuery(item, searchQuery))
    .filter((item) => (market ? inventoryTargetsFeaturedMarket(item, market) : true))
    .sort((left, right) => {
      if (sort === 'price_asc') {
        if (left.pricing_mode !== right.pricing_mode) {
          return left.pricing_mode.localeCompare(right.pricing_mode)
        }

        return left.price - right.price
      }

      if (sort === 'price_desc') {
        if (left.pricing_mode !== right.pricing_mode) {
          return left.pricing_mode.localeCompare(right.pricing_mode)
        }

        return right.price - left.price
      }

      return right.created_at.localeCompare(left.created_at)
    })

  const totalItems = filteredItems.length
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / ITEMS_PER_PAGE) : 1
  const currentPage = Math.min(page, totalPages)
  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const items = filteredItems.slice(from, from + ITEMS_PER_PAGE)
  const newestHref = buildInventoryHref({ q: searchQuery, brand: brandSlug, market: marketSlug })
  const priceAscHref = buildInventoryHref({ q: searchQuery, brand: brandSlug, market: marketSlug, sort: 'price_asc' })
  const clearFiltersHref = '/inventory'
  const clearBrandHref = buildInventoryHref({ q: searchQuery, market: marketSlug, sort })
  const clearMarketHref = buildInventoryHref({ q: searchQuery, brand: brandSlug, sort })
  const clearSearchHref = buildInventoryHref({ brand: brandSlug, market: marketSlug, sort })

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 shrink-0 space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Filters</h2>
          <p className="text-sm text-muted mb-6">
            Filter live wholesale inventory by brand and market before opening product-level inquiries.
          </p>

          {(searchQuery || brand || market) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {searchQuery && (
                <span className="text-xs bg-surface border border-border px-2 py-1 rounded-md flex items-center gap-1">
                  Search: {searchQuery}
                  <Link href={clearSearchHref} className="text-muted hover:text-foreground ml-1">×</Link>
                </span>
              )}
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
            <FacetList
              title="Brands"
              items={availableBrands}
              activeSlug={brandSlug}
              buildHref={(slug) => buildInventoryHref({ q: searchQuery, brand: slug, market: marketSlug, sort })}
              emptyLabel="No brands available yet."
            />

            <FacetList
              title="Markets"
              items={availableMarkets}
              activeSlug={marketSlug}
              buildHref={(slug) => buildInventoryHref({ q: searchQuery, brand: brandSlug, market: slug, sort })}
              emptyLabel="No markets available yet."
            />
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-bold">Browse Active Wholesale Disposable Vape Inventory</h1>
          <p className="text-muted mt-3 max-w-3xl">
            Explore verified wholesale disposable vape listings across brands, markets, and price bands. Use filters to find bulk inventory, compare MOQ and stock depth, and move quickly into direct inquiry.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <form action="/inventory" method="get" className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {brandSlug ? <input type="hidden" name="brand" value={brandSlug} /> : null}
            {marketSlug ? <input type="hidden" name="market" value={marketSlug} /> : null}
            {sort && sort !== 'newest' ? <input type="hidden" name="sort" value={sort} /> : null}
            <div className="flex-1">
              <label htmlFor="inventory-search" className="mb-2 block text-sm font-medium text-foreground">
                Search inventory
              </label>
              <input
                id="inventory-search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search by brand, model, flavor, market, or warehouse"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-teal-DEFAULT"
              />
            </div>
            <div className="flex gap-3 lg:self-end">
              <button
                type="submit"
                className="rounded-xl bg-teal-DEFAULT px-5 py-3 text-sm font-semibold text-background hover:bg-teal-hover transition-colors"
              >
                Search
              </button>
              {(searchQuery || brand || market || sort) && (
                <Link
                  href={clearFiltersHref}
                  className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-background transition-colors"
                >
                  Reset
                </Link>
              )}
            </div>
          </form>

          {searchQuery ? (
            <p className="mt-3 text-sm text-muted">
              Showing results for <span className="font-medium text-foreground">&quot;{searchQuery}&quot;</span>.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Search active listings by brand, model keywords, flavor, target market, or warehouse location.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-border pb-4">
          <div>
            <p className="text-lg font-semibold">{totalItems} Active Listings</p>
            <p className="text-sm text-muted mt-1">
              {searchQuery
                ? 'Search results stay compatible with your current filters and sorting so you can move faster into supplier inquiry.'
                : 'Use filters to find bulk disposable vape stock, compare active listings, and move quickly into supplier inquiry.'}
            </p>
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
                {currentPage > 1 && (
                  <Link
                    href={buildInventoryHref({ q: searchQuery, brand: brandSlug, market: marketSlug, sort, page: currentPage - 1 })}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-muted px-4">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={buildInventoryHref({ q: searchQuery, brand: brandSlug, market: marketSlug, sort, page: currentPage + 1 })}
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
            <p className="text-muted mb-6">
              {searchQuery
                ? `No wholesale vape inventory matches "${searchQuery}" with your current filters. Try another keyword or return to all active listings.`
                : 'No wholesale vape inventory matches your current filters. Clear filters to view all active bulk listings.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {searchQuery ? (
                <Link href={clearSearchHref} className="px-6 py-2 border border-border rounded-lg font-medium hover:bg-background transition-colors">
                  Clear Search
                </Link>
              ) : null}
              <Link href={clearFiltersHref} className="px-6 py-2 bg-teal-DEFAULT text-background rounded-lg font-medium hover:bg-teal-hover transition-colors">
                View All Inventory
              </Link>
            </div>
          </div>
        )}

        <section className="mt-16 border-t border-border pt-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Wholesale Inventory FAQ</h2>
            <p className="text-muted mt-2 max-w-3xl">
              Key questions from buyers reviewing wholesale disposable vape stock before sending a direct inquiry.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">What is the MOQ for wholesale disposable vapes?</h3>
              <p className="text-sm text-muted">
                MOQ varies by listing. Review each inventory page for the current minimum order requirement before sending your inquiry.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">Can I buy vapes in bulk across multiple brands?</h3>
              <p className="text-sm text-muted">
                Availability depends on current active listings. Use filters to review matching stock, then confirm mixed-order options during direct inquiry.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">How often is wholesale vape inventory updated?</h3>
              <p className="text-sm text-muted">
                Inventory changes frequently. We highlight active listings and verification timestamps so buyers can focus on currently available stock.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
