import { createClient } from '@/lib/supabase/server'
import InventoryCard from '@/components/inventory/InventoryCard'
import { Metadata } from 'next'
import { InventoryRecord, resolveFacetLabelBySlug } from '@/lib/inventory'
import { siteConfig } from '@/lib/site'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: brandOptions } = await supabase
    .from('inventory')
    .select('brand')
    .eq('status', 'active')

  const brandName = resolveFacetLabelBySlug((brandOptions ?? []).map((item) => item.brand), resolvedParams.slug)

  if (!brandName) {
    return {
      title: 'Brand Not Found | VapeStockHub',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const { count } = await supabase
    .from('inventory')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('brand', brandName)
  
  return {
    title: `${brandName} Wholesale Vape Inventory | VapeStockHub`,
    description: `Browse active wholesale listings for ${brandName}, including bulk offers, clearance stock, and inquiry-ready inventory from verified supply sources.`,
    alternates: {
      canonical: `${siteConfig.url}/brand/${resolvedParams.slug}`,
    },
    robots: {
      index: (count ?? 0) >= 3,
      follow: true,
    },
  }
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: brandOptions } = await supabase
    .from('inventory')
    .select('brand')
    .eq('status', 'active')

  const brandName = resolveFacetLabelBySlug((brandOptions ?? []).map((item) => item.brand), resolvedParams.slug)

  if (!brandName) {
    notFound()
  }

  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .eq('brand', brandName)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching brand inventory:', error)
  }

  const items = (inventory ?? []) as InventoryRecord[]

  if (items.length === 0) {
    notFound()
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Wholesale <span className="text-teal-DEFAULT">{brandName}</span> Inventory
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Browse active wholesale listings for {brandName}, including bulk offers, clearance stock, and inquiry-ready inventory that can move quickly into direct sourcing conversations.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">{items.length} Active Listings</h2>
            <p className="text-sm text-muted mt-1">Use this brand inventory hub to compare current stock and move into product-level inquiry.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <InventoryCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </main>
  )
}
