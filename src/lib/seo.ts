// 中文注释：统一聚合页索引阈值，避免 Brand / Market / Price 页后续口径漂移。
export const TAXONOMY_INDEX_THRESHOLDS = {
  brand: 3,
  market: 3,
  price: 4,
} as const
