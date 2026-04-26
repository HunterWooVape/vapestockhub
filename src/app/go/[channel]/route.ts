import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { getTelegramUrl, getWhatsAppUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: RouteContext<'/go/[channel]'>
) {
  const { channel } = await context.params
  const { searchParams } = new URL(request.url)
  const sourcePageType = searchParams.get('sourcePageType') || 'inventory'
  const sourcePageSlug = searchParams.get('sourcePageSlug') || 'unknown'
  const itemSlug = searchParams.get('itemSlug')
  const message = searchParams.get('message')

  if (channel !== 'telegram' && channel !== 'whatsapp') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const targetUrl = channel === 'telegram' ? getTelegramUrl(message || undefined) : getWhatsAppUrl(message || undefined)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  await supabase.from('leads').insert({
    source_page_type: sourcePageType,
    source_page_slug: sourcePageSlug,
    source_channel: channel,
    item_slug: itemSlug,
    lead_status: 'new',
    target_url: targetUrl,
    referer: request.headers.get('referer'),
    user_agent: request.headers.get('user-agent'),
  })

  return NextResponse.redirect(targetUrl)
}
