# VapeStockHub 第二阶段拍板记录

## 0. 文档用途
- 本文用于记录第二阶段已经拍板确认的方向与决策。
- 本文与 `MVP_PHASE2_EXECUTION_BLUEPRINT.md` 的区别如下：
  - `MVP_PHASE2_EXECUTION_BLUEPRINT.md` 负责第二阶段主框架、目标与方法论。
  - 本文负责记录已经确认的最终决定，作为后续实施依据。
- 第二阶段所有关于 admin、真实数据、AI 入库、部署与上线后的执行事项，均以本文最新记录为准。

---

## 1. 当前已拍板总原则
- 第二阶段继续沿用第一阶段的方法：
  - 先拆解
  - 再讨论
  - 再拍板
  - 再记录
  - 最后统一实施
- 第二阶段现在就可以开始，不需要等真实数据全部准备完。
- 第二阶段重点从“前台页面语义校正”转向：
  - admin 后台与数据生产准备
  - 真实数据上线准备
  - AI 辅助入库工作流
  - 部署前闭环
  - 上线后 30 天回收

### 1.1 已确认的第二阶段推进方式
- 第二阶段必须建立独立主框架文档与拍板记录文档。
- 第二阶段不直接进入大规模代码实施，先完成关键业务与流程层面的拆解和拍板。
- 第二阶段优先追求“软上线能力”，再决定正式公开上线时机。

### 1.2 已确认的上线判断
- 第二阶段完成后，大概率具备软上线准备度。
- 正式公开上线仍需满足：
  - 一批真实库存已替换关键模拟内容
  - 管理后台安全项已整改
  - 联系链路可实测通过
  - 基础统计与站长工具准备完成

### 1.3 已确认的 AI 入库原则
- AI 可以承担：
  - 提取
  - 映射
  - 标准化
  - 文案优化
  - 草稿生成
- 人工继续承担：
  - price
  - quantity
  - market
  - warehouse_location
  - 图片
  - 发布确认
- MVP 阶段不采用“AI 直接发布”模式。

---

## 2. admin 后台与真实数据上线准备

### 2.1 已确认的后台定位
- admin 后台不再只是测试数据录入工具。
- 第二阶段的 admin 正式定位为：
  - SEO 资产生产后台
  - 真实库存发布后台
  - AI 草稿承接后台
  - 单人强运营后台

### 2.2 已确认的升级目标
- 后台升级目标不是“更复杂”，而是“更有边界、更能控质量、更适合真实数据上线”。
- 第二阶段优先补的是：
  - 字段标准化
  - 质量提醒
  - 发布边界
  - 真实数据承接能力
- 不在第二阶段引入复杂角色权限或重型 CMS / ERP 逻辑。

### 2.3 已确认的 admin 优先收紧字段
- 第一批优先收紧：
  - brand
  - market
  - product_type
  - contact_visibility
- 第二批重点增强：
  - title
  - slug
  - warehouse_location
  - description

### 2.4 已确认的发布策略方向
- 引入“草稿态思维”。
- 新录入数据、AI 生成草稿、未完全确认数据，不应默认直接视为稳定可发布内容。
- 第二阶段默认方向是：
  - 先草稿
  - 再人工复核
  - 再进入 active

### 2.5 已确认的质量控制原则
- 质量规则采用：
  - 关键缺失项阻止发布
  - 其他非致命问题先提示
- 后台需要逐步具备以下提醒能力：
  - description 过短
  - 占位图
  - brand / market 不符合标准
  - slug 结构较弱
  - title 过于营销化

### 2.6 已确认的真实数据上线策略方向
- 第一批真实数据采用“小批量高质量”策略。
- 不建议一次性全量替换模拟数据。
- 更推荐：
  - 先导入一批高质量真实数据
  - 先撑住首页、Inventory、重点 Market / Brand 页与若干详情页
  - 再逐步扩展

### 2.7 已确认的安全判断
- 当前 admin 认证方式可作为 MVP 内部工具继续使用。
- 但正式公开上线前，后台安全项必须优先整改。
- 测试态弱配置不得直接带入生产。

### 2.8 新增插入话题
- flavor 的录入、结构化表达、前台展示与 AI 提取策略
- description 是否允许全程 AI 处理，以及对应 prompt / 审核边界
- 对外供应商数据收集模板，以及其与 AI 入库工作流的衔接方式

### 2.9 已确认的供应商模板判断
- 对外供应商数据收集模板是第二阶段正式任务，而不是边缘补充项。
- 模板不替代 AI 入库，而是与 AI 入库双轨并行：
  - 愿意配合的供应商走标准模板
  - 格式混乱的供应商继续走 AI 清洗路径
