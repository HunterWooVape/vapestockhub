import { createClient } from '@/lib/supabase/server'
import InventoryCard from '@/components/inventory/InventoryCard'
import { Metadata } from 'next'
import { InventoryRecord, resolveFacetLabelBySlug } from '@/lib/inventory'
import { TAXONOMY_INDEX_THRESHOLDS } from '@/lib/seo'
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
    title: `${brandName} Wholesale Vape Stock | VapeStockHub`,
    description: `Browse active ${brandName} wholesale vape stock, including bulk offers, MOQ, warehouse location, price visibility, and inquiry-ready listings for B2B buyers.`,
    alternates: {
      canonical: `${siteConfig.url}/brand/${resolvedParams.slug}`,
    },
    robots: {
      index: (count ?? 0) >= TAXONOMY_INDEX_THRESHOLDS.brand,
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
          <span className="text-teal-DEFAULT">{brandName}</span> Wholesale Vape Stock
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Browse active {brandName} wholesale vape stock, including bulk offers, MOQ, warehouse location, price visibility, and inquiry-ready listings for B2B buyers.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">{items.length} Active Listings</h2>
            <p className="text-sm text-muted mt-1">Compare live {brandName} wholesale listings by MOQ, warehouse, market fit, price visibility, and stock depth before sending your inquiry.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <InventoryCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <section className="border-t border-border pt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{brandName} Wholesale FAQ</h2>
          <p className="text-muted mt-2 max-w-3xl">
            Key questions buyers review before requesting live price and availability for {brandName} stock.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-bold mb-2">Can I buy {brandName} vapes in bulk?</h3>
            <p className="text-sm text-muted">
              Yes, if active {brandName} listings are available. Review current stock on this page and confirm quantity, price, and availability by direct inquiry.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-bold mb-2">What is the MOQ for {brandName} wholesale inventory?</h3>
            <p className="text-sm text-muted">
              MOQ depends on the listing. Open the relevant inventory page to review the current minimum order quantity before contacting the supplier.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-bold mb-2">What warehouse details should I check for {brandName} stock?</h3>
            <p className="text-sm text-muted">
              Check warehouse location, available quantity, MOQ, and whether the listing matches your sourcing route before requesting live availability.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-bold mb-2">Are there {brandName} clearance or budget stock offers?</h3>
            <p className="text-sm text-muted">
              Clearance and budget opportunities depend on active inventory. Review visible prices, pricing notes, and related price-band pages before sending an inquiry.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-bold mb-2">Can I ask for related or alternative stock if {brandName} is unavailable?</h3>
            <p className="text-sm text-muted">
              Yes. Use direct inquiry to ask for related stock or wholesale-friendly alternatives while keeping brand and product relationships clearly labeled.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="text-lg font-bold mb-2">How do I request {brandName} wholesale price?</h3>
            <p className="text-sm text-muted">
              Use the Telegram or WhatsApp inquiry button on the listing you want. The message includes product context so the supplier can confirm price and stock faster.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
