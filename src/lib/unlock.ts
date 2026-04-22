import { createHmac, timingSafeEqual } from 'node:crypto'

export const unlockedItemsCookieName = 'vsh_unlocked_items'
export const adminSessionCookieName = 'vsh_admin_session'
export const backofficeRoles = ['admin', 'staff'] as const
const backofficeSessionVersion = 'v1'

export type BackofficeRole = typeof backofficeRoles[number]
export type BackofficeSession = {
  isAuthenticated: boolean
  role: BackofficeRole | null
}

function normalizeBackofficeRole(value?: string | null) {
  return backofficeRoles.includes(value as BackofficeRole) ? (value as BackofficeRole) : null
}

function getBackofficeSessionSecret() {
  const value = process.env.BACKOFFICE_SESSION_SECRET?.trim()
  return value ? value : null
}

function buildBackofficeSessionPayload(role: BackofficeRole) {
  return `${backofficeSessionVersion}:${role}`
}

function signBackofficeSessionPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function isValidBackofficeSessionSignature(payload: string, signature: string, secret: string) {
  const expectedSignature = signBackofficeSessionPayload(payload, secret)
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export function isBackofficeSessionSigningReady() {
  return Boolean(getBackofficeSessionSecret())
}

export function parseBackofficeSession(value?: string | null): BackofficeSession {
  if (!value) {
    return {
      isAuthenticated: false,
      role: null,
    }
  }
  const secret = getBackofficeSessionSecret()

  if (!secret) {
    return {
      isAuthenticated: false,
      role: null,
    }
  }

  const [version, rawRole, signature] = value.split(':')
  const role = normalizeBackofficeRole(rawRole)

  if (version !== backofficeSessionVersion || !role || !signature) {
    return {
      isAuthenticated: false,
      role: null,
    }
  }
  const payload = buildBackofficeSessionPayload(role)
  const isAuthenticated = isValidBackofficeSessionSignature(payload, signature, secret)

  return {
    isAuthenticated,
    role: isAuthenticated ? role : null,
  }
}

export function serializeBackofficeSession(role: BackofficeRole) {
  const secret = getBackofficeSessionSecret()

  if (!secret) {
    return null
  }

  const payload = buildBackofficeSessionPayload(role)
  const signature = signBackofficeSessionPayload(payload, secret)
  return `${payload}:${signature}`
}

export function isBackofficeAuthenticated(value?: string | null) {
  return parseBackofficeSession(value).isAuthenticated
}

export function getBackofficeRole(value?: string | null) {
  return parseBackofficeSession(value).role
}

export function isAdminRole(value?: string | null) {
  return getBackofficeRole(value) === 'admin'
}

export function isStaffRole(value?: string | null) {
  return getBackofficeRole(value) === 'staff'
}

export function parseUnlockedItems(value?: string | null) {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function serializeUnlockedItems(items: string[]) {
  return Array.from(new Set(items)).join(',')
}

export function isPriceUnlocked(value: string | null | undefined, slug: string) {
  return parseUnlockedItems(value).includes(slug)
}
