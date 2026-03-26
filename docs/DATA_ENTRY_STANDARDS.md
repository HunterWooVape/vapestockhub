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

## 11. 上线前提醒
- 当前阶段允许使用模拟数据验证页面和流程。
- 正式部署前，必须替换为真实库存数据。
- 正式部署前，需复核以下字段：
  - brand
  - market
  - price
  - warehouse_location
  - images
  - contact_visibility
