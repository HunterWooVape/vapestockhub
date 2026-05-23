import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// 中文注释：统一从本地环境读取 Supabase 配置，方便直接查询站内库存数据。
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

type InventoryRow = {
  id: string
  slug: string
  title: string
  brand: string
  product_type: string
  pricing_mode: 'exact_price' | 'inquiry_only'
  pricing_note: string | null
  description: string | null
  flavor: string | null
  nicotine: string | null
  puff: number | null
  e_liquid: string | null
  price: number | null
  quantity: number
  moq: number
  market: string
  featured_markets: string[] | null
  market_access_note: string | null
  warehouse_location: string
  status: 'draft' | 'active' | 'reserved' | 'sold' | 'expired'
  contact_visibility: 'public' | 'contact_required'
  is_featured: boolean | null
  is_urgent_clearance: boolean | null
  last_verified_at: string
}

type DerivedInventory = {
  row: InventoryRow
  source: string
  flavorCount: number
  featuredMarketCount: number
  textSignals: string[]
  dataGaps: string[]
  priceBandLabel: string
  puffBandLabel: string
  candidateAngles: string[]
  evidence: string[]
}

type SlotRecommendation = {
  slotLabel: string
  inventorySlug: string
  inventoryTitle: string
  whyItFits: string[]
  evidence: string[]
}

type CliOptions = {
  keyword: string
  title: string
  urls: string[]
  slugs: string[]
  inputPath?: string
  outDir: string
}

function printUsage() {
  console.log(`
Usage:
  npx tsx scripts/plan-alternative-blog.ts --keyword "geek bar alternative" --title "Best Geek Bar Alternatives for Wholesale Buyers in 2026" --urls "https://vapestockhub.com/inventory/slug-a,https://vapestockhub.com/inventory/slug-b"

Optional flags:
  --slugs "slug-a,slug-b"
  --input /absolute/path/to/urls-or-slugs.txt
  --outDir /absolute/path/to/output-directory
`)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    keyword: '',
    title: '',
    urls: [],
    slugs: [],
    outDir: path.resolve(process.cwd(), 'docs/blog/generated'),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const nextValue = argv[index + 1]

    if (arg === '--keyword' && nextValue) {
      options.keyword = nextValue.trim()
      index += 1
      continue
    }

    if (arg === '--title' && nextValue) {
      options.title = nextValue.trim()
      index += 1
      continue
    }

    if (arg === '--urls' && nextValue) {
      options.urls = nextValue.split(',').map((value) => value.trim()).filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--slugs' && nextValue) {
      options.slugs = nextValue.split(',').map((value) => value.trim()).filter(Boolean)
      index += 1
      continue
    }

    if (arg === '--input' && nextValue) {
      options.inputPath = path.resolve(process.cwd(), nextValue)
      index += 1
      continue
    }

    if (arg === '--outDir' && nextValue) {
      options.outDir = path.resolve(process.cwd(), nextValue)
      index += 1
      continue
    }

    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
  }

  return options
}

