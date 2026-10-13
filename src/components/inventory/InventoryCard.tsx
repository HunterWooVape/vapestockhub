import Image from 'next/image'
import Link from 'next/link'

import { getInventoryFeaturedMarkets } from '@/lib/inventory-markets'
import { buildInventoryImageAlt, getInventoryImageSrc, hasRealInventoryImage, type InventoryRecord } from '@/lib/inventory'
import { hasPublicPrice, isSoldOut, needsAvailabilityConfirmation } from '@/lib/inventory-lifecycle'

export interface InventoryItem {
  id: string
  slug: string
  title: string
  brand: string
  market: string
  product_type: string
  flavor: string | null
  nicotine: string | null
  puff: number | null
  pricing_mode: 'exact_price' | 'inquiry_only'
  pricing_note: string | null
  price: number | null
  quantity: number
  moq: number
  warehouse_location: string
  images: string[] | null
  featured_markets?: string[] | null
  contact_visibility: 'public' | 'contact_required'
  is_urgent_clearance: boolean | null
  is_featured?: boolean | null
  status: InventoryRecord['status']
  last_verified_at?: string | null
}

export default function InventoryCard({ item }: { item: InventoryItem }) {
  const soldOut = isSoldOut(item)
  const reconfirm = needsAvailabilityConfirmation({ status: item.status, last_verified_at: item.last_verified_at ?? null })
  const isInquiryOnly = item.pricing_mode === 'inquiry_only'
  const hasRealImage = hasRealInventoryImage(item.images)
  const featuredMarkets = getInventoryFeaturedMarkets(item).slice(0, 2)

  return (
    <div className="relative rounded-xl border border-border bg-surface flex flex-col overflow-hidden group hover:border-teal-DEFAULT/50 transition-colors">
      <Link href={`/inventory/${item.slug}`} className="flex flex-col h-full">
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full bg-black/20 overflow-hidden">
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {soldOut ? (
              <span className="rounded border border-white/15 bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground">Sold out</span>
            ) : reconfirm ? (
              <span className="rounded border border-amber-400/30 bg-background/95 px-2 py-1 text-xs font-medium text-amber-200">Availability to reconfirm</span>
            ) : item.is_featured ? (
              <span className="rounded bg-teal-DEFAULT px-2 py-1 text-xs font-semibold text-background">Featured</span>
            ) : null}
            {!soldOut && !reconfirm && item.is_urgent_clearance && (
              <div className="text-xs font-bold text-background bg-status-error px-2 py-1 rounded shadow-lg">
                Clearance
              </div>
            )}
          </div>
          
          {/* Warehouse Location - Bottom Right of Image */}
          <div className="absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-sm flex items-center gap-1">
            <span className="text-teal-DEFAULT">Warehouse:</span>
            <span className="max-w-[150px] truncate">{item.warehouse_location || 'On inquiry'}</span>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1 gap-4">
          <div className="flex gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-DEFAULT bg-teal-DEFAULT/10 px-2 py-0.5 rounded">
              {item.brand}
            </span>
            {item.market && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-surface border border-border px-2 py-0.5 rounded">
                {item.market}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-bold line-clamp-2 group-hover:text-teal-DEFAULT transition-colors">
            {item.title}
          </h3>

          {featuredMarkets.length > 0 && (
            <p className="text-xs text-muted line-clamp-2">
              Featured for {featuredMarkets.join(', ')}
            </p>
          )}
          
          {/* Price and Quantity Section */}
          <div className="flex justify-between items-end mt-auto pt-4 border-t border-border">
            <div>
              <div className="text-xs text-muted mb-1">{soldOut ? 'Previous unit price' : 'Unit price'}</div>
              {hasPublicPrice(item) ? (
                <div className={`text-xl font-bold ${soldOut ? 'text-muted' : 'text-teal-DEFAULT'}`}>${item.price!.toFixed(2)}</div>
              ) : (
                <div className="text-sm font-semibold text-foreground">{soldOut ? 'On inquiry' : isInquiryOnly ? 'Price on request' : 'Contact for price'}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-muted mb-1">{soldOut ? 'Availability' : 'Available stock'}</div>
              <div className="text-base font-bold text-foreground">{soldOut ? 'Sold out' : `${item.quantity.toLocaleString()} pcs`}</div>
              <div className="text-[10px] text-muted mt-1">{soldOut ? 'Restock / alternatives →' : `MOQ: ${item.moq.toLocaleString()}`}</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
