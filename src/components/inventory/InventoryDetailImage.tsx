'use client'

import Image from 'next/image'
import { Expand, X } from 'lucide-react'
import { useRef, type MouseEvent } from 'react'

interface InventoryDetailImageProps {
  src: string
  alt: string
  caption: string
  hasRealImage: boolean
}

export default function InventoryDetailImage({ src, alt, caption, hasRealImage }: InventoryDetailImageProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const image = (
    <Image
      unoptimized
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1159px) 46vw, 480px"
      loading="eager"
      className="object-contain p-5 sm:p-8"
    />
  )

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      event.currentTarget.close()
    }
  }

  return (
    <figure className={`relative flex min-w-0 flex-col border-b border-border md:col-start-1 md:row-span-2 md:row-start-1 md:border-b-0 md:border-r ${hasRealImage ? 'bg-[#f6f7f8]' : 'bg-background'}`}>
      {hasRealImage ? (
        <button
          ref={triggerRef}
          type="button"
          aria-label="Enlarge product image"
          aria-haspopup="dialog"
          onClick={() => dialogRef.current?.showModal()}
          className="group relative aspect-[6/5] min-h-[280px] w-full flex-1 cursor-zoom-in overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-DEFAULT sm:min-h-[330px] lg:aspect-square lg:min-h-[480px]"
        >
          {image}
          <span className="absolute right-4 top-4 rounded-lg border border-black/10 bg-white/90 p-2 text-[#52606d] group-hover:text-[#14232e]" aria-hidden="true"><Expand className="size-4" /></span>
        </button>
      ) : (
        <div className="relative aspect-[6/5] min-h-[280px] w-full flex-1 overflow-hidden sm:min-h-[330px] lg:aspect-square lg:min-h-[480px]">{image}</div>
      )}
      <figcaption className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t px-5 py-3 text-[10px] sm:px-6 ${hasRealImage ? 'border-black/5 text-[#65717d]' : 'border-border text-muted'}`}>
        <span>{hasRealImage ? 'Product illustration' : 'Image unavailable'}</span>
        {caption && <span className="min-w-0 break-words">{caption}</span>}
      </figcaption>
      {hasRealImage && (
        <dialog
          ref={dialogRef}
          aria-label="Product image"
          onClick={closeOnBackdrop}
          onClose={() => triggerRef.current?.focus({ preventScroll: true })}
          className="fixed m-auto w-[min(92vw,850px)] max-w-none overflow-visible rounded-xl border border-border bg-white p-0 text-background backdrop:bg-black/80"
        >
          <button
            type="button"
            aria-label="Close image"
            onClick={() => dialogRef.current?.close()}
            className="absolute right-3 top-3 z-10 rounded-full border border-black/10 bg-white p-2 outline-none focus-visible:ring-2 focus-visible:ring-teal-DEFAULT"
          ><X className="size-5" aria-hidden="true" /></button>
          <div className="relative h-[min(85dvh,800px)] w-full">
            <Image unoptimized src={src} alt={alt} fill sizes="(max-width: 923px) 92vw, 850px" className="rounded-xl object-contain p-5" />
          </div>
        </dialog>
      )}
    </figure>
  )
}
