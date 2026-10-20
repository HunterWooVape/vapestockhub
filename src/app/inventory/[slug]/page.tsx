import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import InventoryDetailView from '@/components/inventory/InventoryDetailView'
import { type InventoryRecord, toSlug } from '@/lib/inventory'
import { buildInventoryJsonLd, buildInventoryMetadataDescription } from '@/lib/inventory-seo'
import { getPublicInventory } from '@/lib/public-inventory'
import { siteConfig } from '@/lib/site'

// 同一次请求共用查询结果；公开读取不跨请求缓存库存状态。
const getInventoryItem = cache(async (slug: string) => {
  return (await getPublicInventory()).find((item) => item.slug === slug) ?? null
})

function getSeoProductType(productType: string) {
  const normalizedType = productType.trim().toLowerCase()

  if (normalizedType === 'disposable vape') {
    return 'Disposable Vape'
  }

  if (normalizedType === 'pod kit') {
    return 'Pod Kit'
  }

  if (normalizedType === 'pod system') {
    return 'Pod System'
  }

  if (normalizedType === 'pod') {
    return 'Pod'
  }

  if (normalizedType === 'vape kit' || normalizedType === 'vape kits') {
    return 'Vape Kit'
  }

  if (normalizedType === 'e-liquid' || normalizedType === 'eliquid') {
    return 'E-liquid'
  }

  if (normalizedType === 'device') {
    return 'Vape Device'
  }

  if (normalizedType === 'accessory') {
    return 'Vape Accessory'
  }

  return 'Vape'
}

function buildInventoryMetadataTitle(item: InventoryRecord) {
  return `${item.title} Wholesale ${getSeoProductType(item.product_type)} Stock | VapeStockHub`
}

// Dynamically generate SEO metadata based on the inventory item
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const item = await getInventoryItem(resolvedParams.slug)

  if (!item) {
    return { title: 'Not Found | VapeStockHub' }
  }

  return {
    title: buildInventoryMetadataTitle(item),
    description: buildInventoryMetadataDescription(item),
    alternates: {
      canonical: `${siteConfig.url}/inventory/${resolvedParams.slug}`,
    },
  }
}

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = await getInventoryItem(slug)
  if (!item) notFound()

  const brandSlug = toSlug(item.brand)
  const relatedItems = (await getPublicInventory())
    .filter((other) => other.status === 'active' && other.id !== item.id)
    .filter((other) => toSlug(other.brand) === brandSlug || (item.market && toSlug(other.market) === toSlug(item.market)))
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 3)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildInventoryJsonLd(item)).replace(/</g, '\\u003c'),
        }}
      />
      <InventoryDetailView item={item} relatedItems={relatedItems} />
    </>
  )
}
