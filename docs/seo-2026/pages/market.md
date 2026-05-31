# Market Pages SEO Spec

Routes：
- `/market`
- `/market/[slug]`

## Role
- `/market`：目标市场导航页，负责分发，不是主 SEO 页。
- `/market/[slug]`：目标市场库存聚合页，说明哪些 active stock 适合某类市场买家关注。

## Keyword Decisions
区域组合词整体较弱：
- `wholesale disposable vapes middle east`：无有效数据
- `vape wholesale middle east`：无有效数据
- `vape wholesale latin america`：无有效数据
- `vape wholesale eastern europe`：无有效数据
- `vape wholesale europe`：多国基本 0
- `vape wholesale dubai`：多国基本 0

国家词相对更有机会，但当前暂不开发国家级 SEO 页：
- `vape wholesale usa`：US 5400 / KD 68
- `wholesale vape usa`：US 720 / KD 62
- `vape wholesale uk`：UK 880 / KD 47
- `vape uk wholesale`：UK 390 / KD 52
- `wholesale disposable vapes uk`：UK 40 / KD 0

## `/market/[slug]`
- 主方向：`Wholesale Vape Stock for {Market} Buyers`
- H1：`Wholesale Vape Stock for {Market} Buyers`
- Title：`Wholesale Vape Stock for {Market} Buyers | VapeStockHub`
- Description：`Browse active wholesale vape stock prioritized for {Market} buyers, including bulk offers, MOQ, warehouse location, price visibility, and inquiry-ready listings. Confirm live availability before sourcing.`

## Intro Direction
`Review active vape stock prioritized for {Market} buyers. Listings may include local warehouse stock or globally available inventory suitable for this market route. Compare brand, MOQ, price visibility, warehouse location, and availability before sending an inquiry.`

## FAQ Direction
- `Can I source wholesale vape stock for {Market} through this page?`
- `Does this page only show local warehouse stock?`
- `What should I confirm before sourcing for {Market}?`
- `Can I request cheaper or clearance stock for {Market}?`
- `Do you guarantee compliance or import clearance for {Market}?`

## Boundaries
- 不写成国家 SEO 落地页。
- 不承诺当地合规。
- 不承诺进口、清关、物流或本地发货。
- 不把 market 页当 warehouse 页。
- 文案强调 `target-market fit`，不强调 `local availability guarantee`。

## Index Strategy
- 保持 `Market` 页 noindex 阈值，默认 `>= 3` active listings 才 index。
- 若只有 1-2 条库存，可以作为站内分发页，但不 index。
- 国家级页面暂不做，`USA / UK` 等记录为后续机会。
