export const siteConfig = {
  name: 'VapeStockHub',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@vapestockhub.com',
  telegramUsername: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || 'VapeStockHub',
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8615899880706').replace(/\D/g, ''),
}

export function getTelegramUrl(text?: string) {
  const base = `https://t.me/${siteConfig.telegramUsername}`
  if (text) {
    return `${base}?text=${encodeURIComponent(text)}`
  }
  return base
}

export function getWhatsAppUrl(text?: string) {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`
  if (text) {
    return `${base}?text=${encodeURIComponent(text)}`
  }
  return base
}

export function getTrackedContactHref({
  channel,
  sourcePageType,
  sourcePageSlug,
  itemSlug,
  message,
}: {
  channel: 'telegram' | 'whatsapp'
  sourcePageType: 'inventory' | 'market' | 'brand' | 'price' | 'home' | 'contact'
  sourcePageSlug: string
  itemSlug?: string
  message?: string
}) {
  const searchParams = new URLSearchParams({
    sourcePageType,
    sourcePageSlug,
  })

  if (itemSlug) {
    searchParams.set('itemSlug', itemSlug)
  }

  if (message) {
    searchParams.set('message', message)
  }

  return `/go/${channel}?${searchParams.toString()}`
}
