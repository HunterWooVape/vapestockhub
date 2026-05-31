import Link from 'next/link'

export const metadata = {
  title: 'Disposable Vape Wholesale Prices by Range | VapeStockHub',
  description: 'Browse disposable vape wholesale prices by range, from clearance and budget stock to higher-ticket bulk offers. Compare MOQ, warehouse, and availability before requesting a live quote.',
}

export default function PriceIndexPage() {
  const priceTiers = [
    { name: 'Under $3.00', slug: 'under-3', desc: 'Low-cost wholesale disposable vape stock for clearance buying, budget sourcing, and fast-moving bulk orders.', isHot: true },
    { name: '$3.00 - $5.00', slug: '3-to-5', desc: 'Core wholesale price band for balanced margin, repeat demand, and scalable bulk sourcing.', isHot: false },
    { name: '$5.00 - $8.00', slug: '5-to-8', desc: 'Mid-to-premium wholesale inventory with stronger feature sets, higher puff counts, and broader buyer appeal.', isHot: false },
    { name: 'Over $8.00', slug: 'over-8', desc: 'Higher-ticket wholesale stock for premium devices, advanced hardware, and specialty inventory lines.', isHot: false }
  ]

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 relative z-10">
          Browse Disposable Vape <span className="text-teal-DEFAULT">Wholesale Prices</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto relative z-10">
          Browse disposable vape wholesale prices by range, from clearance and budget stock to higher-ticket bulk offers. Compare MOQ, warehouse, and availability before requesting a live quote.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {priceTiers.map((tier) => (
          <Link 
            key={tier.slug} 
            href={`/price/${tier.slug}`}
            className={`p-8 rounded-xl border ${tier.isHot ? 'border-teal-DEFAULT/50 bg-teal-DEFAULT/5' : 'border-border bg-surface'} hover:border-teal-DEFAULT group transition-all relative overflow-hidden`}
          >
            {tier.isHot && (
              <div className="absolute top-4 right-4 text-xs font-bold bg-teal-DEFAULT text-background px-2 py-1 rounded">
                Clearance Focus
              </div>
            )}
            <h2 className="text-2xl font-bold group-hover:text-teal-DEFAULT transition-colors mb-2">
              {tier.name}
            </h2>
            <p className="text-muted">{tier.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
