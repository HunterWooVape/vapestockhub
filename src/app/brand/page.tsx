import Link from 'next/link'

import { buildInventoryFacets } from '@/lib/inventory'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Vape Inventory by Brand | VapeStockHub',
  description: 'Find active wholesale vape inventory by brand and move directly into brand-specific stock discovery.',
}

function getBrandDescription(brandName: string, count: number) {
  return `${count} active wholesale listing${count > 1 ? 's' : ''} currently available for ${brandName}.`
}

export default async function BrandIndexPage() {
  const supabase = await createClient()
  const { data: inventoryOptions } = await supabase
    .from('inventory')
    .select('brand')
    .eq('status', 'active')

  const brands = buildInventoryFacets((inventoryOptions ?? []).map((item) => item.brand))

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Find Inventory by <span className="text-teal-DEFAULT">Brand</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Explore active wholesale stock by brand and move quickly from brand preference into current inventory discovery.
        </p>
      </div>

      {brands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brand/${brand.slug}`}
              className="p-8 rounded-xl border border-border bg-surface hover:border-teal-DEFAULT/50 group transition-all text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-background border border-border rounded-full flex items-center justify-center font-bold text-xl text-teal-DEFAULT">
                {brand.label.charAt(0)}
              </div>
              <h2 className="text-xl font-bold group-hover:text-teal-DEFAULT transition-colors mb-2">
                {brand.label}
              </h2>
              <p className="text-sm text-muted">{getBrandDescription(brand.label, brand.count)}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <h2 className="text-xl font-bold text-foreground">No active brands yet</h2>
          <p className="mt-2 text-sm text-muted">
            Brand hubs appear here once active inventory is available.
          </p>
        </div>
      )}
    </main>
  )
}
