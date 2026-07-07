import TrustCenterLinks from '@/components/site/TrustCenterLinks'
import { siteConfig } from '@/lib/site'

export const metadata = {
  title: 'Shipping & Returns | VapeStockHub',
  description: 'Review VapeStockHub B2B shipping and return policy context for wholesale inventory inquiries, including quote-based logistics and direct commercial confirmation.',
  alternates: {
    canonical: '/shipping-returns',
  },
}

function buildShippingReturnsJsonLd() {
  const pageUrl = `${siteConfig.url}/shipping-returns`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: 'Shipping & Returns',
        description: 'B2B shipping and return policy context for VapeStockHub wholesale inventory inquiries.',
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        email: siteConfig.contactEmail,
        hasMerchantReturnPolicy: {
          '@id': `${pageUrl}#return-policy`,
        },
        hasShippingService: {
          '@id': `${pageUrl}#shipping-policy`,
        },
      },
      {
        '@type': 'MerchantReturnPolicy',
        '@id': `${pageUrl}#return-policy`,
        name: 'B2B negotiated return terms',
        returnPolicyCategory: 'https://schema.org/MerchantReturnUnspecified',
        merchantReturnLink: pageUrl,
        description: 'VapeStockHub does not operate retail checkout or platform-managed consumer returns. Return, replacement, inspection, and after-sales terms are confirmed directly between B2B commercial parties before procurement.',
      },
      {
        '@type': 'ShippingService',
        '@id': `${pageUrl}#shipping-policy`,
        name: 'B2B quote-based shipping coordination',
        provider: {
          '@id': `${siteConfig.url}#organization`,
        },
        description: 'Shipment route, freight method, warehouse handoff, lead time, documents, customs responsibility, and shipping cost are confirmed during direct B2B inquiry for each inventory offer.',
        shippingConditions: {
          '@type': 'ShippingConditions',
          name: 'Destination and freight terms confirmed on inquiry',
          shippingDestination: {
            '@type': 'DefinedRegion',
            name: 'Buyer destination confirmed during B2B inquiry',
          },
        },
      },
    ],
  }
}

export default function ShippingReturnsPage() {
  const jsonLd = buildShippingReturnsJsonLd()

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12 space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-DEFAULT/80">
          B2B Terms Context
        </p>
        <h1 className="text-3xl md:text-5xl font-bold">Shipping & Returns</h1>
        <p className="text-muted">
          VapeStockHub is a wholesale inventory discovery and inquiry-routing platform. Shipping, delivery, inspection, replacement, and return terms are confirmed directly during B2B commercial discussion for each stock offer.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">1. Quote-Based Shipping</h2>
        <p className="text-muted">
          Listings may show warehouse location, target market, MOQ, available quantity, and stock context, but VapeStockHub does not provide a fixed retail checkout shipping rate. Freight route, handoff point, shipping cost, documents, and lead time must be confirmed in the direct inquiry.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">2. Warehouse and Destination Checks</h2>
        <p className="text-muted">
          Buyers should confirm the current warehouse, remaining quantity, destination market, packaging requirements, customs documents, and any import restrictions before committing to a procurement route.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">3. Return and After-Sales Terms</h2>
        <p className="text-muted">
          VapeStockHub does not operate consumer returns, platform-managed refunds, or checkout-based after-sales service. Any return, replacement, inspection, sample approval, defect handling, or claim process must be agreed directly between the commercial parties before purchase.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">4. Platform Role</h2>
        <p className="text-muted">
          The platform helps organize active wholesale inventory and route qualified inquiries. It does not act as a shipping carrier, customs broker, payment intermediary, or guarantor of delivery, customs clearance, product legality, or after-sales outcomes.
        </p>
      </section>

      <TrustCenterLinks currentPage="shipping-returns" />
    </main>
  )
}
