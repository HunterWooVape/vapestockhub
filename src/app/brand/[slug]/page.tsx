import { getPublicInventory } from '@/lib/public-inventory'
import InventoryCollection from '@/components/inventory/InventoryCollection'
import { Metadata } from 'next'
import { resolveFacetLabelBySlug, toSlug } from '@/lib/inventory'
import { TAXONOMY_INDEX_THRESHOLDS } from '@/lib/seo'
import { siteConfig } from '@/lib/site'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const brandOptions = await getPublicInventory()

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

  const count = brandOptions.filter((item) => toSlug(item.brand) === resolvedParams.slug).length

  return {
    title: `${brandName} Wholesale Vape Stock | VapeStockHub`,
    description: `Browse ${brandName} wholesale vape inventory, specifications, MOQ and warehouse details. Check available stock or request restock and alternatives.`,
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
  const brandOptions = await getPublicInventory()

  const brandName = resolveFacetLabelBySlug((brandOptions ?? []).map((item) => item.brand), resolvedParams.slug)

  if (!brandName) {
    notFound()
  }

  const items = brandOptions.filter((item) => toSlug(item.brand) === resolvedParams.slug)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1160px] flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-surface/40 p-6 text-left sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl text-foreground mb-4">
          <span className="text-teal-DEFAULT">{brandName}</span> Wholesale Vape Stock
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted">
          Browse {brandName} wholesale inventory. Check available lots or request restock and alternatives.
        </p>
      </div>

      <InventoryCollection items={items} sourcePageType="brand" sourcePageSlug={resolvedParams.slug} sourcingContext={`${brandName} wholesale vape stock`} />

      <section className="border-t border-border pt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{brandName} Wholesale FAQ</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
