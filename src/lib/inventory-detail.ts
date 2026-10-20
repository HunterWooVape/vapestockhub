import type { InventoryRecord } from './inventory'

export type InventoryBreakdown = {
  configurations: { key: string; label: string; total: number }[]
  rows: { label: string; quantities: (number | null)[] }[]
  total: number
  unit: 'pcs' | 'sets'
  notes: string
}

type ManifestItem = Pick<InventoryRecord, 'description' | 'quantity' | 'flavor'>
type ParsedRow = { label: string; quantity: number; unit: 'pcs' | 'sets' | null }

const quantityPattern = /^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)$/
const rowPattern = /^(.+?)\s*[-–—]\s*([\d,]+)\s*(pcs?|pieces?|sets?)?\s*$/i

function parseRow(line: string): ParsedRow | null {
  const match = rowPattern.exec(line)
  if (!match || !quantityPattern.test(match[2])) return null

  const label = match[1].trim()
  const quantity = Number(match[2].replaceAll(',', ''))
  // A second separator can be a negative sign, not part of the item name.
  if (!/[\p{L}]/u.test(label) || /[-–—]\s*$/.test(label) || !Number.isSafeInteger(quantity)) return null

  const suppliedUnit = match[3]?.toLowerCase()
  return { label, quantity, unit: suppliedUnit ? (suppliedUnit.startsWith('set') ? 'sets' : 'pcs') : null }
}

function configurationLabel(line: string): string | null {
  const heading = line.replace(/^\d+\s*[:：.]\s*/, '').replace(/[:：]\s*$/, '').trim()
  const product = /^Product\s*[:：]\s*(.+)$/i.exec(heading)
  if (product) return product[1].trim()

  // Recognize configuration headings, not a product type inferred from title.
  // Ignore trailing parentheses only when recognizing the heading. They remain
  // part of its identity: region, strength or composition can distinguish lots.
  const shortHeading = heading.replace(/\s*\([^()]*\)\s*$/, '').trim()
  if (/^(?:[\p{L}\d][\p{L}\d .+&-]*?\s+-\s+)?(?:Full Kit|Pod Only|Starter Kit|Refill Kit)$/iu.test(shortHeading)) {
    return heading
  }
  if (/^\d+\s+Pods?\s+Kit$/i.test(shortHeading)) return heading
  if (/^[\p{L}\d][\p{L}\d .+&-]*?\s+(?:(?:Device|Pod)\s+Kit|Kit|Pod|Pod Cartridge)$/iu.test(shortHeading)) {
    return heading
  }
  if (/^(?:Kit|Pod|Device Kit|Pod Kit)$/i.test(shortHeading)) return heading
  return null
}

function isAmbiguousConfiguration(line: string): boolean {
  if (/^Product\s*[:：]/i.test(line)) return false
  const heading = line.replace(/\s*\([^()]*\)\s*[:：]?$/, '')
  return /\b(?:kit|pods?)\b.*(?:[/&+]|\band\b).*\b(?:kit|pods?)\b/i.test(heading)
}

function isManifestNote(line: string): boolean {
  // These contain quantities too, but are not inventory rows.
  return /^(?:(?:Grand\s+|Sub\s*)?Total\b|.*\bTotal\s*[:：]|MOQ\b|Minimum\s+Order\b|Quantity\s+per\s+carton\b|(?:Carton|Packing|Pack(?:age|ing)?|Box)\s+(?:Size|Weight|Quantity|Dimensions)\b|(?:Nicotine|Puffs?|E[- ]?liquid|Battery|Capacity|Production\s+Date|Expiry\s+Date|Location|Warehouse|Market\s+Access\s+Note|Pricing\s+Note|Price)\s*[:：–—-]|Flavor\s*\+\s*Quantity\b)/i.test(line)
    || /^(?:Kit|Pods?)\s*[:：]\s*[$€£\d]/i.test(line)
}

