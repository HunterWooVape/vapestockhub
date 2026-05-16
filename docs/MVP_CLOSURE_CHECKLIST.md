# VapeStockHub MVP 未收尾事项与短期收口清单

更新时间：2026-05-15

## 1. 文档目的
- 本文用于把 `MVP` 当前“未收尾事项”整理成可执行的短期收口 checklist。
- 本文与 `MVP_AUDIT_REPORT.md` 的关系如下：
  - `MVP_AUDIT_REPORT.md` 负责复盘、审计、判断阶段状态。
  - 本文负责把未收尾事项拆成可执行动作、验收口径和完成标记。
- 本文默认服务于 `1-2 个月` 的短期收口阶段。

---

## 2. 使用方式
- 每完成一个小项，就在本文中更新状态。
- 若某项已不再适用，不直接删除，改为标记“取消”并写明原因。
- 若执行中发现新遗留项，应新增到对应优先级，不要只保留口头结论。
- 本文完成度达到结案门槛后，可作为 `MVP` 阶段结案依据之一。

---

## 3. 当前状态定义
- 当前项目状态：`MVP 主体完工，进入短期收口阶段`
- 当前目标状态：`MVP 阶段性结案`

---

## 4. P0：必须完成的未收尾事项

### 4.1 正式环境全链路 walkthrough
状态：`未完成`

执行文档：
- `docs/MVP_PRODUCTION_WALKTHROUGH_CHECKLIST.md`

执行动作：
- 验证前台链路：
  - 首页 `/`
  - 列表页 `/inventory`
  - 详情页 `/inventory/[slug]`
  - 市场页 `/market/[slug]`
  - 品牌页 `/brand/[slug]`
  - 价格页 `/price/[slug]`
  - Telegram 跳转
  - WhatsApp 跳转
- 验证后台链路：
  - `/admin` 登录
  - `/submit-stock`
  - `/admin/submissions`
  - `/admin/submissions/[id]`
  - `/admin/edit/[id]`
- 验证数据链路：
  - CTA 点击后 `leads` 是否入库
  - submission 是否成功写入
  - draft 是否可生成
  - 发布后前台是否刷新可见

验收标准：
- 前后台关键链路全部可用
- 无阻断级错误
- 至少抽样验证 `1-3` 条真实记录

### 4.2 监控 webhook 接通
- [x] 配置 `MONITORING_WEBHOOK_URL` 和 `MONITORING_WEBHOOK_TOKEN`
  - 状态：已完成 (2026-05-16)
  - 验证：`/health` 返回 `webhookEnabled: true`，且转发器连通性测试通过。

### 4.3 生产数据库备份确认
- [x] 配置数据库定时备份
  - 状态：已完成 (2026-05-16)
  - 执行动作：新增 `.github/workflows/db-backup.yml` 使用 GitHub Actions 每日凌晨通过 `pg_dump` 备份数据库，并存为 Artifacts。
  - 前提：需在 GitHub Secrets 配置 `SUPABASE_DB_URL`。

### 4.4 生产环境变量复核
状态：`未完成`

执行动作：
- 对齐以下字段：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `BACKOFFICE_SESSION_SECRET`
  - `MONITORING_ENVIRONMENT`
  - `MONITORING_WEBHOOK_URL`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `STAFF_USERNAME`
  - `STAFF_PASSWORD`
- 额外确认：
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - `GOOGLE_SITE_VERIFICATION`

验收标准：
- 生产环境变量与实际代码依赖字段完全对齐
- 不存在“代码已依赖、文档未记录、生产未配置”的字段

---

## 5. P1：短期应补齐的未收尾事项

### 5.1 最小 CI 流水线
- [x] 补齐最小 CI 质量门禁 (Lint/Build)
  - 状态：已完成 (2026-05-16)
  - 交付：`.github/workflows/ci.yml`

### 5.2 最小 smoke test
- [x] 补齐最小自动化 Smoke Test
  - 状态：已完成 (2026-05-16)
  - 交付：`scripts/smoke-test.js`，支持 `npm run smoke-test`。

### 5.3 README 与部署文档对齐
- [x] README 与部署文档对齐
  - 状态：已完成 (2026-05-16)
  - 交付：更新了 `README.md` 和 `.env.example`，包含 GA 和 Google 验证字段，并补充了 `smoke-test` 指令。

