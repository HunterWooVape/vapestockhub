export const unlockedItemsCookieName = 'vsh_unlocked_items'
export const adminSessionCookieName = 'vsh_admin_session'

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
