# VapeStockHub 数据录入口径标准

## 1. 目标
- 统一 `brand`、`market`、`price`、`warehouse_location` 等字段写法。
- 降低聚合页错配、筛选失效、SEO 页面内容分裂的风险。
- 让不同录入员都能按同一口径维护数据。

## 2. 总原则
- 所有前台展示字段统一使用英文。
- 同一字段尽量只保留一种主写法，不要出现多种拼写混用。
- 不确定时先参考既有数据，再新增。
- 若需要扩展新口径，先在团队内部确认后再批量使用。

## 3. brand 写法
- 使用标准品牌名首字母大写写法。
- 推荐示例：
  - Vozol
  - Elf Bar
  - Geek Bar
  - Lost Mary
  - Maskking
  - Oxbar
- 不推荐示例：
  - ELFBAR
  - elfbar
  - Geekbar
  - Vozol Vape
- 原则：
  - `brand` 只写品牌，不写型号。
  - 型号写入 `title`。

## 4. market 写法
- 使用市场区域口径，不直接使用零散国家名作为主 market。
- 推荐主写法：
  - Middle East
  - Latin America
  - Eastern Europe
  - North America
- 如果确需补充更细市场，可在 `description` 中补国家，不要轻易拆分主字段。
- 示例：
  - 正确：Middle East
  - 正确：Latin America
  - 不推荐：MENA、Middle-East、LATAM、South America 混用

## 5. price 写法
- `price` 必须是纯数字，统一使用 USD 单价。
- 示例：
  - 正确：3.2
  - 正确：4.50
  - 不正确：USD 3.2
  - 不正确：3.2/pc
  - 不正确：约 3 美元
- 单位、币种、补充说明放前台展示逻辑中，不写入数值字段。

## 6. warehouse_location 写法
- 使用“城市, 国家/地区”的文本格式。
- 推荐示例：
  - Dubai, UAE
  - Panama City, Panama
  - Belgrade, Serbia
  - Los Angeles, USA
- 不推荐示例：
  - Dubai Warehouse
  - UAE Dubai
  - Dubai/UAE

## 7. title 写法
- 结构建议：品牌 + 型号 + 核心规格 + 产品类型
- 示例：
  - Vozol Star 10000 Disposable Vape
  - Elf Bar BC5000 Rechargeable
  - Geek Bar Pulse 15000
- 不要在标题中堆叠过多营销词。

## 8. product_type 写法
- MVP 阶段建议固定以下值：
  - Disposable
  - Pod System
  - Kit
  - E-liquid
  - Accessory
- 不要同义词混用，如 Disposable / Disposable Vape / Disposable Device。

## 9. contact_visibility 写法
- 仅允许两种值：
  - public
  - contact_required
- 默认使用 `contact_required`。

## 10. 图片与描述
- `images` 至少 1 张可用图片。
- 若暂无真实图，可临时使用统一占位图。
- `description` 保持英文短段落，说明库存特征、市场适配或交易信息，不写夸张营销文案。

## 11. title 与 slug 进阶要求
- `title` 不只是展示字段，也会直接影响详情页 H1、SEO metadata 与询盘质量。
- 推荐结构：
  - 品牌 + 型号 + 关键规格 + 产品类型
- 推荐示例：
  - Vozol Star 10000 Disposable Vape
  - Geek Bar Pulse 15000 Disposable
  - Elf Bar BC5000 Rechargeable Disposable
- 不推荐示例：
  - Best Selling Vozol Vape Hot Deal
  - Original Stock Available Now
  - Cheap Disposable Vape for Sale
- `slug` 必须稳定、可读、全小写，并与 `title` 主语义一致。
- `slug` 不应包含：
  - 时间戳
  - 中文
  - 空格
  - 多余营销词

## 12. description / manifest 进阶要求
- `description` 不应只写一句泛描述，正式上线前建议至少覆盖以下信息中的 3-5 项：
  - stock / inventory context
  - available quantity or flavor split
  - MOQ
  - target market or suitable region
  - warehouse or dispatch readiness
  - transaction notes or inquiry hint
- 推荐写法：
  - 保留原始库存清单的可读性
  - 使用英文短段落或英文 manifest
  - 强调事实信息，不强调夸张营销
- 不推荐写法：
  - 只有一句空泛介绍
  - 大量形容词堆叠
  - 写成面向零售消费者的广告文案

## 13. 正式上线前的发布门槛
- 正式上线前，以下字段不建议缺失：
  - title
  - slug
  - brand
  - product_type
  - price
  - quantity
  - moq
  - market
  - warehouse_location
  - description
  - images
- 正式上线前，以下情况不建议直接发布为高优先级页面：
  - 图片仍为占位图
  - description 过短
  - market 不在标准值范围内
  - brand 写法不统一
  - slug 结构不规范

## 14. AI 辅助入库工作流原则
- 推荐工作流：
  - 供应商原始资料
  - AI 提取字段
  - AI 标准化映射
  - AI 生成 admin 草稿
  - 人工最终复核
  - 发布上线
- AI 适合负责：
  - 去重
  - 字段提取
  - 品牌 / 市场 /单位标准化
  - title 草稿生成
  - description / manifest 清洗
  - 缺失字段提示
- 人工必须负责最终确认：
  - price
  - quantity
  - market
  - warehouse_location
  - 图片有效性
  - contact_visibility
  - 是否立即发布
- MVP 阶段不建议采用“AI 直接发布”模式。

## 15. 对 admin 后台的约束升级方向
- 当前 admin 可继续作为基础 CRUD 后台使用。
- 正式上线前建议逐步增加以下能力：
  - 标准值提示
  - 固定选项或推荐选项
  - 字段格式校验
  - 过短 description 提示
  - 占位图提示
  - slug 规范提示
- 推荐优先收敛为固定或半固定输入的字段：
  - brand
  - market
  - product_type
  - contact_visibility
- 目标不是让 admin 变复杂，而是让 admin 成为可稳定生产 SEO 资产的后台。

## 16. 上线前提醒
- 当前阶段允许使用模拟数据验证页面和流程。
- 正式部署前，必须替换为真实库存数据。
- 正式部署前，需复核以下字段：
  - brand
  - slug
  - title
  - market
  - price
  - quantity
  - moq
  - warehouse_location
  - description
  - images
  - contact_visibility

## 17. AI Draft Package 最小输出口径
- AI 不直接输出“可发布库存”，而是输出一份 `AI Draft Package`。
- 最小结构建议为：
  - `rawInput`
  - `normalizedFields`
  - `missingFields`
  - `riskFlags`
  - `humanReviewFocus`
- `rawInput` 至少保留：
  - `sourceType`
  - `supplierName`
  - `submittedAt`
  - `sourceLabel`
  - `rawText`
- `normalizedFields` 至少保留：
  - `title`
  - `slug`
  - `brand`
  - `product_type`
  - `price`
  - `quantity`
  - `moq`
  - `market`
  - `warehouse_location`
  - `nicotine`
  - `puff`
  - `e_liquid`
  - `contact_visibility`
  - `images`
  - `flavor_tags`
  - `flavor_breakdown`
  - `description_summary`
  - `manifest_notes`
- admin 回填时：
  - `description_summary` + `manifest_notes` 合并回填到 `description`
  - `flavor_tags` 回填到 `flavor`
  - 默认状态仍为 `draft`
- `missingFields`、`riskFlags`、`humanReviewFocus` 的目标，是减少人工通读成本，而不是替代人工终审。
