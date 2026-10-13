import ContactButtons from '@/components/contact/ContactButtons'
import InventoryCard from '@/components/inventory/InventoryCard'
import type { PublicInventoryRecord } from '@/lib/inventory'
import { sortInventoryByAvailability } from '@/lib/inventory-lifecycle'

export default function InventoryCollection({ items, sourcePageType, sourcePageSlug, sourcingContext }: {
  items: PublicInventoryRecord[]
  sourcePageType: 'brand' | 'market' | 'price'
  sourcePageSlug: string
  sourcingContext: string
}) {
  const ordered = sortInventoryByAvailability(items)
  const available = ordered.filter((item) => item.status === 'active')
  const sold = ordered.filter((item) => item.status === 'sold')

  return (
    <div className="space-y-10">
      <section aria-labelledby="available-stock-title">
        <div className="mb-6 border-b border-border pb-4">
          <h2 id="available-stock-title" className="text-2xl font-bold">Available stock <span className="text-muted">({available.length})</span></h2>
        </div>
        {available.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((item) => <InventoryCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
            <h3 className="text-lg font-semibold">No available stock listed</h3>
            <p className="mt-2 text-sm text-muted">Send your model, quantity and warehouse requirements.</p>
            <div className="mt-6 max-w-sm">
              <ContactButtons sourcePageType={sourcePageType} sourcePageSlug={sourcePageSlug}
                primaryLabel="Request stock via Telegram"
                message={`Hi VapeStockHub, I'm sourcing ${sourcingContext}. Please confirm available stock, pricing, MOQ and warehouse options.`} />
            </div>
          </div>
        )}
      </section>
      {sold.length > 0 && (
        <section aria-labelledby="past-stock-title">
          <div className="mb-6 border-b border-border pb-4">
            <h2 id="past-stock-title" className="text-2xl font-bold">Past stock <span className="text-muted">({sold.length})</span></h2>
            <p className="mt-2 text-sm text-muted">Sold-out lots. Restock and alternatives on inquiry.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sold.map((item) => <InventoryCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
    </div>
  )
}
