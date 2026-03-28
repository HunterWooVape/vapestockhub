# VapeStockHub MVP 阶段 SEO 与整站文案拍板记录

## 0. 文档用途
- 本文用于记录已经拍板确认的整站 SEO 与文案决策。
- 本文与 `MVP_SEO_COPY_STRATEGY.md` 的区别如下：
  - `MVP_SEO_COPY_STRATEGY.md` 负责策略原则与方法论。
  - 本文负责记录已经确认的最终方向，作为后续统一实施的依据。
- 后续所有页面文案、metadata、CTA、站内语义调整，均以本文最新记录为准。

---

## 1. 当前已拍板总原则
- 现阶段不做重型 SEO 扩张，先做正确的 SEO 基线。
- 当前优先目标不是“覆盖更多关键词”，而是“统一站点身份、页面职责和采购语境”。
- 整站主方向从“泛电子烟电商口吻”校正为“B2B 库存信息与询盘撮合平台”。
- 执行节奏采用：
  - 逐页拆解
  - 逐页拍板
  - 逐页记录
  - 最后统一实施

### 1.1 新增插入任务
- 在继续 Market / Brand / Price 页之前，先插入一个中间小项：
  - 真实数据录入标准 v2
  - AI 辅助入库工作流
  - admin 后台约束升级方向
- 原因：
  - 当前详情页、聚合页与 SEO 质量，未来会直接受真实数据质量影响
  - 若不先明确数据标准与入库流程，后续页面策略会与真实运营流程脱节
  - 当前允许模拟数据验证前端，但正式上线前必须切换为真实数据并经过统一口径清洗
- 决策方向：
  - AI 可以承担“提取、映射、标准化、文案优化、草稿生成”
  - 人工继续承担“价格、数量、market、warehouse_location、图片、发布确认”的最终校验
  - 正式上线前，admin 不再只是 CRUD 后台，而是 SEO 资产生产后台

---

## 2. 首页（Home）

### 2.1 页面角色
- 首页不是商城首页。
- 首页是整站定位页、信任页、分发页和首次询盘入口页。

### 2.2 页面主定位
- 正式定位为：Inventory Hub

### 2.3 页面主语义
- wholesale inventory
- active stock
- verified supply
- inquiry routing
- market / brand / price based discovery

### 2.4 明确不走的方向
- retail vape shop
- buy now
- cart / checkout mindset
- marketplace transaction platform
- 以“best price”或“cheap vape”作为首页主叙事

### 2.5 首页核心任务
- 让用户快速理解平台身份
- 让搜索引擎理解这是 B2B inventory 站点
- 把流量有效分发至 Inventory / Market / Brand / Price
- 引导用户进入浏览库存或发起询盘动作

### 2.6 Hero 已拍板方向
- 推荐 H1：
  - `Global Wholesale Vape Inventory`
- 推荐副标题方向：
  - 围绕 verified active stock、market / brand / price browse、Telegram / WhatsApp inquiry、unlock pricing and availability 展开
- 推荐主 CTA：
  - `Browse Inventory`
- 推荐次 CTA：
  - `Request via Telegram`

### 2.7 首页文案原则
- 说库存，不说商城
- 说可询盘，不说可直接购买
- 说活跃库存，不说空泛优势
- 说用户下一步动作，不说过大概念

### 2.8 后续执行注意事项
- 首页 Hero 文案必须与 Inventory 列表页主承接词保持一致
- Quick Links 文案必须分别对应 Market / Brand / Price 三种采购路径
- FAQ 需要逐步从泛行业问答，校正为 B2B 采购问答
- 避免使用过度绝对化承诺，如 “100% authentic” 这类高风险表述

### 2.9 当前状态
- 已拍板
- 待统一实施

---

## 3. Inventory 列表页（Inventory Index）

