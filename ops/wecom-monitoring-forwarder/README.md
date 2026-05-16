# 企业微信监控转发层部署说明

## 1. 目的
- 本目录提供一个极轻量 `Cloudflare Worker` 转发层。
- 它负责接收 `VapeStockHub` 发送的标准 JSON 监控事件。
- 然后把事件转换成企业微信机器人可识别的文本消息，再转发到企业微信群。

---

## 2. 文件说明
- `worker.js`
  - Worker 主代码
- `wrangler.toml.example`
  - Cloudflare Worker 配置模板

---

## 3. 整体链路
- `VapeStockHub`
  - 发送标准 JSON 到 `MONITORING_WEBHOOK_URL`
- `Cloudflare Worker`
  - 校验 Bearer Token
  - 转换消息格式
  - 转发到企业微信机器人 webhook
- `企业微信群机器人`
  - 接收告警文本

---

## 4. 前置准备

### 4.1 企业微信机器人
1. 打开你的企业微信群
2. 添加群机器人
3. 复制机器人 webhook 地址

示例格式：

```text
https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 4.2 Cloudflare 账号
1. 登录 Cloudflare
2. 开通 Workers
3. 本机安装 `wrangler`

安装命令：

```bash
npm install -g wrangler
```

### 4.3 生成一个转发层 Bearer Token
建议本机执行：

```bash
openssl rand -hex 32
```

这串值用于：
- `VapeStockHub -> Worker` 的调用鉴权
- 防止外部任意人直接调用你的转发层

---

## 5. 部署步骤

### 第一步：复制目录到本机可部署位置
当前仓库已提供现成代码：

- `ops/wecom-monitoring-forwarder/worker.js`
- `ops/wecom-monitoring-forwarder/wrangler.toml.example`

进入目录：

```bash
cd ops/wecom-monitoring-forwarder
```

### 第二步：创建 `wrangler.toml`

```bash
cp wrangler.toml.example wrangler.toml
```

### 第三步：登录 Cloudflare

```bash
wrangler login
```

### 第四步：设置 Worker Secret
把敏感信息写成 secret，不要直接写进代码仓库。

设置转发层 token：

```bash
wrangler secret put MONITORING_FORWARDER_TOKEN
```

设置企业微信机器人地址：

```bash
wrangler secret put WECOM_WEBHOOK_URL
```

### 第五步：部署 Worker

```bash
wrangler deploy
```

部署完成后，你会拿到一个地址，示例：

```text
https://vsh-monitoring-forwarder.<your-subdomain>.workers.dev
```

---

## 6. 回填到主站

### 6.1 主站需要的最终 webhook 地址
主站里应填写 Worker 地址，而不是企业微信机器人原始地址。

即：

```text
MONITORING_WEBHOOK_URL=https://vsh-monitoring-forwarder.<your-subdomain>.workers.dev
```

### 6.2 主站还需要带 Bearer Token
当前主站监控代码默认只发 JSON，没有附加鉴权头。

因此在正式接通前，你需要做下面二选一：

#### 方案 A：我下一步帮你补主站代码
- 给主站监控请求增加：

```text
Authorization: Bearer <MONITORING_FORWARDER_TOKEN>
```

- 然后你在主站环境变量里新增：

```text
MONITORING_WEBHOOK_TOKEN=<和 Worker 一致的 token>
```

这是推荐方案，安全性更高。

#### 方案 B：先去掉 Worker 的鉴权
- 不推荐
- 仅适合短期临时测试
- 这样 Worker 暴露在公网，任何人都可能调用

---

## 7. 验收步骤

### 7.1 部署 Worker 后先独立测试
你可以用 `curl` 直接调用 Worker：

```bash
curl -X POST "https://vsh-monitoring-forwarder.<your-subdomain>.workers.dev" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <MONITORING_FORWARDER_TOKEN>" \
  -d '{
    "event": "manual.test",
    "level": "info",
    "timestamp": "2026-05-15T00:00:00.000Z",
    "environment": "production",
    "details": {
      "source": "manual-curl"
    }
  }'
```

预期结果：
- Worker 返回 `ok: true`
- 企业微信群收到一条测试消息

### 7.2 主站接通后再验证
1. 在主站生产环境配置：
   - `MONITORING_WEBHOOK_URL`
   - `MONITORING_WEBHOOK_TOKEN`（若采用推荐方案）
2. 重新部署主站
3. 打开：
   - `/health`
4. 确认：
   - `webhookEnabled = true`
5. 进入：
   - `/admin/tools`
6. 点击：
   - `发送测试 webhook`
7. 去企业微信群确认是否收到：
   - `backoffice.monitoring.webhook_test`

---

## 8. 推荐消息样式
当前 Worker 会把以下字段转成文本：
- `level`
- `event`
- `environment`
- `timestamp`
- `details`

企业微信群里看到的消息大致如下：

```text
VapeStockHub Monitoring Alert
Level: INFO
Event: backoffice.monitoring.webhook_test
Environment: production
Timestamp: 2026-05-15T00:00:00.000Z
Details:
- source: admin-tools
- triggeredBy: admin-tools
```

---

## 9. 当前最关键提醒
- 这套 Worker 代码已经准备好。
- 但要真正接通生产环境，还差主站增加 `Authorization Bearer Token` 支持。
- 这一步我建议紧接着继续做，不然 Worker 已部署但主站仍无法安全调用。
