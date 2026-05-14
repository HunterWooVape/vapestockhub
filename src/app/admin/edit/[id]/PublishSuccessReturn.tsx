'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type PublishSuccessReturnProps = {
  href: string
  delayMs?: number
}

export default function PublishSuccessReturn({
  href,
  delayMs = 1800,
}: PublishSuccessReturnProps) {
  const router = useRouter()
  const [remainingMs, setRemainingMs] = useState(delayMs)

  useEffect(() => {
    // 中文注释：发布完成后短暂停留，先让操作员确认成功结果，再自动回到来源工作台。
    const redirectTimer = window.setTimeout(() => {
      router.replace(href)
    }, delayMs)

    const countdownTimer = window.setInterval(() => {
      setRemainingMs((currentValue) => Math.max(0, currentValue - 100))
    }, 100)

    return () => {
      window.clearTimeout(redirectTimer)
      window.clearInterval(countdownTimer)
    }
  }, [delayMs, href, router])

  return (
    <div className="mt-2 text-xs text-muted">
      约 {Math.max(1, Math.ceil(remainingMs / 1000))} 秒后自动返回来源工作台。
    </div>
  )
}
