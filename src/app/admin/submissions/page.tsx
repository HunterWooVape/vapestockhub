import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  formatSupplierSubmissionFieldLabel,
  getSupplierSubmissionMissingRequiredFields,
  supplierSubmissionStatusOptions,
  type SupplierSubmissionValues,
} from '@/lib/submissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminSessionCookieName, isBackofficeAuthenticated } from '@/lib/unlock'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 20

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function getPageNumber(value?: string | string[]) {
  const parsedValue = Number.parseInt(getSingleParam(value) ?? '1', 10)

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1
  }

  return parsedValue
}

function getStatusFilter(value?: string | string[]) {
  const status = getSingleParam(value)
  return supplierSubmissionStatusOptions.includes(status as typeof supplierSubmissionStatusOptions[number])
    ? (status as typeof supplierSubmissionStatusOptions[number])
    : 'all'
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = getPageNumber(params.page)
  const statusFilter = getStatusFilter(params.status)
  const cookieStore = await cookies()

  if (!isBackofficeAuthenticated(cookieStore.get(adminSessionCookieName)?.value)) {
    redirect('/admin')
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    redirect('/admin?error=missing-service-role-key')
  }

  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const baseQuery = adminClient
    .from('supplier_submissions')
    .select(
      'id, supplier_name, contact_name, contact_channel, brand, model_name, product_type, available_qty_text, target_market, warehouse_location, submission_status, converted_inventory_id, created_at, updated_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  const query = statusFilter === 'all'
    ? baseQuery
    : baseQuery.eq('submission_status', statusFilter)

  const { data: submissions, count } = await query.range(from, to)

  const submissionRows = (submissions ?? []).map((item) => {
    const submissionValues: SupplierSubmissionValues = {
      supplierName: item.supplier_name ?? '',
      contactName: item.contact_name ?? '',
      contactChannel: item.contact_channel ?? '',
      sourceType: 'supplier_form',
      brand: item.brand ?? '',
      modelName: item.model_name ?? '',
      productType: item.product_type ?? '',
      unitPriceText: '',
      availableQtyText: item.available_qty_text ?? '',
      moqText: '',
      targetMarket: item.target_market ?? '',
      warehouseLocation: item.warehouse_location ?? '',
      puffText: '',
      nicotineText: '',
      eLiquidText: '',
      flavorList: '',
      flavorBreakdown: '',
      imageLinks: '',
      stockNotes: '',
      packagingNotes: '',
      extraNotes: '',
      internalNotes: '',
      submissionStatus: supplierSubmissionStatusOptions.includes(item.submission_status)
        ? item.submission_status
        : 'new',
    }

    return {
      ...item,
      missingRequiredFields: getSupplierSubmissionMissingRequiredFields(submissionValues),
    }
  })

  const totalItems = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Link href="/admin" className="text-sm font-medium text-teal-DEFAULT hover:underline">
              ← 返回后台总控台
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">提报队列</h1>
              <p className="mt-1 text-sm text-muted">
                这里统一查看所有提报的当前状态、缺失字段和后续审核入口。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/submit-stock"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-teal-DEFAULT hover:bg-surface"
            >
              新建提报 →
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-surface p-6 space-y-6">
          <div className="rounded-2xl border border-border/70 bg-background px-4 py-4 space-y-2">
            <div className="font-medium text-foreground">队列说明</div>
            <div className="text-sm text-muted">
              后台日常处理提报时，默认先从这里开始。先补齐最低必填项，再进入单条审核页做标准化和转草稿。
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">待处理提报</h2>
              <p className="text-sm text-muted">
                共 {totalItems} 条提报
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/submissions"
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${statusFilter === 'all' ? 'border-teal-DEFAULT text-teal-DEFAULT bg-teal-DEFAULT/10' : 'border-border text-muted hover:bg-background'}`}
              >
                全部
              </Link>
              {supplierSubmissionStatusOptions.map((status) => (
                <Link
                  key={status}
                  href={`/admin/submissions?status=${status}`}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${statusFilter === status ? 'border-teal-DEFAULT text-teal-DEFAULT bg-teal-DEFAULT/10' : 'border-border text-muted hover:bg-background'}`}
                >
                  {status}
                </Link>
              ))}
            </div>
          </div>

          {submissionRows.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-8 text-sm text-muted">
              当前筛选条件下暂无提报记录。
            </div>
          ) : (
            <div className="space-y-4">
              {submissionRows.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-5 space-y-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">
                        {item.brand || '待补品牌'} · {item.model_name || '待补型号'}
                      </div>
                      <div className="text-sm text-muted">
                        {item.supplier_name || '待补供应商'} · {item.target_market || '待补市场'}
                      </div>
                      <div className="text-xs text-muted">
                        {item.warehouse_location || '待补仓库'} · 数量：{item.available_qty_text || '待补'}
                      </div>
                    </div>
                    <div className="text-right text-sm space-y-1">
                      <div className="font-medium uppercase tracking-wide text-foreground">{item.submission_status}</div>
                      <div className="text-muted">{new Date(item.created_at).toLocaleDateString()}</div>
                      {item.converted_inventory_id && (
                        <div className="text-teal-DEFAULT">已转草稿</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 space-y-2">
                    {item.missingRequiredFields.length > 0 ? (
                      <>
                        <div className="text-sm text-status-warning">
                          仍有 {item.missingRequiredFields.length} 个最低必填项待补齐
                        </div>
                        <div className="text-xs text-muted">
                          {item.missingRequiredFields.map((field) => formatSupplierSubmissionFieldLabel(field)).join(' · ')}
                        </div>
                        <div className="text-xs text-muted">
                          建议先进入审核页补齐后，再考虑转换。
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-teal-DEFAULT">可以进入提报审核</div>
                        <div className="text-xs text-muted">
                          最低必填字段已齐，可以继续做标准化和转草稿。
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/submissions/${item.id}`}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-teal-DEFAULT hover:bg-background"
                    >
                      进入审核 →
                    </Link>
                    {item.converted_inventory_id && (
                      <Link
                        href={`/admin/edit/${item.converted_inventory_id}`}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-background"
                      >
                        打开草稿 →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 border-t border-border pt-6">
              {page > 1 && (
                <Link
                  href={`/admin/submissions?page=${page - 1}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-background"
                >
                  上一页
                </Link>
              )}
              <span className="text-sm text-muted">
                第 {page} / {totalPages} 页
              </span>
              {page < totalPages && (
                <Link
                  href={`/admin/submissions?page=${page + 1}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-background"
                >
                  下一页
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
