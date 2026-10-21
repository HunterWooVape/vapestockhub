export type OcrGrid = { x: number[]; y: number[] }
type Word = { x: number; y: number; width: number; height: number; text: string; confidence: number }

/** Join words by table cells rather than by OCR reading order. */
export function gridOcrText(tsv: string, grid: OcrGrid, headers: string[], headerRow = 0): string | null {
  const normalized = headers.map((value) => value.replace(/[\s.()：:]/g, '').toLowerCase())
  const flavor = normalized.findIndex((value) => /flavou?r|口味|款式/.test(value))
  const quantity = normalized.findIndex((value) => /^(?:qty|quantity|quantitypcs|数量|剩余|结余|未出货数量)$/.test(value))
  if (flavor < 0 || quantity < 0 || flavor === quantity) return null
  const configuration = normalized.findIndex((value) => /^(?:configuration|specification|规格|配置|版本)$/.test(value))
  const nicotine = normalized.findIndex((value) => /^(?:nicotine|strength|浓度|尼古丁)$/.test(value))
  const words: Word[] = tsv.split('\n').slice(1).flatMap((line) => {
    const cell = line.split('\t')
    return cell[0] === '5' && cell[11]?.trim() ? [{ x: Number(cell[6]), y: Number(cell[7]), width: Number(cell[8]), height: Number(cell[9]), confidence: Number(cell[10]), text: cell.slice(11).join('\t').trim() }] : []
  })
  function cell(row: number, column: number, firstLine = false) {
    if (column < 0) return ''
    const found = words.filter((word) => word.x + word.width / 2 > grid.x[column] && word.x + word.width / 2 < grid.x[column + 1] && word.y + word.height / 2 > grid.y[row] && word.y + word.height / 2 < grid.y[row + 1]).sort((a, b) => a.y - b.y || a.x - b.x)
    if (!firstLine) return found.sort((a, b) => a.x - b.x).map((word) => word.text).join(' ')
    const englishAnchor = found.find((word) => /[A-Za-z]{2}/.test(word.text))
    const anchor = englishAnchor ?? found[0]
    if (!anchor) return ''
    return found.filter((word) => (!englishAnchor || /[A-Za-z0-9]/.test(word.text)) && Math.abs(word.y - anchor.y) < Math.max(anchor.height, word.height) * .7).sort((a, b) => a.x - b.x).map((word) => word.text).join(' ')
  }
  const lines = ['Flavor\tConfiguration\tNicotine\tQuantity']
  for (let row = headerRow + 1; row < grid.y.length - 1; row += 1) {
    const label = cell(row, flavor, true)
    const count = cell(row, quantity)
    if (!label && !count) continue
    lines.push([label, cell(row, configuration, true), cell(row, nicotine, true), count || '?'].join('\t'))
  }
  return lines.join('\n')
}

function boundaries(values: number[], end: number) {
  const groups: number[][] = []
  for (const value of values) {
    if (!groups.length || value - groups.at(-1)!.at(-1)! > 3) groups.push([value])
    else groups.at(-1)!.push(value)
  }
  return [...new Set([0, ...groups.map((group) => Math.round((group[0] + group.at(-1)!) / 2)), end])].sort((a, b) => a - b).filter((value, index, array) => index === 0 || value - array[index - 1] > 8)
}

export async function prepareStockOcr(file: File): Promise<{ canvas: HTMLCanvasElement; grid: OcrGrid | null }> {
  const bitmap = await createImageBitmap(file)
  if (bitmap.width * bitmap.height > 30000000) { bitmap.close(); throw new Error('图片过大，请裁切清单后重试。') }
  const scale = Math.min(2, Math.sqrt(12000000 / (bitmap.width * bitmap.height)))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close()
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  const horizontal = new Uint32Array(canvas.height), vertical = new Uint32Array(canvas.width)
  const verticalRuns = new Uint32Array(canvas.width)
  for (let y = 0; y < canvas.height; y += 1) {
    let horizontalRun = 0
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4
      const darkest = Math.min(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2])
      const lightest = Math.max(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2])
      if (lightest < 160 && lightest - darkest < 35) {
        horizontalRun += 1; verticalRuns[x] += 1
        horizontal[y] = Math.max(horizontal[y], horizontalRun)
        vertical[x] = Math.max(vertical[x], verticalRuns[x])
      } else { horizontalRun = 0; verticalRuns[x] = 0 }
    }
  }
  const rows = [...horizontal.keys()].filter((y) => horizontal[y] > canvas.width * .3)
  const columns = [...vertical.keys()].filter((x) => vertical[x] > canvas.height * .6)
  for (const y of rows) for (let x = 0; x < canvas.width; x += 1) { const index = (y * canvas.width + x) * 4; pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = 255 }
  for (const x of columns) for (let y = 0; y < canvas.height; y += 1) { const index = (y * canvas.width + x) * 4; pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = 255 }
  context.putImageData(pixels, 0, 0)
  const x = boundaries(columns, canvas.width), y = boundaries(rows, canvas.height)
  const grid = x.length >= 3 && x.length <= 12 && y.length >= 4 ? { x, y } : null
  return { canvas, grid }
}
