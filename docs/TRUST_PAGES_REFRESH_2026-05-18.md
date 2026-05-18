# 信任页重写留档 2026-05-18

## 1. 本轮目标
- 补强公开信任页的内容深度与平台身份表达。
- 让 `About / Contact / Privacy / Terms / Compliance` 从“存在即可”的初始页，升级为符合当前 MVP 阶段的 B2B 信任资产。
- 统一公开页面语义，避免回到零售电商或泛介绍口吻。

## 2. 本轮涉及文件
- `src/components/site/TrustCenterLinks.tsx`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/compliance/page.tsx`

## 3. 统一写法原则
- 公开文案全部维持英文。
- 统一强调 `B2B / wholesale inventory / inquiry / lawful trade / due diligence`。
- 避免把平台写成零售商城、支付平台或合规担保方。
- 不做夸张承诺，不写“已验证全部供应商”之类高风险表述。
- 所有信任页都要帮助用户理解：
  - 平台是什么
  - 平台不是什么
  - 该如何发起询盘
  - 哪些责任仍由买卖双方承担

## 4. 各页重写重点

### 4.1 About
- 从简短介绍页升级为平台身份页。
- 明确平台角色：
  - B2B wholesale inventory discovery
  - lead routing
  - direct inquiry enablement
- 明确平台边界：
  - 非 retail store
  - 非 payment intermediary
  - 非 regulatory guarantee layer
- 补入 `How VapeStockHub Works` 与 `Operating Principles`，让平台叙事与首页、inventory、taxonomy 页保持一致。

### 4.2 Contact
- 从联系方式展示页升级为商业询盘入口页。
- 强化 Telegram / WhatsApp / email 的使用场景差异。
- 增加 `What to Include in Your Inquiry`，帮助买家提高询盘质量。
- 增加 `Business-Only Notice` 与 `Response Expectations`，让联系页更像真实的 B2B 入口，而不是简单通讯录。

### 4.3 Privacy Policy
- 从过短概述页升级为可交代基本数据处理逻辑的公开页。
- 补入：
  - scope
  - collected information
  - usage purpose
  - cookies and sessions
  - service providers
  - retention and security
  - international / age-restricted context
  - updates and contact
- 避免写死无法长期保证的细节，但让页面达到“可被理解、可建立基本信任”的程度。

### 4.4 Terms of Service
- 从简单声明页升级为平台规则与责任边界页。
- 补入：
  - platform role
  - eligibility and acceptable use
  - inventory information limits
  - third-party channel use
  - IP and site use
  - warranty disclaimer
  - update terms
- 明确站点不是交易担保方，也不替代合同、付款保护与合规审查。

### 4.5 Compliance
- 从简短提醒页升级为 age-restricted B2B trade 合规说明页。
- 补入：
  - B2B-only audience
  - jurisdiction responsibility
  - product claims and documentation
  - restricted markets and sanctions
  - visibility is not compliance clearance
  - due-diligence checklist
  - reporting concerns
- 目标不是假装提供法律意见，而是明确平台不会替用户承担监管判断。

## 5. 新增的结构动作
- 新增 `TrustCenterLinks` 组件，把五个信任页串联为一个更完整的 trust cluster。
- 这样做的目的：
  - 增强内部链接
  - 提高信任页之间的语义联动
  - 让公开用户更容易理解整个平台的责任边界和沟通路径

## 6. 结果判断
- 本轮重写后，这五个页面已经更符合当前阶段的站点形象：
  - B2B inventory platform
  - inquiry-first
  - compliance-aware
  - non-retail
- 这些页面也更适合支撑后续 SEO、Search Console 抓取判断、以及敏感行业下的基础信任建设。

## 7. 后续可选动作
- 后续如需要，可继续补：
  - Footer 中的 trust links 排序优化
  - About / Contact 页的更强 CTA 分层
  - `last updated` 口径统一
  - 若将来需要更正式法务版本，再基于本轮文案交由法律顾问审阅
