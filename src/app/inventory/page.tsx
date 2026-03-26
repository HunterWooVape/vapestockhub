import { createClient } from '@/lib/supabase/server'
import InventoryCard from '@/components/inventory/InventoryCard'
import { InventoryRecord, slugToLabel } from '@/lib/inventory'
import Link from 'next/link'

export const metadata = {
  title: 'All Vape Inventory | VapeStockHub',
  description: 'Browse our complete catalog of verified wholesale vape inventory.',
}

const ITEMS_PER_PAGE = 12

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Extract filter parameters
  const brandSlug = params.brand as string | undefined
  const marketSlug = params.market as string | undefined
  const sort = params.sort as string | undefined
  const page = parseInt(params.page as string || '1')

  const brand = brandSlug ? slugToLabel(brandSlug) : undefined
  const market = marketSlug ? slugToLabel(marketSlug) : undefined

  // Build the query
  let query = supabase
    .from('inventory')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  // Apply filters if they exist
  if (brand) {
    query = query.ilike('brand', `%${brand}%`)
  }
  
  if (market) {
    query = query.ilike('market', `%${market}%`)
  }

  // Apply sorting
  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    // Default sort by newest
    query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1
  query = query.range(from, to)

  const { data: inventory, count, error } = await query

  if (error) {
    console.error('Error fetching inventory:', error)
  }

  const items = (inventory ?? []) as InventoryRecord[]
  const totalItems = count ?? 0
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Left Sidebar: Filters */}
      <aside className="w-full md:w-64 shrink-0 space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Filters</h2>
          
          {/* Active Filters Summary (if any) */}
          {(brand || market) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {brand && (
                <span className="text-xs bg-surface border border-border px-2 py-1 rounded-md flex items-center gap-1">
                  Brand: {brand}
                  <Link href="/inventory" className="text-muted hover:text-foreground ml-1">×</Link>
                </span>
              )}
              {market && (
                <span className="text-xs bg-surface border border-border px-2 py-1 rounded-md flex items-center gap-1">
                  Market: {market}
                  <Link href="/inventory" className="text-muted hover:text-foreground ml-1">×</Link>
                </span>
              )}
              <Link href="/inventory" className="text-xs text-teal-DEFAULT hover:underline py-1">Clear all</Link>
            </div>
          )}

          <div className="space-y-6">
            {/* Simple static filter links for MVP */}
            <div>
              <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Top Brands</h3>
              <ul className="space-y-2">
                <li><a href="?brand=vozol" className={`text-sm hover:text-teal-DEFAULT ${brandSlug === 'vozol' ? 'text-teal-DEFAULT font-bold' : ''}`}>Vozol</a></li>
                <li><a href="?brand=elf-bar" className={`text-sm hover:text-teal-DEFAULT ${brandSlug === 'elf-bar' ? 'text-teal-DEFAULT font-bold' : ''}`}>Elf Bar</a></li>
                <li><a href="?brand=geek-bar" className={`text-sm hover:text-teal-DEFAULT ${brandSlug === 'geek-bar' ? 'text-teal-DEFAULT font-bold' : ''}`}>Geek Bar</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Top Markets</h3>
              <ul className="space-y-2">
                <li><a href="?market=middle-east" className={`text-sm hover:text-teal-DEFAULT ${marketSlug === 'middle-east' ? 'text-teal-DEFAULT font-bold' : ''}`}>Middle East</a></li>
                <li><a href="?market=latin-america" className={`text-sm hover:text-teal-DEFAULT ${marketSlug === 'latin-america' ? 'text-teal-DEFAULT font-bold' : ''}`}>Latin America</a></li>
                <li><a href="?market=eastern-europe" className={`text-sm hover:text-teal-DEFAULT ${marketSlug === 'eastern-europe' ? 'text-teal-DEFAULT font-bold' : ''}`}>Eastern Europe</a></li>
                <li><a href="?market=north-america" className={`text-sm hover:text-teal-DEFAULT ${marketSlug === 'north-america' ? 'text-teal-DEFAULT font-bold' : ''}`}>North America</a></li>
              </ul>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Content: Results */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-border pb-4">
          <h1 className="text-2xl font-bold">
            {totalItems} Products Found
          </h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Sort by:</span>
            <div className="flex gap-2">
              <a href={`?${new URLSearchParams({ ...(brandSlug ? { brand: brandSlug } : {}), ...(marketSlug ? { market: marketSlug } : {}), sort: 'newest' }).toString()}`} className={`text-sm px-3 py-1 rounded-md border ${!sort || sort === 'newest' ? 'bg-surface border-teal-DEFAULT text-teal-DEFAULT' : 'border-border hover:bg-surface'}`}>Newest</a>
              <a href={`?${new URLSearchParams({ ...(brandSlug ? { brand: brandSlug } : {}), ...(marketSlug ? { market: marketSlug } : {}), sort: 'price_asc' }).toString()}`} className={`text-sm px-3 py-1 rounded-md border ${sort === 'price_asc' ? 'bg-surface border-teal-DEFAULT text-teal-DEFAULT' : 'border-border hover:bg-surface'}`}>Price: Low to High</a>
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pt-8 border-t border-border">
                {page > 1 && (
                  <Link
                    href={`?${new URLSearchParams({ ...(brandSlug ? { brand: brandSlug } : {}), ...(marketSlug ? { market: marketSlug } : {}), ...(sort ? { sort } : {}), page: (page - 1).toString() }).toString()}`}
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
                    href={`?${new URLSearchParams({ ...(brandSlug ? { brand: brandSlug } : {}), ...(marketSlug ? { market: marketSlug } : {}), ...(sort ? { sort } : {}), page: (page + 1).toString() }).toString()}`}
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
            <p className="text-muted mb-6">Try adjusting your filters or browse all inventory.</p>
            <Link href="/inventory" className="px-6 py-2 bg-teal-DEFAULT text-background rounded-lg font-medium hover:bg-teal-hover transition-colors">
              Clear Filters
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
