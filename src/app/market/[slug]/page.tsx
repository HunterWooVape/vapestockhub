import { createClient } from '@/lib/supabase/server'
import InventoryCard from '@/components/inventory/InventoryCard'
import { Metadata } from 'next'
import { TAXONOMY_INDEX_THRESHOLDS } from '@/lib/seo'
import { siteConfig } from '@/lib/site'
import { InventoryRecord } from '@/lib/inventory'
import {
  buildFeaturedMarketFacetsFromInventory,
  inventoryTargetsFeaturedMarket,
  resolveFeaturedMarketLabelBySlug,
} from '@/lib/inventory-markets'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: marketOptions } = await supabase
    .from('inventory')
    .select('market, featured_markets')
    .eq('status', 'active')

  const marketName = resolveFeaturedMarketLabelBySlug(marketOptions ?? [], resolvedParams.slug)

  if (!marketName) {
    return {
      title: 'Market Not Found | VapeStockHub',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const matchedCount = buildFeaturedMarketFacetsFromInventory(marketOptions ?? [])
    .find((market) => market.slug === resolvedParams.slug)?.count ?? 0
  
  return {
    title: `Wholesale Vape Inventory for ${marketName} | VapeStockHub`,
    description: `Browse active wholesale vape stock suitable for the ${marketName} market, including verified listings, target-market aligned inventory, and inquiry-ready bulk offers.`,
    alternates: {
      canonical: `${siteConfig.url}/market/${resolvedParams.slug}`,
    },
    robots: {
      index: matchedCount >= TAXONOMY_INDEX_THRESHOLDS.market,
      follow: true,
    },
  }
}

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: marketOptions } = await supabase
    .from('inventory')
    .select('market, featured_markets')
    .eq('status', 'active')

  const marketName = resolveFeaturedMarketLabelBySlug(marketOptions ?? [], resolvedParams.slug)

  if (!marketName) {
    notFound()
  }

  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching market inventory:', error)
  }

  const items = ((inventory ?? []) as InventoryRecord[])
    .filter((item) => inventoryTargetsFeaturedMarket(item, marketName))
    .sort((left, right) => right.created_at.localeCompare(left.created_at))

  const marketFaqs = [
    {
      question: `Can I source wholesale vape inventory for ${marketName} through this page?`,
      answer: `Yes. This page groups active listings prioritized for ${marketName} buyers so you can review current stock and move into direct inquiry faster.`,
    },
    {
      question: `What should I compare before sending an inquiry for ${marketName}?`,
      answer: 'Check MOQ, available quantity, warehouse location, price visibility, and whether the listing matches your target market route before contacting the supplier.',
    },
    {
      question: `Does this market page only show local stock?`,
      answer: `No. It can include globally available inventory that is still prioritized or suitable for ${marketName} demand and shipping paths.`,
    },
  ]

  if (items.length === 0) {
    notFound()
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Wholesale Vape Inventory for <span className="text-teal-DEFAULT">{marketName}</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Browse active wholesale stock curated for buyers targeting {marketName}, including globally available listings prioritized for this market. Compare listings by brand, MOQ, stock depth, price visibility, and warehouse readiness before sending your inquiry.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">{items.length} Active Listings</h2>
            <p className="text-sm text-muted mt-1">Use this market hub to review target-market aligned stock before moving into product-level inquiry.</p>
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
          <h2 className="text-2xl font-bold">{marketName} Market FAQ</h2>
          <p className="text-muted mt-2 max-w-3xl">
            Key questions buyers review when using this regional inventory hub to identify suitable stock and send a direct inquiry.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {marketFaqs.map((faq) => (
            <div key={faq.question} className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
              <p className="text-sm text-muted">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
