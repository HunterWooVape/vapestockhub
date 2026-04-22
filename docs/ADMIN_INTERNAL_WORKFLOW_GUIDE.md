# VapeStockHub 内部 / 后台工作流完整指南

## 1. 文档目的

本文件用于统一当前 MVP 阶段的内部录入、后台 review、AI 辅助、draft 编辑与发布前检查流程。

目标不是增加新流程，而是把现在已经落地的页面和动作梳理成一条清晰链路，方便：

- 平台 owner 自己日常操作
- 后续做 workflow review 时逐项核查
- 避免“今天先去哪一页、下一步做什么”这种后台操作模糊问题

---

## 2. 当前 MVP 的后台链路总览

当前推荐标准路径如下：

1. `submit-stock`
2. `admin/submissions`
3. `admin/submissions/[id]`
4. `Generate AI Suggestion`
5. `Convert to Draft`
6. `admin/edit/[id]`
7. 人工检查后决定是否 `active`

用一句话概括：

`原始录入 -> 标准化 review -> AI 候选建议 -> 转成 draft -> 最终人工编辑 -> 发布`

注意：

- AI 目前是“规则型 suggestion 骨架”，不是正式接入真实 LLM。
- AI 在当前阶段的定位是辅助整理，不是自动发布。
- 最终发布责任始终在人工。

当前最小角色分工：

- `Staff` 默认主路径：
  - `submit-stock -> admin/submissions -> admin/submissions/[id] -> Generate AI Suggestion -> Convert to Draft -> admin/edit/[id]`
- `Admin` 默认主路径：
  - `admin -> recent inventory / admin/edit/[id] -> 发布检查 -> 决定是否 active`
- 结论：
  - `Staff` 更偏上游 intake / review / draft 衔接
  - `Admin` 更偏下游 draft 质量检查 / 最终发布决策

---

## 3. 页面职责总表

### 3.1 `/submit-stock`

用途：

- 供应商或内部人员提交原始库存资料
- 允许信息不完美，但必须满足最低必填字段

适合做的事：

- 快速录入一条产品型号的基础信息
- 粘贴原始 notes、flavor、image links、packaging notes
- 在信息不完整时先提交核心字段，后续由后台补齐

不适合做的事：

- 在这里写最终上架文案
- 在这里做发布决策
- 在这里替代后台标准化处理

当前关键机制：

- 最低必填字段缺失会高亮并阻止提交
- 校验失败后会保留本地草稿，避免丢内容
- 页面右侧已有 review flow 提示

---

### 3.2 `/admin`

用途：

- 后台总入口
- 查看日常工作顺序
- 查看 recent submissions / recent inventory

按角色区分：

- `Admin`
  - 看到完整总控台
  - 可见 `手动新建草稿`
  - 可见 `高级入口：导入 AI 草稿包`
  - 可在总控台直接执行状态切换
- `Staff`
  - 看到精简总控台
  - 默认主入口更偏向 `提报队列`
  - 不显示 `手动新建草稿`
  - 不显示 `高级入口：导入 AI 草稿包`
  - 不在总控台执行状态切换

适合做的事：

- 作为每天进入后台的首页
- 快速判断今天先处理 submission 还是 inventory
- `Admin` 使用普通建档入口手动新增 inventory

不适合做的事：

- 把它当作 submission 标准化详情页
- 直接跳过 review 流程批量发布

注意：

- `Import AI Draft Package` 不是日常默认路线
- 它是高级入口，只适合导入外部已经结构化好的 AI JSON
- `Staff` 即使进入 `/admin`，也应把这里理解成“工作流导航页”，不是最终发布工作台

---

### 3.3 `/admin/submissions`

用途：

- submission 总队列
- 每天后台处理 submission 的默认起点

适合做的事：

- 看有哪些新提报
- 看每条 submission 当前状态
- 看最低必填字段是否缺失
- 进入单条 review 页面继续处理