- 模板目标不是直接等于数据库结构，而是作为上游标准化入口，降低清洗成本并提高 AI 提取准确率。

### 2.10 已确认的供应商模板阶段位置
- 供应商数据收集模板应放在第二阶段中前段。
- 推荐顺序为：
  - flavor / description 结构化策略
  - 对外供应商数据收集模板
  - AI 入库工作流与人工终审边界
- 模板设计应早于真实数据批量接入和 AI 入库规则细化。

### 2.11 已确认的 flavor 方向
- flavor 不能继续只按简单标签字段理解。
- flavor 正式按双层语义处理：
  - flavor tags：面向前台快速概览与标签展示
  - flavor breakdown：面向库存结构、口味数量明细、AI 提取与交易细节展示
- 当前阶段先拍板业务模型，不急于立即做复杂数据库重构。

### 2.12 已确认的 description 方向
- description 正式定义为 AI 主生产字段。
- 但必须采用：
  - 标准化 prompt
  - 固定输出结构
  - 人工关键审核
- 人工审核重点不是逐字润色，而是检查：
  - 是否幻觉
  - 关键规格是否错误
  - flavor breakdown 是否被改坏
  - 是否写偏成零售广告语气

### 2.13 已确认的 flavor / description 联动判断
- flavor 与 description 不作为两个独立小问题处理。
- 统一视为“半结构化库存信息层”：
  - flavor tags
  - flavor breakdown
  - stock notes
  - market notes
  - manifest details
- 该信息层将作为：
  - AI 入库的重点输出层
  - admin 草稿承接的重点信息层
  - 详情页后续增强展示的重点来源

### 2.14 已确认的 description 输出方向
- description 推荐采用双段式输出方向：
  - Display Summary
  - Manifest / Notes
- Summary 面向前台快速理解。
- Manifest / Notes 面向库存明细保真与交易沟通。

### 2.15 已确认的供应商模板结构方向
- 供应商模板采用双版本：
  - 表格版模板
  - 文本版模板
- 模板不直接照搬数据库字段，而采用：
  - 对外业务语言字段
  - 对内系统字段映射
- 第二阶段先做“模板协议”，后续再决定是否做成网页表单或系统入口。

### 2.16 已确认的供应商模板字段原则
- 对外模板分层设计：
  - 必填核心层
  - 推荐补充层
  - 可选运营层
- flavor 在模板中必须拆成：
  - Flavor List
  - Flavor Breakdown
- description 不要求供应商直接写成前台成品文案。
- 供应商提供：
  - Stock Notes
  - Market Notes
  - Packaging Notes
  - Extra Notes
- AI 再将这些原始信息转成系统侧 description。

### 2.17 已确认的供应商模板定位
- 供应商模板属于“高质量外部数据入口”。
- 其目标是：
  - 提高供应商配合度
  - 提高数据一致性
  - 降低人工整理成本
  - 提高 AI 提取与标准化成功率
- 模板不是唯一入口，不配合模板的供应商仍然走 AI 清洗路径。

### 2.18 已确认的 AI 语义原则
- AI 生成内容不能只追求“字段正确”或“语句通顺”。
- AI 在该项目中的内容生成角色必须同时具备：
  - B2B inventory 语境意识
  - 整站 SEO 语义一致性
  - 非零售、非导购、非过度促销的语气约束
- AI 生成内容应服务于整站已拍板的页面语义，而不是独立追求“看起来更完美”的文案。
- AI prompt 后续需要明确写入：
  - inventory / stock / wholesale / market / inquiry 等核心语义
  - 避免 retail shop、best deal、cheap vape 等偏零售表达
  - 不允许为 SEO 生造不存在的信息
  - 不允许为了文案更饱满而弱化真实性和可交易信息
- 后续 AI prompt 设计时，应将“SEO-aware but truth-first”作为正式原则。

### 2.19 已确认的第一批真实数据上线方向
- 第一批真实数据不采用一次性全量替换策略。
- 第一批上线采用“小批量、高质量、重点页面优先、分波替换”策略。
- 第一批目标不是先把数据库塞满，而是先让关键页面真实化并具备可谈库存支撑。

### 2.20 已确认的第一批真实数据优先覆盖范围
- 首页的 featured / latest 区块
- Inventory 列表页整体观感
- 若干高质量详情页
- 2-3 个重点 Market 页
- 2-3 个重点 Brand 页
- 至少 1-2 个能成立的 Price 页

### 2.21 已确认的第一批真实数据导入方式
- 采用分波导入：
  - Wave 1：高质量白名单库存，用于支撑软上线
  - Wave 2：逐步扩充库存盘子与聚合覆盖
