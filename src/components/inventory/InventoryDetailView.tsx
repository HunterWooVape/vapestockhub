import Link from 'next/link'
import { Archive, ArrowUp, ChevronDown, ChevronRight, Clock3, Package, SlidersHorizontal } from 'lucide-react'

import ContactButtons from '@/components/contact/ContactButtons'
import InventoryCard from '@/components/inventory/InventoryCard'
import InventoryDetailImage from '@/components/inventory/InventoryDetailImage'
import InventoryDetailNavigation from '@/components/inventory/InventoryDetailNavigation'
import InventoryStockBreakdown from '@/components/inventory/InventoryStockBreakdown'
import { buildInventoryImageAlt, getInventoryImageSrc, hasRealInventoryImage, toSlug, type InventoryRecord } from '@/lib/inventory'
import { buildInventoryBreakdown } from '@/lib/inventory-detail'
import { buildInventoryInquiry, formatVerifiedDate, hasPublicPrice, isSoldOut, needsAvailabilityConfirmation } from '@/lib/inventory-lifecycle'
import { getInventoryFeaturedMarkets } from '@/lib/inventory-markets'

type Fact = { label: string; value: string | number | null | undefined }
const presentFacts = (facts: Fact[]) => facts.filter((fact) => fact.value !== null && fact.value !== undefined && String(fact.value).trim() !== '')
const format = (value: number) => value.toLocaleString('en-US')

function FactRows({ facts }: { facts: Fact[] }) {
  return <dl className="divide-y divide-border/70 px-5 text-xs sm:px-6">{facts.map((fact) => <div key={fact.label} className="grid grid-cols-[.9fr_1.1fr] items-start gap-4 py-4"><dt className="text-muted">{fact.label}</dt><dd className="min-w-0 break-words text-right font-medium">{fact.value}</dd></div>)}</dl>
}

