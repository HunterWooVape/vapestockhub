# MVP SEO 文案实施留档 2026-05-18

## 0. 文档用途
- 记录本轮已落地的 MVP SEO 文案改造内容，作为后续复盘、继续扩展与对齐执行口径的依据。
- 本文是实施留档，不替代 `MVP_SEO_COPY_STRATEGY.md` 与 `MVP_SEO_DECISIONS.md`。

## 1. 本轮实施目标
- 收紧首页、库存总页、库存详情页、市场页、价格页、品牌详情页的 SEO 主语义。
- 让页面文案更贴近 B2B 批发库存与询盘场景，而非泛零售口吻。
- 优先承接已验证的核心交易词：
  - `vape wholesale`
  - `wholesale vape`
  - `wholesale disposable vapes`
  - `wholesale vape inventory`
  - `buy vapes in bulk`

## 2. 本轮实际改动文件
- `src/lib/seo.ts`
- `src/app/page.tsx`
- `src/app/inventory/page.tsx`
- `src/app/inventory/[slug]/page.tsx`
- `src/app/brand/page.tsx`
- `src/app/market/page.tsx`
- `src/app/market/[slug]/page.tsx`
- `src/app/price/page.tsx`
- `src/app/price/[slug]/page.tsx`
- `src/app/brand/[slug]/page.tsx`

## 3. 页面级实施记录

### 3.1 首页
- `metadata.description` 改为更强的批发库存语义。
- Hero 副文案改为 `wholesale vape inventory / bulk disposable vape stock / inquiry-ready listings` 方向。
- 新增一行 B2B 说明，强调 `live stock visibility / MOQ / fast inquiry`。
- Quick Links 三张卡片统一改为 Market / Brand / Price 三种采购路径文案。
- Featured / Latest 区块说明收紧为库存、MOQ、询盘语义。
- FAQ 改为 B2B 采购问答，不再沿用偏泛行业表述。

### 3.2 Inventory 总页
- `metadata.title` 改为 `Active Wholesale Disposable Vape Inventory | VapeStockHub`。
- `metadata.description` 改为面向 `brand / market / price band / MOQ / buying in bulk` 的表达。
- H1 改为 `Browse Active Wholesale Disposable Vape Inventory`。
- 页面顶部描述强化 `bulk inventory / MOQ / stock depth / direct inquiry`。
- Filters 区块新增说明文案。
- 统计区副文案改为 `bulk disposable vape stock / supplier inquiry` 语义。
- 空状态文案改为 `No wholesale vape inventory matches your current filters`。
- 新增 `Wholesale Inventory FAQ` 模块，补足 `MOQ / mixed-order / inventory update cadence`。

### 3.3 Price 索引页
- `metadata.title` 改为 `Wholesale Disposable Vape Inventory by Price Range | VapeStockHub`。
- `metadata.description` 改为面向 `budget-friendly / clearance-ready / margin-aligned inventory`。
- 页头摘要改为预算筛选语义。
- 四个价格带卡片全部重写为批发库存表达，不再偏泛促销描述。

### 3.4 Inventory 详情页
- metadata title 改为 `Wholesale Inventory Offer` 口径，不再维持偏泛产品详情表达。
- 保留结构化库存描述逻辑，但整体语义进一步向 `inventory offer / stock offer` 收紧。
- 页面顶部新增 `Inventory Offer` 标识，强化页型认知。
- `Inventory Specifications` 改为 `Stock Offer Specifications`。
- `Inventory Manifest & Details` 改为 `Stock Manifest & Offer Details`。
- 右侧库存信息模块的字段表达更贴近交易语义：
  - `Available Quantity` -> `Available Stock`
  - `Availability` -> `Target Market`
- 新增 `Inventory Offer FAQ` 模块，补足：
  - 这条 listing 是否可批量采购
  - 询盘前应该确认哪些交易字段
  - 当前价格是公开价还是询盘价
- `Related Inventory` 改为 `Related Stock Offers`。

### 3.5 Price 详情页
- `metadata.title` 改为 `Wholesale Disposable Vape Inventory {priceDesc} | VapeStockHub`。
- `metadata.description` 改为面向 `MOQ / stock depth / live availability inquiry`。
- H1 改为 `Wholesale Disposable Vape Inventory {priceDesc}`。
- 页头与统计区描述改为 `price-band inventory hub` 语义。
- 空状态改为 `No active wholesale stock is currently available in this price range`。

### 3.6 Market 目录页与详情页
- `market` 目录页 `metadata.title` 改为 `Wholesale Vape Inventory by Target Market | VapeStockHub`。
- `market` 目录页 `metadata.description` 改为围绕 `target market / buyer destination / sourcing route / inquiry priorities` 的表达。
- 目录页 H1 改为 `Browse Wholesale Inventory by Target Market`。
- 市场卡片摘要改为目标市场采购语义，不再偏泛分类介绍。
- `market/[slug]` 的 `metadata.description` 改为 `target-market aligned inventory / inquiry-ready bulk offers` 方向。
- `market/[slug]` 页头描述强化 `MOQ / stock depth / warehouse readiness / target market route`。
- `market/[slug]` 统计区说明改为 `target-market aligned stock` 语义。
- 新增 `{Market} Market FAQ` 模块，补足：
  - 是否可用于该目标市场采购
  - 询盘前应确认哪些交易字段
  - 页面是否只展示本地库存

### 3.7 Brand 详情页
- `metadata.description` 改为 `bulk stock offers / current availability / B2B buyers` 方向。
- H1 改为 `{Brand} Wholesale Vape Inventory`。
- 页头与列表上方说明改为品牌库存筛选语义。
- 新增 `{Brand} Wholesale FAQ` 模块，补足：
  - 批量采购可行性
  - MOQ
  - 如何请求实时价格与库存

### 3.8 Brand 目录页
- `metadata.title` 改为 `Wholesale Vape Inventory by Brand | VapeStockHub`。
- `metadata.description` 改为围绕 `brand-specific stock discovery / bulk sourcing / inquiry` 的表达。
- 目录页 H1 改为 `Browse Wholesale Inventory by Brand`。
- 目录页摘要改为品牌偏好到库存发现与询盘路径的语义。
- 品牌卡片描述补充 `buyers and bulk inquiry` 交易语义。

### 3.9 薄页 noindex 阈值统一
- 新增 `src/lib/seo.ts`，集中定义聚合页索引阈值常量，避免后续页型口径漂移。
- `Brand` 聚合页改为读取统一阈值常量，当前阈值为 `>= 3`。
- `Market` 聚合页改为读取统一阈值常量，当前阈值为 `>= 3`。
- `Price` 聚合页改为读取统一阈值常量，当前阈值提高为 `>= 4`，体现“Price 页比 Brand / Market 更保守”的既定原则。

## 4. 本轮没有做的事
- 未引入结构化数据扩展。
- 未增加博客、资讯页或额外 SEO 路由。

## 5. 实施边界说明
- 品牌页文案虽然已统一升级，但公开 SEO 价值仍然以真实 `active inventory` 为前提。
- 本轮不鼓励为无库存品牌单独造公开承接页。
- 本轮仍以现有 clean routes 为主，不提高 query 参数页 SEO 权重。

## 6. 下一步建议
- 下一轮优先统一复查首页、inventory、market、brand、price 五类页型的 metadata、FAQ 和 CTA 口径是否完全一致。
- 完成页型改造后，再统一复查 metadata、FAQ、内链锚文本与 noindex 阈值口径。