### 5.4 Search Console 接入
- [x] 配置 `GOOGLE_SITE_VERIFICATION` 并提交 `sitemap.xml`
  - 状态：已完成 (2026-05-16)
  - 备注：用户已在 Search Console 侧确认接入完毕。

### 5.5 GA4 数据回流确认
- [x] 确认 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 数据回流
  - 状态：已完成 (2026-05-16)
  - 备注：用户已在 GA4 后台确认回流正常。

### 5.6 文档基线统一
- [x] 修正并统一基线文档口径
  - 状态：已完成 (2026-05-16)
  - 备注：已在全局搜索并修正了 `MVP_PHASE2_DECISIONS.md` 和 `MVP_PHASE2_EXECUTION_BLUEPRINT.md` 等文件中关于“简单访问码校验”的过时描述，统一为“后台身份校验”。

---

## 6. P1：运营闭环类未收尾事项

### 6.1 真实库存复核节奏
状态：`未完成`

执行动作：
- 明确复核人
- 明确复核频率
- 明确复核字段：
  - price
  - quantity
  - market
  - warehouse_location
- 明确异常库存处理方式

验收标准：
- 已形成固定节奏，不再临时处理

### 6.2 周复盘模板
状态：`未完成`

执行动作：
- 建立周复盘模板
- 至少记录：
  - 有效询盘数
  - 首响时效
  - 页面到联系点击率
  - 活跃库存有效率
  - 本周问题与修正动作

验收标准：
- 每周可复盘，不靠零散记忆

### 6.3 有效询盘口径
状态：`未完成`

执行动作：
- 明确定义什么叫“有效询盘”
- 区分：
  - 新线索
  - 无效线索
  - 可继续跟进线索
  - 高价值线索

验收标准：
- 后续看板和判断标准统一

### 6.4 重点页面维护名单
状态：`未完成`

执行动作：
- 列出短期重点维护页面：
  - 首页
  - Inventory 列表
  - 重点 Market 页
  - 重点 Brand 页
  - 若干高价值详情页
- 明确优先级与责任人

验收标准：
- 后续优化有明确主战场，不是平均用力

---

## 7. P2：可并行推进的优化项

### 7.1 低库存索引口径复核
状态：`未完成`

执行动作：
- 复核当前线上低库存 `Market / Brand / Price` 页
- 检查 `index / noindex` 是否符合当前库存阈值

验收标准：
- 当前索引规则和真实库存规模一致

### 7.2 首页与列表页展示细节修正
状态：`未完成`

执行动作：
- 检查首页和列表页中不够稳定的库存信息表达
- 优先修正影响信任感的展示问题

验收标准：
- 关键信息表达更稳定、更可信

### 7.3 walkthrough 文档更新
状态：`未完成`

执行动作：
- 用当前真实链路重写后台 walkthrough 清单
- 确保后续测试不再基于旧入口和旧理解

验收标准：
- 后台 walkthrough 文档与真实实现一致

---

## 8. 短期建议排期

### 第 1 周
- 正式环境 walkthrough
- webhook 接通
- 生产环境变量复核
- 数据库备份确认

### 第 2 周
- 最小 CI
- 最小 smoke test
- README 与部署文档对齐
- Search Console 接入
- GA4 回流确认

### 第 3-4 周
- 建立库存复核节奏
- 建立周复盘模板
- 明确有效询盘口径
- 梳理重点页面维护名单

### 第 5-8 周
- 修正 walkthrough 中发现的问题
- 复核低库存索引口径
- 关闭剩余未收尾事项
- 输出阶段性结案记录

---

## 9. MVP 结案判断

### 9.1 可以判定结案的条件
满足以下条件后，可将 `MVP` 视为阶段性结案：

1. `P0` 项全部完成
2. `P1` 中质量保障项全部完成
3. `P1` 中运营闭环项已开始执行
4. 真实站点已跑过至少一轮稳定观察周期
5. 未收尾事项已从“模糊风险”变成“明确处理完成或明确延期”

### 9.2 当前结论
- 现在还不算结案
- 等这份 checklist 的核心项完成后，才适合正式宣布 `MVP` 阶段结案

---

## 10. 一句话总结
- `MVP 现在不是缺主体功能，而是缺最后一轮收口；把这份未收尾事项清单做完，MVP 才算真正结案。`