- 第一批真实数据应优先选择：
  - 字段较完整
  - market 明确
  - brand 明确
  - quantity / moq / warehouse 较可信
  - flavor 信息相对清晰
  - 图片可用

### 2.22 已确认的推进方式
- 第一批真实数据上线策略的讨论与第二阶段其他工作可以并行推进。
- 不必等待真实数据全部准备好，才开始 admin、AI 入库、部署清单等工作。
- 更合理的方式是：
  - 先把策略、后台承接、AI 工作流、发布门槛设计清楚
  - 你并行准备第一批真实数据样本
  - 待样本到位后，再快速进入真实导入与软上线准备
- 即：
  - 你准备你的数据与业务优先级
  - 我继续推进策略、规则、文档、后台承接与后续实现方案
  - 到时机成熟再汇合落地

### 2.23 已确认的当前协作方式
- 当前阶段允许“策略与实现准备”先行。
- 真实数据样本到位前，优先推进：
  - admin 承接逻辑
  - AI 入库规则
  - 发布门槛
  - 部署前清单
- 真实数据样本到位后，再推进：
  - 白名单筛选
  - 第一批导入
  - 页面级数据复核
  - 软上线前检查

### 2.24 已确认的 AI 入库工作流定位
- AI 在该项目中的正式定位是“整理引擎”，不是“发布引擎”。
- AI 负责：
  - 理解原始资料
  - 提取字段
  - 标准化映射
  - 生成草稿
  - 标记缺失项与风险项
- AI 不直接决定是否发布，不直接替代人工终审。

### 2.25 已确认的 AI 入库统一路径
- 所有输入，无论来自：
  - 供应商模板
  - Excel
  - 文本
  - 聊天记录
  - 其他乱格式资料
- 最终都统一走：
  - Raw Input
  - AI Draft Package
  - Rule Check
  - Admin Review
  - Publish

### 2.26 已确认的 AI Draft Package 输出要求
- AI 输出不只是一组字段值，而是一份完整草稿包。
- 最少应包含：
  - Parsed / Normalized Fields
  - Suggested Title
  - Flavor Tags
  - Flavor Breakdown
  - Description Summary
  - Manifest / Notes
  - Missing Fields
  - Risk Flags
  - Human Review Focus

### 2.27 已确认的人工终审边界
- 人工终审不负责逐字重写全文。
- 人工终审重点核查高风险字段：
  - price
  - quantity
  - moq
  - market
  - warehouse_location
  - flavor breakdown
  - 图片
  - contact_visibility
  - description 是否幻觉
- 人工终审负责最终判断能否进入 active。

### 2.28 已确认的 AI 入库 MVP 边界
- MVP 阶段允许 AI 做：
  - 提取
  - 标准化
  - title / description / flavor 双层草稿生成
  - 缺失项提示
  - 风险项提示
- MVP 阶段不做：
  - 自动发布
  - 复杂批量审批流
  - 自动上下架判断
  - 复杂图片自动校验

### 2.29 已确认的 prompt 资产化方向
- prompt 后续应作为正式资产管理，而不是临时提示词。
- prompt 需要明确包含：
  - B2B inventory 语境
  - SEO-aware but truth-first 原则
  - flavor 双层输出规则
  - description 双段式输出规则
  - 缺失项标记规则
  - 风险项标记规则

### 2.30 已确认的上线分层
- 第二阶段正式区分：
  - 软上线
  - 正式公开上线
- 软上线用于：
  - 小范围可见
  - 验证真实库存展示
  - 验证询盘链路
  - 观察抓取与初步流量反馈
- 正式公开上线用于：
  - 更主动地获取外部流量
  - 稳定承接真实询盘
  - 进入持续 SEO / 运营迭代

### 2.31 已确认的软上线最小硬条件
- 一批真实库存已覆盖关键路径：
  - 首页
  - Inventory 列表页
  - 若干详情页
  - 重点 Market 页
  - 重点 Brand 页
- admin 后台已具备基础可控性
- 管理后台安全项已整改到不含明显硬伤
- Telegram / WhatsApp / source tracking 链路已实测通过
- robots / sitemap / canonical / noindex 逻辑已按当前策略自检通过
- Search Console 与至少一套基础统计工具已准备或接入

### 2.32 已确认的正式公开上线附加条件
- 真实数据稳定性高于软上线阶段
- 第一轮真实反馈后已做页面级复核
- 后台安全项完成进一步检查
- 关键页面不再保留明显测试态或模拟态痕迹
- 站点具备持续运营与每周复盘能力

