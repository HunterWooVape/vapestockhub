# SEO Core Decisions

更新时间：2026-05-30

## 项目定位
- VapeStockHub 是 B2B global vape inventory marketplace。
- 当前阶段是 `MVP core complete, MVP closure + early optimization`。
- 北极星指标是 `有效询盘数`，不是在线 GMV。
- 网站是信息展示 + 询盘引流平台，不是零售 checkout store。

## 主线判断
- `inventory / stock` 保留为 B2B 信任语义，但不是主要获客词。
- `wholesale`、`bulk`、`clearance`、`price`、`disposable vape` 是当前更适合获客的方向。
- `cheap vapes` 可以用，但要绑定 `disposable / wholesale / bulk / clearance / price band`，避免零售低价店心智。
- `cheap disposable vapes` 优先由 `/price/under-3` 承接。
- `vape stock` 不作为 SEO 主攻词；域名 `VapeStockHub` 不需要修改。
- `Shenzhen / China supply chain / supplier` 是信任语义，不进入首页首屏主 SEO。
- `supplier` 语义谨慎使用，不能让用户误解平台是单一卖方、支付方或交易担保方。
- `geek bar alternative` 等替代词进入 Blog / Guide，不直接混进品牌聚合页主叙事。

## 页面主方向
| Page | 主方向 | 说明 |
| --- | --- | --- |
| `/` | `Wholesale Disposable Vapes & Clearance Stock` | 首页短期聚焦 disposable + clearance，同时保留 B2B 批发平台定位。 |
| `/inventory` | `Wholesale Disposable Vapes in Bulk` | 列表页承接库存浏览和批发采购意图。 |
| `/price/under-3` | `Cheap Disposable Vapes` + `Clearance Disposable Vapes` | cheap / clearance 词最适合的承接页。 |
| `/inventory/[slug]` | `[Brand] [Model] Wholesale {Product Type} Stock` | 详情页承接品牌、型号、规格、MOQ、仓库和价格询盘长尾。 |
| `/brand/[slug]` | `{Brand} Wholesale Vape Stock` | 品牌库存聚合页，不做品牌百科。 |
| `/market/[slug]` | `Wholesale Vape Stock for {Market} Buyers` | 目标市场库存聚合页，不承诺当地合规或本地仓。 |
| `/blog/[slug]` | Alternative / guide long-tail | 承接 alternative、采购指南、品牌替代，并导向库存或私域询盘。 |
| `/warehouse/[slug]` | 后续机会 | 当前不开发，满足库存和数据门槛后再开启。 |

## 索引与页面扩张
- Query 参数页继续 `noindex`，clean route 承担 SEO。
- 品牌页和市场页保持 `>= 3` active listings 才 index。
- Warehouse 页面当前不开发；某仓库区域有 `>= 5` 条 active listings 且有数据价值后再考虑。
- 暂不做国家级 USA / UK SEO 页面。
- 暂不新增独立 `/clearance` 页面。
- 暂不新增 `vape wholesale price list` 页面。

## 合规与风险边界
- 不承诺当地合规。
- 不承诺进口、清关、税务、本地销售资格或固定交期。
- Listing 可见不等于商业路线合法。
- 买卖双方需要独立尽调。
- Contact、Compliance、Terms、Privacy 作为信任闭环，不抢主关键词。

## AI 与数据策略
- LLM 可以辅助字段拆分、标题建议、SEO 描述、产品特点和库存描述草稿。
- 后续真实 API 接入按 provider adapter 设计，优先兼容 DeepSeek API，不把流程绑定到单一模型厂商。
- LLM 调用只进入后台 AI Draft Package 流程，不在公开页面请求时实时生成 SEO。
- LLM 不自动发布。
- 发布层必须尊重 `product_type`，不能把所有产品强行写成 Disposable Vape。
- `model_name` 先进入 AI Draft Package 输出，暂不立即新增数据库字段。
