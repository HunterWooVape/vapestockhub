import ContactButtons from '@/components/contact/ContactButtons'
import TrustCenterLinks from '@/components/site/TrustCenterLinks'
import { siteConfig } from '@/lib/site'

export const metadata = {
  title: 'Contact VapeStockHub | Wholesale Inventory Inquiries',
  description: 'Contact VapeStockHub for wholesale inventory inquiries through Telegram, WhatsApp, or email, with faster replies when product link, brand, model, market, warehouse, and quantity details are included.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-DEFAULT/80">
          Business Contact
        </p>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold mb-4">
          Contact <span className="text-teal-DEFAULT">VapeStockHub</span>
        </h1>
        <p className="text-lg text-muted max-w-3xl">
          Use this page for wholesale inventory inquiries, listing follow-up, partnership questions, or compliance-related communication. For the fastest response, start on Telegram with your product link, brand or model, target market, warehouse preference, and quantity target.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-xl font-bold">Direct Channels</h2>
          <p className="text-muted">
            Telegram is the primary business channel for listing-based discussions. WhatsApp works well for follow-up when you already know the SKU, brand, or inventory page you want to reference.
          </p>
          <ContactButtons sourcePageType="contact" sourcePageSlug="contact-page" primaryLabel="Start Business Inquiry on Telegram" />
          <p className="text-sm text-muted">
            Include the listing URL, brand, model, product type, target market, warehouse preference, and expected quantity so the receiving side can respond with better speed and context.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold">Contact Details</h2>
          <div>
            <div className="text-sm text-muted mb-1">Telegram</div>
            <div className="font-semibold">@{siteConfig.telegramUsername}</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-1">WhatsApp</div>
            <div className="font-semibold">+{siteConfig.whatsappNumber}</div>
          </div>
          <div>
            <div className="text-sm text-muted mb-1">Email</div>
            <div className="font-semibold">{siteConfig.contactEmail}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold">What to Include in Your Inquiry</h2>
          <div className="space-y-3 text-muted">
            <p>1. The product link or inventory page you are reviewing.</p>
            <p>2. Brand, model name, product type, puff range, or flavor mix if you do not have a direct URL yet.</p>
            <p>3. Target market, destination country, and warehouse preference such as China, US, UK, EU, or UAE.</p>
            <p>4. Quantity expectation, MOQ tolerance, and whether you need visible-price stock or inquiry-only offers.</p>
            <p>5. Any timing constraint, clearance-stock interest, or requirement for local warehouse availability.</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold">Business-Only Notice</h2>
          <p className="text-muted">
            VapeStockHub is a B2B platform for inventory discovery and lead routing. Contact channels are intended for lawful wholesale, distribution, and commercial sourcing conversations only.
          </p>
          <p className="text-muted">
            Retail, consumer, or age-restricted end-user requests may be declined or redirected because the platform does not operate as a checkout store.
          </p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-bold">Response Expectations</h2>
        <p className="text-muted">
          Response timing depends on listing status, channel load, and whether the inquiry includes enough context to identify the inventory offer quickly. Requests with clear SKU references and market detail are easier to route and validate.
        </p>
        <p className="text-muted">
          For privacy and compliance expectations related to inquiry handling, please review the Privacy Policy, Terms of Service, and Compliance pages before sharing commercially sensitive information.
        </p>
      </section>

      <TrustCenterLinks currentPage="contact" />
    </main>
  )
}
