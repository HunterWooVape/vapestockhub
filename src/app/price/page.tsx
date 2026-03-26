import Link from 'next/link'

export const metadata = {
  title: 'Clearance & Wholesale Deals | VapeStockHub',
  description: 'Find the best wholesale vape deals and clearance stock sorted by price.',
}

export default function PriceIndexPage() {
  const priceTiers = [
    { name: 'Under $3.00', slug: 'under-3', desc: 'Urgent clearance & budget disposable stock', isHot: true },
    { name: '$3.00 - $5.00', slug: '3-to-5', desc: 'Standard wholesale margin products', isHot: false },
    { name: '$5.00 - $8.00', slug: '5-to-8', desc: 'High puff count & premium devices', isHot: false },
    { name: 'Over $8.00', slug: 'over-8', desc: 'Hardware, kits and high-end stock', isHot: false }
  ]

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-DEFAULT/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 relative z-10">
          Browse by <span className="text-teal-DEFAULT">Price & Deals</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto relative z-10">
          Maximize your margins. Browse our inventory categorized by unit price to find the perfect deals for your budget.
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
                HOT DEALS
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
