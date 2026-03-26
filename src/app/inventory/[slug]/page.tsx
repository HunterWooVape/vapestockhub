import { createClient } from '@/lib/supabase/server'
import ContactButtons from '@/components/contact/ContactButtons'
import { getInventoryImageSrc } from '@/lib/inventory'
import { siteConfig } from '@/lib/site'
import { isPriceUnlocked, unlockedItemsCookieName } from '@/lib/unlock'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import InventoryCard from '@/components/inventory/InventoryCard'
import { InventoryRecord } from '@/lib/inventory'

// Add cache control to ensure we get fresh data but don't overwhelm the DB
export const revalidate = 3600 // revalidate every hour

// Dynamically generate SEO metadata based on the inventory item
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()
  
  const { data: item } = await supabase
    .from('inventory')
    .select('title, brand, market, description')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!item) {
    return { title: 'Not Found | VapeStockHub' }
  }

  return {
    title: `${item.title} Wholesale in ${item.market} | VapeStockHub`,
    description: item.description || `Wholesale stock for ${item.title} by ${item.brand} available in ${item.market}.`,
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
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  const { data: item, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single()

  if (error || !item) {
    notFound()
  }

  const unlocked = item.contact_visibility === 'public'
    ? true
    : isPriceUnlocked(cookieStore.get(unlockedItemsCookieName)?.value, item.slug)

  // FOMO random values (deterministic based on item ID so it doesn't flicker on re-render)
  const charSum = item.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
  const viewersCount = (charSum % 15) + 3 // 3 to 17 viewers
  const inquiryCount = (charSum % 8) + 1  // 1 to 8 inquiries
  const isHot = item.is_featured || item.quantity < 5000

  // Flavor Tags Logic
  const flavorList = item.flavor ? item.flavor.split(',').map((f: string) => f.trim()).filter(Boolean) : []
  const displayFlavors = flavorList.slice(0, 6)
  const extraFlavorsCount = flavorList.length - 6

  // Fetch Related Products (same brand or same market, excluding current item)
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
          <Link href={`/brand/${item.brand.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-teal-DEFAULT transition-colors font-medium">{item.brand}</Link>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Image */}
          <div className="aspect-[4/3] bg-surface rounded-2xl border border-border overflow-hidden relative flex items-center justify-center">
            <img
              src={getInventoryImageSrc(item.images)}
              alt={item.title}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Specifications Grid */}
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-6">Product Specifications</h2>
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
            </div>

            {/* Flavor Tags Section */}
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

          {/* Description / Inventory Manifest */}
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

        {/* Right Column: Pricing & Contact (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
              {isHot && (
                <div className="mb-6 flex items-center gap-3 text-sm font-medium text-orange-500 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                  <span className="animate-pulse">👁️</span>
                  <span>{viewersCount} buyers are viewing this deal right now.</span>
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
                  primaryLabel={unlocked ? 'Request Better Offer via Telegram' : 'Unlock Price via Telegram'}
                  message={`Hi VapeStockHub, I'm interested in the [${item.title}] (Market: ${item.market}). Could you share the wholesale price and availability?`}
                />
                
                {!unlocked && (
                  <p className="text-xs text-center text-muted">
                    We unlock the price after your contact request so you can continue browsing without logging in.
                  </p>
                )}
                
                {unlocked && inquiryCount > 0 && (
                  <p className="text-xs text-center text-orange-500 font-medium">
                    🔥 {inquiryCount} inquiries received in the last 24 hours. Inventory moves fast!
                  </p>
                )}
                
                <p className="text-xs text-center text-muted mt-4">
                  Last verified: {new Date(item.last_verified_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedItems.length > 0 && (
        <div className="mt-16 pt-16 border-t border-border">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold">Similar Wholesale Deals</h2>
              <p className="text-muted mt-1">Other stock available for {item.market} or from {item.brand}.</p>
            </div>
            <Link href={`/inventory?market=${item.market.toLowerCase().replace(/\s+/g, '-')}`} className="text-teal-DEFAULT font-medium hover:text-teal-hover hidden sm:block">
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
