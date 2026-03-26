import Link from 'next/link'

import { getInventoryImageSrc } from '@/lib/inventory'

export interface InventoryItem {
  id: string
  slug: string
  title: string
  brand: string
  market: string
  flavor: string | null
  nicotine: string | null
  puff: number | null
  price: number
  quantity: number
  moq: number
  warehouse_location: string
  images: string[] | null
  contact_visibility: 'public' | 'contact_required'
  is_urgent_clearance: boolean | null
  is_featured?: boolean | null
}

export default function InventoryCard({ item }: { item: InventoryItem }) {
  const isHot = item.is_featured || item.quantity < 5000;

  return (
    <div className="relative rounded-xl border border-border bg-surface flex flex-col overflow-hidden group hover:border-teal-DEFAULT/50 hover:shadow-[0_0_20px_rgba(34,199,169,0.1)] transition-all">
      <Link href={`/inventory/${item.slug}`} className="flex flex-col h-full">
        {/* Image Section */}
        <div className="relative w-full h-48 bg-black/20 overflow-hidden">
          <img
            src={getInventoryImageSrc(item.images)}
            alt={item.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isHot && (
              <div className="text-xs font-bold text-background bg-orange-500 px-2 py-1 rounded shadow-lg flex items-center gap-1 animate-pulse">
                🔥 High Demand
              </div>
            )}
            {item.is_urgent_clearance && (
              <div className="text-xs font-bold text-background bg-status-error px-2 py-1 rounded shadow-lg">
                ⚡ Clearance
              </div>
            )}
          </div>
          
          {/* Warehouse Location - Bottom Right of Image */}
          <div className="absolute bottom-3 right-3 text-[11px] font-semibold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-sm flex items-center gap-1">
            <span className="text-teal-DEFAULT">📍</span> {item.warehouse_location}
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1 gap-4">
          <div className="flex gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-DEFAULT bg-teal-DEFAULT/10 px-2 py-0.5 rounded">
              {item.brand}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-surface border border-border px-2 py-0.5 rounded">
              {item.market}
            </span>
          </div>
          
          <h3 className="text-lg font-bold line-clamp-2 group-hover:text-teal-DEFAULT transition-colors">
            {item.title}
          </h3>
          
          {/* Price and Quantity Section */}
          <div className="flex justify-between items-end mt-auto pt-4 border-t border-border">
            <div>
              <div className="text-xs text-muted mb-1">Unit Price</div>
              {item.contact_visibility === 'contact_required' ? (
                <div className="text-sm font-bold text-foreground bg-surface border border-border px-2 py-1 rounded">
                  🔒 Contact to View
                </div>
              ) : (
                <div className="text-xl font-bold text-teal-DEFAULT">${item.price.toFixed(2)}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-muted mb-1">Available Stock</div>
              <div className="text-base font-bold text-foreground">{item.quantity.toLocaleString()} pcs</div>
              <div className="text-[10px] text-muted mt-1">MOQ: {item.moq}</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