### 2.33 已确认的上线硬门槛判断
- 以下事项属于上线硬门槛，不建议缺失：
  - 管理后台安全项整改
  - 联系链路测试通过
  - 关键页面已有真实库存支撑
  - robots / sitemap / canonical / noindex 自检通过
  - 基础监控与 Search Console 准备完成

### 2.34 已确认的当前上线策略
- 当前目标优先指向“软上线准备度”，而不是立刻公开放量。
- 第二阶段后续工作以“先达到软上线条件”为主。
- 何时进入正式公开上线，待真实数据质量与安全条件达标后再拍板。

### 2.35 已确认的上线后 30 天定位
- 上线后 30 天不是自然等待期，而是：
  - 数据回收期
  - 错误修正期
  - 第二轮 SEO 与运营判断起点
- 这 30 天的重点不是盲目扩张，而是基于真实反馈做判断。

### 2.36 已确认的上线后 30 天分段管理
- 上线后 30 天分为三段：
  - 1-7 天：系统与抓取确认期
  - 8-14 天：初始反馈识别期
  - 15-30 天：第二轮优化准备期
- 每一段有不同的观察重点与动作，不用过早下结论。

### 2.37 已确认的上线后核心观察维度
- 第一优先级数据：
  - Search Console 数据
  - 站内行为数据
  - 询盘质量数据
- 重点观察：
  - 哪些页开始有 impressions / clicks
  - 哪些 detail / market / brand 页表现更早
  - 哪些页面有流量但无询盘
  - 哪些询盘更接近高质量 leads

### 2.38 已确认的上线后 30 天动作原则
- 上线后前 30 天不急于继续大规模扩页或大改版。
- 前 30 天优先做：
  - 抓取与索引确认
  - 页面级错误修正
  - 高价值页面识别
  - taxonomy 优先级重新判断
  - 第二轮优化入口确认
- 这 30 天的目标是用真实数据校正主观判断，而不是继续凭感觉改站。

### 2.39 已确认的 admin 最小 Draft 方案
- admin 第二阶段采用“status 增加 draft”方案，不新增复杂审核流字段。
- 新建库存默认进入 draft，不再默认直接 active。
- draft 只在后台内部流转，不进入前台展示、详情页公开链路与 sitemap。
- 该方案优先满足：
  - 单人强运营
  - 真实数据先草稿后发布
  - AI 草稿未来可自然承接

### 2.40 已确认的第一轮 admin 字段收紧方式
- 第一轮采用“两层约束”：
  - 强约束：product_type、contact_visibility
  - 半约束：brand、market
- product_type 使用固定选项，避免自由输入继续发散。
- contact_visibility 保持固定选项。
- brand 与 market 不在当前阶段做死枚举，而采用：
  - 推荐值输入
  - 标准值归一化
  - 不匹配时仅先警告

### 2.41 已确认的 slug 处理方向
- slug 采用“自动生成 + 可编辑”。
- 新建时不再以“标题 + 时间戳”作为默认公开 URL 方案。
- 编辑时允许手动调整，但系统应自动做基础规范化与冲突避让。
- slug 的目标是：
  - 可读
  - 可长期复用
  - 符合 SEO 资产逻辑

### 2.42 已确认的发布门槛结构
- admin 发布质检分为两层：
  - Hard Block
  - Warning
- Hard Block 直接阻止 draft 进入 active。
- Warning 允许发布，但后台必须显式提示风险。
- 第二阶段不做复杂审批系统，先做轻量规则层。

### 2.43 已确认的 Hard Block 范围
- 以下问题属于第一轮发布阻断项：
  - title 缺失
  - brand 缺失
  - product_type 缺失
  - price <= 0
  - quantity <= 0
  - market 缺失
  - warehouse_location 缺失
  - slug 非法或为空
  - description 缺失
  - 图片缺失
  - 图片仍为占位图

### 2.44 已确认的 Warning 范围
- 以下问题属于第一轮提示项，不直接阻断发布：
  - description 过短
  - title 过于营销化
  - flavor 缺失
  - moq 大于 quantity
  - brand 不在当前标准值集合中
  - market 不在当前标准值集合中

### 2.45 已确认的 admin 第一轮界面补强
- admin 首页需要补上 success / error 操作反馈，不再只做 redirect 不展示结果。
- admin 需要提供 publish readiness 信息层，至少能看到：
  - blockers 数量
  - warnings 数量
  - 当前是否可进入 active
- 编辑页需要直接展示当前记录的发布准备度，而不是让管理员自行猜测。

### 2.46 已确认的缓存刷新补强
- admin 在创建、编辑、删除、状态切换后，不能只刷新 /admin 与 /inventory。
- 第一轮至少补齐以下刷新范围：
  - 首页
  - Inventory
  - Inventory detail
  - Market
  - Brand
  - Price
  - sitemap
