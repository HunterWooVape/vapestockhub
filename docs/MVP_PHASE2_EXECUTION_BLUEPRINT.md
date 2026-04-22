# VapeStockHub 第二阶段执行蓝图

## 0. 文档用途
- 本文用于定义 VapeStockHub 第二阶段的主框架、目标、边界、阶段拆分、优先级与发布路径。
- 第一阶段已经完成整站语义、SEO 基线与核心页型角色校正。
- 第二阶段不再以“前台页面大改”为主，而是转向“真实数据上线准备、admin 运营能力补强、AI 辅助入库、部署前闭环、上线后回收”。
- 本文负责方法论与执行路线，不直接代替具体拍板记录。

---

## 1. 第二阶段的核心目标
- 让站点从“结构已经正确”升级为“具备真实上线与持续运营能力”。
- 让 admin 后台从“能录入”升级为“能控质量、能承接真实数据、能支撑 SEO 资产生产”。
- 让真实数据上线准备、AI 入库思路、部署前检查与上线后回收形成闭环。

### 1.1 第二阶段解决的问题
- 真实数据尚未完全准备好，但必须提前准备好数据接入与发布流程。
- admin 后台目前偏基础 CRUD，需要逐步具备约束、提醒和发布门槛。
- AI 入库方向已经明确，但还没有形成稳定的工作流边界。
- MVP 虽然可以部署，但正式公开上线仍需满足安全、数据、追踪、联系链路等最小条件。

### 1.2 第二阶段不追求的事
- 不做超出 MVP 的复杂后台产品化。
- 不做博客系统、多语言 SEO、大规模程序化页面扩张。
- 不在真实数据未稳定前，继续做大量“第二轮前台精修”。
- 不追求一次性把 AI 入库完全自动化。

---

## 2. 第二阶段总原则

### 2.1 原则一：先把运营底盘搭好，再谈流量放大
- 前台第一轮已经成型。
- 接下来最关键的是：让真实库存、admin、AI 入库、上线检查可以稳定运行。

### 2.2 原则二：AI 辅助入库，不直接自动发布
- AI 负责提取、映射、标准化、草稿生成、缺失项提示。
- 人工负责价格、数量、market、warehouse_location、图片、发布确认。
- 第二阶段不采用“原始资料 → AI → 自动上线”的风险模式。

### 2.3 原则三：部署分层，不把“能部署”误判为“适合公开上线”
- 允许先部署预览与软上线。
- 正式公开上线必须以真实数据质量与安全条件达标为前提。

### 2.4 原则四：继续采用“拆解 → 讨论 → 拍板 → 记录 → 实施”的工作方式
- 第二阶段继续文档先行。
- 每个小项先拆解讨论，再进入拍板与落地，避免系统层返工。

---

## 3. 第二阶段分段路线

## 3.1 2A：admin 后台与数据生产准备

### 目标
- 让后台具备真实数据录入、质量提示、发布门槛与未来 AI 草稿承接能力。

### 重点内容
- admin 字段约束最小集
- 标准值与半结构化输入策略
- 草稿态 / 发布态思路
- 字段质量提醒机制
- 与 `DATA_ENTRY_STANDARDS.md` 的规则对齐

### 交付方向
- admin 后台准备清单
- 后台最小升级项列表
- 发布门槛规则草案

---

## 3.2 2B：真实数据接入准备

### 目标
- 在真实数据未完全到位前，先设计好导入节奏、清洗规则、优先级与替换策略。

### 重点内容
- 第一批真实数据最小样本定义
- 模拟数据替换策略
- 第一批重点市场与重点品牌优先级
- 第一批详情页和聚合页的真实数据覆盖策略

### 交付方向
- 第一批真实数据上线策略
- 数据切换节奏表
- 真实数据优先级建议

---

## 3.3 2C：AI 入库工作流规划

### 目标
- 明确 AI 在库存导入链路中的职责边界与工作方式。

### 重点内容
- 原始输入来源：Excel / 文本 / 表格 / 聊天记录
- AI Draft Package V1 最小结构
- 提取字段映射逻辑
- 标准化规则与异常提示
- prompt 资产结构与版本化规则
- description_summary / manifest_notes 双段输出
- flavor_tags / flavor_breakdown 双层输出
- admin 草稿承接方式
- 人工终审边界

### 交付方向
- AI 入库工作流图
- AI Draft Package 结构草案
- AI Draft Package → admin draft 承接说明
- admin AI Draft JSON 导入入口
- prompt asset v1
- AI 可做 / 不可做边界表
- 后续实现优先级清单

---

## 3.4 2D：部署前发布闭环

