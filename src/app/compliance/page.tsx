import TrustCenterLinks from '@/components/site/TrustCenterLinks'

export const metadata = {
  title: 'Compliance | VapeStockHub',
  description: 'Review VapeStockHub compliance principles for lawful B2B trade, age-restricted products, jurisdiction checks, and buyer-supplier due diligence.',
}

export default function CompliancePage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12 space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-DEFAULT/80">
          Trade Responsibility
        </p>
        <h1 className="text-3xl md:text-5xl font-bold">Compliance</h1>
        <p className="text-muted">
          VapeStockHub is intended for lawful B2B trade discussion and inventory discovery only. Because vape products are age-restricted and heavily regulated across jurisdictions, buyers and suppliers must complete their own legal, tax, customs, and product-compliance review before doing business.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">1. B2B and Age-Restricted Audience Only</h2>
        <p className="text-muted">
          This platform is not intended for minors, direct-to-consumer nicotine retail, or general youth-oriented traffic. All users are expected to access the site in a lawful commercial context and to observe applicable age-restricted product rules in their own jurisdictions.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">2. Jurisdiction and Import Responsibility</h2>
        <p className="text-muted">
          Product legality, nicotine restrictions, flavor rules, packaging requirements, tax obligations, and import controls vary by market. Buyers and suppliers are solely responsible for confirming whether a product can be imported, marketed, distributed, warehoused, or resold in the relevant destination.
        </p>
        <p className="text-muted">
          A listing on VapeStockHub does not mean that a product is lawful in your country, state, customs zone, or channel of trade.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">3. Product Claims and Documentation</h2>
        <p className="text-muted">
          Commercial parties should verify product identity, nicotine strength, packaging language, labeling claims, and any documentation required for their route to market before placing reliance on a listing.
        </p>
        <p className="text-muted">
          VapeStockHub may present inventory context, but it is not a substitute for independent product review, local counsel, or importer due diligence.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">4. Restricted Markets, Sanctions, and Prohibited Use</h2>
        <p className="text-muted">
          Users must not rely on the platform to bypass sanctions, export restrictions, age-verification rules, advertising restrictions, or local bans on nicotine products. Any attempt to use the platform for deceptive, unlawful, or evasive trade behavior is outside its intended use.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">5. Marketplace Visibility Is Not Compliance Clearance</h2>
        <p className="text-muted">
          Inventory visibility, brand coverage, market pages, or supplier contact access should not be interpreted as legal clearance, medical approval, tax approval, or customs authorization. The platform helps organize inventory offers, but it does not certify every commercial route.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">6. Recommended Due-Diligence Checklist</h2>
        <div className="space-y-3 text-muted">
          <p>Confirm that the product type, nicotine format, and packaging are lawful for the destination market.</p>
          <p>Confirm MOQ, available stock, shipment route, warehouse location, and commercial terms directly with the counterparty.</p>
          <p>Confirm whether age-gating, labeling, tax stamps, customs declarations, or local registrations are required before import or resale.</p>
          <p>Seek independent legal or regulatory advice when operating in complex or high-risk jurisdictions.</p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">7. Reporting a Concern</h2>
        <p className="text-muted">
          If you believe a page, listing, or inquiry route raises a serious compliance concern, use the Contact page and clearly identify the URL, issue type, and jurisdiction involved so the matter can be reviewed.
        </p>
      </section>

      <TrustCenterLinks currentPage="compliance" />
    </main>
  )
}
