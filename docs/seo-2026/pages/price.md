# Price Pages SEO Spec

Routes：
- `/price`
- `/price/[slug]`

## Page Group Role
- `/price`：价格带导航页，不作为 cheap 主攻页。
- `/price/under-3`：低价、清仓、cheap disposable vapes 的主要承接页。
- `/price/3-to-5`：普通主流批发价格带，作为辅助筛选页。
- `/price/5-to-8` 和 `/price/over-8`：暂不重押 SEO，只作为筛选页。

## Keyword Decisions
| Keyword | Data | Decision |
| --- | --- | --- |
| `cheap disposable vapes` | US 2400 / KD 31 | `/price/under-3` 主攻候选。 |
| `cheap disposable vapes under $10` | US 720 / KD 5 | 可作为 under-3 FAQ / 辅助词，但避免零售误导。 |
| `clearance disposable vapes` | US 140 / KD 0 | `/price/under-3` 主攻辅助词。 |
| `vape clearance` | US 90 / KD 15 | 清仓辅助词。 |
| `disposable vape deals` | US 390 / KD 19 | 可辅助，但避免过度促销化。 |
| `vape wholesale price list` | US 40 / KD 43 | 暂不单独建 price list 页面。 |

## `/price`
- H1：`Browse Disposable Vape Wholesale Prices`
- Title：`Disposable Vape Wholesale Prices by Range | VapeStockHub`
- Description：`Browse disposable vape wholesale prices by range, from clearance and budget stock to higher-ticket bulk offers. Compare MOQ, warehouse, and availability before requesting a live quote.`
- 页面重点：
  - price range
  - wholesale price
  - clearance stock
  - bulk offer
  - live quote
  - MOQ

## `/price/under-3`
- H1：`Cheap Disposable Vapes for Wholesale Clearance`
- Title：`Cheap Disposable Vapes for Wholesale Clearance | VapeStockHub`
- Description：`Review low-cost disposable vape stock, clearance-ready offers, and budget wholesale listings. Compare MOQ, unit price, warehouse, and live availability before sending an inquiry.`
- Top intro：`Use this price band to screen low-cost disposable vape offers for wholesale and clearance sourcing. Listings may move quickly, so confirm live price, MOQ, remaining quantity, and warehouse location before committing.`
- Badge：`Clearance Focus` 或 `Budget Stock`

### FAQ
- `Where can I find cheap disposable vapes in bulk?`
- `Are these clearance disposable vapes ready to ship?`
- `Why do prices change after inquiry?`
- `Can I mix brands or flavors in a budget order?`
- `Is this a retail checkout page?`

## `/price/3-to-5`
- H1：`Wholesale Disposable Vapes from $3 to $5`
- Title：`Wholesale Disposable Vapes from $3 to $5 | VapeStockHub`
- 文案重点：balanced margin、stable bulk sourcing、MOQ、brand / model fit。

## Boundaries
- 暂不新建 `/clearance` 页面。
- 暂不新建 `price list` 页面。
- 库存不足时继续 noindex，避免薄页。
