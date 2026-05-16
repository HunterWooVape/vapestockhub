# VapeStockHub

VapeStockHub 是一个面向 B2B 的电子烟库存信息展示与询盘转化 MVP，技术栈为 Next.js App Router + Supabase。

## 本地启动

1. 复制环境变量模板并填写：

```bash
cp .env.example .env.local
```

2. 安装依赖并启动开发环境：

```bash
npm install
npm run dev
```

3. 打开 `http://localhost:3000`

## 环境变量

以下变量为当前项目实际使用的最小集合：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_TELEGRAM_USERNAME=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_CONTACT_EMAIL=
SUPABASE_SERVICE_ROLE_KEY=
BACKOFFICE_SESSION_SECRET=
MONITORING_ENVIRONMENT=
MONITORING_WEBHOOK_URL=
MONITORING_WEBHOOK_TOKEN=
ADMIN_USERNAME=
ADMIN_PASSWORD=
STAFF_USERNAME=
STAFF_PASSWORD=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
GOOGLE_SITE_VERIFICATION=
```

说明：

- `SUPABASE_SERVICE_ROLE_KEY` 仅服务端使用，缺失时后台写入功能不可用。
- `BACKOFFICE_SESSION_SECRET` 用于后台登录会话签名，生产环境必须配置强随机值。
- `MONITORING_WEBHOOK_URL` 为可选项，可接 Telegram Bot webhook、Slack webhook 或内部告警入口。
- `MONITORING_WEBHOOK_TOKEN` 为可选项；若 webhook 前面接了鉴权转发层，建议必须配置。
- `ADMIN_USERNAME / ADMIN_PASSWORD / STAFF_USERNAME / STAFF_PASSWORD` 为当前 MVP 后台入口凭证。
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` 为 Google Analytics 4 测量 ID。
- `GOOGLE_SITE_VERIFICATION` 为 Google Search Console 验证码。

## 发布前检查

至少执行以下命令：

```bash
npm run lint
npm run build
npm run smoke-test
```

如果使用正式 npm 源，还应补执行：

```bash
npm audit --omit=dev
```

## 部署阶段门槛

当前建议按两个阶段判断：

### 阶段 A：可以开始部署到预发环境

满足以下条件即可开始预发部署：

- `npm run lint` 通过
- `npm run build` 通过
- `.env.example` 与实际环境变量对齐
- 基础安全响应头已启用
- Supabase 迁移已在预发库完整执行

### 阶段 B：可以谨慎开始生产部署

满足以下条件后，才建议开始正式生产部署：

- 已完成阶段 A
- 已人工验证核心链路：`首页 -> 库存列表 -> 详情页 -> Telegram/WhatsApp 跳转`
- 已人工验证后台链路：`登录 -> submit-stock -> submissions -> draft/edit -> publish`
- 已确认生产域名、HTTPS、Supabase 正式项目配置无误
- 已配置最小错误监控或 webhook 告警
- 已完成数据库备份或可回滚快照
- 已准备回滚方案：保留上一版部署，并可快速切回

## 当前状态说明

截至当前修复批次：

- 已修复现有 `lint` 阻断
- 已补齐环境变量模板
- 已增加基础安全响应头并关闭 `X-Powered-By`
- 已增加后台登录限流与 `/go/[channel]` 反刷
- 已增加最小监控基础：`src/instrumentation.ts` 与 `/health`

这意味着项目**现在可以开始部署到预发环境**。

但在下面事项完成前，**还不建议直接正式上线**：

- 最小 CI/CD 质量门禁
- 生产环境 webhook 告警配置

## 推荐下一步

优先继续补以下高优先级项：

1. 生产环境接通 webhook 告警
2. 最小 CI 流水线
3. 一轮完整预发 walkthrough
