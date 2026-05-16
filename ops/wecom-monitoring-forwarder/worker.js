/**
 * 中文注释：Cloudflare Worker 作为极轻量转发层，
 * 接收 VapeStockHub 发来的标准 JSON 监控事件，再转成企业微信机器人文本消息。
 */

function formatDetails(details) {
  if (!details || typeof details !== 'object') {
    return '-'
  }

  return Object.entries(details)
    .map(([key, value]) => `- ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n')
}

function buildWecomTextMessage(payload) {
  const event = typeof payload?.event === 'string' ? payload.event : 'unknown.event'
  const level = typeof payload?.level === 'string' ? payload.level.toUpperCase() : 'INFO'
  const environment = typeof payload?.environment === 'string' ? payload.environment : 'unknown'
  const timestamp = typeof payload?.timestamp === 'string' ? payload.timestamp : new Date().toISOString()
  const details = formatDetails(payload?.details)

  return [
    'VapeStockHub Monitoring Alert',
    `Level: ${level}`,
    `Event: ${event}`,
    `Environment: ${environment}`,
    `Timestamp: ${timestamp}`,
    'Details:',
    details,
  ].join('\n')
}

const worker = {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const expectedBearerToken = env.MONITORING_FORWARDER_TOKEN?.trim()
    if (!expectedBearerToken) {
      return Response.json(
        {
          ok: false,
          error: 'missing_forwarder_token',
        },
        { status: 500 }
      )
    }

    const authorization = request.headers.get('authorization') || ''
    if (authorization !== `Bearer ${expectedBearerToken}`) {
      return Response.json(
        {
          ok: false,
          error: 'unauthorized',
        },
        { status: 401 }
      )
    }

    const wecomWebhookUrl = env.WECOM_WEBHOOK_URL?.trim()
    if (!wecomWebhookUrl) {
      return Response.json(
        {
          ok: false,
          error: 'missing_wecom_webhook_url',
        },
        { status: 500 }
      )
    }

    let payload

    try {
      payload = await request.json()
    } catch {
      return Response.json(
        {
          ok: false,
          error: 'invalid_json',
        },
        { status: 400 }
      )
    }

    const textMessage = buildWecomTextMessage(payload)

    const wecomResponse = await fetch(wecomWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: textMessage,
        },
      }),
    })

    const wecomResult = await wecomResponse.text()

    if (!wecomResponse.ok) {
      return Response.json(
        {
          ok: false,
          error: 'wecom_request_failed',
          status: wecomResponse.status,
          body: wecomResult,
        },
        { status: 502 }
      )
    }

    return Response.json({
      ok: true,
      forwarded: true,
      wecomStatus: wecomResponse.status,
      wecomBody: wecomResult,
    })
  },
}

export default worker
