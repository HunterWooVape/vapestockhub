import { ArrowRight, CalendarDays, MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { blogArticles, getBlogArticle } from '@/lib/blog'
import { getTrackedContactHref, siteConfig } from '@/lib/site'

export function generateStaticParams() {
  return blogArticles.map((article) => ({
    slug: article.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getBlogArticle(slug)

  if (!article) {
    return {
      title: 'Guide Not Found | VapeStockHub',
    }
  }

  return {
    title: `${article.title} | VapeStockHub`,
    description: article.description,
    alternates: {
      canonical: `/blog/${article.slug}`,
    },
    robots: {
      index: article.indexable,
      follow: true,
    },
    openGraph: {
      title: `${article.title} | VapeStockHub`,
      description: article.description,
      url: `${siteConfig.url}/blog/${article.slug}`,
      siteName: siteConfig.name,
      type: 'article',
      publishedTime: article.date,
    },
  }
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getBlogArticle(slug)

  if (!article) {
    notFound()
  }

  const inquiryMessage = `Hi VapeStockHub, I am reading your guide "${article.title}" and want to ask about current wholesale stock with similar sourcing fit.`
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    mainEntityOfPage: `${siteConfig.url}/blog/${article.slug}`,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <article className="mx-auto max-w-4xl space-y-10">
        <header className="border border-border bg-surface rounded-2xl p-8 sm:p-12">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {article.date}
            </span>
            <span className="rounded-full border border-border bg-background px-2.5 py-1">
              {article.primaryKeyword}
            </span>
            {!article.indexable ? (
              <span className="rounded-full border border-status-warning/40 bg-status-warning/10 px-2.5 py-1 text-status-warning">
                Draft framework
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            {article.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={article.ctaTarget}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-DEFAULT px-5 py-3 font-bold text-background transition-colors hover:bg-teal-hover"
            >
              {article.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={getTrackedContactHref({
                channel: 'telegram',
                sourcePageType: 'blog',
                sourcePageSlug: article.slug,
                message: inquiryMessage,
              })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 font-semibold text-foreground transition-colors hover:bg-surface"
            >
              <MessageCircle className="h-4 w-4" />
              Request similar stock
            </a>
          </div>
        </header>

        <div className="space-y-8">
          {article.sections.map((section) => (
            <section key={section.heading} className="space-y-4">
              <h2 className="text-2xl font-bold">{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-muted leading-7">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <section className="border border-border bg-surface rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Buyer FAQ</h2>
          <div className="mt-5 grid grid-cols-1 gap-4">
            {article.faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-border bg-background p-5">
                <h3 className="font-bold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  )
}
