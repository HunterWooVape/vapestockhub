# SEO Execution Checklist

更新时间：2026-05-31

## 当前进度
- P0：已实施并通过 lint / typecheck / build / smoke test。
- P1：Brand、Market、结构化数据、AI Draft Package SEO 字段、最小 Blog 路由已实施。
- P1 Blog：当前是可预览草稿框架，等待真实库存推荐槽位后再切换为 indexable。
- P2：Trust Pages 已做轻量优化；Warehouse、Country、Clearance、Price List 继续暂缓。

## P0：核心流量与询盘闭环

目标：先修正最影响搜索入口、页面意图和询盘转化的公开页面，不引入新业务模型。

### 首页 `/`
- 更新 metadata：
  - Title：`Wholesale Disposable Vapes & Clearance Stock | VapeStockHub`
  - Description：`Source wholesale disposable vapes, clearance stock, and bulk vape offers by brand, price range, market, and warehouse. Request live price and availability via Telegram or WhatsApp.`
- 更新 H1：`Wholesale Disposable Vapes & Clearance Stock`
- 更新 hero subtitle，保留 brand、price range、market、warehouse、MOQ、live availability 语义。
- CTA 使用：
  - `Browse Wholesale Stock`
  - `Request Bulk Quote`
- FAQ 加入 `cheap disposable vapes`、wholesale bulk、Shenzhen / China supply chain、live price、non-retail checkout 边界。
- 不把 `cheap vapes` 放进 H1。
- 不把 `Shenzhen / China supply chain` 放进首屏主副标题。

### Inventory 列表页 `/inventory`
- 更新 metadata：
  - Title：`Wholesale Disposable Vapes in Bulk | VapeStockHub`
  - Description：`Browse wholesale disposable vapes in bulk by brand, market, price range, MOQ, and warehouse location. Compare active stock offers and request live price and availability via Telegram or WhatsApp.`
- 更新 H1：`Wholesale Disposable Vapes in Bulk`
- 顶部简介加入 active offers、wholesale / bulk buyers、brand、market、warehouse、price visibility、MOQ。
- 搜索和筛选文案从 generic inventory 调整为 wholesale stock / active listings。
- 强化 warehouse 显示和筛选，但不开发 `/warehouse/[slug]`。
- FAQ 增加 cheap disposable vapes 到 `/price/under-3` 的内链入口。
- Query 参数页继续 noindex，clean `/inventory` 承担主 SEO。

### Price 页面 `/price` 与 `/price/[slug]`
- `/price`：
  - H1：`Browse Disposable Vape Wholesale Prices`
  - Title：`Disposable Vape Wholesale Prices by Range | VapeStockHub`
  - Description：`Browse disposable vape wholesale prices by range, from clearance and budget stock to higher-ticket bulk offers. Compare MOQ, warehouse, and availability before requesting a live quote.`
- `/price/under-3`：
  - H1：`Cheap Disposable Vapes for Wholesale Clearance`
  - Title：`Cheap Disposable Vapes for Wholesale Clearance | VapeStockHub`
  - Description：`Review low-cost disposable vape stock, clearance-ready offers, and budget wholesale listings. Compare MOQ, unit price, warehouse, and live availability before sending an inquiry.`
  - Badge 从 `HOT DEALS` 调整为 `Clearance Focus` 或 `Budget Stock`。
- `/price/3-to-5`：
  - H1：`Wholesale Disposable Vapes from $3 to $5`
  - Title：`Wholesale Disposable Vapes from $3 to $5 | VapeStockHub`
- `/price/5-to-8`、`/price/over-8` 暂以筛选体验为主，不重押 SEO。
- 暂不新建 `/clearance` 或 `price list` 页面。

### Inventory 详情页 `/inventory/[slug]`
- 按 `product_type` 输出 metadata title：
  - `Disposable Vape`：`{title} Wholesale Disposable Vape Stock | VapeStockHub`
  - `Pod Kit`：`{title} Wholesale Pod Kit Stock | VapeStockHub`
  - `Vape Kit`：`{title} Wholesale Vape Kit Stock | VapeStockHub`
  - `E-liquid`：`{title} Wholesale E-liquid Stock | VapeStockHub`
  - `Accessory`：`{title} Wholesale Vape Accessory Stock | VapeStockHub`
  - Other：`{title} Wholesale Vape Stock | VapeStockHub`
- 描述模板加入 product type、quantity、MOQ、warehouse、market、live price / availability。
- Eyebrow 使用 `Wholesale Stock Offer`。
- CTA 使用 `Request Wholesale Price`、`Request Live Quote` 或价格可见时的 `Request Availability`。
- CTA 询盘上下文带上 title、MOQ、quantity、warehouse availability。
- FAQ 更新为 MOQ、warehouse、live price、wholesale/bulk、availability。
- 不重构 `/inventory/[slug]` route 结构。

### P0 验证
- 检查 public pages 英文一致性。
- 运行 lint / build。
- 检查 metadata、canonical / noindex、CTA 链接、Telegram / WhatsApp 参数。
- 抽查桌面和移动端关键页面，避免文本溢出和 CTA 断层。

## P1：扩展承接与结构增强

目标：在 P0 稳定后，增强品牌、市场、Blog、结构化数据和 AI 入库质量。

### Brand 页面 `/brand` 与 `/brand/[slug]`
- `/brand`：
  - H1：`Wholesale Vape Brands with Active Stock`
  - Title：`Wholesale Vape Brands with Active Stock | VapeStockHub`
