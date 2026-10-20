import assert from 'node:assert/strict'
import test from 'node:test'

import { buildInventoryBreakdown } from '../src/lib/inventory-detail'

const manifest = (description: string, quantity: number, flavor: string | null = null) => ({ description, quantity, flavor })

test('explicit kit and pod groups share rows without inventing missing quantities', () => {
  const result = buildInventoryBreakdown(manifest([
    'US Version - Pod Only：', 'Mint - 0pcs', 'Mango - 20pcs',
    'US Version - Full Kit：', 'Mint - 30pcs', 'Berry - 10pcs',
  ].join('\r\n'), 60))

  assert.ok(result)
  assert.deepEqual(result.configurations.map(({ label, total }) => ({ label, total })), [
    { label: 'US Version - Pod Only', total: 20 }, { label: 'US Version - Full Kit', total: 40 },
  ])
  assert.deepEqual(result.rows, [
    { label: 'Mint', quantities: [0, 30] },
    { label: 'Mango', quantities: [20, null] },
    { label: 'Berry', quantities: [null, 10] },
  ])
  assert.equal(result.total, 60)
  assert.equal(result.unit, 'pcs')
})

test('single configuration and repeated identical labels are summed in input order', () => {
  const result = buildInventoryBreakdown(manifest('Mint - 1,000pcs\nMango - 5pcs\nMint - 30pcs\nmint - 2pcs', 1037))
  assert.ok(result)
  assert.deepEqual(result.configurations.map(({ label, total }) => ({ label, total })), [{ label: 'Quantity', total: 1037 }])
  assert.deepEqual(result.rows, [
    { label: 'Mint', quantities: [1030] }, { label: 'Mango', quantities: [5] }, { label: 'mint', quantities: [2] },
  ])
})

test('Kit in a product heading does not create kit or pod categories', () => {
  const result = buildInventoryBreakdown(manifest('HYPPE INFINITI 50K Kit\nChewy Watermelon - 72609pcs\nMint - 1pcs', 72610))
  assert.ok(result)
  assert.equal(result.configurations.length, 1)
  assert.equal(result.configurations[0].label, 'Quantity')
  assert.match(result.notes, /HYPPE INFINITI 50K Kit/)
})

test('Product headings preserve region/version groups and compose independent quantities', () => {
  const result = buildInventoryBreakdown(manifest('Product: Europe Version (20mg)\nMint - 10pcs\nProduct: Europe Version (0mg)\nMint - 20pcs\nProduct: Middle East Version (20mg)\nMint - 30pcs', 60))
  assert.ok(result)
  assert.deepEqual(result.configurations.map(({ label }) => label), ['Europe Version (20mg)', 'Europe Version (0mg)', 'Middle East Version (20mg)'])
  assert.deepEqual(result.rows[0].quantities, [10, 20, 30])
})

test('starter/refill composition remains part of configuration identity and notes', () => {
  const result = buildInventoryBreakdown(manifest('Starter Kit (1-in-1: 1 Device + 1 Pod + 1 E-liquid)\nMint - 10pcs\nRefill Kit (2-in-1: 1 Pod + 1 E-liquid)\nMint - 20pcs', 30))
  assert.ok(result)
  assert.deepEqual(result.configurations.map(({ label }) => label), [
    'Starter Kit (1-in-1: 1 Device + 1 Pod + 1 E-liquid)',
    'Refill Kit (2-in-1: 1 Pod + 1 E-liquid)',
  ])
  assert.match(result.notes, /1 Device \+ 1 Pod \+ 1 E-liquid/)
})

test('parenthetical region versions never merge while an identical full heading can recur', () => {
  const result = buildInventoryBreakdown(manifest([
    'Full Kit (US Version)', 'Mint - 10pcs',
    'Full Kit (EU Version)', 'Mint - 20pcs',
    'Full Kit (US Version)', 'Mint - 5pcs',
  ].join('\n'), 35))
  assert.ok(result)
  assert.deepEqual(result.configurations.map(({ label, total }) => ({ label, total })), [
    { label: 'Full Kit (US Version)', total: 15 },
    { label: 'Full Kit (EU Version)', total: 20 },
  ])
  assert.deepEqual(result.rows, [{ label: 'Mint', quantities: [15, 20] }])
})