- 目标是避免后台已改、前台局部仍旧的错误认知。

### 2.47 已确认的 AI Draft Package 角色
- AI Draft Package 不是一段文案，也不是一组散字段。
- 它正式定义为：
  - AI 入库链路中的标准中间层
  - 原始资料与 admin draft 之间的承接格式
  - 后续 prompt、规则校验、admin 草稿回填的统一结构
- 第二阶段后续实现，应尽量围绕 AI Draft Package 组织，而不是直接让 AI 输出数据库写入语句。

### 2.48 已确认的 AI Draft Package 最小结构
- AI Draft Package V1 最少包含四层：
  - Raw Input
  - Normalized Fields
  - Missing Fields / Risk Flags
  - Human Review Focus
- 其中 Raw Input 负责保留来源上下文，避免后续核对时丢失原始语义。
- Normalized Fields 负责输出接近 admin 可回填的数据层。
- Missing Fields / Risk Flags 负责提示不确定、缺失、异常点。
- Human Review Focus 负责告诉管理员优先看哪里，而不是让其整条重读。

### 2.49 已确认的 Raw Input 层要求
- Raw Input 层最少保留：
  - sourceType
  - supplierName
  - submittedAt
  - sourceLabel
  - rawText
- sourceType 至少区分：
  - supplier_template
  - excel
  - text
  - chat
  - other
- 目标不是做完整归档系统，而是确保追溯来源时有最小上下文。

### 2.50 已确认的 Normalized Fields 层要求
- Normalized Fields 层第一轮至少包含：
  - title
  - slug
  - brand
  - product_type
  - price
  - quantity
  - moq
  - market
  - warehouse_location
  - nicotine
  - puff
  - e_liquid
  - contact_visibility
  - images
  - flavor_tags
  - flavor_breakdown
  - description_summary
  - manifest_notes
- 其中：
  - flavor_tags 面向前台快速展示与标签化
  - flavor_breakdown 面向库存明细与交易保真
  - description_summary + manifest_notes 共同回填 description

### 2.51 已确认的 Risk / Missing / Review 层要求
- Missing Fields 用于列出当前 AI 无法可靠补全的字段。
- Risk Flags 用于标出：
  - 单位不一致
  - 数值可疑
  - market / brand 识别不稳
  - flavor breakdown 模糊
  - 原始文本冲突
- Human Review Focus 用于点名管理员优先核查字段。
- 第一轮重点 review field 至少覆盖：
  - price
  - quantity
  - moq
  - market
  - warehouse_location
  - flavor_breakdown
  - description
  - images
  - contact_visibility

### 2.52 已确认的 admin 承接方式
- AI Draft Package 不直接发布。
- 第二阶段的 admin 承接方式应是：
  - AI Draft Package → 回填 draft 表单
  - 规则层校验
  - 管理员复核
  - 保持 status = draft
  - 人工确认后再 active
- 也就是说，AI Draft Package 的默认落点永远是 draft，而不是 active。

### 2.53 已确认的 description 回填方式
- AI Draft Package 的 description 不采用单段黑盒文本。
- 回填 admin 时，应由以下两部分拼接：
  - description_summary
  - manifest_notes
- 这样可以同时保留：
  - 前台快速理解层
  - 库存明细保真层
- 该结构也更适合后续继续优化详情页展示。

### 2.54 已确认的 AI Draft Package 与规则层关系
- AI Draft Package 负责“整理与输出草稿”。
- 规则层负责“检查是否可进入 publish review”。
- 二者不能互相替代：
  - AI 不直接定义发布资格
  - 规则层不负责理解原始杂乱资料
- 这也是第二阶段避免“AI 看起来很对，但实际不可发布”的关键边界。

### 2.55 已确认的第一轮导入入口形态
- 第一轮不直接接 AI API，不做自动模型调用入口。
- 第一轮先在 `/admin` 提供一个“AI Draft Package JSON 导入入口”。
- 管理员可直接粘贴 AI Draft Package JSON，由系统完成：
  - JSON 结构校验
  - 最小字段校验
  - 字段映射
  - draft 入库
- 该入口的目标是先把“AI 输出 → admin draft”链路跑通，而不是先追求完整自动化。

### 2.56 已确认的第一轮导入入口边界
- 第一轮导入入口只接受已经生成好的 AI Draft Package。
- 不在本小项内解决：
  - 在线调用模型
  - 上传 Excel 后自动解析
  - 批量多条导入
  - 图片自动处理
