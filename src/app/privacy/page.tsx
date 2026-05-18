import TrustCenterLinks from '@/components/site/TrustCenterLinks'

export const metadata = {
  title: 'Privacy Policy | VapeStockHub',
  description: 'Learn how VapeStockHub handles browsing data, inquiry routing data, contact information, and limited operational logs for its B2B wholesale inventory platform.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12 space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-DEFAULT/80">
          Legal and Data Handling
        </p>
        <h1 className="text-3xl md:text-5xl font-bold">Privacy Policy</h1>
        <p className="text-muted">
          This Privacy Policy explains how VapeStockHub handles browsing data, inquiry routing data, and operational information when business users access inventory pages or contact channels on the platform.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">1. Scope of This Policy</h2>
        <p className="text-muted">
          VapeStockHub is a B2B inventory discovery and lead-routing platform. This policy applies to information collected through the website, including page browsing, contact-button routing, and operational website activity.
        </p>
        <p className="text-muted">
          This policy does not replace the privacy practices of third-party messaging platforms such as Telegram or WhatsApp. If you continue a conversation on those channels, their own privacy terms also apply.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">2. Information We May Collect</h2>
        <div className="space-y-3 text-muted">
          <p>We may collect contact-channel routing data such as source page type, source page slug, and listing context attached to Telegram or WhatsApp redirects.</p>
          <p>We may collect general technical and analytics data, including IP-derived technical logs, referrer data, browser information, device type, and page usage needed to operate and improve the platform.</p>
          <p>We may receive information you voluntarily provide by email or inquiry messages, such as your company name, requested products, target market, and expected quantity.</p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">3. How We Use Information</h2>
        <div className="space-y-3 text-muted">
          <p>We use collected data to route inquiries, understand which inventory pages generate business interest, maintain website functionality, and improve the structure of wholesale inventory pages.</p>
          <p>We may also use operational data to detect misuse, protect the platform, and review whether listings, contact flows, or page content need quality improvements.</p>
          <p>We do not sell inquiry data as a standalone data product to unrelated third parties.</p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">4. Cookies, Sessions, and Technical Storage</h2>
        <p className="text-muted">
          VapeStockHub may use limited cookies or session storage to support secure internal access, basic analytics, and routing continuity. We do not position the public site as a retail account system, so personal account profiling is limited compared with consumer ecommerce websites.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">5. Data Sharing and Service Providers</h2>
        <p className="text-muted">
          We may rely on third-party infrastructure and communication providers to operate the site, store operational data, or route inquiries. Information may therefore be processed by hosting, analytics, database, or messaging providers acting within their own service environments.
        </p>
        <p className="text-muted">
          We do not publicly disclose private inquiry details on listing pages, and we do not intentionally expose commercially sensitive message content in the public interface.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">6. Retention and Security</h2>
        <p className="text-muted">
          We retain operational and inquiry-related data only for as long as it is reasonably needed to operate the platform, review lead quality, protect the service, or meet applicable legal obligations.
        </p>
        <p className="text-muted">
          While we take reasonable steps to secure the platform, no website or messaging workflow can guarantee absolute security. Users should avoid sending unnecessary sensitive personal data through public or semi-public channels.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">7. International and Age-Restricted Context</h2>
        <p className="text-muted">
          VapeStockHub may be accessed from multiple jurisdictions. Users remain responsible for ensuring that their use of the platform and any business communication complies with local age-restricted product laws and cross-border trade requirements.
        </p>
        <p className="text-muted">
          The platform is not intended for minors, and we do not knowingly design these public pages for consumer nicotine purchasing behavior.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">8. Updates and Contact</h2>
        <p className="text-muted">
          We may update this Privacy Policy as the platform evolves. Material wording changes may appear here without separate notice, so please review this page periodically.
        </p>
        <p className="text-muted">
          If you have a privacy-related question, please use the Contact page and clearly label your request so it can be routed appropriately.
        </p>
      </section>

      <TrustCenterLinks currentPage="privacy" />
    </main>
  )
}
