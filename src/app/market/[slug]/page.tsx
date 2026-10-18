import { getPublicInventory } from '@/lib/public-inventory'
import InventoryCollection from '@/components/inventory/InventoryCollection'
import { Metadata } from 'next'
import { TAXONOMY_INDEX_THRESHOLDS } from '@/lib/seo'
import { siteConfig } from '@/lib/site'
import {
  buildFeaturedMarketFacetsFromInventory,
  inventoryTargetsFeaturedMarket,
  resolveFeaturedMarketLabelBySlug,
} from '@/lib/inventory-markets'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const marketOptions = await getPublicInventory()

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
    title: `Wholesale Vape Stock for ${marketName} Buyers | VapeStockHub`,
    description: `Browse wholesale vape inventory for ${marketName} buyers. Review available and past lots by brand, MOQ and warehouse, or request matching stock.`,
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
  const marketOptions = await getPublicInventory()

  const marketName = resolveFeaturedMarketLabelBySlug(marketOptions ?? [], resolvedParams.slug)

  if (!marketName) {
    notFound()
  }

  const items = marketOptions.filter((item) => inventoryTargetsFeaturedMarket(item, marketName))

  const marketFaqs = [
    {
      question: `Can I source wholesale vape stock for ${marketName} through this page?`,
      answer: `Browse available and past lots for ${marketName} buyers. For sold-out listings, ask about restock or alternatives.`,
    },
    {
      question: 'Does this page only show local warehouse stock?',
      answer: 'No. It can include local warehouse stock or globally available inventory that may fit this market route. Always confirm warehouse availability before sourcing.',
    },
    {
      question: `What should I compare before sending an inquiry for ${marketName}?`,
      answer: 'Check MOQ, available quantity, warehouse location, price visibility, and whether the listing matches your target market route before contacting the supplier.',
    },
    {
      question: `Can I request cheaper or clearance stock for ${marketName}?`,
      answer: 'Yes. Include your target price range, quantity, and warehouse preference in the inquiry so matching budget or clearance stock can be checked.',
    },
    {
      question: `Do you guarantee compliance or import clearance for ${marketName}?`,
      answer: 'No. VapeStockHub organizes inventory discovery and inquiry routing only. Buyers and suppliers must independently confirm local rules, import requirements, and commercial terms.',
    },
  ]

  if (items.length === 0) {
    notFound()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1160px] flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-surface/40 p-6 text-left sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl text-foreground mb-4">
          Wholesale Vape Stock for <span className="text-teal-DEFAULT">{marketName}</span> Buyers
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted">
          Wholesale inventory for {marketName} buyers, including local and overseas warehouse lots. Confirm availability and destination requirements by inquiry.
        </p>
      </div>

      <InventoryCollection items={items} sourcePageType="market" sourcePageSlug={resolvedParams.slug} sourcingContext={`wholesale vape stock for ${marketName}`} />

      <section className="border-t border-border pt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{marketName} Market FAQ</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
