# VapeStockHub 上线修复与部署交接文档

更新时间：2026-05-01

## 1. 当前结论

当前项目已经从“只能预发”推进到：

- 代码侧已达到“可以谨慎开始生产部署”的阶段
- 仍建议先完成一轮预发 walkthrough，再进行正式放量

当前验证结果：

- `npm run lint` 通过
- `npm run build` 通过
- 后台登录已有最小限流
- `/go/[channel]` 已有最小反刷
- 已有最小监控基础与 `/health` 健康检查

## 2. 本轮已完成修复

### 2.1 基础质量门禁

- 修复了 `src/components/submissions/form-draft-sync.tsx` 的 React Hooks lint 阻断
- 全仓当前 `eslint` 通过
- 生产构建 `next build` 通过

### 2.2 环境与文档

- 补齐了 `.env.example`
- README 已更新为当前项目实际部署说明
- 已明确区分“可预发部署”和“可谨慎生产部署”的阶段门槛

### 2.3 安全基础加固

- `next.config.ts` 已增加基础安全响应头
- 已关闭 `X-Powered-By`
- 后台登录增加最小防暴力破解机制：
  - 连续失败达到阈值后短时锁定
  - 成功登录后自动清空失败计数

### 2.4 线索接口反刷

- `/go/[channel]` 已增加最小反刷逻辑
- 对 `sourcePageType` 做白名单约束
- 对 `sourcePageSlug` / `itemSlug` 做长度和格式约束
- 对 `message` 做清洗和长度限制
- 高频异常请求仍允许用户跳转 Telegram / WhatsApp
- 但高频异常请求会跳过 `leads` 写库，避免线索表被刷爆

### 2.5 最小监控基础

- 新增 `src/instrumentation.ts`
- 新增 `src/lib/monitoring.ts`
- 新增 `/health` 健康检查路由
- 已支持：
  - 服务端请求错误结构化日志
  - 可选 webhook 告警
  - 环境状态健康输出

## 3. 当前剩余未完成项

以下事项已记录在案，但当前未继续开发：

### P1：上线前建议完成

1. 生产环境真正接通 `MONITORING_WEBHOOK_URL`
2. 执行一轮完整预发 walkthrough
3. 完成一次正式 npm 源的 `npm audit --omit=dev`
4. 确认 Supabase 生产库已备份或已有恢复点

### P2：建议尽快补齐

1. 增加最小 CI 流水线
2. 给关键业务链路补 1 轮最小自动化检查
3. 将迁移中的 mock/cleanup 策略进一步规范化

### P3：后续优化

1. 接入更完整的监控平台，例如 Sentry / Datadog / OpenTelemetry
2. 为首页与列表页补缓存策略和更明确的容量控制
3. 补更细的运营告警与异常数据看板

## 4. 你接下来要做的实际动作

下面是你现在可以直接执行的实际操作。

### 第一步：准备正式环境变量

你需要在部署平台中配置以下环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_TELEGRAM_USERNAME=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_CONTACT_EMAIL=
SUPABASE_SERVICE_ROLE_KEY=
BACKOFFICE_SESSION_SECRET=
MONITORING_ENVIRONMENT=production
MONITORING_WEBHOOK_URL=
ADMIN_USERNAME=
ADMIN_PASSWORD=
STAFF_USERNAME=
STAFF_PASSWORD=
```

配置说明：

- `NEXT_PUBLIC_SITE_URL`：必须填正式域名，例如 `https://www.xxx.com`
- `SUPABASE_SERVICE_ROLE_KEY`：只放服务端环境，不能泄露
- `BACKOFFICE_SESSION_SECRET`：使用强随机字符串，建议至少 32 位
- `MONITORING_ENVIRONMENT`：生产建议填 `production`
- `MONITORING_WEBHOOK_URL`：建议接一个你能即时收到消息的告警入口

### 第二步：如何生成 `BACKOFFICE_SESSION_SECRET`

你可以在本机执行下面任一命令生成：

```bash
openssl rand -base64 32
```

或：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

把输出结果复制到 `BACKOFFICE_SESSION_SECRET`。

### 第三步：如何配置告警 webhook

当前代码支持一个通用 `POST JSON` webhook。

你可以先接任意一种：