- 这些能力后续可以继续叠加，但当前优先级低于先跑通单条链路。

### 2.57 已确认的导入入口成功标准
- 导入成功后，系统必须：
  - 创建一条新的 inventory draft
  - 不直接发布为 active
  - 保留现有 publish blocker 规则
  - 允许管理员继续在 edit 页面复核
- 也就是说，导入入口只是“draft 生成入口”，不是“发布入口”。

### 2.58 已确认的 prompt 资产化形态
- prompt 第一轮不以散落文本存在，而应作为代码侧可复用资产存在。
- 第一轮 prompt 资产至少包含：
  - systemPrompt
  - userPromptTemplate
  - outputContract
- 目标是让后续：
  - 手工调用模型
  - 接 AI API
  - 做批量导入
  - 做 prompt 版本升级
  都能复用同一套基线。

### 2.59 已确认的 systemPrompt 约束
- systemPrompt 必须明确写入以下约束：
  - B2B wholesale inventory 语境
  - 英文输出
  - SEO-aware but truth-first
  - 不得幻觉
  - 不得写成零售导购文案
  - flavor 双层结构要求
  - description 双段式输出要求
  - 返回 JSON only
- systemPrompt 负责定义“角色与边界”，而不是承载具体原始资料。

### 2.60 已确认的 userPromptTemplate 作用
- userPromptTemplate 负责承接：
  - 原始供应商资料
  - 当前已知 brand / market 参考值
  - 当前任务说明
- userPromptTemplate 应支持把原始资料直接插入占位符，而不是每次重新手写 prompt。
- 该模板的主要目标是降低后续手工试跑与 API 接入时的提示词漂移。

### 2.61 已确认的 outputContract 作用
- outputContract 必须显式约束 AI 返回：
  - AI Draft Package JSON 结构
  - 字段要求
  - riskFlags / missingFields / humanReviewFocus 的写法
- outputContract 的目标不是解释业务，而是把模型输出收束到可解析的结构上。

### 2.62 已确认的 prompt 版本化方向
- prompt 资产第一轮采用 `v1` 版本标记。
- 后续若改：
  - 字段结构
  - 风险口径
  - title / description 语气
  - flavor 输出规范
  应通过版本升级处理，而不是悄悄覆盖旧 prompt。
- 这样后续出现输出波动时，才有能力回溯是哪个 prompt 版本导致的。

### 2.63 已确认的当前优先级不是重型 Intake Queue
- 基于真实脏样本测试结果，当前不应优先投入重型 Intake Queue。
- 当前更高 ROI 的方向是：
  - 供应商模板推进
  - 最小准入标准
  - Green / Yellow / Red 分级处理
- 原因是当前最需要解决的问题，不是“如何吞掉所有脏输入”，而是“如何降低脏输入比例”。

### 2.64 已确认的供应商提交最小准入标准
- 第一阶段对供应商资料的最小可持续输入要求为：
  - Brand
  - Model / Product Name
  - Product Type
  - Available Qty
  - Target Market
  - Warehouse Location
- 以上字段不是要求对方一次填满所有模板，而是要求至少明确商品主体与基本交易上下文。
- 若连以上字段都无法稳定提供，则该资料不应被视为主通道输入。

### 2.65 已确认的 Green / Yellow / Red 分级规则
- `Green`
  - 商品主体明确
  - 关键身份字段基本完整
  - 可直接进入 AI Draft Package 主通道
- `Yellow`
  - 商品主体大致明确，但字段缺失明显
  - 可人工补录后再进入 AI Draft Package 或 admin draft
- `Red`
  - 商品主体不清，或多类信息严重混杂
  - 不进入主通道
  - 优先要求补模板，必要时再人工重建

### 2.66 已确认的分级处理原则
- `Green`
  - 直接进入 AI Draft Package → admin draft
- `Yellow`
  - 先补录关键字段，再进入 AI Draft Package
- `Red`
  - 不优先投入 AI 解析算力
  - 不直接进入 admin draft
  - 仅在业务价值高时人工摘取高价值内容

### 2.67 已确认的尾货 / 异常库存处理口径
- 若资料中出现：
  - 无日期
  - 过期
  - 包装破损
  - 产品不良
  - 清仓尾货
  应默认提高风险等级。
- 这类信息不能因为能被 AI 读懂，就当成普通库存直接推进。
- 在后续结构升级前，至少应通过 `riskFlags` 与人工终审显式标记。

### 2.68 已确认的当前执行主张是“模板优先 + 人工补全 + AI 评估 + Draft”
- 当前不应把时间主要花在反复打磨模板细节或长周期样本预案上。
- 当前更务实的执行主张是：
  - 先让供应商尽量按我们的模板提交
  - 缺失字段由我们内部人工补全
  - 再交给 AI 做结构化、风险提示与 draft 生成
  - 最后由 admin blocker / warning 与人工终审把关
