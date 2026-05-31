import { CalendarDays, ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'

import { blogArticles } from '@/lib/blog'

const hasIndexableArticles = blogArticles.some((article) => article.indexable)

export const metadata = {
  title: 'Wholesale Vape Sourcing Guides | VapeStockHub Blog',
  description:
    'Read B2B vape sourcing guides for wholesale inventory, clearance stock, alternative product searches, and inquiry-driven buying decisions.',
  alternates: {
    canonical: '/blog',
  },
  robots: {
    index: hasIndexableArticles,
    follow: true,
  },
}

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      <section className="border border-border bg-surface rounded-2xl p-8 sm:p-12">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-DEFAULT/80">
          Wholesale Guides
        </p>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold">
          Wholesale Vape Sourcing Guides
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">
          Practical B2B guides for buyers comparing active vape stock, clearance opportunities, price bands, and alternative product searches before sending a direct inquiry.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          <BookOpen className="h-4 w-4 text-teal-DEFAULT" />
          Latest Guides
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogArticles.map((article) => (
            <article key={article.slug} className="border border-border bg-surface rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {article.date}
                </span>
                <span className="rounded-full border border-border bg-background px-2.5 py-1">
                  {article.articleType}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-bold">
                <Link href={`/blog/${article.slug}`} className="hover:text-teal-DEFAULT transition-colors">
                  {article.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                {article.description}
              </p>
              <Link
                href={`/blog/${article.slug}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-DEFAULT hover:text-teal-hover"
              >
                Read guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
