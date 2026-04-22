'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type SubmissionFormDraftSyncProps = {
  formId: string
  storageKey: string
}

type SupportedFieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function isSupportedField(element: Element): element is SupportedFieldElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  )
}

export function SubmissionFormDraftSync({
  formId,
  storageKey,
}: SubmissionFormDraftSyncProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const shouldSkipRestore = Boolean(searchParams.get('success'))

    if (shouldSkipRestore) {
      window.sessionStorage.removeItem(storageKey)
    }

    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement)) {
      return
    }

    const storedDraft = window.sessionStorage.getItem(storageKey)

    if (storedDraft && !shouldSkipRestore) {
      try {
        const draftValues = JSON.parse(storedDraft) as Record<string, string>
        const fields = Array.from(form.elements)

        // 中文注释：只恢复具名字段，避免覆盖按钮等非业务控件。
        fields.forEach((field) => {
          if (!isSupportedField(field) || !field.name) {
            return
          }

          if (field.name === 'access_code') {
            return
          }

          const nextValue = draftValues[field.name]
          if (typeof nextValue !== 'string') {
            return
          }

          field.value = nextValue
        })
      } catch {
        window.sessionStorage.removeItem(storageKey)
      }
    }

    const persistDraft = () => {
      const nextDraft = Array.from(form.elements).reduce<Record<string, string>>((result, field) => {
        if (!isSupportedField(field) || !field.name) {
          return result
        }

        if (field.name === 'access_code') {
          return result
        }

        result[field.name] = field.value
        return result
      }, {})

      window.sessionStorage.setItem(storageKey, JSON.stringify(nextDraft))
    }

    persistDraft()
    form.addEventListener('input', persistDraft)
    form.addEventListener('change', persistDraft)

    return () => {
      form.removeEventListener('input', persistDraft)
      form.removeEventListener('change', persistDraft)
    }
  }, [formId, searchParams, storageKey])

  return null
}
