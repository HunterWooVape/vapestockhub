export const metadata = {
  title: 'Compliance | VapeStockHub',
  description: 'Compliance principles for VapeStockHub.',
}

export default function CompliancePage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12 space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold">Compliance</h1>
        <p className="text-muted">VapeStockHub is intended for lawful B2B trade discussions only. Buyers and suppliers must comply with all local laws, age restrictions, customs requirements, and nicotine regulations.</p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">Age and Audience Restriction</h2>
        <p className="text-muted">This platform is not intended for minors or consumer retail transactions. Users must ensure that all business activity complies with age-restricted product laws in their jurisdiction.</p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">Jurisdiction Responsibility</h2>
        <p className="text-muted">Regulatory requirements vary by country and product type. It is the responsibility of the buyer and supplier to verify legality before import, export, promotion, distribution, or resale.</p>
      </section>
    </main>
  )
}
