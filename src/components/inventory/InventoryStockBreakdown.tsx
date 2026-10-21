import type { InventoryBreakdown } from '@/lib/inventory-detail'

const format = (value: number) => value.toLocaleString('en-US')

export default function InventoryStockBreakdown({
  breakdown,
  soldOut,
}: {
  breakdown: InventoryBreakdown
  soldOut: boolean
}) {
  const { configurations, rows, total, unit } = breakdown
  const multiple = configurations.length > 1
  const compactLabels = configurations.every((configuration) => /^US Version\s*[-–]\s*/i.test(configuration.label))
  const label = (value: string) => compactLabels ? value.replace(/^US Version\s*[-–]\s*/i, '') : value
  const renderQuantity = (quantity: number | null) => quantity === null
    ? <span className="text-muted/60" aria-label="Not listed">—</span>
    : format(quantity)

  return (
    <>
      {multiple && (
        <div
          data-configuration-stats
          className={`mb-4 grid overflow-hidden rounded-xl border border-border bg-surface/50 ${configurations.length === 2 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}
        >
          {configurations.map((configuration) => (
            <div key={configuration.key} className="min-w-0 border-r border-border px-3 py-4 last:border-r-0 sm:px-6 sm:py-5">
              <p className="break-words text-[10px] text-muted">{label(configuration.label)}</p>
              <p className="mt-2 text-lg font-semibold tracking-tight tabular-nums sm:text-[25px]">{format(configuration.total)}</p>
              <p className="mt-1 text-[10px] text-muted">{unit}</p>
            </div>
          ))}
          <div className="min-w-0 bg-teal-DEFAULT/[.035] px-3 py-4 sm:px-6 sm:py-5">
            <p className="text-[10px] text-muted">{soldOut ? 'Original lot total' : 'Listed total'}</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-teal-DEFAULT tabular-nums sm:text-[25px]">{format(total)}</p>
            <p className="mt-1 text-[10px] text-muted">{unit}</p>
          </div>
        </div>
      )}

      {configurations.length > 2 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {configurations.map((configuration, index) => (
            <div key={configuration.key} className="min-w-0 overflow-hidden rounded-xl border border-border">
              <h3 className="border-b border-border bg-surface/50 px-4 py-4 text-xs font-semibold sm:px-6">{configuration.label}</h3>
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <caption className="sr-only">{configuration.label}</caption>
                <colgroup><col className="w-[70%]" /><col className="w-[30%]" /></colgroup>
                <thead className="bg-surface/30 text-[10px] text-muted"><tr><th scope="col" className="px-4 py-3 font-medium sm:px-6">Flavor</th><th scope="col" className="px-4 py-3 text-right font-medium sm:px-6">Quantity <span className="block font-normal">{unit}</span></th></tr></thead>
                <tbody className="divide-y divide-border/70">
                  {rows.filter((row) => row.quantities[index] !== null).map((row) => (
                    <tr key={row.label} className="bg-background hover:bg-surface/50"><th scope="row" className="break-words px-4 py-3.5 font-medium sm:px-6">{row.label}</th><td className="px-4 py-3.5 text-right tabular-nums sm:px-6">{renderQuantity(row.quantities[index])}</td></tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-surface/50"><tr><th scope="row" className="px-4 py-4 font-semibold sm:px-6">Total</th><td className="px-4 py-4 text-right font-semibold tabular-nums sm:px-6">{format(configuration.total)}</td></tr></tfoot>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table id="stock-table" className="w-full table-fixed border-collapse text-left text-sm">
            <caption className="sr-only">Flavor quantities</caption>
            <colgroup>{multiple ? <><col className="w-[46%] sm:w-[50%]" /><col className="w-[27%] sm:w-[25%]" /><col className="w-[27%] sm:w-[25%]" /></> : <><col className="w-[70%]" /><col className="w-[30%]" /></>}</colgroup>
            <thead className="bg-surface/30 text-[10px] font-medium text-muted sm:text-[11px]">
              <tr className="border-b border-border"><th scope="col" className="px-3 py-4 font-medium sm:px-6">Flavor</th>{configurations.map((configuration) => <th key={configuration.key} scope="col" className="break-words px-3 py-4 text-right font-medium sm:px-6">{multiple ? label(configuration.label) : 'Quantity'} <span className="block text-[9px] font-normal sm:ml-1 sm:inline">{unit}</span></th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {rows.map((row) => <tr key={row.label} className="bg-background hover:bg-surface/50"><th scope="row" className="break-words px-3 py-3.5 text-[11px] font-medium sm:px-6 sm:text-[13px]">{row.label}</th>{row.quantities.map((quantity, index) => <td key={configurations[index].key} className="px-3 py-3.5 text-right text-xs tabular-nums sm:px-6 sm:text-[13px]">{renderQuantity(quantity)}</td>)}</tr>)}
            </tbody>
            <tfoot className="border-t border-border bg-surface/50"><tr><th scope="row" className="px-3 py-4 text-xs font-semibold sm:px-6">Total</th>{configurations.map((configuration) => <td key={configuration.key} className="px-3 py-4 text-right text-xs font-semibold tabular-nums sm:px-6 sm:text-sm">{format(configuration.total)}</td>)}</tr></tfoot>
          </table>
        </div>
      )}
    </>
  )
}
