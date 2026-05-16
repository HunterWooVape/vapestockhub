type MonitoringLevel = 'info' | 'warn' | 'error'

type MonitoringEventPayload = {
  event: string
  level: MonitoringLevel
  timestamp: string
  environment: string
  details?: Record<string, unknown>
}

type MonitoringWebhookSendResult = 'sent' | 'disabled' | 'cooldown' | 'failed'

type RequestErrorPayload = {
  path: string
  method: string
  routePath: string
  routeType: string
  routerKind: string
  revalidateReason: string | null | undefined
}

const monitoringEnvironment = process.env.MONITORING_ENVIRONMENT?.trim() || process.env.NODE_ENV || 'development'
const monitoringWebhookUrl = process.env.MONITORING_WEBHOOK_URL?.trim() || ''
const monitoringWebhookToken = process.env.MONITORING_WEBHOOK_TOKEN?.trim() || ''
const webhookCooldownMs = 5 * 60 * 1000
const webhookTimeoutMs = 4000
const webhookCooldownStore = new Map<string, number>()

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return typeof error === 'string' ? error : 'Unknown error'
}

function toErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined
}

function getWebhookCooldownKey(payload: MonitoringEventPayload) {
  return `${payload.event}:${JSON.stringify(payload.details ?? {})}`
}

function isWebhookOnCooldown(key: string) {
  const lastSentAt = webhookCooldownStore.get(key)
  if (!lastSentAt) {
    return false
  }

  return Date.now() - lastSentAt < webhookCooldownMs
}

function markWebhookSent(key: string) {
  webhookCooldownStore.set(key, Date.now())
}

export function logMonitoringEvent({
  event,
  level,
  details,
}: {
  event: string
  level: MonitoringLevel
  details?: Record<string, unknown>
}) {
  const payload: MonitoringEventPayload = {
    event,
    level,
    timestamp: new Date().toISOString(),
    environment: monitoringEnvironment,
    details,
  }

  const serializedPayload = JSON.stringify(payload)

  if (level === 'error') {
    console.error(serializedPayload)
    return payload
  }

  if (level === 'warn') {
    console.warn(serializedPayload)
    return payload
  }

  console.log(serializedPayload)
  return payload
}

export async function notifyMonitoringWebhook(payload: MonitoringEventPayload) {
  const result = await sendMonitoringWebhook(payload)
  return result === 'sent'
}

export function isMonitoringWebhookConfigured() {
  return Boolean(monitoringWebhookUrl)
}

async function sendMonitoringWebhook(payload: MonitoringEventPayload): Promise<MonitoringWebhookSendResult> {
  if (!monitoringWebhookUrl) {
    return 'disabled'
  }

  const cooldownKey = getWebhookCooldownKey(payload)
  if (isWebhookOnCooldown(cooldownKey)) {
    return 'cooldown'
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), webhookTimeoutMs)

  try {
    const response = await fetch(monitoringWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(monitoringWebhookToken
          ? {
              Authorization: `Bearer ${monitoringWebhookToken}`,
            }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      return 'failed'
    }

    markWebhookSent(cooldownKey)
    return 'sent'
  } catch {
    return 'failed'
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function triggerMonitoringWebhookTest(triggeredBy: string) {
  const payload = logMonitoringEvent({
    event: 'backoffice.monitoring.webhook_test',
    level: 'info',
    details: {
      source: 'admin-tools',
      triggeredBy,
    },
  })

  // 中文注释：手动测试不制造业务错误，直接发送一条标准监控事件到 webhook。
  return sendMonitoringWebhook(payload)
}

export async function reportRequestError(
  error: unknown,
  request: {
    path: string
    method: string
  },
  context: RequestErrorPayload
) {
  const payload = logMonitoringEvent({
    event: 'next.request.error',
    level: 'error',
    details: {
      ...context,
      path: request.path,
      method: request.method,
      errorMessage: toErrorMessage(error),
      errorStack: toErrorStack(error),
    },
  })

  await notifyMonitoringWebhook(payload)
}

export function getHealthStatus() {
  const requiredEnvReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SITE_URL &&
    process.env.BACKOFFICE_SESSION_SECRET
  )

  return {
    status: requiredEnvReady ? 'ok' : 'degraded',
    environment: monitoringEnvironment,
    webhookEnabled: Boolean(monitoringWebhookUrl),
    timestamp: new Date().toISOString(),
  }
}
