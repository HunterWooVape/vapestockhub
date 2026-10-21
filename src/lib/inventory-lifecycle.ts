import { format, isValid, parseISO } from 'date-fns'

import type { InventoryRecord } from '@/lib/inventory'
import { publicMoq } from '@/lib/inventory-public-fields'

export const PUBLIC_INVENTORY_STATUSES = ['active', 'sold'] as const

export function isSoldOut(item: Pick<InventoryRecord, 'status'>) {
  return item.status === 'sold'
}

export function hasPublicPrice(item: Pick<InventoryRecord, 'price' | 'contact_visibility' | 'pricing_mode'>) {
  return item.contact_visibility === 'public' && item.pricing_mode === 'exact_price' && item.price !== null
}

export function formatVerifiedDate(value: string | null) {
  if (!value) return null
  const date = parseISO(value)
  return isValid(date) ? format(date, 'dd MMM yyyy') : null
}

export function needsAvailabilityConfirmation(item: Pick<InventoryRecord, 'status' | 'last_verified_at'>, now = Date.now()) {
  if (item.status !== 'active') return false
  const time = item.last_verified_at ? Date.parse(item.last_verified_at) : NaN
  return !Number.isFinite(time) || now - time > 7 * 24 * 60 * 60 * 1000
}

export function sortInventoryByAvailability<T extends Pick<InventoryRecord, 'status' | 'created_at'>>(items: T[]) {
  return [...items].sort((left, right) => {
    const statusOrder = Number(isSoldOut(left)) - Number(isSoldOut(right))
    return statusOrder || right.created_at.localeCompare(left.created_at)
  })
}

export function buildInventoryInquiry(item: Pick<InventoryRecord, 'title' | 'status' | 'moq' | 'warehouse_location' | 'moq_public'>) {
  if (isSoldOut(item)) {
    return `Hi VapeStockHub, I'm looking for restock or alternatives to ${item.title}${item.warehouse_location ? ` in ${item.warehouse_location}` : ''}. Please confirm current options, quantity, MOQ and pricing.`
  }
  return `Hi VapeStockHub, I'm interested in ${item.title}. Please confirm current price, available quantity, MOQ${publicMoq(item) ? ` (${publicMoq(item)!.toLocaleString()} pcs)` : ''} and warehouse availability${item.warehouse_location ? ` in ${item.warehouse_location}` : ''}.`
}