### 3.1 页面角色
- Inventory 列表页不是站内搜索结果页。
- Inventory 列表页是全站最宽泛的库存总入口页。
- 其核心职责是承接广义 inventory / stock / wholesale 搜索意图，并把用户导向详情页或进一步分流至 Brand / Market / Price 页。

### 3.2 页面主定位
- 正式定位为：主库存类目页
- 页面表达方向为：Browse Active Wholesale Vape Inventory

### 3.3 页面主语义
- active wholesale inventory
- verified listings
- all inventory
- browse by brand / market / price
- direct path to product detail and inquiry

### 3.4 明确不走的方向
- 不作为品牌词主承接页
- 不作为市场词主承接页
- 不作为价格词主承接页
- 不使用“Products Found”这类结果页表达作为页面主标题
- 不走 marketplace / best price / buy now 叙事

### 3.5 页面核心任务
- 承接最宽泛的库存检索意图
- 提供高效率筛选入口
- 让用户快速进入详情页
- 保持与首页、品牌页、市场页、价格页之间的语义边界清晰

### 3.6 已拍板标题与 metadata 方向
- 推荐 H1：
  - `Browse Active Wholesale Vape Inventory`
- 推荐 metadata title：
  - `Active Wholesale Vape Inventory | VapeStockHub`
- 推荐 metadata description 方向：
  - 围绕 verified listings、active stock、brand / market / price browsing、direct inquiry path 展开

### 3.7 页面文案原则
- 强调 browse / active / verified / listings
- 强调 inventory 入口属性，不承担平台定位叙事
- 数量信息作为辅助信息，不替代类目标题
- 页面顶部需要有简短类目摘要，说明库存范围、筛选维度和下一步动作

### 3.8 SEO 索引策略
- `/inventory` 作为主索引页
- `/inventory` 的 query 参数页主要服务 UX
- `/inventory?brand=...` 不作为品牌词主 SEO 页
- `/inventory?market=...` 不作为市场词主 SEO 页
- `/inventory?sort=...` 与 `/inventory?page=...` 不作为重点 SEO 资产
- 品牌、市场、价格意图继续由以下 clean routes 承接：
  - `/brand/[slug]`
  - `/market/[slug]`
  - `/price/[slug]`

### 3.9 后续执行注意事项
- 页面顶部结构应调整为“类目标题 + 简介 + 结果数量/排序”
- 当前 query filter 体系与 clean taxonomy routes 存在语义重叠，后续实施时要统一降级 query 页 SEO 权重
- 筛选体验后续可顺手优化，避免点击某个 filter 时丢失已有上下文
- page 参数需要边界保护，避免非法分页影响体验

### 3.10 当前状态
- 已拍板
- 待统一实施

---

## 4. Inventory 详情页（Inventory Detail）

### 4.1 页面角色
- Inventory 详情页不是普通产品详情页。
- Inventory 详情页是全站长尾 SEO 主力页、询盘转化核心页和库存真实性证明页。
- 其核心职责是承接具体型号与库存意图，并把访问者推进到询价与沟通动作。

### 4.2 页面主定位
- 内部正式定位为：Inventory Offer Page

### 4.3 页面主语义
- wholesale stock offer
- active inventory
- available quantity
- MOQ
- market / warehouse
- direct inquiry

### 4.4 明确不走的方向
- 不按传统零售商品详情页思维组织主叙事
- 不把页面重点放在品牌宣传或夸张卖点上
- 不让 CTA 偏向“浏览更多”而弱化询盘动作
- 不继续强化与 clean taxonomy routes 冲突的 query route 分发方式

### 4.5 页面核心任务
- 说明这条库存是什么
- 说明这条库存是否可谈、怎么谈
- 说明这条库存适合什么市场与采购条件
- 引导用户进入 Telegram / WhatsApp 询盘路径

### 4.6 已拍板内容方向
- 页面语气从 `product detail` 转向 `stock offer / inventory offer`
- metadata 方向不再只依赖 title + market + wholesale 的基础组合
- title / description 需要逐步引入以下结构化字段：
  - brand
  - puff
  - availability
  - MOQ
  - warehouse / market
