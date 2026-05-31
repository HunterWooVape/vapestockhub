import Link from 'next/link'

import { buildFeaturedMarketFacetsFromInventory } from '@/lib/inventory-markets'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Wholesale Vape Inventory by Target Market | VapeStockHub',
  description: 'Browse wholesale vape stock by target market and region to find active listings aligned with buyer destination, sourcing route, and inquiry priorities.',
}

export default async function MarketIndexPage() {
  const supabase = await createClient()
  const { data: inventory } = await supabase
    .from('inventory')
    .select('market, featured_markets')
    .eq('status', 'active')

  const markets = buildFeaturedMarketFacetsFromInventory(inventory ?? [])

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Browse Wholesale Inventory by <span className="text-teal-DEFAULT">Target Market</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Select a region to explore active wholesale stock aligned with buyer destination, sourcing route, warehouse context, and current inquiry priorities.
        </p>
      </div>

      {markets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {markets.map((market) => (
            <Link
              key={market.slug}
              href={`/market/${market.slug}`}
              className="p-8 rounded-xl border border-border bg-surface hover:border-teal-DEFAULT/50 group transition-all"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold group-hover:text-teal-DEFAULT transition-colors">
                  {market.label}
                </h2>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted">
                  {market.count} listings
                </span>
              </div>
              <p className="text-muted">
                Review active wholesale stock curated for {market.label} buyers, including globally available inventory prioritized for this target market.
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">Markets are being prepared</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            We are organizing market-focused inventory coverage. Check back after target-market tags are assigned to active listings.
          </p>
        </div>
      )}
    </main>
  )
}
