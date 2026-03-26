import { getTrackedContactHref } from '@/lib/site'

type ContactButtonsProps = {
  sourcePageType: 'inventory' | 'market' | 'brand' | 'price' | 'home' | 'contact'
  sourcePageSlug: string
  itemSlug?: string
  primaryLabel?: string
  message?: string
}

export default function ContactButtons({
  sourcePageType,
  sourcePageSlug,
  itemSlug,
  primaryLabel = 'Contact via Telegram',
  message,
}: ContactButtonsProps) {
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