不适合做的事：

- 在列表页完成所有编辑
- 在这里直接做最终 inventory 文案精修

建议默认工作方式：

- 每天先打开这个页面
- 优先处理 `new`
- 再处理 `reviewing`
- `converted` 通常表示已进入 draft，不再是队列主战场

---

### 3.4 `/admin/submissions/[id]`

用途：

- 单条 submission 的标准化和转换中心
- 当前后台 review 的核心页面

这里负责：

- 补齐最低必填字段
- 统一字段格式
- 审核 source 信息是否足够可信
- 生成 AI suggestion
- 转换成 inventory draft

右侧信息区当前已经包含稳定的辅助判断结构：

- `审核状态`
- `缺失字段`
- `AI Assist`
- `原始快照`

其中：

- `缺失字段` 用于先判断是否满足最小处理条件
- `AI Assist` 只在满足条件后进入下一步生成
- `原始快照` 保留原始 submission 上下文，方便核对

这是当前后台最重要的页面，建议把它理解为：

“原始数据 -> 可进入 draft 的标准化中间站”

---

### 3.5 `/admin/edit/[id]`

用途：

- 编辑已创建的 inventory draft
- 做最终发布前检查

这里负责：

- title / slug / price / quantity / market 等正式字段确认
- description 和 media 的最终修正
- contact visibility / status / featured / urgent clearance 设置
- 查看 publish readiness

按角色区分：

- `Staff`
  - 可以继续修正内容字段
  - 可以保存 draft 内容
  - 默认维持当前状态
  - 不可在此页切换到 `active`
  - 不可删除 inventory
- `Admin`
  - 保留完整状态切换能力
  - 可执行最终发布判断
  - 可删除 inventory

当前右侧已增加桥接信息：

- 来源 `Source Submission`
- 返回 `Open Review`
- 最近 AI 的 `Missing Fields`
- 最近 AI 的 `Risk Flags`
- 最近 AI 的 `Human Review Focus`

这意味着后台进入 draft 编辑后，不会和之前的 review 上下文断开。

---

## 4. 标准日常操作流程

## 4.1 每天开始时先做什么

推荐顺序按角色分两条：

`Staff`：

1. 打开 `/admin`
2. 看精简版 `今日工作流`
3. 进入 `/admin/submissions`
4. 先清理新的 submission 队列
5. 再回头处理已有 draft 的内容修正

`Admin`：

1. 打开 `/admin`
2. 看完整总控台中的 `最近提报` 和 `最近草稿 / 库存`
3. 判断今天是先处理 backlog，还是先做发布检查
4. 进入 `/admin/edit/[id]` 做最终质量确认
5. 仅在确认无阻塞后决定是否切到 `active`

原因：

- submission 是上游入口
- 如果上游没处理干净，后面的 draft 会越积越乱
- 把 `Staff` 的默认起点固定在 submission 队列，可以减少误进高级入口或误触发布动作

---

## 4.2 新 submission 的标准处理方式

步骤如下：

1. 进入 `/admin/submissions`
2. 找到目标记录
3. 查看缺失字段提示
4. 点击 `Review Submission`
5. 在 `/admin/submissions/[id]` 完成标准化

在 review 页重点看：

- `Supplier Info` 是否可追溯
- `Product Basics` 是否足够明确
- `Trading & Logistics` 是否满足业务基本判断
- `Flavor, Notes & Media` 是否为后续 draft 提供足够上下文

如果最低必填字段未齐：

- 不要继续 AI
- 不要继续 convert
- 先补齐必填

---

## 4.3 什么时候可以点 `Generate AI Suggestion`

满足条件：

- 最低必填字段全部齐全

当前作用：

- 生成规则型 AI suggestion package
- 写回 `supplier_submissions.ai_draft_package`
- 在 review 页显示 3 个固定输出区块：
  - `Candidate Output`
  - `Latest Suggestion Signals`
  - `AI Draft Package Preview`

