# VapeStockHub 正式环境 Walkthrough 清单

更新时间：2026-05-15

适用域名：

- `https://www.vapestockhub.com/`

---

## 1. 文档目的
- 本文用于执行 `MVP` 短期收口阶段的正式环境 walkthrough。
- 本文重点不是“再讨论要不要做”，而是让执行人按固定顺序逐项验证：
  - 前台链路
  - 后台链路
  - 数据回流链路
  - 运维链路
- 本文默认服务于：
  - `docs/MVP_CLOSURE_CHECKLIST.md` 的 `4.1 正式环境全链路 walkthrough`

---

## 2. 执行原则
- walkthrough 必须在正式域名上完成，不再只基于本地环境判断。
- 每条链路至少记录：
  - `顺`：可连续完成，无需停顿解释
  - `卡`：能完成，但中间需要判断或有明显不顺手
  - `断`：无法继续，或结果与预期不一致
- 每发现一个问题，只记录最小信息：
  - 页面或动作
  - 问题描述
  - 属于 `顺 / 卡 / 断`
  - 是否影响业务跑通

---

## 3. 执行前准备

### 3.1 账号与环境
- 已准备 `Admin` 账号
- 已准备 `Staff` 账号
- 已能访问正式域名
- 已能访问 Supabase 生产库
- 已能查看 `leads`、`supplier_submissions`、`inventory` 相关数据

### 3.2 建议准备 1-3 条演练数据
- 1 条用于前台 CTA 测试的真实详情页
- 1 条用于 `submit-stock -> submissions -> draft -> publish` 的内部提报
- 1 条用于验证后台状态流转与前台刷新

### 3.3 建议记录方式
- 建议新建一份执行记录表，字段如下：
  - 时间
  - 执行人
  - 角色
  - 页面 / 动作
  - 结果
  - 问题
  - 是否阻断
- 推荐直接使用：
  - `docs/MVP_PRODUCTION_WALKTHROUGH_LOG_TEMPLATE.md`

---

## 4. 前台链路

### 4.1 首页 `/`
检查项：
- 页面可正常打开
- Hero 文案与 CTA 正常显示
- `Browse Inventory` 可跳转到 `/inventory`
- `Request via Telegram` 可跳转 `/go/telegram?...`
- Featured Inventory 正常展示
- Latest Active Inventory 正常展示

通过标准：
- 页面无明显报错或空白区块
- CTA 均可点击并进入正确链路

### 4.2 库存列表 `/inventory`
检查项：
- 列表页可正常打开
- 品牌筛选可用
- 市场筛选可用
- 分页可用
- 列表卡片信息展示完整：
  - 标题
  - 品牌
  - 仓库
  - 价格状态
  - 数量
  - MOQ

通过标准：
- 列表可浏览、可筛选、可翻页
- 没有明显展示错位或断链

### 4.3 详情页 `/inventory/[slug]`
检查项：
- 抽样打开至少 `2-3` 个真实详情页
- 页面基础信息完整：
  - 标题
  - 品牌
  - 产品类型
  - 数量
  - MOQ
  - 市场
  - 仓库
  - 价格状态
- `Telegram` 和 `WhatsApp` CTA 可点击
- Related Inventory 正常展示

通过标准：
- 页面内容可信
- CTA 可进入联系链路
- 没有 404、空图、关键字段缺失导致的明显失真

### 4.4 市场页 `/market/[slug]`
检查项：
- 抽样验证：
  - `index` 市场页 1 个
  - `noindex` 市场页 1 个
- 页面能正常打开
- 页面列表与市场语义一致
- 页面 metadata / robots 符合预期

通过标准：
- 高库存页走 `index, follow`
- 低库存页走 `noindex, follow`

### 4.5 品牌页 `/brand/[slug]`
检查项：
- 抽样验证：
  - `index` 品牌页 1 个
  - `noindex` 品牌页 1 个
- 页面能正常打开
- 页面列表与品牌语义一致
- 页面 metadata / robots 符合预期

通过标准：
- 高库存页走 `index, follow`
- 低库存页走 `noindex, follow`

### 4.6 价格页 `/price/[slug]`
检查项：
- 至少抽样验证 `under-3`
- 页面可正常打开
- 页面列表与价格带语义一致
- CTA 可继续进入详情页

通过标准：
- 页面可访问
- 价格带语义与列表结果基本一致

### 4.7 CTA 跳转链路
检查项：
- 从首页点一次 Telegram
- 从详情页点一次 Telegram
- 从详情页点一次 WhatsApp
- 最终跳转目标正确

通过标准：
- `/go/[channel]` 可正常重定向
- 不出现跳回首页、404、错误页面

---

## 5. 后台链路

### 5.1 `/admin` 登录
检查项：
- `Admin` 可登录
- `Staff` 可登录
- 错误密码时提示正常
- 连续错误密码后限流是否生效