- 这条链路更符合当前 MVP 的速度目标，也更有利于尽快推进软上线准备。

### 2.69 已确认的模板目标不是“完美填写”，而是“降低混乱度”
- 供应商模板的目标不是让对方像系统录入员一样完整填写所有字段。
- 模板真正的价值是把原本非常混乱的输入，压缩到“可人工补、可 AI 处理、可进入 draft”的区间。
- 因此：
  - 模板 V1 可以先用
  - 第一轮不需要为了追求完美而反复来回迭代
  - 只要能显著降低脏输入比例，就已经达到阶段目标

### 2.70 已确认的当前节奏应优先服务软上线
- 当前阶段的优先级应以“更快完成软上线准备”为导向。
- 在不牺牲数据安全边界的前提下，应优先走：
  - 模板收集
  - 人工补录
  - AI Draft Package
  - draft 审核
  - 小批量真实数据接入
- 供应商反馈、模板 V2、更多自动化能力，可以放到软上线后持续迭代，而不是作为当前阻塞项。

### 2.71 已确认的方向是“轻量在线提报入口”，不是“供应商后台”
- 当前适合做的是：
  - 在线化的供应商提报入口
  - 模板字段的数字化表单
  - 提交后进入内部处理链路
- 当前不适合做的是：
  - 供应商账号体系
  - vendor dashboard
  - 供应商自助管理库存
  - 多角色权限系统
- 原因是后者明显超出 MVP 边界，也会拖慢软上线准备节奏。

### 2.72 已确认的轻量在线提报入口 V1 定位
- 该入口的目标不是替代 admin。
- 该入口的目标是替代“反复发 Excel 模板”的流程。
- 它本质上是：
  - 供应商或内部人员可填写的在线模板
  - 一个可控、结构化、低摩擦的资料收集入口
  - 后续 AI Draft Package / admin draft 的上游输入层

### 2.73 已确认的轻量在线提报入口 V1 数据链路
- 当前推荐链路为：
  - Supplier Submission Form
  - Internal Review / 人工补全
  - AI Draft Package
  - admin draft
  - blocker / warning / 人工终审
  - active
- 入口提交后不直接发布，不直接进入 active。
- 入口提交后的记录，应先作为内部待处理资料，而不是前台库存。

### 2.74 已确认的轻量在线提报入口 V1 边界
- 第一轮不做：
  - 注册登录
  - 供应商查看自己历史提交
  - 供应商修改已提交记录
  - 供应商查看发布状态
  - 批量 Excel 上传解析
  - 自动发布
- 第一轮只做：
  - 单条提交
  - 模板字段填写
  - 必填项与基础校验
  - 提交后进入内部处理链路

### 2.75 已确认的轻量在线提报入口 V1 使用人群
- 第一轮入口不只服务供应商，也应支持内部代填。
- 也就是说：
  - 供应商愿意自己填时，可以直接发入口
  - 供应商只愿意聊天发资料时，内部人员也可代填
- 这样既保持数字化方向，也不会因为供应商不配合而卡住录入。

### 2.76 已确认的轻量在线提报入口 V1 与白名单关系
- 轻量在线提报入口上线后，第一批真实数据白名单不再必须“录入前先完全拆好”。
- 更实际的方式是：
  - 先通过入口沉淀真实候选池
  - 再从候选池中筛选白名单
- 也就是说，白名单不会消失，只是从“先拆后录”改为“先录后筛”。

### 2.77 已确认的轻量在线提报入口 V1 路由定位
- 第一轮建议使用独立路由，不放入前台主导航。
- 推荐定位：
  - 一个私用或半私用的提交入口
  - 主要给供应商链接直达，或内部人员代填
- 第一轮不需要做公开曝光的站内入口，避免引入低质量垃圾提交。

### 2.78 已确认的轻量在线提报入口 V1 页面结构
- 页面建议分为 6 个区块：
  - Access / Submission Notice
  - Supplier Info
  - Product Basics
  - Trading & Logistics
  - Flavor & Notes
  - Media & Submit
- 目标不是把 admin 全量搬过去，而是保留模板核心字段，让填写成本更低。

### 2.79 已确认的轻量在线提报入口 V1 最小字段方案
- 第一轮建议必填字段为：
  - Supplier Name
  - Brand
  - Model / Product Name
  - Product Type
  - Available Qty
  - Target Market
  - Warehouse Location
