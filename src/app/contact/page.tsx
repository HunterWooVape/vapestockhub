import ContactButtons from '@/components/contact/ContactButtons'
import { siteConfig } from '@/lib/site'

export const metadata = {
  title: 'Contact VapeStockHub',
  description: 'Contact VapeStockHub through Telegram, WhatsApp, or email.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Contact <span className="text-teal-DEFAULT">VapeStockHub</span>
        </h1>
        <p className="text-lg text-muted max-w-3xl">
          For wholesale stock inquiries, fastest response is through Telegram. WhatsApp is available as a secondary channel.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-xl font-bold">Direct Channels</h2>
          <ContactButtons sourcePageType="contact" sourcePageSlug="contact-page" primaryLabel="Start on Telegram" />
          <p className="text-sm text-muted">Share the product link, target market, and quantity target to receive a faster reply.</p>
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
    </main>
  )
}
