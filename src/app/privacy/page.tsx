export const metadata = {
  title: 'Privacy Policy | VapeStockHub',
  description: 'Privacy Policy for VapeStockHub.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <section className="bg-surface border border-border rounded-2xl p-8 sm:p-12 space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold">Privacy Policy</h1>
        <p className="text-muted">This policy explains how VapeStockHub handles data related to browsing, contact requests, and website operations.</p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">What We Collect</h2>
        <p className="text-muted">We may collect source page information, contact channel clicks, referer data, and general technical logs needed to operate the platform.</p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">How We Use Data</h2>
        <p className="text-muted">We use collected information to understand inquiry intent, improve inventory pages, measure lead sources, and maintain website functionality.</p>
        <p className="text-muted">We do not sell inquiry data to third parties.</p>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold">Cookies and Session Data</h2>
        <p className="text-muted">We use limited session cookies to maintain basic administrative sessions for internal operations.</p>
      </section>
    </main>
  )
}