export default function InventoryDetailView({ item, relatedItems }: { item: InventoryRecord; relatedItems: InventoryRecord[] }) {
  const soldOut = isSoldOut(item)
  const reconfirm = needsAvailabilityConfirmation(item)
  const publicPrice = hasPublicPrice(item)
  const verifiedDate = formatVerifiedDate(item.last_verified_at)
  const hasRealImage = hasRealInventoryImage(item.images)
  const breakdown = buildInventoryBreakdown(item)
  const flavorList = [...new Set((item.flavor ?? '').split(',').map((flavor) => flavor.trim()).filter(Boolean))]
  const featuredMarkets = getInventoryFeaturedMarkets(item)
  const primaryMarketLabel = featuredMarkets[0] ?? (item.market && toSlug(item.market) !== 'global' ? item.market : '')
  const marketSlug = primaryMarketLabel ? toSlug(primaryMarketLabel) : ''
  const brandSlug = toSlug(item.brand)
  const hasStockBreakdown = Boolean(breakdown || flavorList.length)
  const sourceText = item.description?.trim() ? item.description : null
  const pricingNote = publicPrice ? item.pricing_note?.trim() : null
  const stockText = breakdown ? breakdown.notes : sourceText
  const hasLotText = Boolean(stockText || item.market_access_note?.trim() || pricingNote)
  const metadata = presentFacts([
    { label: 'Production date', value: item.production_date_text },
    { label: soldOut ? 'Original market scope' : 'Market scope', value: item.market },
    { label: 'Featured markets', value: featuredMarkets.length && featuredMarkets.join(' / ') !== item.market ? featuredMarkets.join(' / ') : null },
  ])
  const productFacts = presentFacts([
    { label: 'Brand', value: item.brand },
    { label: 'Product type', value: item.product_type },
    { label: 'Configurations', value: breakdown && breakdown.configurations.length > 1 ? breakdown.configurations.map((configuration) => configuration.label).join(' / ') : null },
  ])
  const technicalFacts = presentFacts([
    { label: 'Puff count', value: item.puff && item.puff > 0 ? `${format(item.puff)} puffs` : null },
    { label: 'Nicotine', value: item.nicotine },
    { label: 'E-liquid capacity', value: item.e_liquid },
  ])
  const hasNotes = Boolean(hasLotText || metadata.length)
  const hasSpecifications = Boolean(productFacts.length || technicalFacts.length)
  const sections = [
    ...(hasStockBreakdown ? [{ id: 'stock-breakdown', label: 'Stock breakdown' }] : []),
    ...(hasNotes ? [{ id: 'stock-notes', label: 'Stock notes' }] : []),
    ...(hasSpecifications ? [{ id: 'product-specifications', label: 'Specifications' }] : []),
  ]
  const summaryFacts = presentFacts([
    { label: soldOut ? 'Original warehouse' : 'Warehouse', value: item.warehouse_location },
    { label: soldOut ? 'Previous MOQ' : 'Minimum order', value: item.moq > 0 ? `${format(item.moq)} pcs` : null },
  ])
  const inventoryFaqs = [
    {
      question: soldOut ? 'Can I request this product again?' : 'How do I confirm availability?',
      answer: soldOut
        ? 'This lot is sold out. Send your required quantity and warehouse preference to check restock or alternatives.'
        : 'Contact us with the listing details to confirm available quantity, MOQ and dispatch terms.',
    },
    {
      question: soldOut ? 'Does the previous price apply to new stock?' : 'How do I request a quote?',
      answer: soldOut
        ? 'Previous prices apply to the original lot. Request a new quote for restock or alternative stock.'
        : 'Send your target quantity, delivery destination and warehouse preference via Telegram or WhatsApp.',
    },
    {
      question: 'Can I request specific flavors?',
      answer: 'Include your flavor list and quantities in your inquiry. Availability is confirmed for each lot.',
    },
  ]

  return (
    <main id="inventory-detail" className="mx-auto w-full max-w-[1160px] px-4 pb-14 pt-7 sm:px-6 sm:pt-9 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <Link href="/" className="hover:text-teal-DEFAULT">Home</Link><ChevronRight className="size-3.5" aria-hidden="true" />
        <Link href="/inventory" className="hover:text-teal-DEFAULT">Inventory</Link><ChevronRight className="size-3.5" aria-hidden="true" />
        <Link href={`/brand/${brandSlug}`} className="text-foreground hover:text-teal-DEFAULT">{item.brand}</Link>
      </nav>

      <section id="overview" aria-labelledby="product-title" className="grid scroll-mt-36 overflow-hidden rounded-2xl border border-border bg-surface/35 md:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] md:grid-rows-[auto_1fr]">
        <div className="min-w-0 border-b border-border px-5 py-6 sm:px-8 sm:py-8 md:col-start-2 md:row-start-1 md:border-b-0 md:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {item.brand && <span className="text-[11px] font-semibold uppercase tracking-[.18em] text-teal-DEFAULT">{item.brand}</span>}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-medium ${soldOut ? 'border-muted/25 bg-background/60 text-muted' : reconfirm ? 'border-amber-400/25 bg-amber-400/5 text-amber-200' : 'border-teal-DEFAULT/25 bg-teal-DEFAULT/5 text-teal-DEFAULT'}`}>
                {soldOut && <Archive className="size-3.5" aria-hidden="true" />}{soldOut ? 'Sold out' : reconfirm ? 'Availability to reconfirm' : 'Active stock'}
              </span>
              {!soldOut && !reconfirm && item.is_featured && <span className="rounded-md border border-teal-DEFAULT/25 bg-teal-DEFAULT/10 px-2.5 py-1.5 text-[10px] font-medium text-teal-DEFAULT">Featured</span>}
            </div>
          </div>
          <h1 id="product-title" className="mt-4 break-words text-[30px] font-semibold leading-[1.12] tracking-[-.035em] sm:text-[38px]">{item.title}</h1>
          {item.product_type && <p className="mt-3 text-sm text-muted">{item.product_type}</p>}
        </div>
        <InventoryDetailImage src={getInventoryImageSrc(item.images)} alt={buildInventoryImageAlt({ title: item.title, brand: item.brand, productType: item.product_type, hasRealImage })} caption={item.title} hasRealImage={hasRealImage} />
        <div className="flex min-w-0 flex-col px-5 py-6 sm:px-8 sm:py-8 md:col-start-2 md:row-start-2 md:pt-6">
          <div className={`grid gap-4 border-y border-border py-5 ${publicPrice ? 'grid-cols-[1.15fr_1fr]' : 'grid-cols-1'}`}>
            <div className="min-w-0"><p className="text-[10px] text-muted">{soldOut ? 'Original lot quantity' : 'Listed stock'}</p><p className="mt-2 break-words text-[27px] font-semibold leading-none tracking-tight tabular-nums sm:text-[32px]">{format(item.quantity)} <span className="text-xs font-normal tracking-normal text-muted">{breakdown?.unit ?? 'pcs'}</span></p></div>
            {publicPrice && <div className="min-w-0 border-l border-border pl-5" data-public-price><p className="text-[10px] text-muted">{soldOut ? 'Previous unit price' : 'Wholesale price'}</p><p className="mt-2 break-words text-[27px] font-semibold leading-none tracking-tight tabular-nums sm:text-[32px]">${item.price!.toFixed(2)}</p></div>}
          </div>
          {summaryFacts.length > 0 && <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 text-sm">{summaryFacts.map((fact) => <div key={fact.label} className="min-w-0"><dt className="text-[10px] text-muted">{fact.label}</dt><dd className="mt-2 break-words font-medium">{fact.value}</dd></div>)}</dl>}
          {!publicPrice && <p className="mt-5 text-sm font-medium">{item.pricing_mode === 'inquiry_only' ? 'Pricing on request' : soldOut ? 'Price on inquiry' : 'Contact for price'}</p>}
          {soldOut ? <p className="mt-5 border-l-2 border-muted/40 pl-3 text-xs leading-6 text-muted">This lot is sold out. Ask about restock or alternative stock.</p> : reconfirm ? <p className="mt-5 border-l-2 border-amber-400/40 pl-3 text-xs leading-6 text-muted">Availability to reconfirm. Contact us for current quantities and terms.</p> : null}
          <div className="mt-6"><ContactButtons compact sourcePageType="inventory" sourcePageSlug={item.slug} itemSlug={item.slug} primaryLabel={soldOut ? 'Ask about restock via Telegram' : 'Request quote via Telegram'} message={buildInventoryInquiry(item)} /></div>
          {verifiedDate && <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted"><Clock3 className="size-3.5 shrink-0" aria-hidden="true" /><span>{soldOut ? 'Original lot last confirmed' : 'Last confirmed'}</span><span className="ml-auto tabular-nums">{verifiedDate}</span></p>}
        </div>
      </section>

      <InventoryDetailNavigation sections={sections} />

      {hasStockBreakdown && <section id="stock-breakdown" aria-labelledby="stock-heading" className="scroll-mt-36 pt-10">
        <h2 id="stock-heading" className="mb-6 text-2xl font-semibold tracking-[-.035em] sm:text-[27px]">Stock breakdown</h2>
        {breakdown ? <InventoryStockBreakdown breakdown={breakdown} soldOut={soldOut} /> : <ul className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface/30 p-5 sm:p-6">{flavorList.map((flavor) => <li key={flavor} className="max-w-full break-words rounded-md border border-border bg-background px-3 py-2 text-xs font-medium">{flavor}</li>)}</ul>}
      </section>}

      {hasNotes && <section id="stock-notes" aria-labelledby="notes-heading" className="scroll-mt-36 pt-12">
        <h2 id="notes-heading" className="mb-5 text-2xl font-semibold tracking-[-.035em] sm:text-[27px]">Stock notes</h2>
        {(hasLotText || metadata.length > 0) && <div className={`overflow-hidden rounded-xl border border-border bg-surface/35 ${hasLotText && metadata.length ? 'grid md:grid-cols-[1.15fr_1fr]' : ''}`}>
          {hasLotText && <div className={`min-w-0 p-5 sm:p-7 ${metadata.length ? 'border-b border-border md:border-b-0 md:border-r' : ''}`}>
            {stockText && <p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted">{stockText}</p>}
            {item.market_access_note?.trim() && <div className="mt-5"><h4 className="text-xs font-medium">Market access note</h4><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted">{item.market_access_note}</p></div>}
            {pricingNote && <div className="mt-5"><h4 className="text-xs font-medium">{soldOut ? 'Original pricing note' : 'Pricing note'}</h4><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted">{pricingNote}</p></div>}
          </div>}
          {metadata.length > 0 && <dl className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-6 p-5 text-xs sm:p-7">{metadata.map((fact) => <div key={fact.label} className="min-w-0"><dt className="text-[10px] text-muted">{fact.label}</dt><dd className="mt-2 break-words font-medium">{fact.value}</dd></div>)}</dl>}
        </div>}
      </section>}

      {hasSpecifications && <section id="product-specifications" aria-labelledby="specs-heading" className="scroll-mt-36 pt-12"><h2 id="specs-heading" className="mb-6 text-2xl font-semibold tracking-[-.035em] sm:text-[27px]">Product specifications</h2><div className={`grid gap-4 ${productFacts.length && technicalFacts.length ? 'md:grid-cols-2' : ''}`}>
        {productFacts.length > 0 && <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface/35"><h3 className="flex items-center gap-2 border-b border-border px-5 py-4 text-xs font-semibold sm:px-6"><Package className="size-3.5" aria-hidden="true" />Product</h3><FactRows facts={productFacts} /></div>}
        {technicalFacts.length > 0 && <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface/35"><h3 className="flex items-center gap-2 border-b border-border px-5 py-4 text-xs font-semibold sm:px-6"><SlidersHorizontal className="size-3.5" aria-hidden="true" />Specifications</h3><FactRows facts={technicalFacts} /></div>}
      </div></section>}

      <section aria-labelledby="faq-heading" className="mt-12 border-t border-border pt-10"><div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr] lg:gap-12"><h2 id="faq-heading" className="text-xl font-semibold tracking-tight">Wholesale Stock Offer FAQ</h2><div className="divide-y divide-border border-y border-border">{inventoryFaqs.map((faq, index) => <details key={faq.question} className="group" open={index === 0}><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-teal-DEFAULT">{faq.question}<ChevronDown className="size-3.5 shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></summary><p className="pb-5 text-xs leading-6 text-muted">{faq.answer}</p></details>)}</div></div></section>

      {relatedItems.length > 0 && <section aria-labelledby="related-heading" className="mt-12 border-t border-border pt-10"><div className="mb-6 flex items-end justify-between gap-4"><h2 id="related-heading" className="text-xl font-semibold tracking-tight">Related stock</h2>{marketSlug && <Link href={`/market/${marketSlug}`} className="text-xs font-medium text-teal-DEFAULT hover:text-teal-hover">View all →</Link>}</div><div className="grid gap-6 md:grid-cols-3">{relatedItems.map((relatedItem) => <InventoryCard key={relatedItem.id} item={relatedItem} />)}</div></section>}
      <div className="mt-10 flex justify-end border-t border-border pt-6"><a href="#overview" className="inline-flex items-center gap-1.5 text-xs text-muted outline-none hover:text-teal-DEFAULT focus-visible:ring-2 focus-visible:ring-teal-DEFAULT">Back to top<ArrowUp className="size-3.5" aria-hidden="true" /></a></div>
    </main>
  )
}