test('parenthetical nicotine strengths never merge', () => {
  const result = buildInventoryBreakdown(manifest([
    'Pod Only (20mg)', 'Mint - 10pcs',
    'Pod Only (0mg)', 'Mint - 20pcs',
  ].join('\n'), 30))
  assert.ok(result)
  assert.deepEqual(result.configurations.map(({ label, total }) => ({ label, total })), [
    { label: 'Pod Only (20mg)', total: 10 },
    { label: 'Pod Only (0mg)', total: 20 },
  ])
  assert.deepEqual(result.rows, [{ label: 'Mint', quantities: [10, 20] }])
})

test('sets are retained and box specifications, totals, MOQ and risk notes are not rows', () => {
  const result = buildInventoryBreakdown(manifest([
    'Location: London, UK', 'Argusbar Neon 2K Pod Kit：', 'Mint - 10sets',
    'Mango - 20sets', 'Total: 30sets', 'MOQ - 5pcs', 'Quantity per carton: 100pcs',
    'Carton size: 346*328*260mm', 'Carton weight: 14.23KG',
    'Delivery cost not included', 'Potential quality risks include damaged packaging.',
  ].join('\n'), 30))
  assert.ok(result)
  assert.equal(result.unit, 'sets')
  assert.equal(result.rows.length, 2)
  assert.match(result.notes, /Quantity per carton: 100pcs/)
  assert.match(result.notes, /Delivery cost not included/)
  assert.match(result.notes, /Potential quality risks/)
})

test('plain numeric quantities are accepted only with a complete matching total', () => {
  assert.deepEqual(buildInventoryBreakdown(manifest('Mint — 100\nMango — 50', 150))?.rows, [
    { label: 'Mint', quantities: [100] }, { label: 'Mango', quantities: [50] },
  ])
  assert.equal(buildInventoryBreakdown(manifest('Mint — 100\nMango — 50', 160)), null)
})

test('incomplete, ambiguous or mixed-unit manifests retain their original text', () => {
  const cases: [string, number, (string | null)?][] = [
    ['Mint - 20pcs\nMango - 10sets', 30],
    ['Mint - 20pcs\nMango - 10', 30],
    ['Mint - 20pcs\nMango - TBD', 20],
    ['Mint - 20pcs\nMango: TBD', 20],
    ['Mint - 20pcs\nMango -', 20],
    ['Mint - 20pcs\nMango - 0?', 20],
    ['Mint - 20pcs\nMango', 20, 'Mint, Mango'],
    ['Batch A:\nMint - 20pcs\nBatch B:\nMint - 10pcs', 30],
    ['Starter Kit & Refill Kit\nMint - 20pcs', 20],
    ['Full Kit / Pod Only\nMint - 20pcs', 20],
    ['Mint - 20pcs\nFull Kit\nMango - 10pcs', 30],
    ['Full Kit\nMint - 20pcs\nPod Only', 20],
    ['Mint - 20pcs\nMango - 10pcs', 40],
    ['Flavor breakdown visible after inquiry.', 100],
  ]
  for (const [description, quantity, flavor = null] of cases) assert.equal(buildInventoryBreakdown(manifest(description, quantity, flavor)), null, description)
})

test('malformed, negative, fractional, exponential or unsafe numbers are rejected', () => {
  for (const invalid of ['-1', '1.5', '+1', '1e3', '1,00', '9007199254740992']) {
    assert.equal(buildInventoryBreakdown(manifest(`Mint - ${invalid}pcs`, 1)), null, invalid)
  }
  assert.equal(buildInventoryBreakdown(manifest('Mint - 1pcs', Number.NaN)), null)
  assert.equal(buildInventoryBreakdown(manifest('Mint - 1pcs', 1.5)), null)
  assert.equal(buildInventoryBreakdown(manifest('Mint - 9007199254740991pcs\nMango - 1pcs', Number.MAX_SAFE_INTEGER)), null)
})

test('product parameters cannot be reinterpreted as inventory counts', () => {
  const result = buildInventoryBreakdown(manifest('Mint - 30pcs\nPuffs - 50000pcs\nBattery - 800pcs\nNicotine: 5%', 30))
  assert.ok(result)
  assert.equal(result.rows.length, 1)
  assert.match(result.notes, /Puffs - 50000pcs/)
  assert.match(result.notes, /Nicotine: 5%/)
})

test('only fully identical names within one configuration merge', () => {
  const result = buildInventoryBreakdown(manifest('Full Kit\nMint - 10pcs\nMint - 2pcs\nPod Only\nMint - 20pcs\nMint - 3pcs', 35))
  assert.ok(result)
  assert.deepEqual(result.rows, [{ label: 'Mint', quantities: [12, 23] }])
})
