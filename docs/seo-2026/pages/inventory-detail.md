# Inventory Detail Page SEO Spec

Route：`/inventory/[slug]`

## Role
- 全站最重要的长尾 SEO 和转化页。
- 承接品牌、型号、产品类型、规格、MOQ、warehouse、price inquiry 等具体采购词。
- 把访问者推进到 Telegram / WhatsApp 询盘。

## Confirmed Principles
- 页面 route 结构不重构。
- H1 继续使用人工确认后的 `{item.title}`。
- metadata title 必须根据 `product_type` 动态生成。
- `Disposable Vape` 是当前 SEO 主战场，但详情页必须支持 `Pod Kit`、`Vape Kit`、`E-liquid`、`Accessory` 等非 disposable 库存。
- LLM 可以生成标题、SEO 标题、SEO 描述、产品特点和库存描述草稿，但不自动发布。
- `model_name` 先进入 AI Draft Package 输出，暂不立即新增数据库字段。

## Metadata Title Template
- `Disposable Vape`：`{title} Wholesale Disposable Vape Stock | VapeStockHub`
- `Pod Kit`：`{title} Wholesale Pod Kit Stock | VapeStockHub`
- `Vape Kit`：`{title} Wholesale Vape Kit Stock | VapeStockHub`
- `E-liquid`：`{title} Wholesale E-liquid Stock | VapeStockHub`
- `Accessory`：`{title} Wholesale Vape Accessory Stock | VapeStockHub`
- `Other`：`{title} Wholesale Vape Stock | VapeStockHub`

## Metadata Description Direction
通用结构：

`Active wholesale {product_type} stock offer with {quantity} pcs available, MOQ {moq}, warehouse in {warehouse_location}, and market fit for {market}. Request live price and availability before committing.`

Rules：
- 若 `pricing_mode = inquiry_only`，补充：`Pricing is available on request.`
- 若 `is_urgent_clearance = true`，补充：`Clearance stock may move quickly; confirm remaining quantity before ordering.`

## Page Copy / CTA
- Eyebrow：`Wholesale Stock Offer`
- CTA：
  - `Request Wholesale Price`
  - `Request Live Quote`
  - 价格公开时可用 `Request Availability`
- 首段摘要包含：
  - product_type
  - quantity
  - MOQ
  - warehouse_location
  - market / featured_markets
  - pricing visibility
- CTA 询盘上下文建议：
  - `I'm interested in {title}. Please confirm live price, MOQ, quantity, and warehouse availability for {warehouse_location}.`

## FAQ Direction
- `Can I buy {brand} {product_type} stock in bulk from this listing?`
- `How do I confirm the wholesale price for {title}?`
- `What MOQ and warehouse details should I check?`
- `Is this listing ready for immediate inquiry?`
- `Can I request mixed flavors or related stock?`

## Implementation Priority
- P0：metadata title / description 模板。
- P0：eyebrow、CTA 文案和 FAQ。
- P1：Product / Offer JSON-LD。
- P1：AI Draft Package 输出 `model_name`、`seo_title_suggestion`、`seo_description_suggestion`、`product_features`。
- P2：观察详情页表现后，再评估是否在数据库中新增 `model_name` 字段。
