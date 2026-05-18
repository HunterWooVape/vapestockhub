import TrustCenterLinks from '@/components/site/TrustCenterLinks'

export const metadata = {
  title: 'Terms of Service | VapeStockHub',
  description: 'Review the Terms of Service governing access to VapeStockHub, including platform scope, B2B-only use, inventory information limits, and inquiry responsibilities.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12 space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-DEFAULT/80">
          Legal Terms
        </p>
        <h1 className="text-3xl md:text-5xl font-bold">Terms of Service</h1>
        <p className="text-muted">
          These Terms of Service govern access to VapeStockHub as a B2B wholesale inventory discovery and inquiry-routing platform. By using the website, you agree to use it only for lawful commercial purposes and within the limits described below.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">1. Platform Role</h2>
        <p className="text-muted">
          VapeStockHub provides inventory visibility, listing organization, and inquiry-routing tools for wholesale vape trade discussions. The platform is not a retail store, shopping cart, payment intermediary, customs broker, or regulated legal advisor.
        </p>
        <p className="text-muted">
          Public listing pages are designed to help business users identify relevant inventory offers and move into direct communication with the relevant commercial party.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">2. Eligibility and Acceptable Use</h2>
        <div className="space-y-3 text-muted">
          <p>The website is intended for wholesalers, distributors, retailers, importers, and other business users engaged in lawful trade evaluation.</p>
          <p>You agree not to use the website for unlawful activity, consumer retail fulfillment, deceptive conduct, scraping abuse, or any activity that may compromise platform integrity or violate age-restricted product laws.</p>
          <p>You are responsible for ensuring that your own use of the platform is permitted in the jurisdictions relevant to your business.</p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">3. Inventory Information and Inquiry Use</h2>
        <p className="text-muted">
          Listing content is provided for commercial review and inquiry preparation. Availability, MOQ, visible pricing, warehouse context, market suitability, and other listing details may change without notice as inventory moves.
        </p>
        <p className="text-muted">
          Buyers and suppliers must confirm all commercial terms directly before relying on a listing for procurement, export, import, payment, or resale activity.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">4. No Transaction Guarantee</h2>
        <p className="text-muted">
          VapeStockHub does not guarantee that any listing will result in a completed transaction, shipment, payment outcome, customs outcome, or regulatory approval. Inventory visibility on the site does not constitute a legal, commercial, or financial guarantee.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">5. Third-Party Channels and External Services</h2>
        <p className="text-muted">
          Inquiries may be routed to external channels such as Telegram, WhatsApp, or email. Once communication continues on those services, their own terms, security practices, and availability controls apply in addition to these Terms.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">6. Intellectual Property and Website Use</h2>
        <p className="text-muted">
          Unless otherwise stated, the website design, platform structure, and original site content are controlled by VapeStockHub or used under applicable rights. You may not copy, republish, or systematically extract site content in a way that competes with or harms the platform.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">7. Warranty Disclaimer and Liability Limits</h2>
        <p className="text-muted">
          The website is provided on an as-available basis. To the extent permitted by applicable law, VapeStockHub disclaims warranties regarding uninterrupted access, universal legality, or error-free commercial accuracy. Users remain responsible for due diligence, contract negotiation, payment protection, and legal compliance.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">8. Updates to These Terms</h2>
        <p className="text-muted">
          We may revise these Terms as the platform evolves. Continued use of the website after updates are published constitutes acceptance of the revised version.
        </p>
      </section>

      <TrustCenterLinks currentPage="terms" />
    </main>
  )
}