- `/brand/[slug]`：
  - H1：`{Brand} Wholesale Vape Stock`
  - Title：`{Brand} Wholesale Vape Stock | VapeStockHub`
  - Description：`Browse active {Brand} wholesale vape stock, including bulk offers, MOQ, warehouse location, price visibility, and inquiry-ready listings for B2B buyers.`
- FAQ 加入 bulk、wholesale price、MOQ / warehouse、clearance、related / alternative inquiry。
- 保持 `>= 3` active listings 才 index。
- `alternative` 不进品牌页主叙事。

### Market 页面 `/market` 与 `/market/[slug]`
- `/market/[slug]`：
  - H1：`Wholesale Vape Stock for {Market} Buyers`
  - Title：`Wholesale Vape Stock for {Market} Buyers | VapeStockHub`
  - Description：`Browse active wholesale vape stock prioritized for {Market} buyers, including bulk offers, MOQ, warehouse location, price visibility, and inquiry-ready listings. Confirm live availability before sourcing.`
- 文案强调 target-market fit，不承诺合规、进口、清关、物流或本地仓。
- 保持 `>= 3` active listings 才 index。
- 国家级 USA / UK 页面暂不开发，继续观察。

### Blog / Guide
- 新增最小静态 Blog：
  - `/blog`
  - `/blog/[slug]`
- 内容可先使用轻量静态 TS 数据源；后续文章量增加后，再迁移到 Markdown / MDX。
- 不接 CMS，不做后台 blog 管理。
- 首篇试点先做采购评估型 Guide：`Geek Bar Alternatives for Wholesale Buyers`。
- 不在库存槽位确认前发布固定 Top List。
- 未绑定真实库存推荐槽位前，首篇使用 `noindex, follow`，并不进入 sitemap。
- 如果当前没有任何 `indexable` Blog 文章，`/blog` 索引页也使用 `noindex, follow`。
- 真实 `related_inventory_slugs` 和推荐槽位确认后，再切换为 indexable 正式文章。
- 文章通过真实库存、相关 inventory slugs 和 CTA 导向库存或私域询盘；若暂时没有绑定库存，只做评估框架和询盘导流。
- 禁止 replica / copy / fake / counterfeit / official replacement 语义。

### 结构化数据与 AI 入库
- 为详情页增加 Product / Offer JSON-LD。
- 后续真实 LLM API 接入采用可配置 provider adapter，优先兼容 DeepSeek API。
- API key 只允许存在服务端环境变量，不能进入浏览器 bundle。
- 公开页面 title / description 使用已审核数据或 AI Draft Package 审核结果，不做请求时实时生成。
- AI Draft Package 输出：
  - `model_name`
  - `seo_title_suggestion`
  - `seo_description_suggestion`
  - `product_features`
- 后台和数据标准继续强化 `brand + model + puff + product_type` 标题规范。
- 可先在 AI Draft Package 中保留 model_name，不立即数据库迁移。

### Warehouse 字段增强
- 继续保留 `warehouse_location`。
- 可增加派生 helper 或后续字段设计：
  - `warehouse_region`：`China / US / UK / EU / UAE / Other`
- 当前只用于筛选、卡片、详情和 CTA，不开发 warehouse 页面。

## P2：后续机会与暂缓事项

目标：等真实库存、Search Console、询盘数据足够后，再开启更大范围扩展。

### Warehouse 页面后续开启
- 只有满足以下条件才考虑 `/warehouse/[slug]`：
  - 某仓库区域有 `>= 5` 条 active listings。
  - 已有 `warehouse_region` 或等价归一化能力。
  - 有真实询盘、Search Console 曝光或明确运营价值。
  - 页面能展示品牌、型号、MOQ、价格可见性、库存数量和仓库信息。
- 可开启：
  - `/warehouse/us`
  - `/warehouse/eu`
  - `/warehouse/uk`
  - `/warehouse/china`
  - `/warehouse/uae`

### Trust Pages 轻量优化
- `/about` 增强 source-side inventory access、Shenzhen / China supply chain context、wholesale clearance opportunities。
- `/contact` 强化询盘信息要求：product link、brand / model、target market、warehouse preference、MOQ / quantity、price visibility。
- `/compliance` 保持合规、进口、清关、税务和商业尽调边界。
- `/terms`、`/privacy` 保持 footer / Trust Center 信任页。

### 暂缓扩展
- 暂不新增独立 `/clearance` 页面。
- 暂不新增 `vape wholesale price list` 页面。
- 暂不做国家级 USA / UK SEO 页面。
- 暂不做复杂用户系统、vendor onboarding、购物车、支付、结账。
- 暂不做大规模 AI 内容矩阵。
- 暂不做 brand x market x price 无限组合页。
- 暂不新增 `model_name` 数据库字段，除非详情页表现和入库质量证明必要。

## 建议实施顺序
1. P0 metadata / H1 / FAQ / CTA 文案模板。
2. P0 warehouse 显示、筛选和 CTA 上下文增强。
3. P0 build / lint / mobile-desktop 抽查。
4. P1 Brand / Market 页面文案与 noindex 阈值确认。
5. P1 Product / Offer JSON-LD。
6. P1 AI Draft Package 输出增强。
7. P1 最小 Blog 路由与首篇 Alternative 文章试点。
8. P2 根据 Search Console 和询盘数据决定是否开启 warehouse、country、clearance 或 price list 页面。
