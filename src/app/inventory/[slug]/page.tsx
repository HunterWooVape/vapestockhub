import { getPublicInventory } from '@/lib/public-inventory'
import { buildInventoryInquiry, formatVerifiedDate, hasPublicPrice, isSoldOut, needsAvailabilityConfirmation } from '@/lib/inventory-lifecycle'
import { buildInventoryJsonLd, buildInventoryMetadataDescription } from '@/lib/inventory-seo'
import ContactButtons from '@/components/contact/ContactButtons'
import { getInventoryFeaturedMarkets } from '@/lib/inventory-markets'
import {
  buildInventoryImageAlt,
  getInventoryImageSrc,
  hasRealInventoryImage,
  type InventoryRecord,
  toSlug,
} from '@/lib/inventory'
import { siteConfig } from '@/lib/site'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Metadata } from 'next'
import InventoryCard from '@/components/inventory/InventoryCard'
import { cache } from 'react'

// 同一次请求共用查询结果；公开读取不跨请求缓存库存状态。
const getInventoryItem = cache(async (slug: string) => {
  return (await getPublicInventory()).find((item) => item.slug === slug) ?? null
})

function getSeoProductType(productType: string) {
  const normalizedType = productType.trim().toLowerCase()

  if (normalizedType === 'disposable vape') {
    return 'Disposable Vape'
  }

  if (normalizedType === 'pod kit') {
    return 'Pod Kit'
  }

  if (normalizedType === 'pod system') {
    return 'Pod System'
  }

  if (normalizedType === 'pod') {
    return 'Pod'
  }

  if (normalizedType === 'vape kit' || normalizedType === 'vape kits') {
    return 'Vape Kit'
  }

  if (normalizedType === 'e-liquid' || normalizedType === 'eliquid') {
    return 'E-liquid'
  }

  if (normalizedType === 'device') {
    return 'Vape Device'
  }

  if (normalizedType === 'accessory') {
    return 'Vape Accessory'
  }

  return 'Vape'
}

function buildInventoryMetadataTitle(item: InventoryRecord) {
  return `${item.title} Wholesale ${getSeoProductType(item.product_type)} Stock | VapeStockHub`
}

