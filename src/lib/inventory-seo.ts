import type { InventoryRecord } from '@/lib/inventory'
import { getInventoryImageSrc } from '@/lib/inventory'
import { hasPublicPrice, isSoldOut } from '@/lib/inventory-lifecycle'
import { siteConfig } from '@/lib/site'

export function buildInventoryMetadataDescription(item: InventoryRecord) {
  if (isSoldOut(item)) {
    return `${item.title} wholesale lot — sold out. Review product specifications and previous lot details${item.warehouse_location ? ` for ${item.warehouse_location}` : ''}. Ask about restock or alternative stock.`
  }
  return `${item.title} wholesale stock. ${item.quantity.toLocaleString()} pcs listed, MOQ ${item.moq.toLocaleString()} pcs${item.warehouse_location ? `, warehouse: ${item.warehouse_location}` : ''}. Confirm current availability and pricing by inquiry.`
}

export function buildInventoryJsonLd(item: InventoryRecord) {
  const pageUrl = `${siteConfig.url}/inventory/${item.slug}`
  const image = getInventoryImageSrc(item.images)
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url: pageUrl,
    availability: !isSoldOut(item) && item.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': `${siteConfig.url}#organization` },
    hasMerchantReturnPolicy: { '@id': `${siteConfig.url}/shipping-returns#return-policy` },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      hasShippingService: { '@id': `${siteConfig.url}/shipping-returns#shipping-policy` },
    },
  }

  // 售罄页的旧价格只是历史参考，不作为当前可成交报价发送给搜索引擎。
  if (!isSoldOut(item) && hasPublicPrice(item)) {
    offer.price = Number(item.price!.toFixed(2))
    offer.priceCurrency = 'USD'
  }
  return {
    '@context': 'https://schema.org', '@type': 'Product',
    name: item.title, brand: { '@type': 'Brand', name: item.brand },
    category: item.product_type,
    image: image.startsWith('http') ? image : `${siteConfig.url}${image}`,
    description: buildInventoryMetadataDescription(item),
    sku: item.slug, url: pageUrl, offers: offer,
  }
}