通过标准：
- 两类账号均可正常进入各自后台视图
- 登录异常时有明确反馈

### 5.2 `/submit-stock`
检查项：
- 页面可正常进入
- 必填字段易理解
- 缺失字段提示明确
- 提交成功后能进入后续审核链路

通过标准：
- 录入动作可完成
- 提交成功后不会丢上下文

### 5.3 `/admin/submissions`
检查项：
- 新提交记录是否出现在审核队列
- 是否可快速进入单条审核页
- 列表是否能看懂优先级和下一步动作

通过标准：
- 新提报可见
- 审核入口清楚

### 5.4 `/admin/submissions/[id]`
检查项：
- 可编辑 submission 字段
- 缺失字段提示明确
- 可执行 AI 建议生成或草稿承接动作
- 可执行转草稿动作

通过标准：
- 审核页能承担“标准化与转换中心”的职责

### 5.5 `/admin/edit/[id]`
检查项：
- 草稿可正常打开
- 草稿来源关系清楚
- 可继续修正字段
- `Admin` 可完成发布
- `Staff` 权限受限符合预期

通过标准：
- 草稿编辑和发布链路连续
- 角色边界清楚

---

## 6. 数据回流链路

### 6.1 `leads` 表回流
检查项：
- 从前台详情页触发 `Telegram` 或 `WhatsApp`
- 到 Supabase 生产库查询最新 `leads`
- 验证以下字段：
  - `source_page_type`
  - `source_page_slug`
  - `source_channel`
  - `item_slug`
  - `lead_status`

通过标准：
- 线索成功入库
- 字段值与实际点击来源一致

### 6.2 `supplier_submissions` 表回流
检查项：
- 从 `/submit-stock` 提交 1 条测试记录
- 到 Supabase 查询最新 submission
- 验证关键字段是否正常写入

通过标准：
- 提报成功落库
- 没有字段截断或写入失败

### 6.3 `submission -> inventory draft`
检查项：
- 从审核页完成转草稿
- 到 `inventory` 表查看是否生成 `draft`
- 核对 slug、title、brand、market 等核心字段

通过标准：
- draft 成功生成
- submission 与 draft 关系清楚

### 6.4 `draft -> active -> 前台刷新`
检查项：
- 使用 `Admin` 发布 1 条草稿
- 回到前台检查：
  - 首页是否刷新
  - `/inventory` 是否可见
  - 对应详情页是否可访问
  - `sitemap.xml` 是否最终纳入

通过标准：
- 发布后前后台数据一致
- 不出现后台已发布、前台仍旧不可见的情况

---

## 7. 运维链路

### 7.1 `/health`
检查项：
- 访问 `https://www.vapestockhub.com/health`
- 记录：
  - `status`
  - `environment`
  - `webhookEnabled`

通过标准：
- 返回 `200`
- 结果为有效 JSON

### 7.2 webhook 告警
检查项：
- 确认 `MONITORING_WEBHOOK_URL` 已配置
- 使用 `/admin/tools` 中的“发送测试 webhook”按钮主动发送一条测试告警
- 触发 1 次可控监控事件
- 检查告警接收端

通过标准：
- 告警真实到达

### 7.3 生产日志可见性
检查项：
- 确认部署平台日志可访问
- 出现错误时可定位基本请求上下文

通过标准：
- 不依赖猜测，能看到基础日志

---

## 8. 执行结果记录模板

建议直接基于 `docs/MVP_PRODUCTION_WALKTHROUGH_LOG_TEMPLATE.md` 记录。

若只做极简记录，也可按下面格式记录每一项：

```text
页面/动作：
角色：
结果：顺 / 卡 / 断
问题：
是否阻断：是 / 否
备注：
```

---

## 9. Walkthrough 结束后的判断

### 9.1 可判定“通过”的条件
- 前台主链路全部为 `顺` 或少量 `卡`
- 后台主链路无 `断`
- `leads`、`submission`、`draft`、`active` 回流链路正常
- `/health` 正常
- 告警或日志至少有一种可用

### 9.2 若结果为“卡”
- 先记录问题
- 判断是否影响业务跑通
- 优先修正影响成交、发布或数据回流的问题

### 9.3 若结果为“断”
- 直接列为 `P0` 阻断项
- 在修复前，不建议把 `MVP` 判定为结案

---

## 10. 与 MVP 结案的关系
- 本文通过，不代表整个 `MVP` 自动结案。
- 但如果本文未通过，则 `MVP` 一定不能结案。
- 本文通过后，还需继续完成：
  - webhook 接通
  - 最小 CI / smoke test
  - 文档基线统一
  - 运营复核节奏落地

---

## 11. 一句话总结
- `这份 walkthrough 清单的作用，是把“看起来能用”变成“正式环境里已经逐项验证能用”。`
