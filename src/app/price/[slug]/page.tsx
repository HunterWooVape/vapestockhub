import { createClient } from '@/lib/supabase/server'
import InventoryCard from '@/components/inventory/InventoryCard'
import { Metadata } from 'next'
import Link from 'next/link'
import { InventoryRecord } from '@/lib/inventory'
import { TAXONOMY_INDEX_THRESHOLDS } from '@/lib/seo'
import { siteConfig } from '@/lib/site'
import { notFound } from 'next/navigation'

export const revalidate = 3600

type PriceRangeQuery<T> = {
  lte: (column: string, value: number) => T
  gt: (column: string, value: number) => T
  gte: (column: string, value: number) => T
}

const allowedPriceTierSlugs = new Set(['under-3', '3-to-5', '5-to-8', 'over-8'])

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
    intro: 'Use this price band to screen low-cost disposable vape offers for wholesale and clearance sourcing. Listings may move quickly, so confirm live price, MOQ, remaining quantity, and warehouse location before committing.',
    listingSummary: 'Use this clearance-focused price band to compare budget stock, MOQ, warehouse, and live availability before opening product-level inquiries.',
  },
  '3-to-5': {
    h1: 'Wholesale Disposable Vapes from $3 to $5',
    title: 'Wholesale Disposable Vapes from $3 to $5 | VapeStockHub',
    description: 'Review wholesale disposable vape stock from $3 to $5, including bulk offers, MOQ, warehouse location, and live availability before requesting a quote.',
    intro: 'Use this price band to screen mainstream wholesale disposable vape offers with balanced margin potential, stable bulk sourcing fit, and clear MOQ signals.',
    listingSummary: 'Use this price-band inventory hub to compare balanced wholesale offers before opening product-level inquiries.',
  },
  '5-to-8': {
    h1: 'Disposable Vape Wholesale Stock from $5 to $8',
    title: 'Disposable Vape Wholesale Stock from $5 to $8 | VapeStockHub',
    description: 'Browse disposable vape wholesale stock from $5 to $8 by MOQ, warehouse, and availability before requesting live price confirmation.',
    intro: 'Use this price band to review higher-ticket wholesale disposable vape offers with stronger feature sets and clear sourcing context.',
    listingSummary: 'Use this price-band inventory hub to compare active wholesale stock before opening product-level inquiries.',
  },
  'over-8': {
    h1: 'Disposable Vape Wholesale Stock Over $8',
    title: 'Disposable Vape Wholesale Stock Over $8 | VapeStockHub',
    description: 'Browse higher-ticket disposable vape wholesale stock over $8 by MOQ, warehouse, and availability before requesting live price confirmation.',
    intro: 'Use this price band to review higher-ticket wholesale stock, advanced hardware, specialty inventory lines, and live availability context.',
    listingSummary: 'Use this price-band inventory hub to compare active wholesale stock before opening product-level inquiries.',
  },
}

function isSupportedPriceTierSlug(slug: string) {
  return allowedPriceTierSlugs.has(slug)
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

  if (!isSupportedPriceTierSlug(resolvedParams.slug)) {
    return {
      title: 'Price Range Not Found | VapeStockHub',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const supabase = await createClient()
  const { query } = applyPriceRangeQuery(
    resolvedParams.slug,
    supabase
      .from('inventory')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('pricing_mode', 'exact_price')
  )
  const { count } = await query
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

  const supabase = await createClient()
  
  let query = supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .eq('pricing_mode', 'exact_price')
    .order('price', { ascending: true })
  const rangeResult = applyPriceRangeQuery(resolvedParams.slug, query)
  query = rangeResult.query
  const tierCopy = priceTierCopy[resolvedParams.slug]

  const { data: inventory, error } = await query

  if (error) {
    console.error('Error fetching price inventory:', error)
  }

  const items = (inventory ?? []) as InventoryRecord[]

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 relative z-10">
          {tierCopy.h1}
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto relative z-10">
          {tierCopy.intro}
        </p>
      </div>

      <div>
        <div className="flex justify-between items-end mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">{items.length} Active Listings</h2>
            <p className="text-sm text-muted mt-1">{tierCopy.listingSummary}</p>
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
            <h3 className="text-lg font-bold mb-2">No active wholesale stock in this range</h3>
            <p className="text-muted mb-6">No active wholesale stock is currently available in this price range. Try another band or return to the full inventory index.</p>
            <Link href="/inventory" className="px-6 py-2 bg-teal-DEFAULT text-background rounded-lg font-medium hover:bg-teal-hover transition-colors">
              View All Inventory
            </Link>
          </div>
        )}
      </div>

      {resolvedParams.slug === 'under-3' && (
        <section className="border-t border-border pt-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Wholesale Clearance FAQ</h2>
            <p className="text-muted mt-2 max-w-3xl">
              Key questions for buyers reviewing cheap disposable vapes and clearance-ready wholesale stock.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">Where can I find cheap disposable vapes in bulk?</h3>
              <p className="text-sm text-muted">
                This price band shows active exact-price listings under $3. Confirm MOQ, remaining quantity, warehouse, and live availability before sourcing.
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
