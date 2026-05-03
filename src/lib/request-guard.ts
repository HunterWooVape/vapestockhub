import { createHmac, timingSafeEqual } from 'node:crypto'

export const leadRouteGuardCookieName = 'vsh_lead_route_guard'

const leadRouteGuardVersion = 'v1'
const leadRouteWindowMs = 60 * 1000
const leadRouteBlockMs = 10 * 60 * 1000
const leadRouteMaxHitsPerWindow = 8

export type LeadRouteGuardState = {
  hitCount: number
  windowStartedAt: number
  blockedUntil: number | null
}

export type LeadRouteGuardResult = {
  allowWrite: boolean
  retryAfterSeconds: number | null
  nextState: LeadRouteGuardState
}

function getRequestGuardSecret() {
  const value = process.env.BACKOFFICE_SESSION_SECRET?.trim()
  return value ? value : null
}

function buildLeadRouteGuardPayload(state: LeadRouteGuardState) {
  return `${leadRouteGuardVersion}:${state.hitCount}:${state.windowStartedAt}:${state.blockedUntil ?? 0}`
}

function signPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function isValidSignature(payload: string, signature: string, secret: string) {
  const expectedSignature = signPayload(payload, secret)
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(providedBuffer, expectedBuffer)
}

function createEmptyLeadRouteGuardState(now: number): LeadRouteGuardState {
  return {
    hitCount: 0,
    windowStartedAt: now,
    blockedUntil: null,
  }
}

export function parseLeadRouteGuardState(value?: string | null, now = Date.now()): LeadRouteGuardState {
  if (!value) {
    return createEmptyLeadRouteGuardState(now)
  }

  const secret = getRequestGuardSecret()
  if (!secret) {
    return createEmptyLeadRouteGuardState(now)
  }

  const [version, rawHitCount, rawWindowStartedAt, rawBlockedUntil, signature] = value.split(':')
  if (!version || !rawHitCount || !rawWindowStartedAt || !rawBlockedUntil || !signature) {
    return createEmptyLeadRouteGuardState(now)
  }

  const hitCount = Number.parseInt(rawHitCount, 10)
  const windowStartedAt = Number.parseInt(rawWindowStartedAt, 10)
  const blockedUntil = Number.parseInt(rawBlockedUntil, 10)

  if (
    version !== leadRouteGuardVersion ||
    !Number.isFinite(hitCount) ||
    hitCount < 0 ||
    !Number.isFinite(windowStartedAt) ||
    windowStartedAt <= 0 ||
    !Number.isFinite(blockedUntil) ||
    blockedUntil < 0
  ) {
    return createEmptyLeadRouteGuardState(now)
  }

  const payload = buildLeadRouteGuardPayload({
    hitCount,
    windowStartedAt,
    blockedUntil: blockedUntil || null,
  })

  if (!isValidSignature(payload, signature, secret)) {
    return createEmptyLeadRouteGuardState(now)
  }

  return {
    hitCount,
    windowStartedAt,
    blockedUntil: blockedUntil || null,
  }
}

export function serializeLeadRouteGuardState(state: LeadRouteGuardState) {
  const secret = getRequestGuardSecret()
  if (!secret) {
    return null
  }

  const normalizedState: LeadRouteGuardState = {
    hitCount: Math.max(0, Math.floor(state.hitCount)),
    windowStartedAt: Math.max(1, Math.floor(state.windowStartedAt)),
    blockedUntil: state.blockedUntil && state.blockedUntil > 0 ? Math.floor(state.blockedUntil) : null,
  }

  const payload = buildLeadRouteGuardPayload(normalizedState)
  const signature = signPayload(payload, secret)
  return `${payload}:${signature}`
}

export function evaluateLeadRouteGuard(value?: string | null, now = Date.now()): LeadRouteGuardResult {
  const currentState = parseLeadRouteGuardState(value, now)

  if (currentState.blockedUntil && currentState.blockedUntil > now) {
    return {
      allowWrite: false,
      retryAfterSeconds: Math.max(1, Math.ceil((currentState.blockedUntil - now) / 1000)),
      nextState: currentState,
    }
  }

  const isOutsideWindow = now - currentState.windowStartedAt >= leadRouteWindowMs
  const nextWindowStartedAt = isOutsideWindow ? now : currentState.windowStartedAt
  const nextHitCount = (isOutsideWindow ? 0 : currentState.hitCount) + 1

  if (nextHitCount > leadRouteMaxHitsPerWindow) {
    return {
      allowWrite: false,
      retryAfterSeconds: Math.ceil(leadRouteBlockMs / 1000),
      nextState: {
        hitCount: 0,
        windowStartedAt: now,
        blockedUntil: now + leadRouteBlockMs,
      },
    }
  }

  return {
    allowWrite: true,
    retryAfterSeconds: null,
    nextState: {
      hitCount: nextHitCount,
      windowStartedAt: nextWindowStartedAt,
      blockedUntil: null,
    },
  }
}

export function getLeadRouteGuardCookieMaxAge(state: LeadRouteGuardState) {
  if (state.blockedUntil) {
    return Math.max(60, Math.ceil((state.blockedUntil - Date.now()) / 1000))
  }

  return Math.ceil(leadRouteWindowMs / 1000)
}
