import { createClient } from '@/lib/supabase/server'
import InventoryCard from '@/components/inventory/InventoryCard'
import { Metadata } from 'next'
import Link from 'next/link'
import { InventoryRecord } from '@/lib/inventory'
import { siteConfig } from '@/lib/site'

export const revalidate = 3600

type PriceRangeQuery<T> = {
  lte: (column: string, value: number) => T
  gt: (column: string, value: number) => T
  gte: (column: string, value: number) => T
}

function applyPriceRangeQuery<T extends PriceRangeQuery<T>>(slug: string, query: T) {
  const priceDesc = ''

  if (slug.startsWith('under-')) {
    const maxPrice = parseFloat(slug.split('-')[1])
    return {
      query: query.lte('price', maxPrice),
      priceDesc: `Under $${maxPrice.toFixed(2)}`,
    }
  }

  if (slug.startsWith('over-')) {
    const minPrice = parseFloat(slug.split('-')[1])
    return {
      query: query.gt('price', minPrice),
      priceDesc: `Over $${minPrice.toFixed(2)}`,
    }
  }

  if (slug.includes('-to-')) {
    const [min, max] = slug.split('-to-')
    return {
      query: query.gte('price', parseFloat(min)).lte('price', parseFloat(max)),
      priceDesc: `Between $${parseFloat(min).toFixed(2)} - $${parseFloat(max).toFixed(2)}`,
    }
  }

  return { query, priceDesc }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()
  const { query, priceDesc } = applyPriceRangeQuery(
    resolvedParams.slug,
    supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('status', 'active')
  )
  const { count } = await query
  
  return {
    title: `Wholesale Vape Inventory ${priceDesc} | VapeStockHub`,
    description: `Browse active wholesale vape listings ${priceDesc}, including clearance stock and bulk offers sorted by unit price for faster sourcing.`,
    alternates: {
      canonical: `${siteConfig.url}/price/${resolvedParams.slug}`,
    },
    robots: {
      index: (count ?? 0) >= 3,
      follow: true,
    },
  }
}

export default async function PricePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  let query = supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .order('price', { ascending: true })
  const rangeResult = applyPriceRangeQuery(resolvedParams.slug, query)
  query = rangeResult.query
  const priceDesc = rangeResult.priceDesc

  const { data: inventory, error } = await query

  if (error) {
    console.error('Error fetching price inventory:', error)
  }

  const items = (inventory ?? []) as InventoryRecord[]

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-DEFAULT/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 relative z-10">
          Wholesale Vape Inventory <span className="text-teal-DEFAULT">{priceDesc}</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto relative z-10">
          Browse active stock within this price band, compare unit-price aligned listings, and move quickly into inquiry once you find the right inventory fit.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">{items.length} Active Listings</h2>
            <p className="text-sm text-muted mt-1">Use this price-band inventory hub to screen clearance and budget-aligned stock before opening product-level inquiries.</p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-xl border border-border">
            <h3 className="text-lg font-bold mb-2">No inventory found in this range</h3>
            <p className="text-muted mb-6">Inventory moves fast. Try another price band or return to the full inventory index.</p>
            <Link href="/inventory" className="px-6 py-2 bg-teal-DEFAULT text-background rounded-lg font-medium hover:bg-teal-hover transition-colors">
              View All Inventory
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
