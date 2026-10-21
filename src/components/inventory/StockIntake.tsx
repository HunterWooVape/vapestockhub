/* eslint-disable @next/next/no-img-element -- Local blob preview must not use the public image optimizer. */
'use client'

import { useEffect, useRef, useState } from 'react'
import { organizeStockText, type StockRow } from '@/lib/stock-entry'
import { gridOcrText, prepareStockOcr } from '@/lib/stock-image-ocr'

const control = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-teal-DEFAULT'
const button = 'rounded-lg border border-border px-3 py-2 text-sm hover:border-teal-DEFAULT disabled:opacity-50'

export default function StockIntake({ onApply, hasRows }: { onApply: (rows: StockRow[]) => void; hasRows: boolean }) {
  const [text, setText] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [result, setResult] = useState<ReturnType<typeof organizeStockText> | null>(null)
  const [reviewed, setReviewed] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const worker = useRef<Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | null>(null)
  const cancelled = useRef(false)
  useEffect(() => { cancelled.current = false; return () => { cancelled.current = true; void worker.current?.terminate().catch(() => {}) } }, [])
  useEffect(() => () => { if (source) URL.revokeObjectURL(source) }, [source])

  async function recognize(file?: File) {
    if (!file || busy) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) { setMessage('请使用 12 MB 以内的 PNG、JPG 或 WebP 图片。'); return }
    setSource(URL.createObjectURL(file)); setBusy(true); setMessage('正在准备识别…'); setResult(null); setReviewed(false)
    try {
      const { createWorker, PSM } = await import('tesseract.js')
      const instance = await createWorker(['eng', 'chi_sim'], 1, {
        workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr', workerBlobURL: false,
        cacheMethod: 'none', logger: (progress) => {
          if (!cancelled.current && progress.status === 'recognizing text') setMessage(`正在识别 ${Math.round(progress.progress * 100)}%`)
        },
      })
      worker.current = instance
      if (cancelled.current) { await instance.terminate(); return }
      await instance.setParameters({ tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces: '1' })
      const prepared = await prepareStockOcr(file)
      let headers: string[] = []
      let headerRow = 0
      if (prepared.grid) {
        const grid = prepared.grid
        for (let candidate = 0; candidate < Math.min(3, grid.y.length - 2); candidate += 1) {
          headers = []
          for (let column = 0; column < grid.x.length - 1; column += 1) {
            const header = document.createElement('canvas')
            header.width = grid.x[column + 1] - grid.x[column] - 8
            header.height = grid.y[candidate + 1] - grid.y[candidate] - 8
            header.getContext('2d')!.drawImage(prepared.canvas, grid.x[column] + 4, grid.y[candidate] + 4, header.width, header.height, 0, 0, header.width, header.height)
            await instance.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT })
            headers.push((await instance.recognize(header)).data.text)
          }
          headerRow = candidate
          if (headers.some((header) => /flavou?r|口味/.test(header.toLowerCase())) && headers.some((header) => /qty|quantity|数量|结余|剩余/i.test(header))) break
        }
      }
      await instance.setParameters({ tessedit_pageseg_mode: PSM.AUTO })
      const { data } = await instance.recognize(prepared.canvas, {}, { text: true, tsv: true })
      const extracted = prepared.grid && data.tsv ? gridOcrText(data.tsv, prepared.grid, headers, headerRow) : null
      if (!cancelled.current) { setText(extracted ?? data.text); setMessage('识别完成，请整理并核对清单。') }
    } catch { if (!cancelled.current) setMessage('图片识别未完成，可重试或直接粘贴文字。') }
    finally { await worker.current?.terminate().catch(() => {}); worker.current = null; if (!cancelled.current) setBusy(false) }
  }

  function organize() {
    try { setResult(organizeStockText(text)); setReviewed(false); setMessage('') }
    catch (error) { setMessage((error as Error).message) }
  }

  return <details className="rounded-xl border border-border bg-background/50" open>
    <summary className="cursor-pointer px-4 py-3 text-sm font-medium">导入清单</summary>
    <div className="space-y-4 border-t border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className={`${button} cursor-pointer`}>上传清单图片<input aria-label="上传清单图片" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} className="sr-only" onChange={(event) => { void recognize(event.target.files?.[0]); event.target.value = '' }} /></label>
        <span className="text-xs text-muted">图片仅在本机识别</span>
      </div>
      {source && <details><summary className="cursor-pointer text-xs text-muted">查看本次原图</summary>{/* 原图是浏览器本地 blob，不进入提交表单。 */}<img src={source} alt="本次清单原图" className="mt-3 max-h-96 max-w-full rounded-lg border border-border object-contain" /></details>}
      <label className="block space-y-2 text-sm"><span>清单文字</span><textarea aria-label="清单文字" disabled={busy} value={text} onChange={(event) => { setText(event.target.value); setResult(null) }} onPaste={(event) => { const image = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'))?.getAsFile(); if (image) { event.preventDefault(); void recognize(image) } }} placeholder={'口味\t数量\nWatermelon Ice\t2000\nMiami Mint\t2030'} className={`${control} min-h-40 whitespace-pre font-mono`} /></label>
      <button type="button" onClick={organize} disabled={busy || !text.trim()} className={button}>整理清单</button>
      {message && <p role="status" className="text-sm text-muted">{message}</p>}
      {result && <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm"><span>明细 {result.rows.length} 行</span><span className="font-semibold tabular-nums text-teal-DEFAULT">合计 {result.total.toLocaleString()} pcs</span>{result.mergedCount > 0 && <span className="text-muted">合并重复项 {result.mergedCount} 行</span>}</div>
        {result.sourceTotals.some((total) => total !== result.total) && <p className="text-sm text-amber-300">原表合计 {result.sourceTotals.join(' / ')}，明细合计 {result.total.toLocaleString()}。应用时采用明细合计。</p>}
        {result.rows.length > 0 && <div className="max-h-64 overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="text-muted"><th className="p-2">口味</th><th className="p-2">规格／浓度</th><th className="p-2 text-right">数量</th></tr></thead><tbody>{result.rows.map((row, index) => <tr key={index} className="border-t border-border"><td className="p-2">{row.flavor}</td><td className="p-2">{[row.configuration, row.nicotine].filter(Boolean).join(' / ') || '—'}</td><td className="p-2 text-right tabular-nums">{row.quantity.toLocaleString()}</td></tr>)}</tbody></table></div>}
        {result.unresolved.length > 0 && <div className="space-y-2"><p className="text-sm text-amber-300">待核对 {result.unresolved.length} 行</p><pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-muted">{result.unresolved.join('\n')}</pre></div>}
        {(source || result.unresolved.length > 0) && <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} className="accent-[#22C7A9]" />已核对口味和数量，待核对内容已处理</label>}
        <button type="button" className={button} disabled={!result.rows.length || (Boolean(source) || result.unresolved.length > 0) && !reviewed} onClick={() => { onApply(result.rows); setResult(null); setMessage('明细已应用，可在下方修改。') }}>{hasRows ? '替换现有明细' : '应用到库存明细'}</button>
      </div>}
    </div>
  </details>
}