### 目标
- 定义站点从“可预览”到“可软上线”再到“可正式公开”的门槛。

### 重点内容
- 管理员安全项
- 环境变量复核
- 联系链路实测
- 搜索引擎与统计工具接入准备
- robots / sitemap / canonical / noindex 自检
- 第一批真实数据上线前检查

### 交付方向
- 部署前最小检查清单
- 软上线条件
- 正式公开上线条件

---

## 3.5 2E：上线后 30 天回收计划

### 目标
- 用真实数据和真实流量反馈驱动第二轮 SEO 与运营优化。

### 重点内容
- Search Console 观察路径
- impressions / CTR / indexed pages / queries
- 高价值 market / brand / detail 页识别
- 低价值 taxonomy 页收缩策略
- 私域承接与页面联动优化

### 交付方向
- 上线后 7 / 14 / 30 天检查清单
- 第二轮优化方向建议

---

## 4. 第二阶段的上线分层定义

### 4.1 预览上线
- 用于开发验证与内部查看。
- 可带少量模拟数据。
- 不作为正式对外状态。

### 4.2 软上线
- 已有一批真实库存。
- 联系链路和基本安全已完成。
- 可开始承接少量真实流量与询盘。
- 建议作为 MVP 的优先上线目标。

### 4.3 正式公开上线
- 真实数据质量稳定。
- admin 规则清晰。
- 基础统计与站长工具接入完成。
- 线索链路可稳定工作。
- 适合开始更主动地获取外部流量。

---

## 5. 第二阶段的最小发布条件

### 5.1 数据条件
- 至少有一批真实库存替换关键模拟内容。
- 首页、Inventory、若干详情页、重点 Market 页和重点 Brand 页有真实内容支撑。

### 5.2 安全条件
- 管理后台安全项完成整改。
- 生产环境变量完成复核。
- 弱口令和测试态配置不得进入生产。

### 5.3 转化条件
- Telegram / WhatsApp 链路完整可用。
- 预填消息内容已测试。
- source tracking 可正常回流。

### 5.4 SEO 条件
- robots / sitemap / canonical / noindex 已按当前策略自检通过。
- 低库存聚合页与参数页的索引规则已明确。

### 5.5 监控条件
- 至少接入 Search Console。
- 至少接入 1 套基础统计系统。

---

## 6. 你需要逐步提供给我的材料

### 6.1 现在阶段就有帮助的
- 你优先想做的 2-3 个目标市场
- 你优先想做的 3-5 个品牌
- 供应商原始资料样本 2-5 份
- 你希望 AI 最终产出的 admin 字段形式
- 你对高质量询盘的判断标准

### 6.2 真实数据逐步到位时提供
- 第一批真实库存样本
- 几份典型乱格式 Excel / 文本 / 库存单
- 哪些字段你更信 AI，哪些字段必须人工复核
- 哪些市场和品牌你准备优先推动

### 6.3 上线前后建议提供
- Search Console 数据
- SEMrush / Ahrefs / 关键词工具导出
- 私域运营节奏
- Telegram / WhatsApp 承接路径
- 每周上新频率与主要库存方向

---

## 7. 第二阶段的文档协作方式
- 本文负责第二阶段总路线与方法论。
- 后续另建一份拍板记录文档，负责记录每个小项的最终决定。
- 第二阶段仍然采用：
  - 主框架文档
  - 拍板记录文档
  - 小项拆解
  - 小项总结
  - 统一实施

---

## 8. 第二阶段建议执行顺序
- 第一步：admin 后台与真实数据上线准备清单
- 第二步：AI 入库工作流与人工终审边界
- 第三步：第一批真实数据上线策略
- 第四步：部署前最小发布清单
- 第五步：上线后 30 天回收计划

---

## 9. 当前判断
- 第二阶段现在就可以开始，不需要等真实数据全部准备完。
- 当前最合理的下一步不是继续大改前台，而是把数据、admin、AI 入库、发布与上线节奏设计清楚。
- 第二阶段完成后，大概率可进入“软上线准备完毕”状态。
- 是否正式公开上线，仍需根据真实数据质量与安全条件最终拍板。

---

## 10. 第二阶段实施清单（执行版）

