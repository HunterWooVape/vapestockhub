export const featuredMarketRegionOptions = [
  'Middle East',
  'North America',
  'Latin America',
  'Western Europe',
  'Eastern Europe',
  'Southeast Asia',
  'Africa',
  'Russia / CIS',
] as const

export const featuredMarketCountryOptions = [
  'USA',
  'UK',
  'UAE',
] as const

export const featuredMarketPresetOptions = [
  ...featuredMarketRegionOptions,
  ...featuredMarketCountryOptions,
] as const

export const featuredMarketPresetGroups = [
  {
    label: '区域',
    options: [...featuredMarketRegionOptions],
  },
  {
    label: '国家特例',
    options: [...featuredMarketCountryOptions],
  },
] as const

const featuredMarketPresetSet = new Set<string>(featuredMarketPresetOptions)

const marketAliasMap = new Map<string, string>([
  ['global', 'Global'],
  ['middle east', 'Middle East'],
  ['middle-east', 'Middle East'],
  ['latin america', 'Latin America'],
  ['latin-america', 'Latin America'],
  ['eastern europe', 'Eastern Europe'],
  ['eastern-europe', 'Eastern Europe'],
  ['western europe', 'Western Europe'],
  ['western-europe', 'Western Europe'],
  ['north america', 'North America'],
  ['north-america', 'North America'],
  ['south america', 'South America'],
  ['south-america', 'South America'],
  ['southeast asia', 'Southeast Asia'],
  ['south east asia', 'Southeast Asia'],
  ['southeast-asia', 'Southeast Asia'],
  ['south-east-asia', 'Southeast Asia'],
  ['africa', 'Africa'],
  ['mena', 'MENA'],
  ['middle east & africa', 'Middle East & Africa'],
  ['middle-east-africa', 'Middle East & Africa'],
  ['russia/cis', 'Russia / CIS'],
  ['russia / cis', 'Russia / CIS'],
  ['cis', 'Russia / CIS'],
  ['us', 'USA'],
  ['uk', 'UK'],
  ['usa', 'USA'],
  ['united states', 'USA'],
  ['united state', 'USA'],
  ['united states of america', 'USA'],
  ['u.s.', 'USA'],
  ['u.s.a.', 'USA'],
  ['united kingdom', 'UK'],
  ['great britain', 'UK'],
  ['britain', 'UK'],
  ['england', 'UK'],
  ['uae', 'UAE'],
  ['united arab emirates', 'UAE'],
  ['emirates', 'UAE'],
])

const uppercaseMarketTokens = new Set(['UK', 'USA', 'UAE', 'EU', 'CIS', 'MENA', 'GCC'])

export const dataEntryGuidelines = {
  brand: '只填品牌，不混型号；新品牌按官方写法录入。',
  market: '可售范围填 Global；主推市场只选预设区域或 USA / UK / UAE。',
  imageFileName: '建议使用小写英文和连字符。避免空格、%20、中文和括号，例如 rifbar-mixpro-40k.webp。',
} as const

function safeDecodeUriComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function titleCaseMarketToken(token: string) {
  const upperToken = token.toUpperCase()
  if (uppercaseMarketTokens.has(upperToken)) {
    return upperToken
  }

  return token ? token.charAt(0).toUpperCase() + token.slice(1).toLowerCase() : token
}

export function normalizeMarketLabel(value: string) {
  const normalizedValue = value.trim().replace(/\s+/g, ' ')
  if (!normalizedValue) {
    return ''
  }

  const alias = marketAliasMap.get(normalizedValue.toLowerCase())
  if (alias) {
    return alias
  }

  return normalizedValue
    .split(/(\s+|\/|&|-)/)
    .map((segment) => (/^[A-Za-z]+$/.test(segment) ? titleCaseMarketToken(segment) : segment))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeMarketLabels(values: string[]) {
  const seen = new Set<string>()

  return values
    .map((value) => normalizeMarketLabel(value))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

export function normalizeFeaturedMarketLabel(value: string) {
  const normalizedLabel = normalizeMarketLabel(value)
  return featuredMarketPresetSet.has(normalizedLabel) ? normalizedLabel : ''
}

export function normalizeFeaturedMarketLabels(values: string[]) {
  const seen = new Set<string>()

  return values
    .map((value) => normalizeFeaturedMarketLabel(value))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

export function sanitizeImageAssetFileName(value: string) {
  const decodedValue = safeDecodeUriComponent(value.trim())
  const fileName = decodedValue.split('/').pop() ?? decodedValue
  const lastDotIndex = fileName.lastIndexOf('.')
  const extension = lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : ''
  const baseName = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName

  const sanitizedBaseName = baseName
    .toLowerCase()
    .replace(/[%\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return extension ? `${sanitizedBaseName}.${extension}` : sanitizedBaseName
}

export function getImageFileNameRisk(urlOrFileName: string) {
  const rawValue = urlOrFileName.trim()
  if (!rawValue) {
    return false
  }

  const decodedValue = safeDecodeUriComponent(rawValue)
  const fileName = decodedValue.split('/').pop() ?? decodedValue
  const rawFileName = rawValue.split('/').pop() ?? rawValue

  // 中文注释：这里收紧为强风险判断，避免仅因大写字母或下划线就提示运营“文件名有问题”。
  if (/%20/i.test(rawFileName)) {
    return true
  }

  return /[\s\u4e00-\u9fff()[\]{}（）【】]/.test(fileName)
}