// Dynamically generate SEO metadata based on the inventory item
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const item = await getInventoryItem(resolvedParams.slug)

  if (!item) {
    return { title: 'Not Found | VapeStockHub' }
  }

  return {
    title: buildInventoryMetadataTitle(item),
    description: buildInventoryMetadataDescription(item),
    alternates: {
      canonical: `${siteConfig.url}/inventory/${resolvedParams.slug}`,
    },
  }
}

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const item = await getInventoryItem(resolvedParams.slug)

  if (!item) {
    notFound()
  }

  const isInquiryOnly = item.pricing_mode === 'inquiry_only'
  const unlocked = hasPublicPrice(item)
  const soldOut = isSoldOut(item)
  const reconfirm = needsAvailabilityConfirmation(item)
  const verifiedDate = formatVerifiedDate(item.last_verified_at)
  const hasRealImage = hasRealInventoryImage(item.images)
  const inventoryJsonLd = buildInventoryJsonLd(item)

  const isFeatured = !soldOut && !reconfirm && item.is_featured
  const flavorList = item.flavor ? item.flavor.split(',').map((f: string) => f.trim()).filter(Boolean) : []
  const displayFlavors = flavorList.slice(0, 6)
  const extraFlavorsCount = flavorList.length - 6
  const brandSlug = toSlug(item.brand)
  const featuredMarkets = getInventoryFeaturedMarkets(item)
  const primaryMarketLabel = featuredMarkets[0] ?? (item.market && toSlug(item.market) !== 'global' ? item.market : '')
  const marketSlug = primaryMarketLabel ? toSlug(primaryMarketLabel) : ''
  const inventoryFaqs = [
    {
      question: soldOut ? 'Can I request this product again?' : 'How do I confirm availability?',
      answer: soldOut
        ? 'This lot is sold out. Send your required quantity and warehouse preference to check restock or alternatives.'
        : 'Contact us with the listing details to confirm available quantity, MOQ and dispatch terms.',
    },
    {
      question: soldOut ? 'Does the previous price apply to new stock?' : 'How do I request a quote?',
      answer: soldOut
        ? 'Previous prices apply to the original lot. Request a new quote for restock or alternative stock.'
        : 'Send your target quantity, delivery destination and warehouse preference via Telegram or WhatsApp.',
    },
    {
      question: 'Can I request specific flavors?',
      answer: 'Include your flavor list and quantities in your inquiry. Availability is confirmed for each lot.',
    },
  ]
  const relatedItems = (await getPublicInventory())
    .filter((other) => other.status === 'active' && other.id !== item.id)
    .filter((other) => toSlug(other.brand) === brandSlug || (item.market && toSlug(other.market) === toSlug(item.market)))
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 3)

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(inventoryJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/inventory" className="hover:text-foreground transition-colors">Inventory</Link>
          <span>/</span>
          <Link href={`/brand/${brandSlug}`} className="hover:text-teal-DEFAULT transition-colors font-medium">{item.brand}</Link>
        </div>

        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-DEFAULT/80">
          Wholesale Stock Offer
        </p>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center flex-wrap gap-4">
          {item.title}
          {item.status === 'active' && (
            <span className="text-sm font-medium px-3 py-1 bg-teal-DEFAULT/10 text-teal-DEFAULT rounded-full">
              Active Stock
            </span>
          )}
          {soldOut && (
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-semibold text-muted">Sold out</span>
          )}
          {isFeatured && (
            <span className="rounded-full bg-teal-DEFAULT/10 px-3 py-1 text-sm font-medium text-teal-DEFAULT">Featured</span>
          )}
        </h1>
        <p className="text-muted mt-4 max-w-3xl">
          {soldOut ? 'This lot is sold out. Ask about restock or alternative stock.' : `${item.product_type}${item.warehouse_location ? ` · Warehouse: ${item.warehouse_location}` : ''}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-[4/3] bg-surface rounded-2xl border border-border overflow-hidden relative flex items-center justify-center">
            <Image
              unoptimized
              src={getInventoryImageSrc(item.images)}
              alt={buildInventoryImageAlt({
                title: item.title,
                brand: item.brand,
                productType: item.product_type,
                hasRealImage,
              })}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-6">Stock Offer Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="text-sm text-muted mb-1">Brand</div>
                <div className="font-semibold">{item.brand}</div>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Product Type</div>
                <div className="font-semibold">{item.product_type}</div>
              </div>
              {item.puff && (
                <div>
                  <div className="text-sm text-muted mb-1">Puff Count</div>
                  <div className="font-semibold">{item.puff.toLocaleString()} Puffs</div>
                </div>
              )}
              {item.nicotine && (
                <div>
                  <div className="text-sm text-muted mb-1">Nicotine</div>
                  <div className="font-semibold">{item.nicotine}</div>
                </div>
              )}
              {item.e_liquid && (
                <div>
                  <div className="text-sm text-muted mb-1">E-liquid Capacity</div>
                  <div className="font-semibold">{item.e_liquid}</div>
                </div>
              )}
              {item.production_date_text && (
                <div>
                  <div className="text-sm text-muted mb-1">Production Date</div>
                  <div className="font-semibold">{item.production_date_text}</div>
                </div>
              )}
            </div>

            {flavorList.length > 0 && (
              <div className="border-t border-border pt-6">
                <div className="text-sm text-muted mb-3 flex items-center justify-between">
                  <span>{soldOut ? 'Original flavors' : 'Listed flavors'} ({flavorList.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayFlavors.map((flavor: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-background border border-border rounded-lg text-sm font-medium">
                      {flavor}
                    </span>
                  ))}
                  {extraFlavorsCount > 0 && (
                    <span className="px-3 py-1 bg-surface border border-dashed border-border rounded-lg text-sm font-medium text-muted">
                      +{extraFlavorsCount} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {item.description && (
            <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">Stock Manifest & Offer Details</h2>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
              {soldOut ? (
                <div className="mb-6 rounded-lg border border-border bg-background p-4">
                  <p className="font-semibold">Sold out</p>
                  <p className="mt-1 text-sm text-muted">Restock and alternatives on inquiry.</p>
                </div>
              ) : reconfirm ? (
                <div className="mb-6 rounded-lg border border-amber-400/25 bg-amber-400/5 p-4 text-sm text-amber-200">Availability to reconfirm</div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted mb-1">{soldOut ? 'Original lot quantity' : 'Listed stock'}</div>
                  <div className="text-2xl font-bold">{item.quantity.toLocaleString()} pcs</div>
                </div>
                <div>
                  <div className="text-sm text-muted mb-1">{soldOut ? 'Previous MOQ' : 'Minimum order (MOQ)'}</div>
                  <div className="text-lg font-semibold">{item.moq.toLocaleString()} pcs</div>
                </div>
                <div>
                  <div className="text-sm text-muted mb-1">Target Market</div>
                  <div className="text-lg font-semibold">
                    {item.market || 'Available on inquiry'}
                  </div>
                </div>
                {featuredMarkets.length > 0 && (
                  <div>
                    <div className="text-sm text-muted mb-1">Featured Markets</div>
                    <div className="text-lg font-semibold">
                      {featuredMarkets.join(' / ')}
                    </div>
                  </div>
                )}
                {item.market_access_note && (
                  <div>
                    <div className="text-sm text-muted mb-1">Market Access Note</div>
                    <div className="text-sm font-medium text-foreground whitespace-pre-wrap">
                      {item.market_access_note}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted mb-1">{soldOut ? 'Original warehouse' : 'Warehouse'}</div>
                  <div className="text-lg font-semibold">
                    {item.warehouse_location || 'Available on inquiry'}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="text-sm text-muted mb-1">{soldOut ? 'Previous unit price' : 'Wholesale price'}</div>
                  {isInquiryOnly ? (
                    <div className="text-2xl font-bold text-foreground">
                      Pricing on Request
                    </div>
                  ) : unlocked ? (
                    <div className="text-4xl font-bold text-teal-DEFAULT">
                      ${item.price!.toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-foreground">
                      {soldOut ? 'On inquiry' : 'Contact for price'}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <ContactButtons 
                  sourcePageType="inventory"
                  sourcePageSlug={item.slug}
                  itemSlug={item.slug}
                  primaryLabel={soldOut ? 'Ask about restock via Telegram' : 'Request quote via Telegram'}
                  message={buildInventoryInquiry(item)}
                />

                {item.pricing_note && (
                  <p className="text-xs text-center text-muted">
                    {item.pricing_note}
                  </p>
                )}

                {verifiedDate && (
                  <p className="text-xs text-center text-muted mt-4">{soldOut ? 'Original lot last confirmed' : 'Last confirmed'}: {verifiedDate}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-border pt-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Wholesale Stock Offer FAQ</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {inventoryFaqs.map((faq) => (
            <div key={faq.question} className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
              <p className="text-sm text-muted">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {relatedItems.length > 0 && (
        <div className="mt-16 pt-16 border-t border-border">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold">Related Stock Offers</h2>
              <p className="text-muted mt-1">
                {item.market
                  ? `Other active stock offers aligned with ${primaryMarketLabel || item.market} buyers or from ${item.brand}.`
                  : `Other active stock offers from ${item.brand}.`}
              </p>
            </div>
            {marketSlug ? (
              <Link href={`/market/${marketSlug}`} className="text-teal-DEFAULT font-medium hover:text-teal-hover hidden sm:block">
                View All →
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedItems.map((relatedItem) => (
              <InventoryCard key={relatedItem.id} item={relatedItem} />
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
