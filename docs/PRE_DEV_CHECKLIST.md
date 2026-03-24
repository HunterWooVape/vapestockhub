# VapeStockHub 开发前必要准备清单（可直接填空）

## 1. 本次开发范围（仅MVP）
- 本周目标：
- 不做范围：
- 验收标准：

## 2. 首批库存准备（60条）
- 总条数确认：60
- 字段完整率目标（建议≥95%）：95%
- 必填字段确认：
  - title：允许“口数或核心卖点”作为规格表达，统一英文短标题
  - brand：必填
  - product_type：必填
  - price：必填
  - quantity：必填
  - market：必填
  - warehouse_location：必填
  - description：必填
  - images：至少1张可用图片链接
  - contact_visibility：默认 contact_required
- 数据来源人：线下供应商（由管理员统一收集）
- 数据清洗负责人：管理员（AI辅助清洗，人工最终确认）

### 2.1 AI清洗执行规则（MVP）
- AI负责：去重、字段映射、标题标准化、单位统一、缺失项提示。
- 人工负责：price、quantity、market、warehouse_location 四项最终校验。
- 发布门槛：关键字段缺失不发布；图片无效不发布；价格异常需人工复核。

## 3. 路由与页面规则
- 详情页路由规则：/inventory/{slug}
- 市场页路由规则：/market/{region}
- 品牌页路由规则：/brand/{brand}
- 价格带页路由规则：/price/{band}
- slug命名规范：
- 首发页面策略确认：市场页/品牌页/价格带页同步发布

## 4. 联系与转化规则
- 主联系入口优先级（Telegram/WhatsApp/Email）：Telegram
- 次联系入口：WhatsApp
- “公开价格 / 联系可见”默认值：contact_required（联系可见）
- 线索字段最小集：
  - source_page_type：inventory/market/brand/price
  - source_page_slug：页面slug
  - source_channel：seo/telegram/whatsapp/email/direct
  - lead_status：new/qualified/invalid/won/lost

## 5. SEO最小规则
- 默认index页面：inventory、market、brand
- 默认noindex页面：低库存 price 页面、低库存组合页面
- 低库存阈值（触发noindex）：库存条数 < 3
- canonical规则负责人：管理员（单人负责）

## 6. 手动SLA执行
- 高频库存复核：48小时
- 普通库存复核：72小时
- 超96小时动作：降权/待确认
- 每日复核时段（2个）：10:00、18:00
- 复核负责人：管理员

## 7. 环境与发布准备
- Supabase项目已创建（是/否）：
- 基础表结构已确认（是/否）：
- 部署环境已准备（是/否）：
- 预览域名：

## 8. 本周拍板项（待填写）
- [x] 必填字段最终清单
- [x] 主联系入口优先级
- [x] 低库存noindex阈值
- [x] 每日复核时段与负责人