后台操作原则：

- 把 AI suggestion 当成“候选整理意见”
- 不要把 AI 输出当成最终真相
- 优先看 `Risk Flags` 和 `Human Review Focus`
- AI 的职责是辅助 review 和 draft，不替代人工发布判断

当前建议的使用顺序：

1. 先人工补齐最小必填
2. 再生成 AI suggestion
3. 看 suggestion 有没有暴露风险
4. 风险可接受时再 convert

---

## 4.4 什么时候可以 `Convert to Draft`

建议满足以下条件后再转换：

- 最低必填字段完整
- 基础 business 字段可信
- AI suggestion 已看过，或你明确知道不需要看
- 没有明显错误的 market / warehouse / qty

转换后会发生什么：

- 创建一条新的 inventory draft
- submission 状态改为 `converted`
- submission 与 inventory 建立关联

转换后下一步：

- 进入 `/admin/edit/[id]`
- 做正式 inventory 编辑

---

## 4.5 draft 编辑页如何处理

进入 `/admin/edit/[id]` 后，建议按下面顺序：

1. 先看右侧 `Publish Readiness`
2. 再看 `Source Submission`
3. 再看 `AI Review Context`
4. 最后改主表单

主表单重点字段优先级：

1. `Title`
2. `Slug`
3. `Brand`
4. `Product Type`
5. `Price`
6. `Quantity`
7. `Market`
8. `Warehouse Location`
9. `Image URL`
10. `Description / Manifest`

说明：

- draft edit 页是“最终发布前整理页”
- 这里允许做正式展示向修正
- 但仍然要保持信息真实，不要编造库存事实

角色补充：

- `Staff`
  - 重点是补内容、修字段、整理展示质量
  - 保存时默认维持当前状态
  - 如果这条记录已具备发布条件，应转交 `Admin`
- `Admin`
  - 在内容整理完成后，负责最后一跳状态决策
  - 只有 `Admin` 应把记录从 `draft` 推到 `active`

---

## 5. AI 在当前流程中的真实角色

当前 AI 不是自动发布器，而是：

- 原始 submission 的整理辅助
- 风险暴露器
- 人工 review 的优先级提示器

当前 AI 会帮助你看到：

- 哪些字段还薄弱
- 哪些地方可能缺价格、图片、风味信息、描述上下文
- 人工下一步应该先复核什么

当前 AI 不负责：

- 直接发布 inventory
- 替你决定价格真实性
- 替你判断库存是否真的可卖

结论：

- AI 提高效率
- 人工负责结果

---

## 6. `Import AI Draft Package` 的正确定位

这是高级入口，不是日常默认工作流。

角色限制：

- 该入口只面向 `Admin`
- `Staff` 默认看不到，也不应依赖它开展日常工作

适用场景：

- 你在站外已经有一份合规、结构化、字段完整的 AI JSON
- 想直接导入成新的 inventory draft

不适用场景：

- 普通供应商提交
- 日常后台 review
- 信息还很乱、还没标准化的 submission

日常推荐路线仍然是：

`submit-stock -> admin/submissions -> submission review -> AI suggestion -> convert -> edit`

不是：

`submit-stock -> Import AI Draft Package`

---

## 7. 当前最重要的人工判断点

即使流程已经更顺，下面这些点仍然必须人工拍板：

### 7.1 价格

- 是否真实
- 是否明显异常
- 是否适合公开展示还是保持 contact required

### 7.2 数量

- 是否可信
- 是否只是一次性短库存
- 是否值得上 active

### 7.3 市场和仓库

- 是否和 source 信息一致
- 是否会影响 SEO 归类和 buyer 判断

### 7.4 图片

- 是否可打开
- 是否对应正确产品
- 是否至少有 1 张有效图

### 7.5 描述

- 是否只是原始碎片
- 是否需要整理成更可读但仍真实的 manifest / listing 文案

---

## 8. 异常与回退处理

