import type { InventoryRecord } from './inventory'

export function publicMoq(item: Pick<InventoryRecord, 'moq' | 'moq_public'>) {
  return item.moq_public !== false && item.moq !== null && item.moq > 0 ? item.moq : null
}

/** The preview uses the same allowed fields and masks as public_inventory. */
export function publicInventoryPreview(item: InventoryRecord): InventoryRecord {
  const publicPrice = item.contact_visibility === 'public' && item.pricing_mode === 'exact_price'
  return {
    id: item.id, slug: item.slug, title: item.title, brand: item.brand, product_type: item.product_type,
    pricing_mode: item.pricing_mode, pricing_note: publicPrice ? item.pricing_note : null,
    price: publicPrice ? item.price : null, quantity: item.quantity,
    moq: publicMoq(item), moq_public: item.moq_public,
    description: item.entry_version === 1 ? null : item.description,
    flavor: item.flavor, nicotine: item.nicotine, puff: item.puff, e_liquid: item.e_liquid,
    model_name: item.model_name, product_highlight: item.product_highlight,
    stock_rows: item.stock_rows, stock_notes: item.stock_notes,
    product_parameters: item.product_parameters, entry_version: item.entry_version,
    production_date_text: item.production_date_text, market: item.market,
    featured_markets: item.featured_markets, market_access_note: item.market_access_note,
    warehouse_location: item.warehouse_location, images: item.images, status: item.status,
    contact_visibility: item.contact_visibility, is_featured: item.is_featured,
    is_urgent_clearance: item.is_urgent_clearance, last_verified_at: item.last_verified_at,
    created_at: item.created_at, updated_at: item.updated_at,
  }
}
