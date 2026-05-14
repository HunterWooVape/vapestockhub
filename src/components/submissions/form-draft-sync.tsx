'use client'

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type SubmissionFormDraftSyncProps = {
  formId: string
  storageKey: string
}

type SupportedFieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
type DraftFieldValue = string | string[]

type DraftChoice = 'restore' | 'clear' | 'new-blank'

type DraftSyncState = {
  isReady: boolean
  showDraftChoice: boolean
  storedDraftValues: Record<string, DraftFieldValue> | null
  persistImmediately: boolean
}

type DraftSyncAction =
  | { type: 'reset-and-skip-restore' }
  | { type: 'set-empty-draft' }
  | { type: 'set-stored-draft'; payload: Record<string, DraftFieldValue> }
  | { type: 'restore-draft' }
  | { type: 'clear-draft'; payload: { persistImmediately: boolean } }

const initialDraftSyncState: DraftSyncState = {
  isReady: false,
  showDraftChoice: false,
  storedDraftValues: null,
  persistImmediately: true,
}

function draftSyncReducer(state: DraftSyncState, action: DraftSyncAction): DraftSyncState {
  switch (action.type) {
    case 'reset-and-skip-restore':
      return {
        isReady: true,
        showDraftChoice: false,
        storedDraftValues: null,
        persistImmediately: true,
      }
    case 'set-empty-draft':
      return {
        isReady: true,
        showDraftChoice: false,
        storedDraftValues: null,
        persistImmediately: true,
      }
    case 'set-stored-draft':
      return {
        ...state,
        storedDraftValues: action.payload,
        showDraftChoice: true,
        isReady: false,
      }
    case 'restore-draft':
      return {
        ...state,
        showDraftChoice: false,
        isReady: true,
        persistImmediately: true,
      }
    case 'clear-draft':
      return {
        isReady: true,
        showDraftChoice: false,
        storedDraftValues: null,
        persistImmediately: action.payload.persistImmediately,
      }
    default:
      return state
  }
}

function isSupportedField(element: Element): element is SupportedFieldElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  )
}

function collectFormValues(form: HTMLFormElement) {
  return Array.from(form.elements).reduce<Record<string, DraftFieldValue>>((result, field) => {
    if (!isSupportedField(field) || !field.name) {
      return result
    }

    if (field.name === 'access_code') {
      return result
    }

    if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      const nextValues = Array.isArray(result[field.name]) ? [...result[field.name]] : []
      if (field.checked) {
        nextValues.push(field.value)
      }
      result[field.name] = nextValues
      return result
    }

    if (field instanceof HTMLInputElement && field.type === 'radio') {
      if (field.checked) {
        result[field.name] = field.value
      } else if (!(field.name in result)) {
        result[field.name] = ''
      }
      return result
    }

    result[field.name] = field.value
    return result
  }, {})
}

function areDraftValuesEqual(
  currentValues: Record<string, DraftFieldValue>,
  initialValues: Record<string, DraftFieldValue>
) {
  const fieldNames = new Set([
    ...Object.keys(currentValues),
    ...Object.keys(initialValues),
  ])

  return Array.from(fieldNames).every(
    (fieldName) => JSON.stringify(currentValues[fieldName] ?? '') === JSON.stringify(initialValues[fieldName] ?? '')
  )
}

