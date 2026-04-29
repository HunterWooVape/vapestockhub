'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type SubmissionFormDraftSyncProps = {
  formId: string
  storageKey: string
}

type SupportedFieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

type DraftChoice = 'restore' | 'clear' | 'new-blank'

function isSupportedField(element: Element): element is SupportedFieldElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  )
}

function collectFormValues(form: HTMLFormElement) {
  return Array.from(form.elements).reduce<Record<string, string>>((result, field) => {
    if (!isSupportedField(field) || !field.name) {
      return result
    }

    if (field.name === 'access_code') {
      return result
    }

    result[field.name] = field.value
    return result
  }, {})
}

function areDraftValuesEqual(
  currentValues: Record<string, string>,
  initialValues: Record<string, string>
) {
  const fieldNames = new Set([
    ...Object.keys(currentValues),
    ...Object.keys(initialValues),
  ])

  return Array.from(fieldNames).every(
    (fieldName) => (currentValues[fieldName] ?? '') === (initialValues[fieldName] ?? '')
  )
}

export function SubmissionFormDraftSync({
  formId,
  storageKey,
}: SubmissionFormDraftSyncProps) {
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDraftChoice, setShowDraftChoice] = useState(false)
  const [storedDraftValues, setStoredDraftValues] = useState<Record<string, string> | null>(null)
  const [persistImmediately, setPersistImmediately] = useState(true)
  const initialFormValuesRef = useRef<Record<string, string> | null>(null)

  const shouldSkipRestore = useMemo(() => Boolean(searchParams.get('success')), [searchParams])

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
      setShowDraftChoice(false)
      return
    }

    if (shouldSkipRestore) {
      window.sessionStorage.removeItem(storageKey)
      setStoredDraftValues(null)
      setShowDraftChoice(false)
      setPersistImmediately(true)
      setIsReady(true)
      return
    }

    const storedDraft = window.sessionStorage.getItem(storageKey)

    if (!storedDraft) {
      setStoredDraftValues(null)
      setShowDraftChoice(false)
      setPersistImmediately(true)
      setIsReady(true)
      return
    }

    try {
      const parsedDraft = JSON.parse(storedDraft) as Record<string, string>
      setStoredDraftValues(parsedDraft)
      setShowDraftChoice(true)
      setIsReady(false)
    } catch {
      window.sessionStorage.removeItem(storageKey)
      setStoredDraftValues(null)
      setShowDraftChoice(false)
      setPersistImmediately(true)
      setIsReady(true)
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
      setShowDraftChoice(false)
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
      if (typeof nextValue !== 'string') {
        return
      }

      field.value = nextValue
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
      setPersistImmediately(true)
      setShowDraftChoice(false)
      setIsReady(true)
      return
    }

    window.sessionStorage.removeItem(storageKey)
    resetFormToDefaultValues()
    setStoredDraftValues(null)
    setShowDraftChoice(false)
    setPersistImmediately(choice === 'new-blank')
    setIsReady(true)
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
