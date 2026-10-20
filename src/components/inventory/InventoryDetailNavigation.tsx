'use client'

import { useEffect, useRef, useState } from 'react'

interface InventoryDetailNavigationProps {
  sections: { id: string; label: string }[]
}

export default function InventoryDetailNavigation({ sections }: InventoryDetailNavigationProps) {
  const navRef = useRef<HTMLElement>(null)
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const targets = sections.flatMap(section => {
      const element = document.getElementById(section.id)
      return element ? [element] : []
    })
    if (!targets.length) return

    let frame = 0
    const update = () => {
      frame = 0
      const anchorOffset = Number.parseFloat(window.getComputedStyle(targets[0]).scrollMarginTop) || 0
      const threshold = Math.max(anchorOffset, 64 + (navRef.current?.offsetHeight ?? 52) + 16) + 1
      const atBottom = window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      const current = atBottom
        ? targets[targets.length - 1]
        : [...targets].reverse().find(target => target.getBoundingClientRect().top <= threshold) ?? targets[0]
      setActiveId(previous => previous === current.id ? previous : current.id)
    }
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('hashchange', scheduleUpdate)
    const observer = new ResizeObserver(scheduleUpdate)
    observer.observe(document.documentElement)
    if (navRef.current) observer.observe(navRef.current)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('hashchange', scheduleUpdate)
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
