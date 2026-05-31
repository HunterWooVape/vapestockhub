# Warehouse / Local Stock SEO Spec

Current route：none  
Future routes：
- `/warehouse/us`
- `/warehouse/eu`
- `/warehouse/uk`
- `/warehouse/china`
- `/warehouse/uae`

## Role
- Warehouse 是强转化维度，不是当前阶段的独立 SEO 主战场。
- 当前先进入 `/inventory`、`/inventory/[slug]`、FAQ、CTA 和数据字段。
- 暂不开发 `/warehouse/[slug]`，但保留为后续可开启页面组。

## Keyword Decisions
| Keyword | Data | Decision |
| --- | --- | --- |
| `vape warehouse` | US 880 / KD 58 | 有量但 SERP 混合，包含批发站、零售站、本地店和品牌名，不适合当前单独主攻。 |
| `eu warehouse vapes` | US 170 / KD 0 | 有低难度长尾机会，后续可观察。 |
| `eu warehouse disposable vape` | US 90 / KD 0 | 有低难度长尾机会，但当前体量不足以单独建页。 |
| `vape warehouse usa` | US 50 / KD 0 | 可作为后续观察词，不当前建页。 |
| `vape wholesale usa` | US 5400 / KD 68 | 国家 wholesale 词有量但竞争强，不等同于 warehouse 页意图。 |
| `vape wholesale uk` | UK 880 / KD 47 | 后续可和 UK market / warehouse 机会一起观察。 |

## Current Implementation
- `/inventory`：
  - 增强 warehouse 筛选。
  - 卡片显示 `Warehouse` 或 `Warehouse Location`。
  - 顶部简介保留 `brand, market, warehouse, MOQ, price visibility`。
  - FAQ 增加 warehouse / local stock 问答。
- `/inventory/[slug]`：
  - 明确展示 `warehouse_location`。
  - 描述里加入可用仓库信息。
  - CTA 自动带上仓库上下文。
- `/market/[slug]`：
  - 可以提到 listings may include local warehouse stock or globally available inventory。
  - 不能把 market 页写成 warehouse 页。

## CTA Context
`I'm interested in {title}. Please confirm live price, MOQ, quantity, and warehouse availability for {warehouse_location}.`

## Future Opening Conditions
只有满足以下条件才考虑 `/warehouse/[slug]`：
- 某个仓库区域有 `>= 5` 条 active listings。
- 仓库字段已经归一化，例如 `US`、`UK`、`EU`、`China`、`UAE`、`Other`。
- 该仓库区域已有真实询盘、Search Console 曝光或明确运营价值。
- 页面能展示品牌、型号、MOQ、价格可见性、库存数量和仓库信息，不是薄集合页。

## Future Page Template
- H1：`Wholesale Vape Stock in {Warehouse} Warehouse`
- Title：`Wholesale Vape Stock in {Warehouse} Warehouse | VapeStockHub`
- Description：`Browse active wholesale vape stock available from {Warehouse} warehouse listings, including brand, MOQ, price visibility, quantity, and inquiry-ready offers. Confirm live availability before sourcing.`

## Data Field Direction
- 当前保留：`warehouse_location`
- 后续可派生或新增：
  - `warehouse_region`：`China / US / UK / EU / UAE / Other`
  - `warehouse_location`：具体城市、国家或仓库说明，例如 `Shenzhen, China`、`California, US`、`Germany EU warehouse`
- `warehouse_region` 用于筛选和 clean route。
- `warehouse_location` 用于详情展示和询盘上下文。

## Boundaries
- 不承诺当地合规。
- 不承诺进口、清关或固定交期。
- 不写成物流服务页。
- 不因为低难度长尾词存在就立即新建薄页。
- 后续 warehouse 页面必须由真实库存和真实询盘反推开启。
