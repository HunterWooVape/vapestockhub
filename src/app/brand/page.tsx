import Link from 'next/link'

export const metadata = {
  title: 'Vape Brands | VapeStockHub',
  description: 'Browse wholesale vape inventory by top disposable vape brands.',
}

export default function BrandIndexPage() {
  const brands = [
    { name: 'Vozol', slug: 'vozol', desc: 'Star, Gear, and other top Vozol models' },
    { name: 'Elf Bar', slug: 'elf-bar', desc: 'BC5000, Pi9000, and more Elf Bar lines' },
    { name: 'Geek Bar', slug: 'geek-bar', desc: 'Pulse and other Geek Bar favorites' },
    { name: 'Lost Mary', slug: 'lost-mary', desc: 'OS5000, MO5000 and clearance stock' }
  ]

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Browse by <span className="text-teal-DEFAULT">Brand</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Explore our verified network of suppliers offering top vape brands at wholesale prices.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {brands.map((brand) => (
          <Link 
            key={brand.slug} 
            href={`/brand/${brand.slug}`}
            className="p-8 rounded-xl border border-border bg-surface hover:border-teal-DEFAULT/50 group transition-all text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-background border border-border rounded-full flex items-center justify-center font-bold text-xl text-teal-DEFAULT">
              {brand.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold group-hover:text-teal-DEFAULT transition-colors mb-2">
              {brand.name}
            </h2>
            <p className="text-sm text-muted">{brand.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
