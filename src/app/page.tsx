import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import InventoryCard from '@/components/inventory/InventoryCard'
import type { InventoryRecord } from '@/lib/inventory'
import { getTrackedContactHref } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Wholesale Disposable Vapes & Clearance Stock | VapeStockHub',
  description: 'Source wholesale disposable vapes, clearance stock, and bulk vape offers by brand, price range, market, and warehouse. Request live price and availability via Telegram or WhatsApp.',
}

export default async function Home() {
  const supabase = await createClient()
  
  // Fetch featured active inventory
  const { data: featuredInventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('last_verified_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)

  const featuredItems = (featuredInventory ?? []) as InventoryRecord[]
  const featuredIds = featuredItems.map((item) => item.id)

  // Fetch latest active inventory
  const { data: latestInventory, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .order('last_verified_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    console.error('Error fetching inventory (check RLS policies):', error)
  }

  const latestItems = ((latestInventory ?? []) as InventoryRecord[])
    .filter((item) => !featuredIds.includes(item.id))
    .slice(0, 3)

  return (
    <main className="flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 flex flex-col items-center justify-center text-center bg-surface border-b border-border">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Wholesale Disposable Vapes & <span className="text-teal-DEFAULT">Clearance Stock</span>
          </h1>
          <p className="text-xl text-muted">
            Browse active disposable vape stock, clearance-ready offers, and bulk wholesale listings by brand, price range, market, and warehouse.
          </p>
          <p className="text-sm text-muted max-w-2xl mx-auto">
            Send a direct inquiry to confirm live price, MOQ, and availability through WhatsApp or Telegram.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/inventory" className="px-6 py-3 rounded-lg bg-teal-DEFAULT text-background font-semibold hover:bg-teal-hover transition-colors">
              Browse Wholesale Stock
            </Link>
            <a href={getTrackedContactHref({ channel: 'telegram', sourcePageType: 'home', sourcePageSlug: 'hero' })} className="px-6 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-background transition-colors">
              Request Bulk Quote
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="w-full py-12 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/market" className="p-6 rounded-2xl border border-border bg-surface hover:border-teal-DEFAULT/50 transition-colors group">
            <h3 className="text-lg font-bold group-hover:text-teal-DEFAULT transition-colors">Browse by Market →</h3>
            <p className="text-muted text-sm mt-2">Find wholesale vape stock for your target market, sourcing route, and current regional demand.</p>
          </Link>
          <Link href="/brand" className="p-6 rounded-2xl border border-border bg-surface hover:border-teal-DEFAULT/50 transition-colors group">
            <h3 className="text-lg font-bold group-hover:text-teal-DEFAULT transition-colors">Browse by Brand →</h3>
            <p className="text-muted text-sm mt-2">Compare active wholesale inventory from brands currently available for inquiry and bulk sourcing.</p>
          </Link>
          <Link href="/price" className="p-6 rounded-2xl border border-teal-DEFAULT/30 bg-teal-DEFAULT/5 hover:border-teal-DEFAULT transition-colors group relative overflow-hidden">
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-DEFAULT animate-pulse"></div>
            <h3 className="text-lg font-bold group-hover:text-teal-DEFAULT transition-colors">Browse by Price →</h3>
            <p className="text-muted text-sm mt-2">Screen bulk disposable vape stock by unit price, margin target, and clearance potential.</p>
          </Link>
        </div>
      </section>
      
      {/* Featured Deals Section */}
      {featuredItems.length > 0 && (
        <section className="w-full py-12 px-4 max-w-7xl mx-auto border-b border-border">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-orange-500">🔥</span> Featured Inventory
              </h2>
              <p className="text-muted mt-1">Selected wholesale vape listings with active stock, clear MOQ signals, and strong inquiry potential.</p>
            </div>
            <Link href="/inventory" className="text-teal-DEFAULT font-medium hover:text-teal-hover hidden sm:block">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Inventory Section */}
      <section className="w-full py-12 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold">Latest Active Inventory</h2>
            <p className="text-muted mt-1">Recently verified wholesale listings with current availability, MOQ, market fit, and inquiry-ready stock.</p>
          </div>
          <Link href="/inventory" className="text-teal-DEFAULT font-medium hover:text-teal-hover hidden sm:block">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestItems.map((item) => (
            <InventoryCard key={item.id} item={item} />
          ))}
          
          {latestItems.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted border border-dashed border-border rounded-xl">
              No active inventory is available right now. Please check back later.
            </div>
          )}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full py-16 px-4 bg-surface border-t border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How VapeStockHub Works</h2>
            <p className="text-muted max-w-2xl mx-auto">A streamlined B2B workflow for buyers who need to move from wholesale inventory discovery to direct supplier inquiry fast.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-teal-DEFAULT/10 text-teal-DEFAULT rounded-full flex items-center justify-center text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Find Active Stock</h3>
              <p className="text-muted">Browse current wholesale inventory by market, brand, or price band and focus on listings that match your sourcing target.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-teal-DEFAULT/10 text-teal-DEFAULT rounded-full flex items-center justify-center text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Review Key Terms</h3>
              <p className="text-muted">Check quantity, MOQ, warehouse, market fit, and price visibility before deciding which inventory to pursue.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-teal-DEFAULT/10 text-teal-DEFAULT rounded-full flex items-center justify-center text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Send Your Inquiry</h3>
              <p className="text-muted">Open Telegram or WhatsApp with pre-filled context, confirm availability, and continue the deal discussion directly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted">Key details for buyers using VapeStockHub to source wholesale inventory and move into direct inquiry.</p>
        </div>
        <div className="space-y-6">
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">Where can I find cheap disposable vapes in bulk?</h3>
            <p className="text-muted">
              Start from the <Link href="/price/under-3" className="text-teal-DEFAULT hover:text-teal-hover">budget and clearance price band</Link>, then confirm MOQ, live price, remaining quantity, and warehouse availability before sourcing.
            </p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">Do you offer wholesale disposable vapes for bulk buyers?</h3>
            <p className="text-muted">Yes. VapeStockHub is built for B2B buyers reviewing wholesale disposable vape stock, MOQ, price visibility, market fit, and direct inquiry options.</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">Why do some vape listings mention Shenzhen, China, or overseas warehouses?</h3>
            <p className="text-muted">Warehouse and supply-side context helps buyers understand where active stock is held before asking about live availability, lead time, and sourcing fit.</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">Can I request live price and availability before ordering?</h3>
            <p className="text-muted">Yes. Open Telegram or WhatsApp from any listing to confirm live price, MOQ, remaining stock, warehouse location, and final commercial terms.</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">Are these listings for retail checkout?</h3>
            <p className="text-muted">No. VapeStockHub is an inventory discovery and inquiry-routing platform for lawful B2B sourcing conversations, not a retail cart or checkout store.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
