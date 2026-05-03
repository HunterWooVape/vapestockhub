import type { Instrumentation } from 'next'

import { logMonitoringEvent, reportRequestError } from '@/lib/monitoring'

export function register() {
  // 中文注释：服务启动时输出一条结构化日志，便于确认监控钩子已加载。
  logMonitoringEvent({
    event: 'next.instrumentation.registered',
    level: 'info',
    details: {
      runtime: process.env.NEXT_RUNTIME || 'nodejs',
    },
  })
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  await reportRequestError(error, request, {
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    revalidateReason: context.revalidateReason,
  })
}
