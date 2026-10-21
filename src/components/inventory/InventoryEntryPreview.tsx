'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { InventoryRecord } from '@/lib/inventory'
import InventoryDetailView from './InventoryDetailView'

export default function InventoryEntryPreview({ item, mobile }: { item: InventoryRecord; mobile: boolean }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  return <>
    <iframe title="库存详情预览" sandbox="allow-same-origin" className={`mx-auto block h-[76dvh] w-full border-0 ${mobile ? 'max-w-[390px]' : ''}`} onLoad={(event) => {
      const frame = event.currentTarget.contentDocument
      if (!frame) return
      frame.documentElement.lang = 'en'
      frame.documentElement.className = document.documentElement.className
      frame.body.className = 'bg-background text-foreground antialiased'
      frame.head.replaceChildren(...Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style')).map((element) => element.cloneNode(true)))
      setTarget(frame.body)
    }} />
    {target && createPortal(<div onClickCapture={(event) => { const anchor = (event.target as HTMLElement).closest('a'); if (anchor && !anchor.getAttribute('href')?.startsWith('#')) { event.preventDefault(); event.stopPropagation() } }}><InventoryDetailView item={item} relatedItems={[]} /></div>, target)}
  </>
}
