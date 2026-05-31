# Blog / Alternative SEO Spec

Routes：
- `/blog`
- `/blog/[slug]`

## Role
- Blog / Guide 属于 `MVP+ Optimization`。
- 用于承接 alternative、采购指南、清仓采购、品牌替代等内容型长尾。
- 通过 CTA 导向库存详情页、Inventory 或 Telegram / WhatsApp。
- Blog 不是泛内容站，不做内容农场。

## Keyword Decisions
| Keyword | Data | Decision |
| --- | --- | --- |
| `geek bar alternative` | US 590 / KD 5 | 首篇试点主关键词。 |
| `vapes similar to geek bar` | US 320 / KD 3 | 首篇辅助词。 |
| `geek bar alternatives` | US 110 / KD 3 | 首篇辅助词。 |
| `best geek bar alternative` | US 110 / KD 0 | 首篇辅助词。 |
| `geek bar alternative reddit` | US 70 / KD 27 | 可作为搜索意图参考，不主动模拟 Reddit 语气。 |
| `geek bar pulse x alternative` | US 40 / KD 0 | 可作为小节或 FAQ。 |

## Development Scope
- 最小静态 blog：
  - `/blog`
  - `/blog/[slug]`
- 内容来源可先使用轻量静态 TS 数据源。
- 后续文章量增加后，再迁移到 Markdown / MDX。
- 不接 CMS。
- 不做后台 blog 管理。
- 不引入复杂内容发布系统。

## Content Fields
- `title`
- `slug`
- `description`
- `date`
- `primary_keyword`
- `article_type`
- `related_inventory_slugs`
- `cta_label`
- `cta_target`

## Alternative Workflow
沿用 `docs/blog` 和 `scripts/plan-alternative-blog.ts`：
1. 确认目标关键词和文章标题。
2. 输入库存 URL 或 slug。
3. 从真实库存记录抓取字段。
4. 先做特征抽取。
5. 生成动态推荐槽位。
6. 人工确认槽位。
7. 再进入正式文章写作。

文章必须从真实库存出发，不先拍脑袋写固定 Top List。

## Allowed Language
- `alternative`
- `similar format`
- `similar puff range`
- `wholesale-friendly option`
- `budget alternative`
- `clearance-ready option`

## Forbidden Language
- `replica`
- `copy`
- `fake`
- `counterfeit`
- `same as Geek Bar`
- `official replacement`

不能暗示公模产品是官方品牌库存。

## First Pilot
- Public title：`Geek Bar Alternatives for Wholesale Buyers`
- Top-list title such as `Best Geek Bar Alternatives for Wholesale Buyers` should wait until inventory slots are confirmed.
- 当前未绑定真实库存推荐槽位前，首篇只作为 route / layout / CTA 框架，不进入 sitemap，metadata 使用 `noindex, follow`。
- 如果当前没有任何 `indexable` Blog 文章，`/blog` 索引页也使用 `noindex, follow`。
- 当真实 `related_inventory_slugs` 和推荐槽位确认后，再切换为 indexable 正式文章。
- Primary keyword：`geek bar alternative`
- Secondary keywords：
  - `geek bar alternatives`
  - `vapes similar to geek bar`
  - `best geek bar alternative`
  - `geek bar pulse x alternative`
- CTA：
  - `View current wholesale stock`
  - `Request similar stock via Telegram`
  - `Ask for Geek Bar alternative inventory`
