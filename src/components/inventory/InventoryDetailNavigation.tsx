'use client'

import { useEffect, useRef, useState } from 'react'

interface InventoryDetailNavigationProps {
  sections: { id: string; label: string }[]
}

export default function InventoryDetailNavigation({ sections }: InventoryDetailNavigationProps) {
  const navRef = useRef<HTMLElement>(null)
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const ownerDocument = navRef.current?.ownerDocument
    const view = ownerDocument?.defaultView
    if (!ownerDocument || !view) return
    const targets = sections.flatMap(section => {
      const element = ownerDocument.getElementById(section.id)
      return element ? [element] : []
    })
    if (!targets.length) return

    let frame = 0
    const update = () => {
      frame = 0
      const anchorOffset = Number.parseFloat(view.getComputedStyle(targets[0]).scrollMarginTop) || 0
      const threshold = Math.max(anchorOffset, 64 + (navRef.current?.offsetHeight ?? 52) + 16) + 1
      const atBottom = view.scrollY > 0 && view.innerHeight + view.scrollY >= ownerDocument.documentElement.scrollHeight - 2
      const current = atBottom
        ? targets[targets.length - 1]
        : [...targets].reverse().find(target => target.getBoundingClientRect().top <= threshold) ?? targets[0]
      setActiveId(previous => previous === current.id ? previous : current.id)
    }
    const scheduleUpdate = () => {
      if (!frame) frame = view.requestAnimationFrame(update)
    }

    scheduleUpdate()
    view.addEventListener('scroll', scheduleUpdate, { passive: true })
    view.addEventListener('resize', scheduleUpdate)
    view.addEventListener('hashchange', scheduleUpdate)
    const observer = new ResizeObserver(scheduleUpdate)
    observer.observe(ownerDocument.documentElement)
    if (navRef.current) observer.observe(navRef.current)

    return () => {
      view.cancelAnimationFrame(frame)
      view.removeEventListener('scroll', scheduleUpdate)
      view.removeEventListener('resize', scheduleUpdate)
      view.removeEventListener('hashchange', scheduleUpdate)
      observer.disconnect()
    }
  }, [sections])

  if (!sections.length) return null
  const currentId = sections.some(section => section.id === activeId) ? activeId : sections[0].id

  return (
    <nav ref={navRef} aria-label="Page sections" className="sticky top-16 z-30 mt-8 min-w-0 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="grid grid-flow-col auto-cols-fr gap-2 text-center text-[11px] sm:flex sm:gap-8 sm:text-left sm:text-[13px]">
        {sections.map(section => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={currentId === section.id ? 'location' : undefined}
            className={`min-w-0 border-b-2 px-1 py-4 font-medium break-words outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-DEFAULT motion-reduce:transition-none sm:px-0 ${currentId === section.id ? 'border-teal-DEFAULT text-teal-DEFAULT' : 'border-transparent text-muted hover:text-foreground'}`}
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