- 页面 CTA 继续以 inquiry 为唯一核心动作

### 4.7 页面文案原则
- 说库存，不说品牌广告
- 说可交易信息，不说空泛卖点
- 强调 availability / MOQ / warehouse / market
- 保留价格解锁逻辑，服务线索收集
- FOMO 表达允许保留，但要收敛，避免削弱 B2B 专业感

### 4.8 路由与分发策略
- 详情页 related 区块的后续跳转应优先走 clean taxonomy routes
- 若是市场意图，优先导向 `/market/[slug]`
- 不再继续强化 `/inventory?market=...` 作为市场分发主路径

### 4.9 数据前提提醒
- 当前页面分析基于模拟数据结构完成，但拍板结论适用于未来真实数据
- 详情页 SEO 上限高度依赖真实数据质量
- 后续上线前必须确保标题、图片、描述、数量、MOQ、market、warehouse 等字段达到统一口径

### 4.10 当前状态
- 已拍板
- 待统一实施

---

## 5. Market 页（Market Taxonomy）

### 5.1 页面角色
- `/market` 是市场导航目录页，用于结构导航与内部链接分发。
- `/market/[slug]` 是区域库存主承接页，而不是普通分类页或地区介绍页。
- `/market/[slug]` 的核心职责是承接某一目标市场的采购意图，并将访问者导向具体库存详情页与询盘路径。

### 5.2 页面主定位
- `/market/[slug]` 内部正式定位为：Regional Inventory Hub

### 5.3 页面主语义
- wholesale inventory for target market
- active stock for regional buyers
- verified listings
- inquiry-ready offers
- market-focused sourcing

### 5.4 明确不走的方向
- 不写成泛地区介绍页
- 不写成市场报告页
- 不写成品牌集合页
- 不只做“换 market 名称的库存列表”
- 不让结果数量文案替代页面主语义

### 5.5 页面核心任务
- 承接区域采购搜索意图
- 强调这批库存是围绕目标市场组织与理解的
- 引导用户进入详情页和私域询盘路径
- 服务后续区域化 SEO 与私域分发

### 5.6 已拍板标题与 metadata 方向
- `/market/[slug]` 推荐 H1：
  - `Wholesale Vape Inventory for ${marketName}`
- `/market/[slug]` 推荐 description 方向：
  - 围绕 active stock、target market suitability、bulk offers、clearance opportunities、direct inquiry 展开
- `/market` 作为目录页，不承担最强 SEO 抢词任务

### 5.7 页面文案原则
- 强调目标市场采购任务
- 强调库存适配和可询盘
- 保持与 Inventory / Brand / Price 页之间的语义边界
- 页面顶部需要有市场摘要，不应只报“Products Available”

### 5.8 SEO 优先级与索引策略
- `/market/[slug]` 是重点 SEO 资产
- `/market` 是导航目录页
- Market 页战略优先级高于 Brand 页和 Price 页
- 继续保留低库存 noindex 思路，但后续统一阈值口径

### 5.9 数据依赖与执行注意事项
- Market 页高度依赖 `market` 字段标准化
- `market` 字段不得混用 MENA / Middle East / Middle-East 等不同口径
- Market 页未来适合作为区域私域分发与库存合集落地页

### 5.10 当前状态
- 已拍板
- 待统一实施

---

## 6. Brand 页（Brand Taxonomy）

### 6.1 页面角色
- `/brand` 是品牌导航目录页，用于品牌分发与结构导航。
- `/brand/[slug]` 是品牌库存承接页，而不是品牌故事页、品牌介绍页或供应商资质页。
- `/brand/[slug]` 的核心职责是承接品牌词 + 批发库存意图，并把用户导向具体库存详情页与询盘路径。

### 6.2 页面主定位
- `/brand/[slug]` 内部正式定位为：Brand Stock Hub