function extractSlugFromSource(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (!trimmed.includes('/')) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    const match = parsed.pathname.match(/\/inventory\/([^/?#]+)/i)
    return match?.[1] ?? null
  } catch {
    const match = trimmed.match(/\/inventory\/([^/?#]+)/i)
    return match?.[1] ?? null
  }
}

function normalizeSources(options: CliOptions) {
  const fileValues = options.inputPath && fs.existsSync(options.inputPath)
    ? fs.readFileSync(options.inputPath, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    : []

  const combinedSources = [...options.urls, ...options.slugs, ...fileValues]
  const uniqueSources = Array.from(new Set(combinedSources))
  const slugPairs = uniqueSources
    .map((source) => ({
      source,
      slug: extractSlugFromSource(source),
    }))
    .filter((entry): entry is { source: string; slug: string } => Boolean(entry.slug))

  return slugPairs
}

function splitFlavors(value: string | null) {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
}

function buildPriceBandLabel(row: InventoryRow) {
  if (row.pricing_mode !== 'exact_price' || row.price == null) {
    return 'Inquiry-only pricing'
  }

  if (row.price < 3) {
    return 'Budget-visible price (< $3)'
  }

  if (row.price <= 5) {
    return 'Core price band ($3-$5)'
  }

  if (row.price <= 8) {
    return 'Mid-price band ($5-$8)'
  }

  return 'Premium visible price ($8+)'
}

function buildPuffBandLabel(puff: number | null) {
  if (!puff) {
    return 'Puff count not stated'
  }

  if (puff < 6000) {
    return 'Lower puff range'
  }

  if (puff < 12000) {
    return 'Mid puff range'
  }

  if (puff < 18000) {
    return 'High puff range'
  }

  return 'Ultra-high puff range'
}

function collectTextSignals(row: InventoryRow) {
  const text = `${row.title} ${row.product_type} ${row.description ?? ''}`.toLowerCase()
  const signals: string[] = []

  const signalMap: Array<{ regex: RegExp; label: string }> = [
    { regex: /\bdisplay\b|\bscreen\b/, label: 'Display or screen style' },
    { regex: /\brecharge\b|\brechargeable\b|type-c|type c|usb-c|usb c/, label: 'Rechargeable format' },
    { regex: /\bmesh\b/, label: 'Mesh-related feature' },
    { regex: /\bpulse\b/, label: 'Pulse-style signal' },
    { regex: /\bbar\b/, label: 'Bar-style signal' },
    { regex: /\bdual\b/, label: 'Dual-mode or dual-feature signal' },
    { regex: /\bclearance\b|\burgent\b/, label: 'Clearance or urgency signal' },
  ]

  signalMap.forEach((signal) => {
    if (signal.regex.test(text)) {
      signals.push(signal.label)
    }
  })

  return signals
}

function collectDataGaps(row: InventoryRow) {
  const gaps: string[] = []

  if (!row.puff) {
    gaps.push('Missing puff count')
  }

  if (!row.flavor) {
    gaps.push('Missing flavor list')
  }

  if (!row.description) {
    gaps.push('Missing description')
  }

  if (!row.market_access_note) {
    gaps.push('Missing market access note')
  }

  if (!row.e_liquid) {
    gaps.push('Missing e-liquid capacity')
  }

  if (!row.nicotine) {
    gaps.push('Missing nicotine detail')
  }

  return gaps
}

function buildCandidateAngles(row: InventoryRow, allRows: InventoryRow[]) {
  const angles: string[] = []
  const visiblePriceRows = allRows.filter((item) => item.pricing_mode === 'exact_price' && item.price != null)
  const moqs = allRows.map((item) => item.moq)
  const quantities = allRows.map((item) => item.quantity)
  const puffs = allRows.map((item) => item.puff ?? 0)
  const flavorCount = splitFlavors(row.flavor).length
  const featuredMarketCount = row.featured_markets?.length ?? 0
  const textSignals = collectTextSignals(row)

  const minMoq = Math.min(...moqs)
  const maxQuantity = Math.max(...quantities)
  const maxPuff = Math.max(...puffs)
  const minVisiblePrice = visiblePriceRows.length > 0
    ? Math.min(...visiblePriceRows.map((item) => Number(item.price)))
    : null

  if (row.moq === minMoq) {
    angles.push('Low-MOQ alternative')
  }

  if (row.quantity === maxQuantity) {
    angles.push('Strong stock-depth alternative')
  }

  if ((row.puff ?? 0) === maxPuff && row.puff) {
    angles.push('High-puff alternative')
  }

  if (minVisiblePrice != null && row.pricing_mode === 'exact_price' && row.price === minVisiblePrice) {
    angles.push('Budget-visible alternative')
  }

  if (featuredMarketCount >= 2 || (row.market_access_note?.trim() ?? '').length > 0) {
    angles.push('Market-flexible alternative')
  }

  if (flavorCount >= 6) {
    angles.push('Flavor-breadth alternative')
  }

  if (textSignals.includes('Display or screen style')) {
    angles.push('Display-style alternative')
  }

  if (textSignals.includes('Rechargeable format')) {
    angles.push('Rechargeable alternative')
  }

  if (textSignals.includes('Pulse-style signal')) {
    angles.push('Pulse-style alternative')
  }

  if (angles.length === 0) {
    angles.push('General wholesale alternative')
  }

  return angles
}

function buildEvidence(row: InventoryRow) {
  const evidence: string[] = []
  const flavors = splitFlavors(row.flavor)

  evidence.push(`Status: ${row.status}`)
  evidence.push(`MOQ: ${row.moq.toLocaleString()} pcs`)
  evidence.push(`Stock: ${row.quantity.toLocaleString()} pcs`)
  evidence.push(`Pricing: ${buildPriceBandLabel(row)}`)
  evidence.push(`Puff band: ${buildPuffBandLabel(row.puff)}`)

  if (row.market) {
    evidence.push(`Primary market: ${row.market}`)
  }

  if ((row.featured_markets?.length ?? 0) > 0) {
    evidence.push(`Featured markets: ${row.featured_markets?.join(', ')}`)
  }

  if (row.warehouse_location) {
    evidence.push(`Warehouse: ${row.warehouse_location}`)
  }

  if (flavors.length > 0) {
    evidence.push(`Flavor count: ${flavors.length}`)
  }

  collectTextSignals(row).forEach((signal) => {
    evidence.push(`Signal: ${signal}`)
  })

  return evidence
}

function toDerivedInventory(row: InventoryRow, source: string, allRows: InventoryRow[]): DerivedInventory {
  const flavors = splitFlavors(row.flavor)

  return {
    row,
    source,
    flavorCount: flavors.length,
    featuredMarketCount: row.featured_markets?.length ?? 0,
    textSignals: collectTextSignals(row),
    dataGaps: collectDataGaps(row),
    priceBandLabel: buildPriceBandLabel(row),
    puffBandLabel: buildPuffBandLabel(row.puff),
    candidateAngles: buildCandidateAngles(row, allRows),
    evidence: buildEvidence(row),
  }
}

function buildSlotRecommendations(items: DerivedInventory[]): SlotRecommendation[] {
  const priority = [
    'Low-MOQ alternative',
    'Budget-visible alternative',
    'High-puff alternative',
    'Pulse-style alternative',
    'Display-style alternative',
    'Rechargeable alternative',
    'Market-flexible alternative',
    'Flavor-breadth alternative',
    'Strong stock-depth alternative',
    'General wholesale alternative',
  ]

  const usedSlugs = new Set<string>()
  const recommendations: SlotRecommendation[] = []

  priority.forEach((label) => {
    const matched = items.find((item) => item.candidateAngles.includes(label) && !usedSlugs.has(item.row.slug))
    if (!matched) {
      return
    }

    recommendations.push({
      slotLabel: label,
      inventorySlug: matched.row.slug,
      inventoryTitle: matched.row.title,
      whyItFits: matched.candidateAngles,
      evidence: matched.evidence.slice(0, 5),
    })
    usedSlugs.add(matched.row.slug)
  })

  // 中文注释：如果库存数量多于已生成推荐位，补充剩余库存为备用推荐位。
  items.forEach((item) => {
    if (usedSlugs.has(item.row.slug)) {
      return
    }

    recommendations.push({
      slotLabel: 'Supporting alternative option',
      inventorySlug: item.row.slug,
      inventoryTitle: item.row.title,
      whyItFits: item.candidateAngles,
      evidence: item.evidence.slice(0, 5),
    })
  })

  return recommendations
}

function slugifyFilePart(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatMarkdownReport({
  title,
  keyword,
  derivedItems,
  recommendations,
}: {
  title: string
  keyword: string
  derivedItems: DerivedInventory[]
  recommendations: SlotRecommendation[]
}) {
  const lines: string[] = []

  lines.push(`# Alternative Blog Planning Sheet`)
  lines.push('')
  lines.push(`- Article title: \`${title}\``)
  lines.push(`- Primary keyword: \`${keyword}\``)
  lines.push(`- Inventory count reviewed: \`${derivedItems.length}\``)
  lines.push('')
  lines.push('## Recommended Slot Structure')

  recommendations.forEach((slot, index) => {
    lines.push(`${index + 1}. ${slot.slotLabel}`)
    lines.push(`   - Inventory: \`${slot.inventoryTitle}\` (\`${slot.inventorySlug}\`)`)
    lines.push(`   - Why: ${slot.whyItFits.join(' | ')}`)
    lines.push(`   - Evidence: ${slot.evidence.join(' | ')}`)
  })

  lines.push('')
  lines.push('## Inventory Feature Extraction')

  derivedItems.forEach((item) => {
    lines.push(`### ${item.row.title}`)
    lines.push(`- Source: \`${item.source}\``)
    lines.push(`- Slug: \`${item.row.slug}\``)
    lines.push(`- Brand: \`${item.row.brand}\``)
    lines.push(`- Product type: \`${item.row.product_type}\``)
    lines.push(`- Candidate angles: ${item.candidateAngles.join(' | ')}`)
    lines.push(`- Price band: ${item.priceBandLabel}`)
    lines.push(`- Puff band: ${item.puffBandLabel}`)
    lines.push(`- Text signals: ${item.textSignals.length > 0 ? item.textSignals.join(' | ') : 'None detected'}`)
    lines.push(`- Data gaps: ${item.dataGaps.length > 0 ? item.dataGaps.join(' | ') : 'No major gap detected'}`)
    lines.push(`- Evidence: ${item.evidence.join(' | ')}`)
    lines.push('')
  })

  lines.push('## Confirmation Checklist')
  lines.push('- Are the recommended slot labels aligned with the intended article angle?')
  lines.push('- Should any slot be merged, renamed, or removed before drafting?')
  lines.push('- Are more inventory items needed to strengthen market-fit, price, or feature comparisons?')
  lines.push('- Do any claims require a softer wording to avoid brand confusion or overstatement?')

  return lines.join('\n')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const slugPairs = normalizeSources(options)

  if (!options.keyword || !options.title || slugPairs.length === 0) {
    printUsage()
    process.exit(1)
  }

  const slugs = Array.from(new Set(slugPairs.map((pair) => pair.slug)))
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      slug,
      title,
      brand,
      product_type,
      pricing_mode,
      pricing_note,
      description,
      flavor,
      nicotine,
      puff,
      e_liquid,
      price,
      quantity,
      moq,
      market,
      featured_markets,
      market_access_note,
      warehouse_location,
      status,
      contact_visibility,
      is_featured,
      is_urgent_clearance,
      last_verified_at
    `)
    .in('slug', slugs)

  if (error) {
    console.error('Failed to fetch inventory:', error.message)
    process.exit(1)
  }

  const rows = (data ?? []) as InventoryRow[]
  if (rows.length === 0) {
    console.error('No matching inventory found for the provided slugs or URLs.')
    process.exit(1)
  }

  const derivedItems = rows.map((row) => {
    const matchedSource = slugPairs.find((pair) => pair.slug === row.slug)?.source ?? row.slug
    return toDerivedInventory(row, matchedSource, rows)
  })

  const recommendations = buildSlotRecommendations(derivedItems)
  const markdown = formatMarkdownReport({
    title: options.title,
    keyword: options.keyword,
    derivedItems,
    recommendations,
  })

  fs.mkdirSync(options.outDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const baseName = `${slugifyFilePart(options.keyword)}-${timestamp}`
  const jsonPath = path.join(options.outDir, `${baseName}.json`)
  const mdPath = path.join(options.outDir, `${baseName}.md`)

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        keyword: options.keyword,
        title: options.title,
        requestedSources: slugPairs,
        derivedItems,
        recommendations,
      },
      null,
      2
    )
  )
  fs.writeFileSync(mdPath, markdown)

  console.log(`Generated planning files:`)
  console.log(`- ${jsonPath}`)
  console.log(`- ${mdPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
