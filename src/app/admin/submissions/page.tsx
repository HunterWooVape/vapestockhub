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
import {
  adminSessionCookieName,
  isBackofficeAuthenticated,
  normalizeBackofficeReturnTo,
} from '@/lib/unlock'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 20

const submissionStatusLabels: Record<(typeof supplierSubmissionStatusOptions)[number], string> = {
  new: '新录入',
  reviewing: '审核中',
  converted: '已转草稿',
  rejected: '已驳回',
}

const visibleQueueStatusFilters = supplierSubmissionStatusOptions.filter((status) => status !== 'converted')

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

function formatSubmissionStatusLabel(status: (typeof supplierSubmissionStatusOptions)[number]) {
  return submissionStatusLabels[status]
}

function buildSubmissionsListHref(page: number, statusFilter: string) {
  const searchParams = new URLSearchParams()

  if (page > 1) {
    searchParams.set('page', String(page))
  }

  if (statusFilter !== 'all') {
    searchParams.set('status', statusFilter)
  }

  const queryString = searchParams.toString()
  return queryString ? `/admin/submissions?${queryString}` : '/admin/submissions'
}

function appendReturnTo(path: string, returnTo?: string | null) {
  const normalizedReturnTo = normalizeBackofficeReturnTo(returnTo)

  if (!normalizedReturnTo) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}return_to=${encodeURIComponent(normalizedReturnTo)}`
}

function getStatusBadgeClass(status: (typeof supplierSubmissionStatusOptions)[number]) {
  if (status === 'converted') {
    return 'border-teal-DEFAULT/30 bg-teal-DEFAULT/10 text-teal-DEFAULT'
  }

  if (status === 'rejected') {
    return 'border-status-danger/30 bg-status-danger/10 text-status-danger'
  }

  if (status === 'reviewing') {
    return 'border-status-warning/30 bg-status-warning/10 text-status-warning'
  }

  return 'border-border bg-background text-muted'
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = getPageNumber(params.page)
  const statusFilter = getStatusFilter(params.status)
  const returnTo = normalizeBackofficeReturnTo(getSingleParam(params.return_to))
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
      'id, supplier_name, contact_name, contact_channel, brand, model_name, product_type, available_qty_text, target_market, warehouse_location, production_date_text, submission_status, converted_inventory_id, created_at, updated_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  // 审核队列默认只看还没转草稿的录入，避免和草稿阶段混在一起。
  const query = statusFilter === 'all'
    ? baseQuery.neq('submission_status', 'converted')
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
      marketAccessNote: '',
      warehouseLocation: item.warehouse_location ?? '',
      puffText: '',
      nicotineText: '',
      eLiquidText: '',
      productionDateText: item.production_date_text ?? '',
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
  const isConvertedView = statusFilter === 'converted'
  const currentListHref = buildSubmissionsListHref(page, statusFilter)
  const backHref = returnTo ?? '/admin'
  const backLabel = returnTo ? '← 返回上一页' : '← 返回后台总控台'
  const pageTitle = isConvertedView ? '已转草稿记录' : '待审核录入'
  const pageDescription = isConvertedView
    ? '这里只在需要回溯时查看已转草稿记录。日常处理请回到待审核视图。'
    : '这里只放还没转成草稿的录入。按卡片提示进入处理即可。'

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Link href={backHref} className="text-sm font-medium text-teal-DEFAULT hover:underline">
              {backLabel}
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
              <p className="mt-1 text-sm text-muted">{pageDescription}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={appendReturnTo('/submit-stock', currentListHref)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-teal-DEFAULT hover:bg-surface"
            >
              打开内部录入 →
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-surface p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">队列记录</h2>
              <p className="text-sm text-muted">当前共 {totalItems} 条记录</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildSubmissionsListHref(1, 'all')}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${statusFilter === 'all' ? 'border-teal-DEFAULT text-teal-DEFAULT bg-teal-DEFAULT/10' : 'border-border text-muted hover:bg-background'}`}
              >
                待处理全部
              </Link>
              {visibleQueueStatusFilters.map((status) => (
                <Link
                  key={status}
                  href={buildSubmissionsListHref(1, status)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${statusFilter === status ? 'border-teal-DEFAULT text-teal-DEFAULT bg-teal-DEFAULT/10' : 'border-border text-muted hover:bg-background'}`}
                >
                  {formatSubmissionStatusLabel(status)}
                </Link>
              ))}
              {isConvertedView && (
                <Link
                  href={buildSubmissionsListHref(1, 'converted')}
                  className="rounded-full border border-teal-DEFAULT bg-teal-DEFAULT/10 px-4 py-2 text-sm text-teal-DEFAULT transition-colors"
                >
                  已转草稿
                </Link>
              )}
            </div>
          </div>

          {submissionRows.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-8 text-sm text-muted">
              当前筛选条件下暂无记录。可先去内部录入台新增，再回到这里推进审核。
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
                    <div className="text-right text-sm space-y-2">
                      <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(item.submission_status)}`}>
                        {formatSubmissionStatusLabel(item.submission_status)}
                      </div>
                      <div className="text-muted">录入时间：{new Date(item.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 space-y-2">
                    {item.converted_inventory_id ? (
                      <>
                        <div className="text-sm text-teal-DEFAULT">下一步：进入草稿页继续编辑</div>
                        <div className="text-xs text-muted">这条记录已经完成转草稿。</div>
                      </>
                    ) : item.missingRequiredFields.length > 0 ? (
                      <>
                        <div className="text-sm text-status-warning">当前阻塞：缺少 {item.missingRequiredFields.length} 项最低必填</div>
                        <div className="text-xs text-muted">{item.missingRequiredFields.map((field) => formatSupplierSubmissionFieldLabel(field)).join(' · ')}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-teal-DEFAULT">下一步：进入审核并转草稿</div>
                        <div className="text-xs text-muted">最低必填项已齐，可以继续标准化并生成草稿。</div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {item.converted_inventory_id ? (
                      <Link
                        href={appendReturnTo(`/admin/edit/${item.converted_inventory_id}`, currentListHref)}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-teal-DEFAULT hover:bg-background"
                      >
                        打开草稿 →
                      </Link>
                    ) : (
                      <Link
                        href={appendReturnTo(`/admin/submissions/${item.id}`, currentListHref)}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-teal-DEFAULT hover:bg-background"
                      >
                        {item.missingRequiredFields.length > 0 ? '去补齐并审核 →' : '去审核并转草稿 →'}
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
                  href={buildSubmissionsListHref(page - 1, statusFilter)}
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
                  href={buildSubmissionsListHref(page + 1, statusFilter)}
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