- 推荐字段为：
  - Unit Price (USD)
  - MOQ
  - Puff Count
  - Nicotine Strength
  - E-liquid Capacity
  - Flavor List
  - Flavor Breakdown
  - Image Link
  - Stock Notes
  - Packaging Notes
  - Extra Notes
- 该字段层级与当前“模板优先 + 人工补全 + AI 评估 + Draft”主张一致。

### 2.80 已确认的轻量在线提报入口 V1 落库策略
- 第一轮不建议提交后直接写入 `inventory`。
- 第一轮应单独落到一张 submission / intake 表中。
- 原因：
  - submission 记录本质上是“待处理资料”
  - inventory 记录本质上是“待发布库存草稿”
  - 两者语义不同，混在一起会让 admin 边界变脏
- 因此推荐链路应保持：
  - submission record
  - internal review
  - AI Draft Package
  - inventory draft

### 2.81 已确认的轻量在线提报入口 V1 submission 表最小结构
- 第一轮 submission 表建议至少包含：
  - `id`
  - `supplier_name`
  - `contact_name`
  - `contact_channel`
  - `source_type`
  - `brand`
  - `model_name`
  - `product_type`
  - `unit_price_text`
  - `available_qty_text`
  - `moq_text`
  - `target_market`
  - `warehouse_location`
  - `puff_text`
  - `nicotine_text`
  - `e_liquid_text`
  - `flavor_list`
  - `flavor_breakdown`
  - `image_links`
  - `stock_notes`
  - `packaging_notes`
  - `extra_notes`
  - `submission_status`
  - `internal_notes`
  - `ai_draft_package`
  - `converted_inventory_id`
  - `created_at`
  - `updated_at`
- 其中多数字段保留 text，是为了第一轮优先保证收集成功率，而不是过早卡死输入格式。

### 2.82 已确认的轻量在线提报入口 V1 submission 状态
- 第一轮推荐状态最少只保留：
  - `new`
  - `reviewing`
  - `converted`
  - `rejected`
- 不建议第一轮把状态做得过多，以免入口本身又演变成复杂工作流系统。

### 2.83 已确认的轻量在线提报入口 V1 与 AI / admin 的衔接方式
- submission 记录进入内部后：
  - 可先人工补全关键字段
  - 再生成 AI Draft Package
  - 再从 AI Draft Package 转成 inventory draft
- AI 不直接面向供应商提交页做自动发布判断。
- publish blocker / warning 仍然只在 inventory draft / admin 阶段生效。

### 2.84 已确认的轻量在线提报入口 V1 安全边界
- 第一轮至少应避免“任何人都能公开乱提报”。
- 在不引入完整账号体系的前提下，可接受的第一轮方式包括：
  - 不挂主导航
  - 使用专属链接
  - 采用 Admin/Staff 后台身份校验
- 具体实现以后续落地时选择最轻量方案为准，但目标必须是减少垃圾提交与爬虫污染。

### 2.85 已确认的轻量在线提报入口 V1 第一轮实际落地方式
- 第一轮实际落地采用：
  - 独立路由 `/submit-stock`
  - 后台身份校验 (Admin/Staff 登录态)
  - `supplier_submissions` 独立表落库
  - admin 首页展示 Recent Submissions
  - admin 提供单条 submission review 页
- 该实现已经满足“在线提报入口 → 内部补全 → inventory draft”的最小链路。

### 2.86 已确认的第一轮实际转换方式
- submission review 页允许内部人员：
  - 修改 submission 字段
  - 保存内部 notes
  - 手动转换为 inventory draft
- 第一轮转换不是自动发布，也不是完整 AI 自动转换。
- 第一轮转换完成后：
  - submission 状态转为 `converted`
  - 记录 `converted_inventory_id`
  - 同时写入一份 AI Draft Package seed 供后续链路复用

### 2.87 已确认的当前安全与运维提醒
- 轻量在线提报入口虽然已数字化，但数据库迁移必须先执行后才能使用。
- 后台凭证 (ADMIN_USERNAME 等) 环境变量必须配置，否则无法提交。
- 因此第一轮上线前至少需要：
  - 执行 `supplier_submissions` 相关 migration
  - 配置 `SUPPLIER_SUBMISSION_ACCESS_CODE`
  - 配置 `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. 第二阶段待继续拍板主线
- 第二阶段核心主线第一轮已完成，后续进入实施与细化阶段

---

## 4. 更新规则
- 每完成一个第二阶段小项拍板，必须先更新本文，再进入下一项。
- 若后续讨论推翻已拍板内容，必须直接在本文更新，不保留口头版本。
- 进入第二阶段实施前，必须以本文为最终执行清单逐项核对。
