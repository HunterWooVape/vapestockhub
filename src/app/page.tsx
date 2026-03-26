import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import InventoryCard from '@/components/inventory/InventoryCard'
import type { InventoryRecord } from '@/lib/inventory'
import { getTrackedContactHref } from '@/lib/site'

export default async function Home() {
  const supabase = await createClient()
  
  // Fetch featured active inventory
  const { data: featuredInventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch latest active inventory
  const { data: latestInventory, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error fetching inventory (check RLS policies):', error)
  }

  const featuredItems = (featuredInventory ?? []) as InventoryRecord[]
  const latestItems = (latestInventory ?? []) as InventoryRecord[]

  return (
    <main className="flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 flex flex-col items-center justify-center text-center bg-surface border-b border-border">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Global Vape Inventory <span className="text-teal-DEFAULT">Marketplace</span>
          </h1>
          <p className="text-xl text-muted">
            Connect with verified suppliers. Find the best wholesale prices and clearance deals across global markets.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/inventory" className="px-6 py-3 rounded-lg bg-teal-DEFAULT text-background font-semibold hover:bg-teal-hover transition-colors">
              Browse Inventory
            </Link>
            <a href={getTrackedContactHref({ channel: 'telegram', sourcePageType: 'home', sourcePageSlug: 'hero' })} className="px-6 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-background transition-colors">
              Join Telegram
            </a>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="w-full py-12 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/market" className="p-6 rounded-2xl border border-border bg-surface hover:border-teal-DEFAULT/50 transition-colors group">
            <h3 className="text-lg font-bold group-hover:text-teal-DEFAULT transition-colors">Browse by Market →</h3>
            <p className="text-muted text-sm mt-2">Explore wholesale inventory for Middle East, LATAM, and Europe.</p>
          </Link>
          <Link href="/brand" className="p-6 rounded-2xl border border-border bg-surface hover:border-teal-DEFAULT/50 transition-colors group">
            <h3 className="text-lg font-bold group-hover:text-teal-DEFAULT transition-colors">Browse by Brand →</h3>
            <p className="text-muted text-sm mt-2">Top disposable vape brands including Vozol, Elf Bar, and Geek Bar.</p>
          </Link>
          <Link href="/price" className="p-6 rounded-2xl border border-teal-DEFAULT/30 bg-teal-DEFAULT/5 hover:border-teal-DEFAULT transition-colors group relative overflow-hidden">
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-DEFAULT animate-pulse"></div>
            <h3 className="text-lg font-bold group-hover:text-teal-DEFAULT transition-colors">Hot Clearance Deals →</h3>
            <p className="text-muted text-sm mt-2">Discover urgent clearance stock sorted by price tiers.</p>
          </Link>
        </div>
      </section>
      
      {/* Featured Deals Section */}
      {featuredItems.length > 0 && (
        <section className="w-full py-12 px-4 max-w-7xl mx-auto border-b border-border">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-orange-500">🔥</span> Featured Deals
              </h2>
              <p className="text-muted mt-1">Hand-picked wholesale opportunities with high margins.</p>
            </div>
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
            <p className="text-muted mt-1">Recently verified wholesale stock ready for dispatch.</p>
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
              No active inventory found. Please run the SQL migration to add test data.
            </div>
          )}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full py-16 px-4 bg-surface border-t border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How VapeStockHub Works</h2>
            <p className="text-muted max-w-2xl mx-auto">A streamlined B2B process designed to connect verified buyers with global wholesale inventory fast.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-teal-DEFAULT/10 text-teal-DEFAULT rounded-full flex items-center justify-center text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Find Your Stock</h3>
              <p className="text-muted">Browse live inventory by market, brand, or price tier. We only list verified active stock.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-teal-DEFAULT/10 text-teal-DEFAULT rounded-full flex items-center justify-center text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Contact Directly</h3>
              <p className="text-muted">Click the Telegram or WhatsApp button. A pre-filled message will open instantly in your app.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-teal-DEFAULT/10 text-teal-DEFAULT rounded-full flex items-center justify-center text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Negotiate & Close</h3>
              <p className="text-muted">Discuss shipping, MOQ, and final pricing 1-on-1. No platform fees or middleman markups.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted">Everything you need to know about sourcing wholesale vapes through our platform.</p>
        </div>
        <div className="space-y-6">
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">Are these products authentic?</h3>
            <p className="text-muted">Yes, we strictly verify our supply network. All inventory listed is 100% authentic and comes from reputable distributors or direct factory clearances.</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">What is the Minimum Order Quantity (MOQ)?</h3>
            <p className="text-muted">MOQs vary by deal. Standard wholesale orders typically start at 500-1000 units, but urgent clearance stock may require larger batch purchases. Check the individual product page for details.</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">How do I get the exact price?</h3>
            <p className="text-muted">Click the "Contact via Telegram" button on any product page. It will automatically generate a message for you. Once we receive your inquiry and target market, we will unlock the price for you.</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-bold mb-2">Do you handle shipping and customs?</h3>
            <p className="text-muted">Terms are typically EXW or FOB depending on the warehouse location. We can connect you with experienced freight forwarders for your specific market if needed.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