/**
 * Present only complete, unambiguous legacy manifests as a table. This is a
 * read-only adapter: unfamiliar formats retain their original description.
 */
export function buildInventoryBreakdown(item: ManifestItem): InventoryBreakdown | null {
  if (!item.description?.trim() || !Number.isSafeInteger(item.quantity) || item.quantity < 0) return null

  const lines = item.description.replace(/\r\n?/g, '\n').split('\n').map((line) => line.trim())
  const notes: string[] = []
  const configurations: { label: string; values: Map<string, number> }[] = []
  const labels: string[] = []
  const suppliedFlavors = new Set(item.flavor?.split(',').map((value) => value.trim()).filter(Boolean) ?? [])
  const units = new Set<'pcs' | 'sets'>()
  let hasUnitlessRows = false
  let hasExplicitRows = false
  let currentHeading: string | null = null
  let currentConfiguration: (typeof configurations)[number] | undefined
  let total = 0
  let hasRows = false

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line || /^[-–—]{3,}$/.test(line)) {
      if (notes.length && notes.at(-1) !== '') notes.push('')
      continue
    }
    if (isManifestNote(line)) {
      notes.push(line)
      continue
    }

    const row = parseRow(line)
    if (row) {
      if (!currentConfiguration) {
        currentConfiguration = configurations.find((configuration) => configuration.label === currentHeading)
        if (!currentConfiguration) {
          currentConfiguration = { label: currentHeading ?? '', values: new Map() }
          configurations.push(currentConfiguration)
        }
      }
      if (row.unit) {
        units.add(row.unit)
        hasExplicitRows = true
      } else hasUnitlessRows = true
      if (units.size > 1 || (hasUnitlessRows && hasExplicitRows)) return null

      const quantity = (currentConfiguration.values.get(row.label) ?? 0) + row.quantity
      total += row.quantity
      if (!Number.isSafeInteger(quantity) || !Number.isSafeInteger(total)) return null
      currentConfiguration.values.set(row.label, quantity)
      if (!labels.includes(row.label)) labels.push(row.label)
      hasRows = true
      continue
    }

    if (isAmbiguousConfiguration(line)) return null
    const heading = configurationLabel(line)
    if (heading) {
      // Rows without a heading must never be retroactively assigned a type.
      if (hasRows && configurations.some((configuration) => !configuration.label)) return null
      currentHeading = heading
      currentConfiguration = undefined
      notes.push(line)
      continue
    }

    // Unknown quantities, malformed numeric rows, and unknown group headings
    // must not silently disappear while the remaining rows form a valid sum.
    const nextLine = lines.slice(index + 1).find(Boolean)
    if (/\s[-–—](?:\s|$)|[-–—]\s*[+\d?]|\d\s*(?:pcs?|pieces?|sets?)\b/i.test(line)
      || /(?:^|[\s:：])(?:TBD|TBC|unknown|pending|N\/?A|\?)(?:\s|$)/i.test(line)
      || suppliedFlavors.has(line)
      || (hasRows && /[:：]$|\b(?:version|variant|configuration|batch|kit|pods?)\b/i.test(line))
      || (hasRows && nextLine && parseRow(nextLine))) return null

    notes.push(line)
  }

  if (!hasRows || total !== item.quantity || configurations.length === 0) return null
  // An explicit final heading with no following rows is an incomplete group.
  if (currentHeading !== null && !currentConfiguration) return null

  const singleConfiguration = configurations.length === 1
  return {
    configurations: configurations.map((configuration, index) => ({
      key: `configuration-${index + 1}`,
      label: singleConfiguration ? 'Quantity' : configuration.label,
      total: Array.from(configuration.values.values()).reduce((sum, value) => sum + value, 0),
    })),
    rows: labels.map((label) => ({
      label,
      quantities: configurations.map((configuration) => configuration.values.get(label) ?? null),
    })),
    total,
    unit: units.values().next().value ?? 'pcs',
    notes: notes.join('\n').trim(),
  }
}
