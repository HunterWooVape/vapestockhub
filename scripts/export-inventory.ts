import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function exportInventory() {
  console.log('Fetching inventory data from Supabase...')
  
  // Fetch active inventory
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      brand,
      title,
      product_type,
      puff,
      nicotine,
      e_liquid,
      flavor,
      quantity,
      moq,
      pricing_mode,
      price,
      pricing_note,
      market,
      warehouse_location,
      description,
      status
    `)
    .eq('status', 'active')
    .order('brand', { ascending: true })
    .order('quantity', { ascending: false })

  if (error) {
    console.error('Error fetching data:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('No active inventory found.')
    return
  }

  console.log(`Found ${data.length} active inventory items. Generating Excel...`)

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Public Inventory')

  // Define columns
  worksheet.columns = [
    { header: 'Brand (品牌)', key: 'brand', width: 15 },
    { header: 'Product (产品)', key: 'title', width: 25 },
    { header: 'Type (类型)', key: 'product_type', width: 15 },
    { header: 'Puffs (口数)', key: 'puff', width: 10 },
    { header: 'Nicotine (尼古丁)', key: 'nicotine', width: 15 },
    { header: 'E-liquid (容量)', key: 'e_liquid', width: 15 },
    { header: 'Flavors (口味)', key: 'flavor', width: 35 },
    { header: 'Available Qty (可售数)', key: 'quantity', width: 20 },
    { header: 'MOQ (起订量)', key: 'moq', width: 15 },
    { header: 'Price (USD)', key: 'price', width: 15 },
    { header: 'Market (市场)', key: 'market', width: 20 },
    { header: 'Warehouse (交货仓库)', key: 'warehouse_location', width: 25 },
    { header: 'Notes (备注)', key: 'description', width: 30 }
  ]

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF22C7A9' } // Teal accent color
  }
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getRow(1).height = 25

  // Add rows
  data.forEach((item) => {
    // Format price display
    let displayPrice = 'Inquiry'
    if (item.pricing_mode === 'exact_price' && item.price) {
      displayPrice = `$${Number(item.price).toFixed(2)}`
    } else if (item.pricing_note) {
      displayPrice = item.pricing_note
    }

    const row = worksheet.addRow({
      brand: item.brand,
      title: item.title,
      product_type: item.product_type,
      puff: item.puff || 'N/A',
      nicotine: item.nicotine || 'N/A',
      e_liquid: item.e_liquid || 'N/A',
      flavor: item.flavor || 'N/A',
      quantity: item.quantity,
      moq: item.moq || 1,
      price: displayPrice,
      market: item.market,
      warehouse_location: item.warehouse_location,
      description: item.description || ''
    })

    // Auto-wrap text for long content
    row.alignment = { vertical: 'top', wrapText: true }
  })

  // Ensure output directory exists
  const outDir = path.resolve(process.cwd(), 'exports')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const filename = `Public_Inventory_${timestamp}.xlsx`
  const filepath = path.join(outDir, filename)

  await workbook.xlsx.writeFile(filepath)
  console.log(`✅ Excel file successfully generated at: ${filepath}`)
}

exportInventory()
