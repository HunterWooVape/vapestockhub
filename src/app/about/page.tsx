import Link from 'next/link'

import TrustCenterLinks from '@/components/site/TrustCenterLinks'

export const metadata = {
  title: 'About VapeStockHub | B2B Wholesale Inventory Platform',
  description: 'Learn how VapeStockHub helps B2B buyers discover active wholesale vape inventory, review stock context, and move into direct Telegram or WhatsApp inquiry.',
}

const operatingPrinciples = [
  'Inventory-first: we organize active stock, not generic catalog copy.',
  'B2B-only: the platform is designed for wholesalers, distributors, and trade buyers rather than retail consumers.',
  'Inquiry-driven: Telegram, WhatsApp, and email are used to move qualified interest into direct discussion.',
  'Operational clarity: pages emphasize MOQ, availability, market fit, and inventory context over hype.',
]

export default function AboutPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-DEFAULT/80">
          Platform Overview
        </p>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold">
          About <span className="text-teal-DEFAULT">VapeStockHub</span>
        </h1>
        <p className="mt-4 text-lg text-muted max-w-3xl">
          VapeStockHub is a B2B wholesale inventory platform built for trade buyers who need faster access to active vape stock, clearer inventory context, and a direct inquiry path to suppliers.
        </p>
        <p className="mt-4 text-muted max-w-3xl">
          We focus on wholesale listings, clearance opportunities, and market-aware inventory discovery. The goal is simple: help legitimate business buyers review stock signals quickly and move into private negotiation with better context.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold">What the Platform Does</h2>
          <p className="text-muted">
            We organize inventory into searchable pages by brand, market, price band, and listing detail so buyers can review current wholesale opportunities without digging through fragmented supplier messages.
          </p>
          <p className="text-muted">
            We also route qualified interest into direct channels such as Telegram, WhatsApp, and email, where actual pricing, availability, and commercial terms can be confirmed.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold">What the Platform Does Not Do</h2>
          <p className="text-muted">
            VapeStockHub is not a retail checkout site, payment processor, or consumer-facing nicotine store. It does not replace independent due diligence by buyers or suppliers.
          </p>
          <p className="text-muted">
            Platform visibility does not equal regulatory approval, legal clearance, or transaction guarantee in any jurisdiction. Commercial parties remain responsible for lawful trade decisions.
          </p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-5">
        <h2 className="text-2xl font-bold">How VapeStockHub Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-bold">1. Browse active inventory</h3>
            <p className="mt-2 text-sm text-muted">
              Buyers start from inventory, brand, market, or price pages to identify listings that match their sourcing priorities.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-bold">2. Review trade context</h3>
            <p className="mt-2 text-sm text-muted">
              Listing pages highlight the commercial details that matter most in B2B trade, including MOQ, available stock, pricing mode, and target-market fit.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-bold">3. Start direct inquiry</h3>
            <p className="mt-2 text-sm text-muted">
              Once a listing looks relevant, buyers can move into Telegram, WhatsApp, or email with the page context already attached to the inquiry route.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-bold">4. Confirm terms offline</h3>
            <p className="mt-2 text-sm text-muted">
              Final pricing, stock confirmation, logistics, and compliance decisions are handled directly between the commercial parties outside the public listing page.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-bold">Operating Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operatingPrinciples.map((principle) => (
            <div key={principle} className="rounded-xl border border-border bg-background p-5">
              <p className="text-sm text-muted">{principle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-10">
        <h2 className="text-2xl font-bold">Need a Business Conversation?</h2>
        <p className="mt-3 max-w-3xl text-muted">
          If you want to understand how to use the platform, how inventory inquiry works, or how to route a wholesale request correctly, use the contact page to start with the fastest channel.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-teal-DEFAULT px-5 py-3 font-bold text-background transition-colors hover:bg-teal-hover"
          >
            Go to Contact
          </Link>
          <Link
            href="/inventory"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 font-medium text-foreground transition-colors hover:bg-surface"
          >
            Browse Inventory
          </Link>
        </div>
      </section>

      <TrustCenterLinks currentPage="about" />
    </main>
  )
}
