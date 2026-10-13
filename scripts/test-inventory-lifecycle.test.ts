import assert from 'node:assert/strict'
import test from 'node:test'

import type { PublicInventoryRecord } from '../src/lib/inventory'
import { buildInventoryInquiry, hasPublicPrice, needsAvailabilityConfirmation, sortInventoryByAvailability } from '../src/lib/inventory-lifecycle'
import { getPriceTierItems } from '../src/lib/inventory-price'
import { buildInventoryJsonLd, buildInventoryMetadataDescription } from '../src/lib/inventory-seo'

const stock: PublicInventoryRecord = {
  id:'test-stock', slug:'test-stock', title:'Test wholesale lot', brand:'Test', product_type:'Pod Kit',
  pricing_mode:'exact_price', pricing_note:null, description:'Original manifest', flavor:'Mint',
  nicotine:null, puff:null, e_liquid:null, production_date_text:null,
  price:2.8, quantity:12000, moq:500, market:'Europe', featured_markets:['Europe'],
  market_access_note:null, warehouse_location:'London, UK', images:[], status:'active',
  contact_visibility:'public', is_featured:true, is_urgent_clearance:true,
  last_verified_at:'2026-10-13T00:00:00Z', created_at:'2026-10-13T00:00:00Z', updated_at:'2026-10-13T00:00:00Z',
}

test('sold-out status overrides original quantity and never offers the historical price', () => {
  const sold = {...stock, status:'sold' as const}
  const schema = buildInventoryJsonLd(sold)
  assert.equal(schema.offers.availability,'https://schema.org/OutOfStock')
  assert.equal('price' in schema.offers,false)
  assert.match(buildInventoryMetadataDescription(sold),/sold out/i)
  assert.doesNotMatch(buildInventoryMetadataDescription(sold),/12,000 pcs available|active wholesale/i)
  assert.match(buildInventoryInquiry(sold),/restock or alternatives/)
  assert.doesNotMatch(buildInventoryInquiry(sold),/available quantity \(12,000/)
  assert.equal(sold.quantity,12000)
})

test('hidden and inquiry-only prices are excluded from price bands and structured offers', () => {
  const hidden = {...stock, contact_visibility:'contact_required' as const, price:9999}
  const inquiry = {...stock, pricing_mode:'inquiry_only' as const}
  assert.equal(hasPublicPrice(hidden),false)
  assert.equal(hasPublicPrice(inquiry),false)
  assert.equal('price' in buildInventoryJsonLd(hidden).offers,false)
  assert.equal('price' in buildInventoryJsonLd(inquiry).offers,false)
  assert.deepEqual(getPriceTierItems([hidden,inquiry], 'over-8'),[])
  assert.deepEqual(getPriceTierItems([inquiry], 'under-3'),[])
  assert.equal(buildInventoryJsonLd(stock).offers.price,2.8)
})

test('sold-out lots remain discoverable in price bands and available lots sort first', () => {
  const sold = {...stock,id:'sold',status:'sold' as const,created_at:'2026-10-14T00:00:00Z'}
  assert.equal(getPriceTierItems([sold], 'under-3').length,1)
  assert.deepEqual(sortInventoryByAvailability([sold,stock]).map((item)=>item.id),['test-stock','sold'])
})

test('old or missing confirmation prompts recheck without changing the stock status', () => {
  const now=Date.parse('2026-10-21T00:00:00Z')
  assert.equal(needsAvailabilityConfirmation(stock,now),true)
  assert.equal(needsAvailabilityConfirmation({...stock,last_verified_at:null},now),true)
  assert.equal(needsAvailabilityConfirmation({...stock,status:'sold'},now),false)
  assert.equal(stock.status,'active')
})
