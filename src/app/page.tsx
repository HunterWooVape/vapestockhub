import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import InventoryCard from '@/components/inventory/InventoryCard'
import type { InventoryRecord } from '@/lib/inventory'
import { getTrackedContactHref } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Global Wholesale Vape Inventory | VapeStockHub',
  description: 'Browse verified active wholesale vape stock by market, brand, and price range. Send a Telegram or WhatsApp inquiry to confirm pricing and availability.',
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
            Global <span className="text-teal-DEFAULT">Wholesale Vape Inventory</span>
          </h1>
          <p className="text-xl text-muted">
            Browse verified active stock by market, brand, and price range. Send a Telegram or WhatsApp inquiry to confirm pricing and availability.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/inventory" className="px-6 py-3 rounded-lg bg-teal-DEFAULT text-background font-semibold hover:bg-teal-hover transition-colors">
              Browse Inventory
            </Link>
            <a href={getTrackedContactHref({ channel: 'telegram', sourcePageType: 'home', sourcePageSlug: 'hero' })} className="px-6 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-background transition-colors">
              Request via Telegram
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="w-full py-12 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/market" className="p-6 rounded-2xl border border-border bg-surface hover:border-teal-DEFAULT/50 transition-colors group">
            <h3 className="text-lg font-bold group-hover:text-teal-DEFAULT transition-colors">Browse by Market →</h3>
            <p className="text-muted text-sm mt-2">Find active wholesale stock for target markets including Middle East, LATAM, and Eastern Europe.</p>
          </Link>
          <Link href="/brand" className="p-6 rounded-2xl border border-border bg-surface hover:border-teal-DEFAULT/50 transition-colors group">
            <h3 className="text-lg font-bold group-hover:text-teal-DEFAULT transition-colors">Browse by Brand →</h3>
            <p className="text-muted text-sm mt-2">Compare active listings from top disposable vape brands and bulk inventory lines.</p>
          </Link>
          <Link href="/price" className="p-6 rounded-2xl border border-teal-DEFAULT/30 bg-teal-DEFAULT/5 hover:border-teal-DEFAULT transition-colors group relative overflow-hidden">
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-DEFAULT animate-pulse"></div>
            <h3 className="text-lg font-bold group-hover:text-teal-DEFAULT transition-colors">Browse by Price →</h3>
            <p className="text-muted text-sm mt-2">Screen clearance and budget-aligned inventory by wholesale price band.</p>
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
              <p className="text-muted mt-1">Selected active listings with strong buyer demand and clear inquiry paths.</p>
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
            <p className="text-muted mt-1">Recently verified wholesale stock with current availability, MOQ, and market coverage.</p>
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
            <p className="text-muted max-w-2xl mx-auto">A streamlined B2B workflow built for buyers who need to move from inventory discovery to supplier inquiry quickly.</p>
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
            <h3 className="text-lg font-bold mb-2">How is inventory verified?</h3>
            <p className="text-muted">We review supplier-provided inventory information before listings go live and use verification timestamps to keep active stock current. Final transaction checks still happen directly during inquiry.</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">What is the Minimum Order Quantity (MOQ)?</h3>
            <p className="text-muted">MOQs vary by listing. Many wholesale offers start around 500-1000 units, while urgent clearance stock may require larger takeovers. Review each inventory page for listing-specific terms.</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">How do I get pricing and availability?</h3>
            <p className="text-muted">Open the Telegram or WhatsApp inquiry button on any inventory page. Your message includes the product context so pricing, quantity, and availability can be confirmed faster.</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">Why browse by market instead of only by brand?</h3>
            <p className="text-muted">Many buyers source by destination first. Market pages help you focus on inventory that is relevant to your target region, warehouse path, and current deal flow before you narrow by brand or price.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