export function SubmissionFormDraftSync({
  formId,
  storageKey,
}: SubmissionFormDraftSyncProps) {
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, dispatch] = useReducer(draftSyncReducer, initialDraftSyncState)
  const initialFormValuesRef = useRef<Record<string, DraftFieldValue> | null>(null)

  const shouldSkipRestore = useMemo(() => Boolean(searchParams.get('success')), [searchParams])
  const { isReady, showDraftChoice, storedDraftValues, persistImmediately } = state

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement) || initialFormValuesRef.current) {
      return
    }

    // 中文注释：记录页面初始值，后续只有真正偏离初始表单时才写入本地草稿。
    initialFormValuesRef.current = collectFormValues(form)
  }, [formId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (isSubmitting) {
      return
    }

    if (shouldSkipRestore) {
      window.sessionStorage.removeItem(storageKey)
      dispatch({ type: 'reset-and-skip-restore' })
      return
    }

    const storedDraft = window.sessionStorage.getItem(storageKey)

    if (!storedDraft) {
      dispatch({ type: 'set-empty-draft' })
      return
    }

    try {
      const parsedDraft = JSON.parse(storedDraft) as Record<string, DraftFieldValue>
      dispatch({ type: 'set-stored-draft', payload: parsedDraft })
    } catch {
      window.sessionStorage.removeItem(storageKey)
      dispatch({ type: 'set-empty-draft' })
    }
  }, [isSubmitting, shouldSkipRestore, storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement)) {
      return
    }

    // 中文注释：一旦用户正式提交，就不再重新弹出本地草稿选择层，避免跳转前误打断。
    const handleSubmit = () => {
      setIsSubmitting(true)
    }

    form.addEventListener('submit', handleSubmit)

    return () => {
      form.removeEventListener('submit', handleSubmit)
    }
  }, [formId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement) || !isReady) {
      return
    }

    const persistDraft = () => {
      const nextDraft = collectFormValues(form)
      const initialFormValues = initialFormValuesRef.current ?? {}

      if (areDraftValuesEqual(nextDraft, initialFormValues)) {
        window.sessionStorage.removeItem(storageKey)
        return
      }

      window.sessionStorage.setItem(storageKey, JSON.stringify(nextDraft))
    }

    if (persistImmediately) {
      persistDraft()
    }

    form.addEventListener('input', persistDraft)
    form.addEventListener('change', persistDraft)

    return () => {
      form.removeEventListener('input', persistDraft)
      form.removeEventListener('change', persistDraft)
    }
  }, [formId, isReady, persistImmediately, storageKey])

  const applyDraftToForm = () => {
    if (typeof window === 'undefined') {
      return
    }

    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement) || !storedDraftValues) {
      return
    }

    const fields = Array.from(form.elements)

    // 中文注释：只恢复具名字段，避免覆盖按钮等非业务控件。
    fields.forEach((field) => {
      if (!isSupportedField(field) || !field.name) {
        return
      }

      if (field.name === 'access_code') {
        return
      }

      const nextValue = storedDraftValues[field.name]

      if (field instanceof HTMLInputElement && field.type === 'checkbox') {
        const nextValues = Array.isArray(nextValue) ? nextValue : typeof nextValue === 'string' ? [nextValue] : []
        field.checked = nextValues.includes(field.value)
        return
      }

      if (field instanceof HTMLInputElement && field.type === 'radio') {
        if (typeof nextValue === 'string') {
          field.checked = field.value === nextValue
        }
        return
      }

      if (typeof nextValue === 'string') {
        field.value = nextValue
      }
    })
  }

  const resetFormToDefaultValues = () => {
    if (typeof window === 'undefined') {
      return
    }

    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement)) {
      return
    }

    form.reset()
  }

  const handleDraftChoice = (choice: DraftChoice) => {
    if (typeof window === 'undefined') {
      return
    }

    if (choice === 'restore') {
      applyDraftToForm()
      dispatch({ type: 'restore-draft' })
      return
    }

    window.sessionStorage.removeItem(storageKey)
    resetFormToDefaultValues()
    dispatch({
      type: 'clear-draft',
      payload: {
        persistImmediately: choice === 'new-blank',
      },
    })
  }

  return (
    <>
      {showDraftChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-DEFAULT">
                检测到本地草稿
              </div>
              <h3 className="text-2xl font-bold text-foreground">要继续上次录入，还是从空白开始？</h3>
              <p className="text-sm leading-6 text-muted">
                当前浏览器里还有一份未提交的本地草稿。请选择恢复、彻底清空，或直接新建一份空白草稿。
              </p>
            </div>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => handleDraftChoice('restore')}
                className="rounded-2xl border border-teal-DEFAULT/40 bg-teal-DEFAULT/10 px-4 py-4 text-left transition-colors hover:bg-teal-DEFAULT/15"
              >
                <div className="text-sm font-semibold text-foreground">恢复上次草稿</div>
                <div className="mt-1 text-sm text-muted">把本地未提交内容回填到表单，继续编辑。</div>
              </button>
              <button
                type="button"
                onClick={() => handleDraftChoice('clear')}
                className="rounded-2xl border border-border bg-background px-4 py-4 text-left transition-colors hover:border-status-warning/40 hover:bg-status-warning/10"
              >
                <div className="text-sm font-semibold text-foreground">清空旧草稿</div>
                <div className="mt-1 text-sm text-muted">删除当前本地草稿，不立即生成新的空白草稿记录。</div>
              </button>
              <button
                type="button"
                onClick={() => handleDraftChoice('new-blank')}
                className="rounded-2xl border border-border bg-background px-4 py-4 text-left transition-colors hover:border-border/80 hover:bg-surface"
              >
                <div className="text-sm font-semibold text-foreground">新建空白草稿</div>
                <div className="mt-1 text-sm text-muted">丢弃旧内容，并从当前空白表单开始重新自动保存。</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
