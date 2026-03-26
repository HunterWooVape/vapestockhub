import Link from 'next/link'

export const metadata = {
  title: 'Vape Markets | VapeStockHub',
  description: 'Browse wholesale vape inventory by target market and region.',
}

export default function MarketIndexPage() {
  const markets = [
    { name: 'Middle East', slug: 'middle-east', desc: 'UAE, Saudi Arabia, Iraq, Jordan' },
    { name: 'Latin America', slug: 'latin-america', desc: 'Chile, Colombia, Peru' },
    { name: 'Eastern Europe', slug: 'eastern-europe', desc: 'Serbia, Russia, and surrounding regions' },
    { name: 'North America', slug: 'north-america', desc: 'USA and Canada clearance stock' }
  ]

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Browse by <span className="text-teal-DEFAULT">Market</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Select a region to find wholesale inventory ready for dispatch to your specific target market.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {markets.map((market) => (
          <Link 
            key={market.slug} 
            href={`/market/${market.slug}`}
            className="p-8 rounded-xl border border-border bg-surface hover:border-teal-DEFAULT/50 group transition-all"
          >
            <h2 className="text-2xl font-bold group-hover:text-teal-DEFAULT transition-colors mb-2">
              {market.name}
            </h2>
            <p className="text-muted">{market.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
