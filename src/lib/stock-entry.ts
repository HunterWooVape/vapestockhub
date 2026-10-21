export type StockRow = { flavor: string; configuration: string; nicotine: string; quantity: number }
export type ProductParameter = { name: string; value: string }

const integer = /^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:[,\u00a0 ]\d{3})+)$/
export function stockInteger(value: string): number | null {
  const cleaned = value.trim().replace(/\s*(?:pcs?|pieces?|sets?|个|套|支)\s*$/i, '')
  if (!integer.test(cleaned)) return null
  const number = Number(cleaned.replace(/[,\u00a0 ]/g, ''))
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null
}

export function mergeStockRows(rows: StockRow[]): StockRow[] {
  const merged = new Map<string, StockRow>()
  for (const row of rows) {
    const value = { flavor: row.flavor.trim(), configuration: row.configuration.trim(), nicotine: row.nicotine.trim(), quantity: row.quantity }
    if (!value.flavor || value.flavor.length > 250 || value.configuration.length > 250 || value.nicotine.length > 100 || !Number.isSafeInteger(value.quantity) || value.quantity < 0) throw new Error('明细名称或数量无效。')
    const key = JSON.stringify([value.configuration, value.nicotine, value.flavor])
    const previous = merged.get(key)
    const quantity = (previous?.quantity ?? 0) + value.quantity
    if (quantity > 2147483647) throw new Error('明细数量超出范围。')
    merged.set(key, { ...value, quantity })
  }
  if (merged.size > 3000 || stockTotal([...merged.values()]) > 2147483647) throw new Error('明细数量超出范围。')
  return [...merged.values()]
}

export function stockTotal(rows: StockRow[]) { return rows.reduce((total, row) => total + row.quantity, 0) }

export function readStockRows(value: unknown): StockRow[] {
  if (!Array.isArray(value) || value.length > 3000) throw new Error('库存明细格式无效。')
  return mergeStockRows(value.map((row) => {
    if (!row || typeof row !== 'object' || typeof row.flavor !== 'string' || typeof row.quantity !== 'number') throw new Error('请补齐口味和数量。')
    if (row.configuration != null && typeof row.configuration !== 'string' || row.nicotine != null && typeof row.nicotine !== 'string') throw new Error('规格格式无效。')
    return { flavor: row.flavor, configuration: row.configuration ?? '', nicotine: row.nicotine ?? '', quantity: row.quantity }
  }))
}

export function readProductParameters(value: unknown): ProductParameter[] {
  if (!Array.isArray(value) || value.length > 40) throw new Error('补充参数格式无效。')
  return value.flatMap((pair) => {
    if (!pair || typeof pair.name !== 'string' || typeof pair.value !== 'string' || pair.name.length > 100 || pair.value.length > 500) throw new Error('补充参数格式无效。')
    const name = pair.name.trim(), content = pair.value.trim()
    return name && content ? [{ name, value: content }] : []
  })
}

function cells(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((value) => value.trim())
  // Quoted CSV fields keep comma-formatted quantities intact.
  if (line.includes(',')) {
    const values = [...line.matchAll(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g)].map((match) => (match[1]?.replaceAll('""', '"') ?? match[2]).trim())
    if (values.length > 1) return values
  }
  return []
}

const flavorHeader = /^(?:flavou?r(?:\s*name)?|local\d?\s*flavou?r\s*name|口味|款式)$/i
const quantityHeader = /^(?:qty\.?|quantity(?:\s*\(?pcs\)?)?|数量|剩余|结余|未出货数量)$/i
const configHeader = /^(?:configuration|specification|规格|配置|版本)$/i
const nicotineHeader = /^(?:nicotine|strength|浓度|尼古丁)$/i
const totalHeader = /^(?:(?:grand|sub)?\s*total|合计|总计)\s*[:：]?/i