### 8.1 submit-stock 校验失败

现状：

- 页面会提示缺失字段
- 本地草稿会保留

建议动作：

- 回到高亮字段补齐
- 不要重新整页填写

---

### 8.2 submission review 里 AI 不可用

常见原因：

- 最低必填字段未齐

建议动作：

- 先看右侧 `Minimum Required Fields`
- 点击缺失字段跳转补齐
- 不要急着点 convert

---

### 8.3 convert 后发现 draft 还不够好

这是正常情况，不算错误。

建议动作：

- 进入 `/admin/edit/[id]`
- 参考右侧 `Source Submission` 和 `AI Review Context`
- 继续人工修正即可

---

### 8.4 想追溯 inventory 是从哪条 submission 来的

现在可以直接在 `/admin/edit/[id]` 右侧查看：

- 来源 submission id
- supplier
- submission status
- `Open Review`

---

## 9. 后台每日推荐节奏

建议节奏按角色区分：

`Staff`：

1. 先看 `/admin/submissions`
2. 清理 `new`
3. 处理 `reviewing`
4. 对成熟记录生成 AI suggestion
5. convert 成 draft
6. 再去 `/admin/edit/[id]` 做内容修正
7. 如达到上线条件，交给 `Admin`

`Admin`：

1. 查看 `/admin` 中的 `最近草稿 / 库存`
2. 打开需要最终判断的 `/admin/edit/[id]`
3. 检查 publish readiness / source submission / AI review context
4. 决定是否保留 `draft`
5. 决定是否切换为 `active / reserved / sold`

这个顺序比“先看 inventory 再想 submission”更顺，因为它符合数据从上游到下游的流向。

---

## 10. Workflow Review 检查清单

后续你检查整条链路时，可以直接按下面清单走：

### 10.1 提交流程检查

- `submit-stock` 是否能正常提交
- 缺失字段时是否会阻止提交
- 失败后草稿是否仍保留
- 提交成功后后台能否看到新 submission

### 10.2 队列流程检查

- `/admin/submissions` 是否能区分 `new / reviewing / converted / rejected`
- 缺失字段提示是否准确
- 是否能一键进入单条 review

### 10.3 review 流程检查

- `/admin/submissions/[id]` 是否能补齐字段
- 高亮和跳转是否准确
- AI Assist 是否只在满足条件后启用
- `Generate AI Suggestion` 是否能生成结果
- `Convert to Draft` 是否能成功创建 inventory

### 10.4 draft 编辑检查

- `/admin/edit/[id]` 是否能看到来源 submission
- 是否能回到 `Open Review`
- 是否能看到 AI risk / review focus
- 保存后数据是否正常
- 发布阻塞提示是否正常
- `Staff` 是否只能保存内容、不能切状态
- `Staff` 是否不能删除 inventory
- `Admin` 是否仍可执行完整状态切换

### 10.5 发布前质量检查

- price 是否有效
- quantity 是否有效
- market / warehouse 是否明确
- image 是否可用
- description 是否能支持页面展示
- status 改为 `active` 时是否仍有阻塞
- `Staff` 是否无法通过 UI 与 server action 发布
- `Admin` 是否不受影响

---

## 11. 当前结论

截至目前，这套内部 / 后台链路已经达到：

- 页面职责基本清晰
- 上下游跳转基本连贯
- AI 介入节点清晰
- convert 后不会彻底丢失 review 上下文
- `Staff` 与 `Admin` 的默认心智已经分开
- 高级入口与最终发布动作已有最小角色边界

当前最推荐的后续动作不是继续加很多新功能，而是：

- 按本文件做一轮完整 workflow review
- 找出仍然卡手、重复、模糊的步骤
- 再做第二轮针对性优化

---

## 12. 一句话操作口令

如果以后需要一句最短版本的后台操作原则，可以直接记：

`先 submissions，后 review；先补齐，后 AI；先 draft，后发布。`
