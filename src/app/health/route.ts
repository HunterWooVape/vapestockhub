import { NextResponse } from 'next/server'

import { getHealthStatus } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

export async function GET() {
  const status = getHealthStatus()

  return NextResponse.json(status, {
    status: status.status === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
