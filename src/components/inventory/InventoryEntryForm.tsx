'use client'

import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { InventoryRecord } from '@/lib/inventory'
import { buildInventoryBreakdown } from '@/lib/inventory-detail'
import { inventoryPublishIssues, readInventoryEntry } from '@/lib/inventory-entry'
import { publicInventoryPreview } from '@/lib/inventory-public-fields'
import { recommendInventoryTitles, stockTotal, type StockRow, type ProductParameter } from '@/lib/stock-entry'
import { productTypeOptions, formatInventoryStatusLabel } from '@/lib/admin-inventory'
import { saveInventoryEntry } from '@/app/admin/inventory/actions'
import StockIntake from './StockIntake'
import InventoryEntryPreview from './InventoryEntryPreview'

const input = 'w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-teal-DEFAULT'
const secondary = 'rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:border-teal-DEFAULT focus-visible:ring-2 focus-visible:ring-teal-DEFAULT disabled:opacity-50'
const primary = 'rounded-lg bg-teal-DEFAULT px-4 py-2.5 text-sm font-semibold text-background hover:bg-teal-hover disabled:opacity-50'
const typeLabels: Record<string, string> = { 'Disposable Vape': '一次性设备', 'Vape Kit': '套装', 'Pod System': '换弹设备', 'Pod Kit': '换弹套装', Pod: '烟弹', 'E-liquid': '烟油', Device: '设备', Accessory: '配件', Other: '其他' }

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block min-w-0 space-y-2 text-sm"><span className="text-muted">{label}</span>{children}</label> }
function Section({ title, children, id }: { title: string; children: ReactNode; id: string }) { return <section id={id} className="scroll-mt-24 space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-6"><h2 className="border-b border-border pb-4 text-lg font-semibold">{title}</h2>{children}</section> }

function initialRows(item?: InventoryRecord | null): StockRow[] {
  if (!item) return []
  if (item.entry_version === 1) return item.stock_rows ?? []
  const breakdown = buildInventoryBreakdown(item)
  return breakdown?.rows.flatMap((row) => row.quantities.flatMap((quantity, index) => quantity === null ? [] : [{ flavor: row.label, quantity, configuration: breakdown.configurations.length > 1 ? breakdown.configurations[index].label : '', nicotine: '' }])) ?? []
}

