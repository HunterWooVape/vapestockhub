# SEO 2026

更新时间：2026-05-31

## 状态
- 分类：`MVP+ Optimization`
- 阶段：P0 与 P1 基础承接已实施，Blog 正式索引等待真实库存推荐槽位。
- 北极星指标：`有效询盘数`
- 核心目标：用更贴近真实 vape B2B 买家搜索行为的词承接流量，并推动访问者进入 Telegram / WhatsApp 询盘。

## 当前实施状态
- 已完成：Home、Inventory、Price、Inventory Detail、Brand、Market、Trust Pages 的 SEO 文案、metadata、FAQ 和 CTA 语义调整。
- 已完成：Inventory warehouse 筛选、详情页 Product / Offer JSON-LD、AI Draft Package SEO 字段、DeepSeek-compatible LLM provider 方向文档化。
- 已完成：最小 Blog 路由与首篇 Alternative Guide 框架；当前未绑定真实库存槽位，保持 `noindex, follow`，不进入 sitemap。
- 已完成：`npm run build` 改为 Webpack 路径并移除 Google Fonts 构建依赖；本机 smoke test 覆盖关键 SEO 页面和 Blog 草稿索引边界。
- 待后续：真实 `related_inventory_slugs` 确认后，完善首篇 Blog 推荐槽位并切换为可索引正式文章。
- 待后续：根据 Search Console、Semrush 和询盘数据，再决定 warehouse、country、clearance、price-list 等 P2 页面。

## Source of Truth
- 实施顺序：[`SEO_EXECUTION_CHECKLIST.md`](SEO_EXECUTION_CHECKLIST.md)
- 核心决策：[`SEO_CORE_DECISIONS.md`](SEO_CORE_DECISIONS.md)
- 关键词数据：[`KEYWORD_RESEARCH_SUMMARY.md`](KEYWORD_RESEARCH_SUMMARY.md)
- 页面规格：[`pages/`](pages)
- 历史追溯：[`HISTORICAL_WORKSHEET.md`](HISTORICAL_WORKSHEET.md)

## 代码实施时怎么读
1. 先读 [`SEO_EXECUTION_CHECKLIST.md`](SEO_EXECUTION_CHECKLIST.md)，确认当前任务属于 P0、P1 还是 P2。
2. 再读对应页面文件，例如改首页就读 [`pages/home.md`](pages/home.md)。
3. 涉及关键词判断时读 [`KEYWORD_RESEARCH_SUMMARY.md`](KEYWORD_RESEARCH_SUMMARY.md)。
4. 如遇到旧讨论冲突，以 [`SEO_CORE_DECISIONS.md`](SEO_CORE_DECISIONS.md) 和页面规格为准。

## 页面规格索引
- [`pages/home.md`](pages/home.md)
- [`pages/inventory.md`](pages/inventory.md)
- [`pages/price.md`](pages/price.md)
- [`pages/inventory-detail.md`](pages/inventory-detail.md)
- [`pages/brand.md`](pages/brand.md)
- [`pages/market.md`](pages/market.md)
- [`pages/blog-alternative.md`](pages/blog-alternative.md)
- [`pages/warehouse.md`](pages/warehouse.md)
- [`pages/trust-pages.md`](pages/trust-pages.md)

## 硬边界
- 不引入用户注册、购物车、结账、支付、Vendor dashboard。
- 不做大规模 AI 内容矩阵。
- 不做 brand x market x price 无限组合页。
- 不做仿牌、replica、copy、fake、counterfeit 语义。
- 不因为某个词临时有量就直接新建页面，必须先判断真实库存、页面意图、B2B 询盘质量和运营复杂度。
