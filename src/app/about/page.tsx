export const metadata = {
  title: 'About VapeStockHub',
  description: 'Learn about VapeStockHub and our B2B wholesale inventory focus.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          About <span className="text-teal-DEFAULT">VapeStockHub</span>
        </h1>
        <p className="text-lg text-muted max-w-3xl">
          VapeStockHub is a B2B inventory platform focused on wholesale vape stock, clearance opportunities, and faster supplier-buyer connections across priority markets.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-bold">What We Do</h2>
          <p className="text-muted">We organize wholesale inventory into searchable pages by market, brand, price range, and product detail.</p>
          <p className="text-muted">We help buyers discover live stock and move the conversation into direct channels such as Telegram and WhatsApp.</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-bold">What We Do Not Do</h2>
          <p className="text-muted">We do not operate as a retail store, shopping cart, payment processor, or consumer-facing nicotine marketplace.</p>
          <p className="text-muted">We do not guarantee regulatory clearance in every jurisdiction. Buyers and suppliers remain responsible for local compliance.</p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-bold">Operating Principles</h2>
        <p className="text-muted">We prioritize verified inventory, clear routing to private contact channels, and market-specific discoverability over unnecessary platform complexity.</p>
        <p className="text-muted">Our MVP is designed to validate buyer demand, increase qualified inquiries, and support fast operational updates as inventory changes.</p>
      </section>
    </main>
  )
}
