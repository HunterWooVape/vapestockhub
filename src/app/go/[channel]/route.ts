import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import {
  evaluateLeadRouteGuard,
  getLeadRouteGuardCookieMaxAge,
  leadRouteGuardCookieName,
  serializeLeadRouteGuardState,
} from '@/lib/request-guard'
import { getTelegramUrl, getWhatsAppUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

const allowedSourcePageTypes = new Set(['inventory', 'market', 'brand', 'price', 'home', 'contact'])
const maxTrackedSlugLength = 120
const maxTrackedMessageLength = 500

function normalizeTrackedSlug(value: string | null, fallback: string) {
  const trimmedValue = value?.trim().toLowerCase() ?? ''

  if (!trimmedValue || trimmedValue.length > maxTrackedSlugLength) {
    return fallback
  }

  return /^[a-z0-9-]+$/.test(trimmedValue) ? trimmedValue : fallback
}

function normalizeTrackedMessage(value: string | null) {
  if (!value) {
    return undefined
  }

  const normalizedValue = value.replace(/\s+/g, ' ').trim()
  if (!normalizedValue) {
    return undefined
  }

  return normalizedValue.slice(0, maxTrackedMessageLength)
}

export async function GET(
  request: NextRequest,
  context: RouteContext<'/go/[channel]'>
) {
  const { channel } = await context.params
  const { searchParams } = new URL(request.url)

  if (channel !== 'telegram' && channel !== 'whatsapp') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const rawSourcePageType = searchParams.get('sourcePageType')
  const sourcePageType = allowedSourcePageTypes.has(rawSourcePageType ?? '')
    ? (rawSourcePageType as 'inventory' | 'market' | 'brand' | 'price' | 'home' | 'contact')
    : 'inventory'
  const sourcePageSlug = normalizeTrackedSlug(searchParams.get('sourcePageSlug'), 'unknown')
  const itemSlug = normalizeTrackedSlug(searchParams.get('itemSlug'), '')
  const message = normalizeTrackedMessage(searchParams.get('message'))
  const targetUrl = channel === 'telegram' ? getTelegramUrl(message) : getWhatsAppUrl(message)

  // 中文注释：高频请求仍允许用户继续跳转私域，但会跳过写库，避免 leads 表被刷爆。
  const guardResult = evaluateLeadRouteGuard(request.cookies.get(leadRouteGuardCookieName)?.value)
  const response = NextResponse.redirect(targetUrl)
  const guardCookieValue = serializeLeadRouteGuardState(guardResult.nextState)

  if (guardCookieValue) {
    response.cookies.set(leadRouteGuardCookieName, guardCookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: getLeadRouteGuardCookieMaxAge(guardResult.nextState),
    })
  }

  if (!guardResult.allowWrite) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  await supabase.from('leads').insert({
    source_page_type: sourcePageType,
    source_page_slug: sourcePageSlug,
    source_channel: channel,
    item_slug: itemSlug || null,
    lead_status: 'new',
    target_url: targetUrl,
    referer: request.headers.get('referer'),
    user_agent: request.headers.get('user-agent'),
  })

  return response
}
