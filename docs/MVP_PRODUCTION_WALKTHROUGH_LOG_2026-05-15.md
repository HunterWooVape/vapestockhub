# VapeStockHub 正式环境 Walkthrough 执行记录

执行日期：2026-05-15

适用域名：

- `https://www.vapestockhub.com/`

参考文档：

- `docs/MVP_PRODUCTION_WALKTHROUGH_CHECKLIST.md`
- `docs/MVP_PRODUCTION_WALKTHROUGH_LOG_TEMPLATE.md`

---

## 1. 本次执行范围
- 本次已执行：
  - `Admin / Staff` 后台登录
  - 角色边界验证
  - `/submit-stock` 页面访问
  - `/admin/submissions` 页面访问
  - 前台 `Telegram` CTA 跳转
  - `leads` 表回流验证
  - `/health` 线上状态验证
- 本次未执行：
  - 新建 production submission
  - `submission -> draft`
  - `draft -> active -> 前台刷新`

说明：

- 本次以“先跑真实链路、尽量避免直接污染生产数据”为原则。
- 当前生产库不存在待审核 submission，也不存在 draft inventory，因此无法基于现成数据继续验证转换与发布链路。

---

## 2. 执行结果

| 页面 / 动作 | 角色 | 结果 | 备注 |
|---|---|---|---|
| `/admin` 登录 | Admin | 顺 | `303 -> /admin` |
| `/admin` 登录 | Staff | 顺 | `303 -> /admin` |
| `/admin` 后台总控台 | Admin | 顺 | 可见 `Admin 工具` 入口 |
| `/admin` 后台总控台 | Staff | 顺 | 不可见 `Admin 工具` 入口 |
| `/admin/tools` | Admin | 顺 | 返回 `200` |
| `/admin/tools` | Staff | 顺 | `307 -> /admin?error=insufficient-role` |
| `/submit-stock` | Admin | 顺 | 返回 `200` |
| `/submit-stock` | Staff | 顺 | 返回 `200` |
| `/admin/submissions` | Admin | 顺 | 返回 `200` |
| `/admin/submissions` | Staff | 顺 | 返回 `200` |
| `/go/telegram` | 公开 | 顺 | `307 -> https://t.me/VapeStockHub` |
| `leads` 回流 | 公开 | 顺 | 成功写入最新线索记录 |
| `/health` | 公开 | 顺 | `status = ok`，`webhookEnabled = true` (2026-05-16 验证通过) |

---

## 3. 数据验证结果

### 3.1 leads 回流
- 已触发测试链接：
  - `/go/telegram?sourcePageType=inventory&sourcePageSlug=ivg-savr-pod-kit&itemSlug=ivg-savr-pod-kit`
- 已在生产库 `leads` 表中确认新增记录，关键字段如下：
  - `source_page_type = inventory`
  - `source_page_slug = ivg-savr-pod-kit`
  - `source_channel = telegram`
  - `item_slug = ivg-savr-pod-kit`
  - `lead_status = new`

### 3.2 当前生产库样本状态
- `supplier_submissions` 中当前 `new / reviewing` 且 `converted_inventory_id is null` 的记录数：`0`
- `inventory` 中当前 `draft` 记录数：`0`
- `inventory` 中当前 `active` 记录存在，说明前台已上线数据正常服务

结论：

- 本次未能继续验证 `submission -> draft -> active`，不是因为页面异常，而是因为当前生产库没有可用于抽检的开放样本。

---

## 4. 发现的问题

### 4.1 已解决问题
- `webhookEnabled = true` (2026-05-16 已接通)

---

### 4.2 当前未覆盖链路
- `/admin/submissions/[id]`
- `/admin/edit/[id]`
- `submission -> draft`
- `draft -> active`
- 发布后的前台刷新

未覆盖原因：

- 当前生产库无待审核 submission。
- 当前生产库无 draft inventory。
- 本次未主动创建 production 测试数据。

---

## 5. 角色边界结论
- `Admin` 可以正常进入 `/admin/tools`
- `Staff` 访问 `/admin/tools` 时会被拦回 `/admin?error=insufficient-role`
- 现有线上角色边界与预期一致

代码依据可见：

- [page.tsx](file:///Users/dezuo/Desktop/项目开发/vapestockhub/src/app/admin/page.tsx#L363-L373)
- [page.tsx](file:///Users/dezuo/Desktop/项目开发/vapestockhub/src/app/admin/edit/[id]/page.tsx#L437-L445)

---

## 6. 本次结论
- 本次 walkthrough 已确认：
  - 正式环境后台登录正常
  - `Admin / Staff` 基础角色边界正常
  - 内部录入与审核队列页面可访问
  - 前台 `Telegram` CTA 跳转正常
  - `leads` 数据回流正常
  - `/health` 可访问，但告警未接通
- 本次 walkthrough 仍未完成全链路闭环验证
- 当前 `P0` 第一项状态应判断为：
  - `部分完成`

---

## 7. 下一步建议
- 方案 A：
  - 由你确认是否允许我在 production 创建 1 条带明显测试标记的 submission
  - 然后继续跑通 `submission -> draft -> active`
- 方案 B：
  - 你先在后台手工创建 1 条测试 submission 或 1 条 draft
  - 我基于现成数据继续做后半段 walkthrough
- 方案 C：
  - 暂不写生产测试数据
  - 先转去执行下一个 `P0` 项：`webhook` 接通

---

## 8. 一句话总结
- `这轮已经把“登录、角色、页面访问、CTA 回流”跑通了，但生产库当前没有开放样本，所以转换与发布链路还差最后半程。`
