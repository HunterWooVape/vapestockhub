import type { InventoryRecord } from './inventory'
import { readProductParameters, readStockRows, stockInteger, stockTotal } from './stock-entry'
import { toSlug } from './inventory'

const statuses = ['draft', 'active', 'reserved', 'sold', 'expired'] as const
export function readInventoryEntry(data: FormData, current?: InventoryRecord | null) {
  const text = (key: string, limit = 500) => {
    const value = String(data.get(key) ?? '').trim()
    if (value.length > limit) throw new Error('输入内容过长。')
    return value
  }
  const numeric = (key: string) => {
    const raw = text(key)
    if (!raw) return null
    const value = stockInteger(raw)
    if (value === null) throw new Error('数量、口数和 MOQ 需要填写非负整数。')
    return value
  }
  const stockRows = readStockRows(JSON.parse(text('stock_rows', 500000) || '[]'))
  const parameters = readProductParameters(JSON.parse(text('product_parameters', 50000) || '[]'))
  const quantity = numeric('quantity') ?? 0
  if (stockRows.length && stockTotal(stockRows) !== quantity) throw new Error('明细合计与总量不一致，请先核对。')
  const rawPrice = text('price')
  const price = rawPrice ? Number(rawPrice) : null
  if (price !== null && (!/^\d+(?:\.\d{1,2})?$/.test(rawPrice) || !Number.isFinite(price) || price <= 0 || price > 99999999.99)) throw new Error('价格需要大于 0，最多两位小数。')
  const moq = numeric('moq')
  if (moq === 0) throw new Error('MOQ 请填写正整数，未知时留空。')
  const requestedStatus = text('status')
  if (!statuses.includes(requestedStatus as InventoryRecord['status'])) throw new Error('库存状态无效。')
  const title = text('title', 250)
  const slugValue = text('slug', 250)
  if (slugValue && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue)) throw new Error('网址标识只能使用小写英文字母、数字和连字符。')
  const imageUrl = text('image_url', 2000)
  if (imageUrl && !(imageUrl.startsWith('/images/') && !imageUrl.includes('..')) && !/^https:\/\/[^\s<>"']+$/i.test(imageUrl)) throw new Error('主图请使用 HTTPS 链接或站内图片路径。')
  const notes = text('stock_notes', 30000)
  const verifiedDate = text('verified_date', 10)
  if (verifiedDate && (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedDate) || Number.isNaN(Date.parse(`${verifiedDate}T00:00:00Z`)) || new Date(`${verifiedDate}T00:00:00Z`).toISOString().slice(0, 10) !== verifiedDate)) throw new Error('最近确认日期无效。')
  return {
    title, slug: current?.slug || slugValue || toSlug(title), brand: text('brand', 150),
    product_type: text('product_type', 100), model_name: text('model_name', 150) || null,
    product_highlight: text('product_highlight', 250) || null,
    price, quantity, moq, moq_public: data.get('moq_public') === 'on',
    pricing_mode: price === null ? 'inquiry_only' as const : 'exact_price' as const,
    pricing_note: text('pricing_note', 5000) || null,
    contact_visibility: data.get('contact_visibility') === 'public' ? 'public' as const : 'contact_required' as const,
    stock_rows: stockRows, stock_notes: notes || null, product_parameters: parameters, entry_version: 1,
    // 原描述保留在数据库供旧记录核对；新版公开视图永不返回此值。
    description: current?.description ?? null,
    flavor: stockRows.length ? [...new Set(stockRows.map((row) => row.flavor))].join(', ') : text('flavor', 10000) || null,
    nicotine: text('nicotine', 100) || null, puff: numeric('puff'), e_liquid: text('e_liquid', 100) || null,
    warehouse_location: text('warehouse_location'), market: text('market'),
    featured_markets: text('featured_markets', 2000).split(',').map((value) => value.trim()).filter(Boolean),
    market_access_note: text('market_access_note', 5000) || null,
    production_date_text: text('production_date_text', 200) || null,
    images: imageUrl ? [imageUrl] : [], status: requestedStatus as InventoryRecord['status'],
    last_verified_at: verifiedDate ? verifiedDate === current?.last_verified_at?.slice(0, 10) ? current.last_verified_at : `${verifiedDate}T00:00:00.000Z` : null,
    is_featured: data.get('is_featured') === 'on', is_urgent_clearance: data.get('is_urgent_clearance') === 'on',
  }
}

export function inventoryPublishIssues(item: Pick<InventoryRecord, 'title' | 'brand' | 'product_type' | 'quantity' | 'images'>) {
  const issues: string[] = []
  if (!item.title.trim()) issues.push('请填写标题。')
  if (!item.brand.trim()) issues.push('请填写品牌。')
  if (!item.product_type.trim()) issues.push('请选择产品类型。')
  if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) issues.push('请填写大于 0 的库存总量。')
  if (!item.images?.[0] || item.images[0].includes('placehold.co') || item.images[0] === '/images/inventory-placeholder.svg') issues.push('请提供一张真实主图。')
  return issues
}
