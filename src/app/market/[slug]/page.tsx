import { createClient } from '@/lib/supabase/server'
import InventoryCard from '@/components/inventory/InventoryCard'
import { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/site'
import { InventoryRecord, slugToLabel } from '@/lib/inventory'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const marketName = slugToLabel(resolvedParams.slug)
  const supabase = await createClient()
  const { count } = await supabase
    .from('inventory')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .ilike('market', `%${marketName}%`)
  
  return {
    title: `Wholesale Vape Inventory for ${marketName} | VapeStockHub`,
    description: `Browse active wholesale vape stock suitable for the ${marketName} market, including verified listings, bulk offers, and clearance opportunities ready for inquiry.`,
    alternates: {
      canonical: `${siteConfig.url}/market/${resolvedParams.slug}`,
    },
    robots: {
      index: (count ?? 0) >= 3,
      follow: true,
    },
  }
}

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const marketName = slugToLabel(resolvedParams.slug)

  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .ilike('market', `%${marketName}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching market inventory:', error)
  }

  const items = (inventory ?? []) as InventoryRecord[]

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Wholesale Vape Inventory for <span className="text-teal-DEFAULT">{marketName}</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Explore active wholesale stock suitable for buyers targeting {marketName}. Compare listings by brand, quantity, price visibility, and warehouse availability before sending your inquiry.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">{items.length} Active Listings</h2>
            <p className="text-sm text-muted mt-1">Use this regional inventory hub to move from target market research into product-level inquiry.</p>
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
            <h3 className="text-lg font-bold mb-2">No inventory currently available</h3>
            <p className="text-muted mb-6">Check back soon for new active stock aligned with the {marketName} market.</p>
            <Link href="/inventory" className="px-6 py-2 bg-teal-DEFAULT text-background rounded-lg font-medium hover:bg-teal-hover transition-colors">
              View All Global Inventory
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
