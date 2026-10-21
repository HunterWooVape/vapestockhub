import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergeStockRows, organizeStockText, readStockRows, recommendInventoryTitles } from '../src/lib/stock-entry'
import { inventoryPublishIssues, readInventoryEntry } from '../src/lib/inventory-entry'
import { publicInventoryPreview } from '../src/lib/inventory-public-fields'
import { buildInventoryInquiry } from '../src/lib/inventory-lifecycle'
import { buildInventoryMetadataDescription } from '../src/lib/inventory-seo'
import { buildInventoryBreakdown } from '../src/lib/inventory-detail'
import type { InventoryRecord } from '../src/lib/inventory'
import { gridOcrText } from '../src/lib/stock-image-ocr'

test('pasted table keeps configurations separate, merges exact duplicates and compares supplier totals', () => {
  const value = organizeStockText('口味\t规格\t浓度\t数量\nBlue\tKit\t5%\t2000\nBlue\tKit\t5%\t30\nBlue\tPod\t5%\t100\nBlue\tKit\t2%\t40\nTotal\t\t\t2199')
  assert.equal(value.total, 2170)
  assert.equal(value.rows.length, 3)
  assert.equal(value.rows[0].quantity, 2030)
  assert.deepEqual(value.sourceTotals, [2199])
  assert.equal(value.unresolved.length, 0)
})
test('unknown and malformed numeric lines cannot silently disappear', () => {
  const value = organizeStockText('Blue - 2,000 pcs\nBlack - -1\nWhite - TBD\nGreen - 2.5\nPink - 0 pcs')
  assert.equal(value.total, 2000)
  assert.equal(value.rows.length, 2)
  assert.equal(value.unresolved.length, 3)
  assert.throws(() => readStockRows([{ flavor: 'Blue', quantity: null }]))
  assert.throws(() => mergeStockRows([{ flavor: 'Blue', configuration: '', nicotine: '', quantity: 2147483648 }]))
})
test('title suggestions use supplied facts without adding puff count twice', () => {
  const values = recommendInventoryTitles({ brand: 'Brand', model: 'Series 50K', productType: 'Device', puff: '50000', eLiquid: '20ml' })
  assert.equal(values[0], 'Brand Series 50K Device')
  assert(!values.join(' ').includes('50,000 Puffs'))
  assert(values.some((value) => value.endsWith('20ml')))
})
function data() { const value = new FormData(); value.set('status', 'draft'); value.set('stock_rows', '[]'); value.set('product_parameters', '[]'); return value }
test('an incomplete draft keeps optional values truly empty; publishing checks the agreed minimum', () => {
  const value = readInventoryEntry(data())
  assert.equal(value.price, null); assert.equal(value.moq, null); assert.equal(value.moq_public, false)
  assert.equal(value.pricing_mode, 'inquiry_only')
  assert.equal(inventoryPublishIssues(value).length, 5)
  assert.equal(inventoryPublishIssues({ ...value, title: 'Sample', brand: 'Brand', product_type: 'Device', quantity: 10, images: ['https://example.com/product.jpg'] }).length, 0)
})
test('total conflicts fail instead of overwriting the supplied quantity', () => {
  const value = data(); value.set('quantity', '100'); value.set('stock_rows', '[{"flavor":"Blue","quantity":90}]')
  assert.throws(() => readInventoryEntry(value), /不一致/)
  value.set('price', 'NaN'); assert.throws(() => readInventoryEntry(value))
})

test('confirmation dates stay empty unless supplied and retain an existing timestamp on ordinary saves', () => {
  const value = data()
  assert.equal(readInventoryEntry(value).last_verified_at, null)
  value.set('verified_date', '2026-10-21')
  assert.equal(readInventoryEntry(value, { slug: 'old', last_verified_at: '2026-10-21T12:30:00.000Z' } as InventoryRecord).last_verified_at, '2026-10-21T12:30:00.000Z')
  value.set('verified_date', '2026-02-31')
  assert.throws(() => readInventoryEntry(value), /日期无效/)
})
test('hidden MOQ, price and source text are absent from public preview and derived text', () => {
  const value = data(); value.set('quantity', '100'); value.set('title', 'Sample'); value.set('moq', '789123'); value.set('price', '123.45')
  const item = { ...readInventoryEntry(value), id: 'id', slug: 'sample', last_verified_at: null, created_at: '', updated_at: '', status: 'active', description: 'PRIVATE-SOURCE', internal_note: 'PRIVATE-NOTE' } as InventoryRecord
  const preview = publicInventoryPreview(item)
  assert.equal(preview.moq, null); assert.equal(preview.price, null); assert.equal(preview.description, null)
  assert(!JSON.stringify(preview).includes('PRIVATE'))
  assert(!buildInventoryInquiry(item).includes('789123'))
  assert(!buildInventoryMetadataDescription(item).includes('789'))
})
test('reviewed structured rows render without using the raw description', () => {
  const rows = [{ flavor: 'Blue', configuration: 'Kit', nicotine: '5%', quantity: 20 }, { flavor: 'Blue', configuration: 'Pod', nicotine: '5%', quantity: 0 }]
  const value = buildInventoryBreakdown({ stock_rows: rows, stock_notes: 'Public note', entry_version: 1, quantity: 20, description: 'PRIVATE', flavor: '' })!
  assert.deepEqual(value.rows[0].quantities, [20, 0]); assert.equal(value.notes, 'Public note')
})

test('OCR cells keep rows aligned and accept formatted thousands without guessing unclear digits', () => {
  const tsv = ['level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
    '5\t1\t1\t1\t1\t1\t10\t60\t30\t10\t90\tBlue',
    '5\t1\t1\t1\t1\t2\t110\t60\t10\t10\t90\t2',
    '5\t1\t1\t1\t1\t3\t125\t60\t30\t10\t90\t000',
    '5\t1\t1\t1\t2\t1\t10\t110\t30\t10\t90\tWhite',
    '5\t1\t1\t1\t2\t2\t110\t110\t30\t10\t40\t2O0',
  ].join('\n')
  const text = gridOcrText(tsv, { x: [0,100,200], y: [0,50,100,150] }, ['Flavor', 'QTY'])!
  const result = organizeStockText(text)
  assert.equal(result.total, 2000)
  assert.equal(result.rows.length, 1)
  assert.equal(result.unresolved.length, 1)
  assert.equal(gridOcrText(tsv, { x: [0,100,200], y: [0,50,100,150] }, ['Unknown', 'QTY']), null)
})