- Slack Incoming Webhook
- 企业微信机器人 webhook
- 自己的轻量告警转发服务

如果你暂时没有现成告警平台：

- 也可以先留空 `MONITORING_WEBHOOK_URL`
- 这样结构化错误日志仍会输出到平台日志
- 但没有主动推送提醒

建议：

- 预发环境可先留空
- 正式生产环境建议必须配置

### 第四步：在 Supabase 里要确认什么

你需要在 Supabase 后台确认以下内容：

1. 当前使用的是正式项目，不是测试项目
2. 所有迁移已执行完成
3. `inventory`、`leads`、`supplier_submissions` 表存在
4. RLS 状态与当前产品预期一致
5. 上线前做一次数据库备份或确认恢复点

建议实际动作：

1. 打开 Supabase 项目后台
2. 确认 Project URL 和 anon key 与部署环境一致
3. 确认 service role key 已复制到部署平台
4. 打开 SQL / Migration 历史，确认没有漏跑迁移
5. 做一次上线前备份

### 第五步：部署平台里要怎么操作

如果你使用 Vercel 或类似平台，建议按这个顺序：

1. 创建一个预发部署
2. 配置全部环境变量
3. 先部署预发环境
4. 打开预发环境地址
5. 逐项执行 walkthrough
6. 通过后再部署生产环境

### 第六步：你要人工验证哪些页面

预发 walkthrough 最少要覆盖：

#### 前台链路

1. 首页 `/`
2. 库存列表 `/inventory`
3. 详情页 `/inventory/[slug]`
4. 市场页 `/market/[slug]`
5. 品牌页 `/brand/[slug]`
6. 价格页 `/price/[slug]`
7. Telegram 跳转
8. WhatsApp 跳转

#### 后台链路

1. `/admin` 登录
2. `/submit-stock` 内部录入
3. `/admin/submissions` 审核队列
4. `/admin/submissions/[id]` 提报审核
5. `/admin/edit/[id]` 草稿编辑 / 发布

#### 运维链路

1. `/health`
2. 生产日志是否可见
3. webhook 是否能收到告警

## 5. 你如何验证当前配置是否成功

### 5.1 验证应用可构建

本地或 CI 执行：

```bash
npm run lint
npm run build
```

### 5.2 验证健康检查

部署后访问：

```bash
curl https://你的域名/health
```

预期：

- 返回 `200` 或 `503`
- 返回 JSON

如果是健康状态正常，响应示例类似：

```json
{
  "status": "ok",
  "environment": "production",
  "webhookEnabled": true,
  "timestamp": "2026-05-01T00:00:00.000Z"
}
```

如果看到 `degraded`，说明最少有一项关键环境变量缺失。

### 5.3 验证 webhook

验证方法：

1. 先确认 `MONITORING_WEBHOOK_URL` 已配置
2. 触发一个可控错误，或观察启动日志
3. 检查 webhook 接收端是否收到消息

### 5.4 验证后台登录限流

测试方法：

1. 连续多次输入错误后台密码
2. 确认出现“稍后再试”提示
3. 等待锁定时间结束后重试

### 5.5 验证 `/go/[channel]` 反刷

测试方法：

1. 正常点击前台 CTA
2. 确认仍然能跳转 Telegram / WhatsApp
3. 高频重复请求时，观察数据库 `leads` 是否不再无限增长

## 6. 当前建议的上线顺序

### 方案 A：最稳妥

1. 配置预发环境变量
2. 部署预发
3. 完整 walkthrough
4. 配置生产环境变量
5. 配置生产 webhook
6. 做数据库备份
7. 部署生产
8. 小流量观察

### 方案 B：当前也可谨慎执行

如果你时间紧，可以按下面执行：

1. 先完成生产环境变量配置
2. 先确认 `/health` 正常
3. 先确认 webhook 正常
4. 先做数据库备份
5. 再开始正式部署

## 7. 当前我的建议

当前最适合你的动作不是继续写功能，而是：

1. 先把正式环境变量全部配好
2. 先把 webhook 接上
3. 先跑完整预发 walkthrough
4. 再决定是否当天生产上线

## 8. 下一步如果继续开发

如果你下一步还要我继续，我建议优先顺序：

1. 补最小 CI 流水线
2. 补上线前 checklist 文档
3. 补一轮关键链路自动化检查
