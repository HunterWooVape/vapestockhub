'use client'

import { useEffect } from 'react'

type SubmissionDraftCleanupProps = {
  storageKey: string
}

export function SubmissionDraftCleanup({
  storageKey,
}: SubmissionDraftCleanupProps) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // 中文注释：提报已成功写入后台后，清掉对应本地草稿，避免下次回到录入页继续误识别为旧草稿。
    window.sessionStorage.removeItem(storageKey)
  }, [storageKey])

  return null
}
