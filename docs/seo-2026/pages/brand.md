# Brand Pages SEO Spec

Routes：
- `/brand`
- `/brand/[slug]`

## Role
- `/brand`：品牌导航页，负责分发，不是主 SEO 页。
- `/brand/[slug]`：品牌库存聚合页，承接“某品牌当前有真实 active stock 可询盘”的 B2B 批发意图。

## Keyword Decisions
| Keyword | Data | Decision |
| --- | --- | --- |
| `geek bar wholesale` | US 1900 / KD 27 | 首批重点品牌机会。 |
| `geek bar bulk` | US 480 / KD 21 | Geek Bar 品牌页/详情页辅助词。 |
| `geek bar wholesale price` | US 320 / KD 4 | 适合详情页、品牌页 FAQ、询价 CTA。 |
| `lost mary wholesale` | US 140 / KD 13 | 次级重点品牌。 |
| `raz vape wholesale` | US 110 / KD 8 | 次级重点品牌。 |
| `elf bar wholesale` | US 90 / KD 15 | 次级重点品牌。 |
| `geek bar alternative` | US 590 / KD 5 | 不进品牌页主叙事，进入 Blog / Guide + CTA。 |

## `/brand`
- H1：`Wholesale Vape Brands with Active Stock`
- Title：`Wholesale Vape Brands with Active Stock | VapeStockHub`
- 任务：品牌分发，不抢具体品牌词。

## `/brand/[slug]`
- 主方向：`{Brand} Wholesale Vape Stock`
- H1：`{Brand} Wholesale Vape Stock`
- Title：`{Brand} Wholesale Vape Stock | VapeStockHub`
- Description：`Browse active {Brand} wholesale vape stock, including bulk offers, MOQ, warehouse location, price visibility, and inquiry-ready listings for B2B buyers.`

## Copy Direction
- 不写成品牌百科。
- 不写成品牌官网介绍。
- 不主攻 alternative。
- 只回答：
  - 这个品牌现在有没有库存？
  - 有哪些型号 / 价格 / MOQ / 仓库 / 市场？
  - 怎么快速询价？

## FAQ Direction
- `Can I buy {Brand} vapes in bulk from this page?`
- `How do I request {Brand} wholesale price?`
- `What MOQ and warehouse details should I check for {Brand} stock?`
- `Are there {Brand} clearance or budget stock offers?`
- `Can I ask for related or alternative stock if this brand is unavailable?`

## Index Strategy
- 保持品牌页 noindex 阈值，默认 `>= 3` active listings 才 index。
- `Geek Bar`、`Lost Mary`、`Raz`、`Elf Bar` 可进入重点品牌观察名单，但库存不足时仍不强行 index。
- `Vozol`、`Oxbar`、`Maskking`、`IVG` 等根据真实库存和 Semrush 数据逐个验证。