export function organizeStockText(text: string) {
  if (text.length > 200000) throw new Error('清单过长，请分批整理。')
  const rows: StockRow[] = [], unresolved: string[] = [], totals: number[] = []
  let columns: { flavor: number; quantity: number; configuration: number; nicotine: number } | null = null
  let configuration = '', nicotine = ''
  for (const source of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = source.trim()
    if (!line) continue
    const values = cells(line)
    const flavorIndex = values.findIndex((value) => flavorHeader.test(value))
    const quantityIndex = values.findIndex((value) => quantityHeader.test(value))
    if (flavorIndex >= 0 && quantityIndex >= 0) {
      columns = { flavor: flavorIndex, quantity: quantityIndex, configuration: values.findIndex((value) => configHeader.test(value)), nicotine: values.findIndex((value) => nicotineHeader.test(value)) }
      continue
    }
    if (totalHeader.test(line) || values.some((value) => totalHeader.test(value))) {
      const last = values.at(-1) ?? line.replace(totalHeader, '').replace(/^\s*[-–—:=]\s*/, '')
      const number = stockInteger(last)
      if (number !== null) totals.push(number)
      else unresolved.push(source)
      continue
    }
    const heading = /^(?:configuration|规格|配置|版本)\s*[:：]\s*(.+)$/i.exec(line)
    if (heading) { configuration = heading[1].trim(); continue }
    const strength = /^(?:nicotine|strength|浓度)\s*[:：]\s*(.+)$/i.exec(line)
    if (strength) { nicotine = strength[1].trim(); continue }
    if (/^(?:MOQ\b|minimum\s+order\b|puffs?\b|nicotine\b|battery\b|capacity\b|e[- ]?liquid\b|(?:carton|box|packing)\b|production\b|expiry\b|price\b|warehouse\b|箱规|容量|浓度|生产|到期|单箱|毛重|净重|尺寸)/i.test(line)) { unresolved.push(source); continue }
    if (columns && values.length) {
      const flavor = values[columns.flavor] ?? ''
      const quantity = stockInteger(values[columns.quantity] ?? '')
      if (flavor && quantity !== null) rows.push({ flavor, quantity, configuration: columns.configuration < 0 ? configuration : values[columns.configuration] ?? '', nicotine: columns.nicotine < 0 ? nicotine : values[columns.nicotine] ?? '' })
      else unresolved.push(source)
      continue
    }
    const plain = values.length === 2 && stockInteger(values[1]) !== null && !/[-–—:]\s*\d*$/.test(values[0]) ? values : []
    const match = /^(.+?)\s*(?:\s[-–—:]\s*|\s{1,}|\t)([\d,]+\s*(?:pcs?|pieces?|sets?|个|套|支)?)$/i.exec(line)
    const flavor = plain[0] ?? match?.[1]?.trim()
    const quantity = stockInteger(plain[1] ?? match?.[2] ?? '')
    if (flavor && /[\p{L}]/u.test(flavor) && !/[-–—:]\s*$/.test(flavor) && quantity !== null) rows.push({ flavor, quantity, configuration, nicotine })
    else unresolved.push(source)
  }
  const merged = mergeStockRows(rows)
  return { rows: merged, unresolved, sourceTotals: totals, total: stockTotal(merged), mergedCount: rows.length - merged.length }
}

export function recommendInventoryTitles(input: { brand: string; model: string; productType: string; puff?: string; eLiquid?: string; nicotine?: string; highlight?: string }) {
  const parts: string[] = []
  const brand = input.brand.trim()
  const model = input.model.trim().toLowerCase().startsWith(`${brand.toLowerCase()} `) ? input.model.trim().slice(brand.length).trim() : input.model
  for (const raw of [brand, model, input.productType]) {
    const value = raw.trim().replace(/\s+/g, ' ')
    if (value && !parts.join(' ').toLowerCase().includes(value.toLowerCase())) parts.push(value)
  }
  const base = parts.join(' ')
  if (!base) return []
  const puff = stockInteger(input.puff ?? '')
  const puffMentioned = puff !== null && new RegExp(`(?:${puff}|${puff / 1000}k)\\b`, 'i').test(base.replaceAll(',', ''))
  const parameter = puff && !puffMentioned ? `${puff.toLocaleString('en-US')} Puffs` : input.eLiquid?.trim() || input.nicotine?.trim()
  return [...new Set([base, parameter && !base.toLowerCase().includes(parameter.toLowerCase()) ? `${base} — ${parameter}` : '', input.highlight?.trim() ? `${base} — ${input.highlight.trim()}` : ''].filter(Boolean))].slice(0, 3)
}