### 6.3 页面主语义
- brand wholesale inventory
- active brand listings
- bulk offers
- clearance stock
- inquiry-ready inventory

### 6.4 明确不走的方向
- 不写成品牌故事页
- 不写成产品测评页
- 不写成泛供应商渠道页
- 不只用“supplier network”作为页面主叙事
- 不让结果数量文案替代页面主语义

### 6.5 页面核心任务
- 承接品牌词 + wholesale inventory 搜索意图
- 帮买家快速找到该品牌当前 active stock
- 将品牌偏好转化为库存浏览与询盘动作
- 支撑头部品牌 SEO 覆盖

### 6.6 已拍板标题与 metadata 方向
- `/brand/[slug]` 推荐 H1：
  - `Wholesale ${brandName} Inventory`
- `/brand/[slug]` 推荐 description 方向：
  - 围绕 active listings、bulk offers、clearance stock、inquiry-ready inventory 展开
- `/brand` 作为目录页，不承担最强 SEO 抢词任务

### 6.7 页面文案原则
- 说品牌库存，不说品牌故事
- 说 active listings / stock / availability，不说泛渠道网络
- 保持与 Inventory / Market / Price 页之间的语义边界
- 页面顶部需要有品牌摘要，不应只报“Products Available”

### 6.8 SEO 优先级与索引策略
- `/brand/[slug]` 是重点 SEO 资产
- `/brand` 是导航目录页
- Brand 页优先级低于 Market 页，但高于 Price 页
- 继续保留薄页 noindex 思路
- 继续坚持“头部品牌池 + 库存驱动品牌页”双策略

### 6.9 数据依赖与执行注意事项
- Brand 页高度依赖 `brand` 字段标准化
- Brand 写法不得混用 ELFBAR / Elfbar / Elf Bar 等不同口径
- Brand 页比 Market 页更容易变成薄页，后续必须严格控制品牌池与上新节奏

### 6.10 当前状态
- 已拍板
- 待统一实施

---

## 7. Price 页（Price Taxonomy）

### 7.1 页面角色
- `/price` 是价格带导航目录页，用于预算筛选导航与内部链接分发。
- `/price/[slug]` 是价格带库存聚合页，而不是促销活动页、零售导购页或首页 Hot Deals 的放大版。
- `/price/[slug]` 的核心职责是承接预算 / clearance / under-x 这类价格带意图，并把访问者导向具体库存详情页。

### 7.2 页面主定位
- `/price/[slug]` 内部正式定位为：Price-Band Deal Hub

### 7.3 页面主语义
- wholesale inventory by price band
- budget-aligned stock
- clearance inventory
- active listings by unit price
- bulk offers

### 7.4 明确不走的方向
- 不写成零售促销活动页
- 不写成 flash sale / deal hype 页面
- 不让“Deals”成为页面唯一主语义
- 不和首页 Hot Deals、Inventory 排序页、详情页 FOMO 语义重叠
- 不让结果数量文案替代页面主语义

### 7.5 页面核心任务
- 帮买家按预算带快速筛库存
- 承接 under-x / clearance / budget stock 搜索意图
- 强化商业筛选效率，但不抢走整站主叙事

### 7.6 已拍板标题与 metadata 方向
- `/price/[slug]` 推荐 H1：
  - `Wholesale Vape Inventory ${priceDesc}`
- `/price/[slug]` 推荐 metadata title 方向：
  - `Wholesale Vape Inventory ${priceDesc} | VapeStockHub`
- `/price/[slug]` 推荐 description 方向：
  - 围绕 price band、active listings、clearance stock、bulk offers、faster sourcing 展开
- `/price` 作为目录页，不承担最强 SEO 抢词任务

### 7.7 页面文案原则
- 说价格带库存，不说促销活动
- 说预算筛选，不说零售导购情绪
- 保持与 Inventory / Market / Brand / Detail 页之间的语义边界
- 页面顶部需要有价格带摘要，不应只报“Deals Found”

