import { createClient } from '@/lib/supabase/server'
import ContactButtons from '@/components/contact/ContactButtons'
import { getInventoryImageSrc, InventoryRecord, toSlug } from '@/lib/inventory'
import { siteConfig } from '@/lib/site'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Metadata } from 'next'
import InventoryCard from '@/components/inventory/InventoryCard'
import { cache } from 'react'

// Add cache control to ensure we get fresh data but don't overwhelm the DB
export const revalidate = 3600 // revalidate every hour

const getInventoryItem = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory')
    .select('*')
    .eq('slug', slug)
    .single()

  return (data ?? null) as InventoryRecord | null
})

function buildInventoryMetadataDescription(item: InventoryRecord) {
  const summaryParts = [
    `${item.brand} wholesale stock offer`,
    `available for ${item.market}`,
    `${item.quantity.toLocaleString()} pcs in stock`,
    `MOQ ${item.moq.toLocaleString()} pcs`,
    `warehouse ${item.warehouse_location}`,
  ]

  if (item.puff) {
    summaryParts.splice(2, 0, `${item.puff.toLocaleString()} puffs`)
  }

  if (item.production_date_text) {
    summaryParts.push(`production ${item.production_date_text}`)
  }

  return `${summaryParts.join(', ')}.`
}

// Dynamically generate SEO metadata based on the inventory item
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const item = await getInventoryItem(resolvedParams.slug)

  if (!item) {
    return { title: 'Not Found | VapeStockHub' }
  }

  return {
    title: `${item.title} Wholesale Stock | ${item.market} | VapeStockHub`,
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

  const supabase = await createClient()

  const unlocked = item.contact_visibility === 'public'

  const isHot = item.is_featured || item.quantity < 5000
  const flavorList = item.flavor ? item.flavor.split(',').map((f: string) => f.trim()).filter(Boolean) : []
  const displayFlavors = flavorList.slice(0, 6)
  const extraFlavorsCount = flavorList.length - 6
  const brandSlug = toSlug(item.brand)
  const marketSlug = toSlug(item.market)

  const { data: relatedInventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .neq('id', item.id)
    .or(`brand.ilike.%${item.brand}%,market.ilike.%${item.market}%`)
    .order('created_at', { ascending: false })
    .limit(3)
    
  const relatedItems = (relatedInventory ?? []) as InventoryRecord[]

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/inventory" className="hover:text-foreground transition-colors">Inventory</Link>
          <span>/</span>
          <Link href={`/brand/${brandSlug}`} className="hover:text-teal-DEFAULT transition-colors font-medium">{item.brand}</Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center flex-wrap gap-4">
          {item.title}
          {item.status === 'active' && (
            <span className="text-sm font-medium px-3 py-1 bg-teal-DEFAULT/10 text-teal-DEFAULT rounded-full">
              Active Stock
            </span>
          )}
          {isHot && (
            <span className="text-sm font-bold px-3 py-1 bg-orange-500 text-background rounded-full animate-pulse shadow-lg flex items-center gap-1">
              🔥 High Demand
            </span>
          )}
        </h1>
        <p className="text-muted mt-4 max-w-3xl">
          Active wholesale stock offer for the {item.market} market with warehouse availability in {item.warehouse_location}. Review quantity, MOQ, and pricing terms before sending your inquiry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-[4/3] bg-surface rounded-2xl border border-border overflow-hidden relative flex items-center justify-center">
            <Image
              unoptimized
              src={getInventoryImageSrc(item.images)}
              alt={item.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
          </div>

          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-6">Inventory Specifications</h2>
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
                  <span>Available Flavors ({flavorList.length})</span>
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
              <h2 className="text-xl font-bold mb-4">Inventory Manifest & Details</h2>
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
              {isHot && (
                <div className="mb-6 flex items-center gap-3 text-sm font-medium text-orange-500 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                  <span>Hot</span>
                  <span>Fast-moving stock. Send your inquiry early to confirm remaining availability.</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted mb-1">Available Quantity</div>
                  <div className="text-2xl font-bold">{item.quantity.toLocaleString()} pcs</div>
                </div>
                <div>
                  <div className="text-sm text-muted mb-1">Minimum Order (MOQ)</div>
                  <div className="text-lg font-semibold">{item.moq.toLocaleString()} pcs</div>
                </div>
                <div>
                  <div className="text-sm text-muted mb-1">Target Market / Location</div>
                  <div className="text-lg font-semibold flex items-center gap-2">
                    {item.market} <span className="text-muted text-sm font-normal">({item.warehouse_location})</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="text-sm text-muted mb-1">Wholesale Price</div>
                  {unlocked ? (
                    <div className="text-4xl font-bold text-teal-DEFAULT">
                      ${item.price.toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-foreground">
                      Contact to Unlock
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <ContactButtons 
                  sourcePageType="inventory"
                  sourcePageSlug={item.slug}
                  itemSlug={item.slug}
                  primaryLabel={unlocked ? 'Request Availability via Telegram' : 'Contact for Price via Telegram'}
                  message={`Hi VapeStockHub, I'm interested in the [${item.title}] (Market: ${item.market}). Could you share the wholesale price and availability?`}
                />

                {!unlocked && (
                  <p className="text-xs text-center text-muted">
                    Pricing is shared during direct contact so current stock and terms can be confirmed together.
                  </p>
                )}

                <p className="text-xs text-center text-muted mt-4">
                  Last verified on {new Date(item.last_verified_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedItems.length > 0 && (
        <div className="mt-16 pt-16 border-t border-border">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold">Related Inventory</h2>
              <p className="text-muted mt-1">Other active stock offers for the {item.market} market or from {item.brand}.</p>
            </div>
            <Link href={`/market/${marketSlug}`} className="text-teal-DEFAULT font-medium hover:text-teal-hover hidden sm:block">
              View All →
            </Link>
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
