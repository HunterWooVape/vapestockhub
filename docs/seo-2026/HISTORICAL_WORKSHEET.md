# Historical Worksheet

更新时间：2026-05-30

## 用途
本文件保留 SEO 重定位讨论中的探索过程、旧候选词和待验证方向。它不是最新执行依据。

最新实施依据：
- [`SEO_EXECUTION_CHECKLIST.md`](SEO_EXECUTION_CHECKLIST.md)
- [`SEO_CORE_DECISIONS.md`](SEO_CORE_DECISIONS.md)
- [`pages/`](pages)

## 历史工作表保留原则
- 这里的 `待拍板 / 待验证` 是历史探索状态。
- 如果本文件与页面规格冲突，以页面规格和执行清单为准。
- 本文件用于理解“为什么没有选择某些词或页面”，不是用于直接改代码。

## 早期候选方向
### 首页
曾讨论过：
- `Global Wholesale Vape Inventory`
- `wholesale vape inventory`
- `bulk disposable vape stock`
- `cheap vapes`
- `China disposable vape wholesale`
- `Shenzhen vape supplier`

最终结论：
- 首页主方向为 `Wholesale Disposable Vapes & Clearance Stock`。
- `cheap vapes` 可用但不进 H1。
- `Shenzhen / China supply chain` 进入 FAQ / About / 信任说明，不进入首屏主副标题。

### Inventory
曾讨论过：
- `Active Wholesale Disposable Vape Inventory`
- `wholesale disposable vape listings`
- `wholesale vape stock`
- `disposable vape inventory`
- `vape stock`

最终结论：
- `/inventory` 主打 `Wholesale Disposable Vapes in Bulk`。
- `stock / inventory` 保留为 B2B 信任语义。
- `vape stock` 因 SERP 股票/金融意图，不作为主攻词。

### Detail
曾讨论过：
- `[Brand] [Model] Wholesale Disposable Vape Stock`
- `[Brand] [Model] Disposable Vape Wholesale Price`
- `[Puff Count] Puffs Disposable Vape Wholesale`
- `[Brand] Alternative Disposable Vape Wholesale`
- `[Brand] [Model] Bulk Disposable Vape Supply`

最终结论：
- 详情页按 `product_type` 动态生成 SEO title。
- 非 Disposable 产品不能强行写成 Disposable。
- Alternative 进入 Blog / Guide，不进入详情页默认模板。

### Price
曾讨论过：
- `vape wholesale price list`
- `wholesale vape prices`
- `disposable vape wholesale price`
- `wholesale disposable vape price`
- 独立 `/clearance` 页面

最终结论：
- `/price` 是价格带导航页。
- `/price/under-3` 承接 `cheap disposable vapes` 与 `clearance disposable vapes`。
- 暂不新增独立 `/clearance` 或 `price list` 页面。

### Brand
曾讨论过：
- `wholesale vape brands`
- `disposable vape brands wholesale`
- `vape brands bulk stock`
- `[Brand] alternative wholesale`

最终结论：
- `/brand` 做品牌分发。
- `/brand/[slug]` 做品牌库存聚合，不做品牌百科。
- Alternative 进入 Blog / Guide。
- 品牌页保持 `>= 3` active listings 才 index。

### Market
曾讨论过：
- `vape wholesale by market`
- `disposable vape suppliers by region`
- `wholesale vape stock for export`
- `vape wholesale suppliers for [Market]`
- `vape export stock to [Market]`
- 国家级 USA / UK 页面

最终结论：
- `/market/[slug]` 是目标市场库存聚合页。
- 不承诺合规、进口、清关、物流或本地仓。
- 国家级 USA / UK 页面暂不开发。

### Warehouse
曾讨论过是否开发：
- `/warehouse/us`
- `/warehouse/eu`
- `/warehouse/uk`
- `/warehouse/china`
- `/warehouse/uae`

最终结论：
- 当前不开发 warehouse 页面。
- 先强化 warehouse 字段、筛选、卡片、详情页和 CTA。
- 满足 `>= 5` active listings、字段归一化和数据价值后再开启。

## 关键词类型分工
- 热门核心词：由首页、`/inventory` 和高质量详情页承接。
- 快速相关词：由 `/price/[slug]`、详情页、品牌页和 Blog 承接。
- B2B 信任词：MOQ、warehouse、availability、ready stock、bulk inquiry、wholesale quote、stock manifest、factory-side stock、Shenzhen supply chain。

## 明确不做
- 大规模 AI 文章矩阵。
- 无限组合页，例如 `brand x market x price` 全量扩张。
- 购物车、下单、支付、用户注册。
- vendor onboarding。
- 仿牌、replica、copy、fake、counterfeit 关键词。
- 把首页改成 `cheap vapes online` 零售站定位。
