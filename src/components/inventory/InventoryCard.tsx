import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'

import { getInventoryFeaturedMarkets } from '@/lib/inventory-markets'
import { buildInventoryImageAlt, getInventoryImageSrc, hasRealInventoryImage, type InventoryRecord } from '@/lib/inventory'
import { hasPublicPrice, isSoldOut, needsAvailabilityConfirmation } from '@/lib/inventory-lifecycle'
import { publicMoq } from '@/lib/inventory-public-fields'

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
  moq: number | null
  moq_public?: boolean
  warehouse_location: string
  images: string[] | null
  featured_markets?: string[] | null
  contact_visibility: 'public' | 'contact_required'
  is_urgent_clearance: boolean | null
  is_featured?: boolean | null
  status: InventoryRecord['status']
  last_verified_at?: string | null
}

export default function InventoryCard({ item, layout = 'grid' }: { item: InventoryItem; layout?: 'grid' | 'row' }) {
  const soldOut = isSoldOut(item)
  const reconfirm = needsAvailabilityConfirmation({ status: item.status, last_verified_at: item.last_verified_at ?? null })
  const isInquiryOnly = item.pricing_mode === 'inquiry_only'
  const hasRealImage = hasRealInventoryImage(item.images)
  const featuredMarkets = getInventoryFeaturedMarkets(item).slice(0, 2)
  const imageAlt = buildInventoryImageAlt({ title: item.title, brand: item.brand, productType: item.product_type, hasRealImage })
  const badges = (
    <>
      {soldOut ? (
        <span className="rounded-md border border-white/15 bg-background/95 px-2.5 py-1 text-[10px] font-semibold text-foreground">Sold out</span>
      ) : reconfirm ? (
        <span className="rounded-md border border-amber-400/30 bg-background/95 px-2.5 py-1 text-[10px] font-medium text-amber-200">Availability to reconfirm</span>
      ) : item.is_featured ? (
        <span className="rounded-md border border-teal-DEFAULT/30 bg-background/95 px-2.5 py-1 text-[10px] font-semibold text-teal-DEFAULT">Featured</span>
      ) : null}
      {!soldOut && !reconfirm && item.is_urgent_clearance && (
        <span className="rounded-md bg-status-error px-2.5 py-1 text-[10px] font-bold text-background">Clearance</span>
      )}
    </>
  )
  const price = hasPublicPrice(item) ? (
    <span className={`text-xl font-semibold tabular-nums ${soldOut ? 'text-muted' : 'text-teal-DEFAULT'}`}>${item.price!.toFixed(2)}</span>
  ) : (
    <span className="text-sm font-semibold text-foreground">{soldOut ? 'On inquiry' : isInquiryOnly ? 'Price on request' : 'Contact for price'}</span>
  )

  if (layout === 'row') {
    return (
      <article data-card-layout="row" data-inventory-id={item.id} className="group overflow-hidden rounded-xl border border-border border-l-2 border-l-teal-DEFAULT/50 bg-surface transition-colors hover:border-teal-DEFAULT/50 focus-within:ring-2 focus-within:ring-teal-DEFAULT motion-reduce:transition-none">
        <Link href={`/inventory/${item.slug}`} className="grid h-full grid-cols-[92px_minmax(0,1fr)] outline-none sm:grid-cols-[140px_minmax(0,1fr)] md:grid-cols-[180px_minmax(0,1fr)_180px] lg:grid-cols-[200px_minmax(0,1fr)_184px]">
          <div className="relative min-h-40 overflow-hidden border-r border-border bg-background md:min-h-52">
            <Image unoptimized src={getInventoryImageSrc(item.images)} alt={imageAlt} fill sizes="(max-width: 639px) 92px, (max-width: 767px) 140px, (max-width: 1023px) 180px, 200px" className="object-contain" />
          </div>
          <div className="min-w-0 px-3 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-DEFAULT">{item.brand}</span>
              <span className="flex flex-wrap gap-1.5">{badges}</span>
            </div>
            <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-tight tracking-tight group-hover:text-teal-DEFAULT sm:text-2xl">{item.title}</h3>
            <p className="mt-1 text-[11px] text-muted">{item.product_type}{item.market ? ` / ${item.market}` : ''}</p>
            <p className="mt-3 flex min-w-0 items-start gap-1.5 text-[11px] text-muted"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span className="break-words">{item.warehouse_location || 'On inquiry'}</span></p>
            {featuredMarkets.length > 0 && <p className="mt-2 text-[11px] text-muted">Featured for {featuredMarkets.join(', ')}</p>}
            <div className="mt-3 grid max-w-xs grid-cols-2 gap-3 border-t border-border pt-3 tabular-nums">
              <div><p className="text-[10px] text-muted">{soldOut ? 'Availability' : 'Available stock'}</p><p className="mt-1 text-sm font-semibold sm:text-base">{soldOut ? 'Sold out' : `${item.quantity.toLocaleString()} pcs`}</p></div>
              {publicMoq(item) && <div><p className="text-[10px] text-muted">MOQ</p><p className="mt-1 text-sm font-semibold sm:text-base">{publicMoq(item)!.toLocaleString()}</p></div>}
            </div>
          </div>
          <div className="col-span-2 flex items-center justify-between gap-4 border-t border-border bg-background/25 px-4 py-3 md:col-span-1 md:flex-col md:items-start md:justify-center md:border-t-0 md:border-l md:px-5 md:py-5">
            <div><p className="mb-1 text-[10px] text-muted">{soldOut ? 'Previous unit price' : 'Unit price'}</p>{price}</div>
            <ArrowUpRight className="size-5 text-muted group-hover:text-teal-DEFAULT" aria-hidden="true" />
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article data-card-layout="grid" data-inventory-id={item.id} className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-teal-DEFAULT/50 focus-within:ring-2 focus-within:ring-teal-DEFAULT motion-reduce:transition-none">
      <Link href={`/inventory/${item.slug}`} className="flex h-full flex-col outline-none">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-background sm:aspect-[3/2]">
          <Image unoptimized src={getInventoryImageSrc(item.images)} alt={imageAlt} fill sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw" className="object-cover" />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-2">{badges}</div>
          <div className="absolute bottom-3 left-3 right-3 flex min-w-0 items-center gap-1.5 rounded-md border border-white/10 bg-background/90 px-2.5 py-2 text-[11px] text-foreground">
            <MapPin className="size-3.5 shrink-0 text-muted" aria-hidden="true" /><span className="shrink-0 text-muted">Warehouse:</span><span className="truncate">{item.warehouse_location || 'On inquiry'}</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]"><span className="font-bold uppercase tracking-widest text-teal-DEFAULT">{item.brand}</span>{item.market && <span className="text-muted">{item.market}</span>}</div>
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight group-hover:text-teal-DEFAULT">{item.title}</h3>
          {featuredMarkets.length > 0 && <p className="line-clamp-2 text-xs text-muted">Featured for {featuredMarkets.join(', ')}</p>}
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
            <div className="min-w-0"><p className="mb-1 text-[10px] text-muted">{soldOut ? 'Previous unit price' : 'Unit price'}</p>{price}</div>
            <div className="shrink-0 text-right tabular-nums"><p className="mb-1 text-[10px] text-muted">{soldOut ? 'Availability' : 'Available stock'}</p><p className="text-sm font-semibold">{soldOut ? 'Sold out' : `${item.quantity.toLocaleString()} pcs`}</p>{(soldOut || publicMoq(item)) && <p className="mt-1 text-[10px] text-muted">{soldOut ? 'Restock / alternatives →' : `MOQ: ${publicMoq(item)!.toLocaleString()}`}</p>}</div>
          </div>
        </div>
      </Link>
    </article>
  )
}
