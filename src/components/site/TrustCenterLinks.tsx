import Link from 'next/link'

const trustPageItems = [
  {
    key: 'about',
    href: '/about',
    label: 'About',
    description: 'Understand our B2B inventory model, operating principles, and platform scope.',
  },
  {
    key: 'contact',
    href: '/contact',
    label: 'Contact',
    description: 'Use Telegram, WhatsApp, or email for business inquiries and inventory follow-up.',
  },
  {
    key: 'privacy',
    href: '/privacy',
    label: 'Privacy Policy',
    description: 'Review how browsing, inquiry, and operational data are handled across the platform.',
  },
  {
    key: 'terms',
    href: '/terms',
    label: 'Terms of Service',
    description: 'See the platform rules, role boundaries, and responsibility limits for B2B use.',
  },
  {
    key: 'compliance',
    href: '/compliance',
    label: 'Compliance',
    description: 'Check the lawful-trade principles and due-diligence expectations for age-restricted products.',
  },
] as const

type TrustCenterLinksProps = {
  currentPage: (typeof trustPageItems)[number]['key']
}

export default function TrustCenterLinks({ currentPage }: TrustCenterLinksProps) {
  const relatedItems = trustPageItems.filter((item) => item.key !== currentPage)

  return (
    <section className="border-t border-border pt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Related Trust Pages</h2>
        <p className="mt-2 max-w-3xl text-muted">
          Review the key pages that explain how VapeStockHub operates, how inquiries are handled, and where compliance responsibility remains with business users.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-teal-DEFAULT/50"
          >
            <h3 className="text-lg font-bold">{item.label}</h3>
            <p className="mt-2 text-sm text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
