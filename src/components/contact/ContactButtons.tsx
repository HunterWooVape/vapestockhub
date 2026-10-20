import { getTrackedContactHref } from '@/lib/site'
import { ArrowUpRight } from 'lucide-react'
import { FaTelegramPlane, FaWhatsapp } from 'react-icons/fa'

type ContactButtonsProps = {
  sourcePageType: 'inventory' | 'market' | 'brand' | 'price' | 'home' | 'contact' | 'blog'
  sourcePageSlug: string
  itemSlug?: string
  primaryLabel?: string
  message?: string
  compact?: boolean
}

export default function ContactButtons({
  sourcePageType,
  sourcePageSlug,
  itemSlug,
  primaryLabel = 'Contact via Telegram',
  message,
  compact = false,
}: ContactButtonsProps) {
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={getTrackedContactHref({ channel: 'telegram', sourcePageType, sourcePageSlug, itemSlug, message })}
          aria-label={primaryLabel}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-DEFAULT px-3 py-3 text-xs font-semibold text-background outline-none hover:bg-teal-hover focus-visible:ring-2 focus-visible:ring-foreground"
        >
          <FaTelegramPlane className="size-3.5 shrink-0" aria-hidden="true" />
          Telegram
          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
        </a>
        <a
          href={getTrackedContactHref({ channel: 'whatsapp', sourcePageType, sourcePageSlug, itemSlug, message })}
          aria-label="Contact via WhatsApp"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-3 text-xs font-semibold outline-none hover:border-teal-DEFAULT/50 focus-visible:ring-2 focus-visible:ring-teal-DEFAULT"
        >
          <FaWhatsapp className="size-3.5 shrink-0" aria-hidden="true" />
          WhatsApp
          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
        </a>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <a
        href={getTrackedContactHref({
          channel: 'telegram',
          sourcePageType,
          sourcePageSlug,
          itemSlug,
          message,
        })}
        className="w-full flex items-center justify-center gap-2 bg-teal-DEFAULT text-background font-bold text-lg py-4 rounded-xl hover:bg-teal-hover transition-colors"
      >
        {primaryLabel}
      </a>
      <a
        href={getTrackedContactHref({
          channel: 'whatsapp',
          sourcePageType,
          sourcePageSlug,
          itemSlug,
          message,
        })}
        className="w-full flex items-center justify-center gap-2 border border-border bg-background text-foreground font-bold py-4 rounded-xl hover:bg-surface transition-colors"
      >
        Contact via WhatsApp
      </a>
    </div>
  )
}