### 10.1 现在就可以做
- admin 后台最小升级项梳理
- admin 默认 Draft 流程落地
- Draft → Active 发布门槛与阻断规则落地
- admin 成功 / 错误反馈展示补齐
- admin publish readiness 面板与 blocker / warning 提示落地
- product_type / contact_visibility 固定选项化
- brand / market 推荐值输入与标准值归一化
- brand / market / product_type / contact_visibility 的约束方案
- AI Draft Package V1 结构定义
- AI Draft Package 到 admin draft 的字段映射
- flavor 双层模型的承接设计
- description AI 主生产规则与 prompt 资产化设计
- prompt asset v1 与版本标记
- AI Draft Package 输出结构定义
- 供应商模板 V1 外发试探与反馈收集
- 供应商提交最小准入标准与 Green / Yellow / Red 分级规则
- 轻量在线提报入口 V1 方案拆解
- 部署前最小检查清单草案
- 软上线与正式公开上线条件确认

### 10.2 等真实数据样本到位后做
- 第一批真实库存白名单筛选
- Wave 1 / Wave 2 导入节奏确定
- 重点市场与重点品牌优先级确认
- 真实 inventory detail 样本抽样复核
- taxonomy 覆盖是否成立的抽样检查
- 第一批真实数据导入与软上线前复核
- 模板 V2 与更深度反馈回路优化

### 10.2A 轻量在线提报入口 V1 目标
- 用在线表单替代反复发送 Excel 模板
- 支持供应商直接填写，也支持内部人员代填
- 将提交结果引入内部待处理链路，而不是直接发布
- 为 AI Draft Package 与 admin draft 提供结构化上游输入

### 10.2B 轻量在线提报入口 V1 边界
- 不做账号系统
- 不做 vendor dashboard
- 不做供应商自助查看历史提交
- 不做供应商自助编辑状态
- 不做自动发布
- 不做批量 Excel 上传解析

### 10.2C 轻量在线提报入口 V1 推荐数据流
- 在线提报入口提交
- 内部补全关键字段
- AI Draft Package 结构化与风险提示
- admin draft
- blocker / warning / 人工终审
- active

### 10.2D 轻量在线提报入口 V1 页面结构
- 区块 1：Access / Submission Notice
- 区块 2：Supplier Info
- 区块 3：Product Basics
- 区块 4：Trading & Logistics
- 区块 5：Flavor & Notes
- 区块 6：Media & Submit
- 第一轮目标是降低填写摩擦，不是复制 admin 全量字段。

### 10.2E 轻量在线提报入口 V1 最小字段
- 必填：
  - Supplier Name
  - Brand
  - Model / Product Name
  - Product Type
  - Available Qty
  - Target Market
  - Warehouse Location
- 推荐：
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

### 10.2F 轻量在线提报入口 V1 落库设计
- 第一轮不直接写 `inventory`
- 第一轮单独写 submission / intake 表
- submission 状态最少建议：
  - `new`
  - `reviewing`
  - `converted`
  - `rejected`
- submission 记录应允许保存：
  - 原始提报内容
  - 内部补充说明
  - AI Draft Package
  - 最终转换出的 inventory id

### 10.2G 轻量在线提报入口 V1 已落地项
- `supplier_submissions` 独立表 migration
- `/submit-stock` 私用提报入口页
- 简单访问码校验
- admin 首页 Recent Submissions 区块
- `/admin/submissions/[id]` review 页面
- submission → inventory draft 手动转换动作

### 10.3 软上线前必须完成
- 管理后台安全项整改
- 环境变量与生产配置复核
- Telegram / WhatsApp / source tracking 实测
- robots / sitemap / canonical / noindex 抽样检查
- Search Console 与基础统计工具接入
- 第一批真实数据覆盖关键路径
- 首页、Inventory、重点 Market / Brand、若干 detail 页去模拟感检查

### 10.4 正式公开上线前建议完成
- 第一轮真实反馈后的页面级复核
- taxonomy 页优先级与 noindex 口径再次确认
- 第一批真实询盘质量判断
- admin 发布边界在真实场景下经过一轮验证
- 每周复盘机制建立

### 10.5 上线后再做
- Search Console 驱动的第二轮 metadata 精修
- 高价值 market / brand / detail 页继续加强
- 低价值 taxonomy 页收缩
- AI 入库从草稿模式向更稳的半自动流程扩展
- 供应商模板 V2 迭代
- 私域承接路径优化

### 10.6 当前推荐执行顺序
- 第一步：admin 后台最小升级项与发布门槛清单
- 第二步：AI Draft Package / prompt / 规则层方案
- 第三步：供应商模板外发、最小准入标准与 Green / Yellow / Red 分级规则
- 第四步：轻量在线提报入口 V1 方案与落地
- 第五步：通过入口收集资料并由内部人工补全关键字段
- 第六步：AI Draft Package → draft 小批量真实数据接入
- 第七步：从真实候选池中筛选第一批白名单并覆盖关键页面
- 第八步：部署前最小检查清单落地
- 第九步：软上线准备与第一批真实数据接入