### 7.8 SEO 优先级与索引策略
- `/price/[slug]` 是 SEO 补充页
- `/price` 是导航目录页
- Price 页优先级低于 Market 页和 Brand 页
- Price 页 noindex 执行应比 Brand / Market 更保守
- 后续价格带划分要根据真实数据分布与询盘反馈校准

### 7.9 数据依赖与执行注意事项
- Price 页最容易薄页化，必须谨慎控制索引
- 当前价格区间仅作为 MVP 初始版本，后续不应长期固定不变
- Price 页要避免把整站气质带偏向 DTC 电商促销页

### 7.10 当前状态
- 已拍板
- 待统一实施

---

## 8. 已完成的核心页型拍板
- 首页（Home）
- Inventory 列表页（Inventory Index）
- Inventory 详情页（Inventory Detail）
- Market 页（Market Taxonomy）
- Brand 页（Brand Taxonomy）
- Price 页（Price Taxonomy）

---

## 9. 统一实施清单（执行版）

### 9.1 实施优先级
- P0：首页、Inventory 列表页、Inventory 详情页
- P1：Market 页
- P2：Brand 页
- P3：Price 页
- P0-P3 全部完成后，再统一补 admin 录入约束、数据质量提示与索引规则细化

### 9.2 文案与 metadata 必改项
- 首页：
  - Hero H1 / 副标题 / CTA 统一改为 Inventory Hub 方向
  - Quick Links 文案改为任务导向表达
  - FAQ 从泛行业问答收敛为 B2B 采购问答
- Inventory 列表页：
  - 顶部增加类目标题与摘要
  - 结果数量从主标题降级为辅助信息
  - metadata 统一到 active wholesale inventory 语义
- Inventory 详情页：
  - metadata 改为库存要约页逻辑
  - 区块标题从 product copy 向 stock offer copy 收敛
  - related 路由改为 clean taxonomy routes
- Market 页：
  - H1、摘要、description 改为目标市场采购语义
- Brand 页：
  - H1、摘要、description 改为品牌库存语义
- Price 页：
  - H1、摘要、description 改为价格带库存筛选语义
  - 弱化促销和 deals 导向表达

### 9.3 UI 结构影响范围
- 本轮执行会涉及轻到中度的信息结构调整，但不涉及整站视觉风格重做。
- 重点调整对象：
  - 页面顶部标题层级
  - 页面摘要说明
  - 结果数量与排序条的位置关系
  - CTA 表达与优先级
  - 部分页面的辅助跳转路径
- 不建议调整对象：
  - Dark Pro 主题
  - 颜色系统
  - 整站布局基调
  - 复杂交互与动画层

### 9.4 SEO 规则配套项
- 统一薄页 noindex 阈值口径
- 明确 query 参数页的 SEO 降级策略
- 继续使用 canonical 指向 clean routes
- 保证 Brand / Market / Price 聚合页只承接各自专属语义

### 9.5 数据与 admin 配套项
- 正式上线前必须按 `DATA_ENTRY_STANDARDS.md` 升级版执行真实数据录入
- admin 后台后续需补充：
  - 标准值提示
  - 基础格式校验
  - 占位图提示
  - description 过短提示
  - slug 规范提示
- AI 入库采用“AI 草稿 + 人工终审”模式，不直接自动发布

### 9.6 执行边界
- 本轮统一实施以“语义正确、结构清晰、转化路径顺畅”为目标
- 不在本轮引入博客系统、多语言 SEO、复杂 faceted SEO、结构化数据大扩张
- 不在本轮做超出 MVP 的后台复杂化改造

---

## 10. 更新规则
- 每完成一页拍板，必须先更新本文，再进入下一页。
- 若后续讨论推翻已拍板内容，必须直接在本文中更新，不保留口头版本。
- 进入统一实施阶段前，必须以本文为最终执行清单进行逐项核对。
