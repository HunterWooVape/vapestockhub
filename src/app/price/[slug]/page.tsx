import { getPublicInventory } from '@/lib/public-inventory'
import { getPriceTierItems, PRICE_TIER_SLUGS } from '@/lib/inventory-price'
import InventoryCollection from '@/components/inventory/InventoryCollection'
import { Metadata } from 'next'
import { TAXONOMY_INDEX_THRESHOLDS } from '@/lib/seo'
import { siteConfig } from '@/lib/site'
import { notFound } from 'next/navigation'

export const revalidate = 3600

const priceTierCopy: Record<string, {
  h1: string
  title: string
  description: string
  intro: string
  listingSummary: string
}> = {
  'under-3': {
    h1: 'Cheap Disposable Vapes for Wholesale Clearance',
    title: 'Cheap Disposable Vapes for Wholesale Clearance | VapeStockHub',
    description: 'Review low-cost disposable vape stock, clearance-ready offers, and budget wholesale listings. Compare MOQ, unit price, warehouse, and live availability before sending an inquiry.',
    intro: 'Wholesale and clearance lots at $3 or less. Sold-out lots show previous prices; current quotes are available by inquiry.',
    listingSummary: 'Use this clearance-focused price band to compare budget stock, MOQ, warehouse, and live availability before opening product-level inquiries.',
  },
  '3-to-5': {
    h1: 'Wholesale Disposable Vapes from $3 to $5',
    title: 'Wholesale Disposable Vapes from $3 to $5 | VapeStockHub',
    description: 'Review wholesale disposable vape stock from $3 to $5, including bulk offers, MOQ, warehouse location, and live availability before requesting a quote.',
    intro: 'Wholesale lots listed from $3 to $5. Sold-out lots show previous prices; confirm current terms by inquiry.',
    listingSummary: 'Use this price-band inventory hub to compare balanced wholesale offers before opening product-level inquiries.',
  },
  '5-to-8': {
    h1: 'Disposable Vape Wholesale Stock from $5 to $8',
    title: 'Disposable Vape Wholesale Stock from $5 to $8 | VapeStockHub',
    description: 'Browse disposable vape wholesale stock from $5 to $8 by MOQ, warehouse, and availability before requesting live price confirmation.',
    intro: 'Wholesale lots listed from $5 to $8. Sold-out lots show previous prices; confirm current terms by inquiry.',
    listingSummary: 'Use this price-band inventory hub to compare active wholesale stock before opening product-level inquiries.',
  },
  'over-8': {
    h1: 'Disposable Vape Wholesale Stock Over $8',
    title: 'Disposable Vape Wholesale Stock Over $8 | VapeStockHub',
    description: 'Browse higher-ticket disposable vape wholesale stock over $8 by MOQ, warehouse, and availability before requesting live price confirmation.',
    intro: 'Wholesale lots listed above $8. Sold-out lots show previous prices; confirm current terms by inquiry.',
    listingSummary: 'Use this price-band inventory hub to compare active wholesale stock before opening product-level inquiries.',
  },
}

function isSupportedPriceTierSlug(slug: string) {
  return PRICE_TIER_SLUGS.some((value) => value === slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params

  if (!isSupportedPriceTierSlug(resolvedParams.slug)) {
    return {
      title: 'Price Range Not Found | VapeStockHub',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const count = getPriceTierItems(await getPublicInventory(), resolvedParams.slug).length
  const tierCopy = priceTierCopy[resolvedParams.slug]
  
  return {
    title: tierCopy.title,
    description: tierCopy.description,
    alternates: {
      canonical: `${siteConfig.url}/price/${resolvedParams.slug}`,
    },
    robots: {
      index: (count ?? 0) >= TAXONOMY_INDEX_THRESHOLDS.price,
      follow: true,
    },
  }
}

export default async function PricePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params

  if (!isSupportedPriceTierSlug(resolvedParams.slug)) {
    notFound()
  }

  const items = getPriceTierItems(await getPublicInventory(), resolvedParams.slug)
  const tierCopy = priceTierCopy[resolvedParams.slug]

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1160px] flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-surface/40 p-6 text-left sm:p-8 relative overflow-hidden">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl text-foreground mb-4 relative z-10">
          {tierCopy.h1}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted relative z-10">
          {tierCopy.intro}
        </p>
      </div>

      <InventoryCollection items={items} sourcePageType="price" sourcePageSlug={resolvedParams.slug} sourcingContext={tierCopy.h1.toLowerCase()} />

      {resolvedParams.slug === 'under-3' && (
        <section className="border-t border-border pt-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Wholesale Clearance FAQ</h2>
            <p className="text-muted mt-2 max-w-3xl">
              Key questions for buyers reviewing cheap disposable vapes and clearance-ready wholesale stock.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">Where can I find cheap disposable vapes in bulk?</h3>
              <p className="text-sm text-muted">
                Available lots show current listed prices. Sold-out lots show previous prices for reference. Confirm a new quote before sourcing.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">Are these clearance disposable vapes ready to ship?</h3>
              <p className="text-sm text-muted">
                Warehouse and availability details vary by listing. Use Telegram or WhatsApp to confirm whether the stock is ready for your route.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">Why do prices change after inquiry?</h3>
              <p className="text-sm text-muted">
                Clearance stock can move quickly. Final price can depend on quantity, warehouse, flavor mix, and current stock status.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">Can I mix brands or flavors in a budget order?</h3>
              <p className="text-sm text-muted">
                Mixed orders depend on active stock and MOQ. Include your target quantity and flavor preference in the inquiry.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">Is this a retail checkout page?</h3>
              <p className="text-sm text-muted">
                No. This page is for wholesale inventory discovery and direct B2B inquiry, not retail cart checkout.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
