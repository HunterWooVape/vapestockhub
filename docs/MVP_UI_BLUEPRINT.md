# VapeStockHub MVP UI 结构蓝图（已确认版）

## 1. UI决策结论
- 主题基调：Dark Pro（已确认）。
- 强调色推荐：Teal（推荐值：#22C7A9）（已确认）。
- 字体推荐：Inter（正文与数据信息可读性最佳，国际化兼容好）（已确认）。
- 视觉定位：B2B库存情报平台，不做强电商促销风。

## 2. 视觉系统（MVP最小集）

### 2.1 颜色令牌
- 背景主色：#0B0F14
- 背景次色：#111827
- 边框色：#1F2937
- 主文字：#E5E7EB
- 次文字：#9CA3AF
- 强调色（Teal）：#22C7A9
- 强调色悬停：#18B79A
- 危急标签：#F59E0B
- 错误标签：#EF4444
- 成功标签：#10B981

### 2.2 字体层级
- 字体：Inter
- H1：40/48，600
- H2：28/36，600
- H3：20/28，600
- Body：16/24，400
- Data Label：12/16，500
- Data Value：18/24，600

### 2.3 基础组件风格
- 卡片：8px圆角，1px边框，轻阴影。
- 按钮：主按钮仅用于“Contact Supplier”。
- 标签：用于状态信息（Verified、Urgent、Low Stock、Pending Check）。
- 表单控件：暗色背景，聚焦时显示Teal外框。

## 3. 页面结构蓝图

### 3.1 首页（Home）
- 顶部导航：Logo、Inventory、Markets、Brands、Contact。
- Hero区：
  - 标题：一句英文价值表达。
  - 副标题：库存时效与全球分发能力。
  - CTA：Browse Inventory / Join Telegram。
- 快速入口区：Market / Brand / Price Band 三个入口卡。
- 列表区块：
  - Latest Inventory
  - Urgent Clearance
  - Recently Verified
- 页脚：联系方式、渠道入口、合规说明链接。

### 3.2 库存列表页（Inventory List）
- 左侧固定筛选：
  - Product Type
  - Brand
  - Market
  - Price Band
  - Warehouse Region
- 顶部工具条：结果数量、排序（Newest / Price / Quantity）。
- 结果卡片：
  - 标题（品牌+核心规格）
  - 关键参数（Price、MOQ、Quantity、Warehouse）
  - 状态标签（Verified/Low Stock）
  - 按钮（View Details）

### 3.3 详情页（Inventory Detail）
- 顶部三栏：
  - 左：产品图
  - 中：标题与核心参数
  - 右：Sticky联系卡（Telegram优先，WhatsApp次级）
- 核心参数区：
  - Puff
  - E-liquid
  - Nicotine
  - Price
  - MOQ
  - Quantity
  - Market
  - Warehouse
- 信任区：
  - Last Verified At
  - Inventory Status
  - Shipping Notes
- 相关推荐区：Similar Inventory（同市场或同品牌）。

### 3.4 市场页（Market Page）
- 顶部：市场简介 + 当前库存数量 + 更新时间。
- 主体：该市场库存列表（与列表页同卡片结构）。
- 辅助：热门品牌与常见价格带快捷入口。

### 3.5 品牌页（Brand Page）
- 顶部：品牌标题 + 库存数量 + 最近更新。
- 主体：品牌库存列表。
- 规则：仅展示满足发布阈值的品牌页（30天≥2 SKU）。

### 3.6 价格带页（Price Band Page）
- 顶部：价格区间定义（如 USD 0-2）。
- 主体：该区间库存列表。
- 规则：低库存页默认noindex（<3条）。

## 4. 交互与转化规范
- 联系入口全站统一文案：Contact Supplier。
- 详情页右侧联系卡在桌面端常驻可见。
- 所有筛选结果保持URL可分享。
- 联系动作必须记录：
  - source_page_type
  - source_page_slug
  - source_channel
  - lead_status（默认new）

## 5. 响应式规则（MVP）
- Desktop（≥1280）：三栏详情布局。
- Tablet（768-1279）：详情页改两栏，联系卡顶部固定。
- Mobile（<768）：筛选抽屉化，底部固定Contact按钮。

## 6. 文案与信息表达
- 前端对外文案统一英文。
- 字段标签统一短词，避免冗长句子。
- 参数展示优先级：Price > Quantity > MOQ > Warehouse > Market。

## 7. 开发交付顺序（UI视角）
- 第一步：设计令牌与基础组件（按钮/卡片/标签/筛选控件）。
- 第二步：详情页UI先行（核心转化页）。
- 第三步：列表页与三类SEO页复用同一结果卡。
- 第四步：首页拼装与样式统一。

## 8. 已拍板项（UI）
- 强调色 Teal（#22C7A9）已确认。
- 字体 Inter 作为MVP唯一字体已确认。
- 首页Hero主文案风格已确认偏“库存情报”。

