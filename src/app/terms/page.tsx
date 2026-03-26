export const metadata = {
  title: 'Terms of Service | VapeStockHub',
  description: 'Terms of Service for using VapeStockHub.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12 space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold">Terms of Service</h1>
        <p className="text-muted">VapeStockHub is a B2B information and lead-generation platform. By using this website, you agree to the following terms.</p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">Use of the Platform</h2>
        <p className="text-muted">This website is intended for business users seeking wholesale vape inventory. You agree not to use this website for unlawful, retail, or consumer-facing nicotine transactions.</p>
        <p className="text-muted">Inventory information is provided for commercial inquiry purposes. Availability, pricing, and shipping terms may change without notice.</p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">No Transaction Guarantee</h2>
        <p className="text-muted">VapeStockHub does not guarantee any completed transaction, shipment, payment outcome, or regulatory clearance. Final due diligence remains the responsibility of buyers and suppliers.</p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">Changes</h2>
        <p className="text-muted">We may update these terms as the platform evolves. Continued use of the website constitutes acceptance of the updated terms.</p>
      </section>
    </main>
  )
}