export default function InventoryEntryForm({ item, isAdmin, knownBrands = [], returnTo = '' }: { item?: InventoryRecord | null; isAdmin: boolean; knownBrands?: string[]; returnTo?: string }) {
  const [state, action, pending] = useActionState(saveInventoryEntry, { errors: [] })
  const form = useRef<HTMLFormElement>(null)
  const [title, setTitle] = useState(item?.title ?? '')
  const [rows, setRows] = useState<StockRow[]>(() => initialRows(item))
  const [quantity, setQuantity] = useState(item ? String(item.quantity) : '')
  const [parameters, setParameters] = useState<ProductParameter[]>(item?.product_parameters ?? [])
  const [titles, setTitles] = useState<string[]>([])
  const [preview, setPreview] = useState<InventoryRecord | null>(null)
  const [previewMobile, setPreviewMobile] = useState(false)
  const [localError, setLocalError] = useState('')
  const previewButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const legacy = item && item.entry_version !== 1 ? buildInventoryBreakdown(item) : null
  const notes = item?.entry_version === 1 ? item.stock_notes ?? '' : legacy?.notes ?? item?.description ?? ''

  useEffect(() => {
    if (preview) { dialog.current?.showModal(); document.body.style.overflow = 'hidden' }
    return () => { document.body.style.overflow = '' }
  }, [preview])

  function closePreview() { dialog.current?.close(); setPreview(null); previewButton.current?.focus() }
  function recommend() {
    if (!form.current) return
    const values = new FormData(form.current)
    const read = (key: string) => String(values.get(key) ?? '')
    setTitles(recommendInventoryTitles({ brand: read('brand'), model: read('model_name'), productType: read('product_type'), puff: read('puff'), eLiquid: read('e_liquid'), nicotine: read('nicotine'), highlight: read('product_highlight') }))
  }
  function openPreview() {
    if (!form.current) return
    try {
      const values = readInventoryEntry(new FormData(form.current), item)
      const now = new Date().toISOString()
      setPreview(publicInventoryPreview({ ...values, id: item?.id ?? 'preview', slug: values.slug || 'preview', status: item?.status === 'sold' ? 'sold' : 'active', created_at: item?.created_at ?? now, updated_at: now }))
      setLocalError('')
    } catch (error) { setLocalError(error instanceof SyntaxError ? '请检查明细数据。' : (error as Error).message) }
  }
  function editRow(index: number, field: keyof StockRow, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: field === 'quantity' ? (value === '' ? NaN : Number(value)) : value } : row))
  }

  return <>
    <form ref={form} action={action} className="space-y-5" onReset={(event) => event.preventDefault()} onSubmit={() => setLocalError('')}>
      <input type="hidden" name="id" value={item?.id ?? ''} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input type="hidden" name="slug" value={item?.slug ?? ''} />
      <input type="hidden" name="stock_rows" value={JSON.stringify(rows)} />
      <input type="hidden" name="product_parameters" value={JSON.stringify(parameters)} />
      {(state.errors.length > 0 || localError) && <div role="alert" className="rounded-xl border border-red-400/40 bg-red-400/5 p-4 text-sm text-red-200"><ul className="space-y-1">{[...state.errors, ...(localError ? [localError] : [])].map((error) => <li key={error}>{error}</li>)}</ul></div>}

      <Section title="产品资料" id="product-data">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="品牌"><input name="brand" list="entry-brands" defaultValue={item?.brand ?? ''} className={input} /></Field>
          <Field label="型号"><input name="model_name" defaultValue={item?.model_name ?? ''} className={input} /></Field>
          <Field label="产品类型"><select name="product_type" defaultValue={item?.product_type ?? ''} className={input}><option value="">请选择</option>{(item?.product_type && !productTypeOptions.includes(item.product_type as typeof productTypeOptions[number]) ? [item.product_type, ...productTypeOptions] : productTypeOptions).map((type) => <option key={type} value={type}>{typeLabels[type] ?? type}</option>)}</select></Field>
        </div>
        <Field label="标题"><input name="title" value={title} onChange={(event) => setTitle(event.target.value)} className={input} /></Field>
        <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={recommend} className={secondary}>推荐标题</button>{titles.length > 0 && <span className="text-xs text-muted">点击采用，可继续修改</span>}</div>
        {titles.length > 0 && <div className="grid gap-2">{titles.map((candidate) => <button key={candidate} type="button" onClick={() => { setTitle(candidate); setTitles([]) }} className="rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-teal-DEFAULT">{candidate}</button>)}</div>}
        <Field label="主图链接"><input name="image_url" defaultValue={item?.images?.[0] ?? ''} className={input} placeholder="https://…" /></Field>
        <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer text-sm">产品参数</summary><div className="mt-4 space-y-4"><div className="grid gap-4 sm:grid-cols-3">
          <Field label="口数"><input name="puff" type="number" min="0" step="1" defaultValue={item?.puff ?? ''} className={input} /></Field>
          <Field label="尼古丁"><input name="nicotine" defaultValue={item?.nicotine ?? ''} className={input} /></Field>
          <Field label="烟油容量"><input name="e_liquid" defaultValue={item?.e_liquid ?? ''} className={input} /></Field>
        </div><Field label="产品亮点"><input name="product_highlight" defaultValue={item?.product_highlight ?? ''} className={input} /></Field>
        {parameters.map((pair, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"><input aria-label={`参数名称 ${index + 1}`} value={pair.name} onChange={(event) => setParameters((current) => current.map((value, i) => i === index ? { ...value, name: event.target.value } : value))} placeholder="参数名称（英文）" className={input} /><input aria-label={`参数值 ${index + 1}`} value={pair.value} onChange={(event) => setParameters((current) => current.map((value, i) => i === index ? { ...value, value: event.target.value } : value))} placeholder="参数值" className={input} /><button type="button" aria-label={`删除参数 ${index + 1}`} onClick={() => setParameters((current) => current.filter((_, i) => i !== index))} className={secondary}><Trash2 size={15} /></button></div>)}
        <button type="button" disabled={parameters.length >= 40} onClick={() => setParameters((current) => [...current, { name: '', value: '' }])} className={secondary}>添加参数</button></div></details>
      </Section>

      <Section title="库存明细" id="stock-data">
        <StockIntake onApply={(nextRows) => { setRows(nextRows); setQuantity(String(stockTotal(nextRows))) }} hasRows={rows.length > 0} />
        {rows.length > 0 && <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[590px] text-left text-xs"><thead className="bg-background text-muted"><tr>{['口味', '规格／配置', '浓度', '数量', ''].map((value, index) => <th key={index} className="px-3 py-3 font-medium">{value}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-border"><td className="w-[30%] p-2"><input aria-label={`口味 ${index + 1}`} value={row.flavor} onChange={(event) => editRow(index, 'flavor', event.target.value)} className={input} /></td><td className="w-[25%] p-2"><input aria-label={`规格 ${index + 1}`} value={row.configuration} onChange={(event) => editRow(index, 'configuration', event.target.value)} className={input} /></td><td className="w-[18%] p-2"><input aria-label={`浓度 ${index + 1}`} value={row.nicotine} onChange={(event) => editRow(index, 'nicotine', event.target.value)} className={input} /></td><td className="p-2"><input aria-label={`数量 ${index + 1}`} type="number" min="0" step="1" value={Number.isFinite(row.quantity) ? row.quantity : ''} onChange={(event) => editRow(index, 'quantity', event.target.value)} className={input} /></td><td className="p-2"><button type="button" aria-label={`删除明细 ${index + 1}`} onClick={() => setRows((current) => current.filter((_, i) => i !== index))} className={secondary}><Trash2 size={14} /></button></td></tr>)}</tbody></table></div>}
        <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => setRows((current) => [...current, { flavor: '', configuration: '', nicotine: '', quantity: 0 }])} className={`${secondary} inline-flex items-center gap-2`}><Plus size={15} />添加明细</button>{rows.length > 0 && <><span className="text-sm tabular-nums">明细合计 {Number.isFinite(stockTotal(rows)) ? stockTotal(rows).toLocaleString() : '待补齐'}</span><button type="button" onClick={() => setQuantity(String(stockTotal(rows)))} disabled={!Number.isFinite(stockTotal(rows))} className={secondary}>更新总量</button></>}</div>
        {rows.length > 0 && Number(quantity) !== stockTotal(rows) && <p role="status" className="text-sm text-amber-300">明细合计与总量不一致，请核对后更新总量。</p>}
        <div className="grid gap-4 sm:grid-cols-3"><Field label="库存总量"><input name="quantity" type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className={input} /></Field><Field label="单价（美元）"><input name="price" type="number" min="0.01" step="0.01" defaultValue={item?.price && item.price > 0 ? item.price : ''} className={input} /></Field><Field label="起订量（MOQ）"><input name="moq" type="number" min="1" step="1" defaultValue={item?.moq ?? ''} className={input} /></Field></div>
        <Field label="仓库位置"><input name="warehouse_location" defaultValue={item?.warehouse_location ?? ''} className={input} /></Field>
        <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer text-sm">口味标签与市场</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="口味标签（逗号分隔）"><input name="flavor" defaultValue={item?.flavor ?? ''} className={input} /></Field><Field label="目标市场"><input name="market" defaultValue={item?.market ?? ''} className={input} /></Field><Field label="主推市场（逗号分隔）"><input name="featured_markets" defaultValue={item?.featured_markets?.join(', ') ?? ''} className={input} /></Field></div></details>
      </Section>

      <Section title="库存说明" id="stock-notes-edit">
        <Field label="公开库存说明"><textarea name="stock_notes" defaultValue={notes} className={`${input} min-h-36 whitespace-pre-wrap`} placeholder="特殊起订、混款、箱规等条件（英文）" /></Field>
        <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer text-sm">日期与其他说明</summary><div className="mt-4 space-y-4"><Field label="最近确认日期"><input name="verified_date" type="date" defaultValue={item?.last_verified_at?.slice(0, 10) ?? ''} className={input} /></Field><Field label="生产时间"><input name="production_date_text" defaultValue={item?.production_date_text ?? ''} className={input} /></Field><Field label="市场限制说明"><textarea name="market_access_note" defaultValue={item?.market_access_note ?? ''} className={`${input} min-h-20`} /></Field><Field label="报价备注"><textarea name="pricing_note" defaultValue={item?.pricing_note ?? ''} className={`${input} min-h-20`} /></Field></div></details>
      </Section>

      <Section title="发布设置" id="publish-settings">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="价格公开方式"><select name="contact_visibility" defaultValue={item?.contact_visibility ?? 'contact_required'} className={input}><option value="contact_required">联系询价</option><option value="public">公开价格</option></select></Field><Field label="库存状态">{isAdmin ? <select name="status" defaultValue={item?.status ?? 'draft'} className={input}>{['draft', 'active', 'reserved', 'sold', 'expired'].filter((value) => value !== 'active' || item?.status === 'active').map((status) => <option key={status} value={status}>{formatInventoryStatusLabel(status as InventoryRecord['status'])}</option>)}</select> : <><input name="status" type="hidden" value={item?.status ?? 'draft'} /><span className="block py-2.5">{formatInventoryStatusLabel(item?.status ?? 'draft')}</span></>}</Field></div>
        <div className="flex flex-wrap gap-x-6 gap-y-4 text-sm"><label className="flex items-center gap-2"><input name="moq_public" type="checkbox" defaultChecked={item ? item.moq_public !== false : false} className="accent-[#22C7A9]" />公开显示 MOQ</label><label className="flex items-center gap-2"><input name="is_featured" type="checkbox" defaultChecked={item?.is_featured ?? false} className="accent-[#22C7A9]" />精选</label><label className="flex items-center gap-2"><input name="is_urgent_clearance" type="checkbox" defaultChecked={item?.is_urgent_clearance ?? false} className="accent-[#22C7A9]" />紧急清仓</label></div>
      </Section>
      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur-sm"><button ref={previewButton} type="button" onClick={openPreview} className={secondary}>预览详情页</button><button type="submit" name="intent" value="save" disabled={pending} className={secondary}>{pending ? '正在保存…' : item?.status === 'active' ? '保存更新' : '保存草稿'}</button>{isAdmin && item?.status !== 'active' && <button type="submit" name="intent" value="publish" disabled={pending} className={primary}>发布</button>}</div>
      <datalist id="entry-brands">{knownBrands.map((brand) => <option key={brand} value={brand} />)}</datalist>
    </form>
    {preview && <dialog ref={dialog} onCancel={closePreview} aria-label="前台详情预览" className="fixed inset-0 m-auto h-[94dvh] max-h-none w-[96vw] max-w-[1400px] rounded-xl border border-border bg-background p-0 text-foreground backdrop:bg-black/75"><div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3"><span className="text-sm font-semibold">前台预览</span><div className="flex gap-2"><button type="button" onClick={() => setPreviewMobile(false)} className={`${secondary} ${!previewMobile ? 'text-teal-DEFAULT' : ''}`}>电脑</button><button type="button" onClick={() => setPreviewMobile(true)} className={`${secondary} ${previewMobile ? 'text-teal-DEFAULT' : ''}`}>手机</button><button type="button" aria-label="关闭预览" onClick={closePreview} className={secondary}><X size={17} /></button></div></div>{inventoryPublishIssues(preview).length > 0 && <div className="border-b border-border px-5 py-3 text-xs text-amber-300">待补齐：{inventoryPublishIssues(preview).join(' ')}</div>}<InventoryEntryPreview item={preview} mobile={previewMobile} /></dialog>}
  </>
}
