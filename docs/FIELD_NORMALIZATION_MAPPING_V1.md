# 字段标准值映射表 V1

## 1. 文档目的

本文件用于明确冷启动阶段最关键字段的标准值口径。

目标不是要求供应商一开始就填得完全标准，而是保证：

- 原始输入允许有脏值
- 内部整理后能够归一
- LLM 输出有明确 canonical value 可落
- draft 与最终发布字段保持一致

---

## 2. 总原则

### 2.1 三层心智

字段统一按三层处理：

1. `原始输入值`
2. `标准化值`
3. `最终发布值`

解释：

- `原始输入值`：供应商在 Excel、聊天记录或图片备注里的原始写法
- `标准化值`：规则清洗 + LLM 辅助后得到的归一结果
- `最终发布值`：真正写入系统并用于前台展示、聚合页、SEO 与筛选的值

### 2.2 当前处理原则

- 原始输入允许大小写、空格、同义词差异
- 标准化阶段必须尽量映射到 canonical value
- 若无法稳定映射，不直接静默改写，应进入 warning 或人工确认
- 最终发布字段必须使用本文件定义的标准值

---

## 3. 当前范围

本版只收口 4 组字段：

- `brand`
- `market`
- `product_type`
- `contact_visibility`

---

## 4. brand

### 4.1 Canonical Value 原则

- 使用标准品牌名首字母大写写法
- `brand` 只写品牌，不写型号，不写产品类型，不写营销词

### 4.2 当前推荐标准值示例

- `Vozol`
- `Elf Bar`
- `Geek Bar`
- `Lost Mary`
- `Maskking`
- `Oxbar`

### 4.3 常见脏值示例

- `vozol`
- `VOZOL`
- `Vozol `
- `elfbar`
- `ELFBAR`
- `Geekbar`
- `Vozol Vape`

### 4.4 处理口径

- 仅大小写或前后空格差异：
  - 直接归一到已有标准值
- 明显包含品牌 + 噪音词：
  - 去除尾部 `vape`、`device` 等非品牌词后再尝试归一
- 若仍不确定是否为同一品牌：
  - 保留原值
  - 标记 `brand-not-standard`
  - 进入人工确认

### 4.5 当前建议

- `brand` 当前采用“半约束”
- 不做死枚举
- 采用：
  - 推荐值输入
  - 标准值归一化
  - 不匹配先 warning

---

## 5. market

### 5.1 Canonical Value 原则

- 使用区域口径
- 不直接使用零散国家名作为主 `market`
- 若需要更细国家信息，放入 `description` 或备注层

### 5.2 当前推荐标准值

- `Middle East`
- `Latin America`
- `Eastern Europe`
- `North America`

### 5.3 常见脏值示例

- `middle east`
- `Middle-East`
- `MENA`
- `LATAM`
- `South America`
- `eastern europe `

### 5.4 处理口径

- 仅大小写或前后空格差异：
  - 直接归一
- 连字符差异：
  - 优先归一到空格标准写法
- 明显通用缩写：
  - 可映射时映射到标准区域口径
- 若原值只是单个国家，且无法确定是否应归入某个统一区域：
  - 不自动硬改
  - 进入 warning 或人工确认

### 5.5 当前建议

- `market` 当前采用“半约束”
- 不做死枚举
- 采用：
  - 推荐值输入
  - 标准值归一化
  - 不匹配先 warning

---

## 6. product_type

### 6.1 当前正式拍板

当前 SEO 主战场优先围绕 `Disposable Vape`，但发布层 `product_type` 不再强制统一为唯一值。

`product_type` 使用固定标准枚举：

- `Disposable Vape`
- `Pod Kit`
- `Pod System`
- `Vape Kit`
- `E-liquid`
- `Accessory`
- `Device`
- `Other`

### 6.2 当前执行原则

- 对外输入允许出现近义表达。
- 对内标准化后，明显属于一次性电子烟的统一收口为：
  - `Disposable Vape`
- 明显属于其他产品类型的，归一到对应标准枚举。
- 无法稳定判断的，不静默硬改，进入 warning 或人工确认。

### 6.3 当前常见脏值示例

- `disposable`
- `Disposable`
- `disposable vape`
- ` disposable vape `
- `Disposable Device`
- `one-time vape`
- `pod`
- `pod system`
- `podkit`
- `vape kit`
- `starter kit`
- `eliquid`
- `e liquid`
- `accessories`

### 6.4 处理口径

- 明显属于一次性电子烟：
  - 一律归一到 `Disposable Vape`
- 明显属于 `Pod Kit`、`Pod System`、`Vape Kit`、`E-liquid`、`Accessory`、`Device`：
  - 归一到对应标准值
- 不能稳定判定产品类型：
  - 不静默改写
  - 进入人工确认

### 6.5 当前需要注意的冲突点

当前项目曾存在口径冲突：

- 文档早期版本里曾出现：
  - `Disposable`
- 旧决策中曾将当前主通道收口为：
  - `Disposable Vape`

本轮已修正为：

- SEO 主攻方向优先 disposable
- 真实库存发布层允许多产品类型
- `product_type` 使用固定标准枚举，不使用自由发散值

因此，后续标准化工作应以本节枚举为准。

---

## 7. contact_visibility

### 7.1 Canonical Value

当前只允许两种值：

- `contact_required`
- `public`

### 7.2 处理口径

- 该字段属于强约束字段
- 不使用自由输入
- 若外部资料没有明确表达：
  - 默认采用 `contact_required`

---

## 8. 当前字段约束分层

### 8.1 强约束

- `product_type`
- `contact_visibility`

处理方式：

- 使用固定标准枚举
- 不允许自由发散到发布层

### 8.2 半约束

- `brand`
- `market`

处理方式：

- 推荐值输入
- 标准值归一化
- 不匹配先 warning
- 边界情况交给人工确认

---

## 9. 当前推荐的最小映射逻辑

### 9.1 规则层优先处理

先做基础规则清洗：

- 去前后空格
- 连续空格压缩
- 忽略大小写比较
- 去掉显而易见的尾部噪音词

### 9.2 LLM 层辅助处理

LLM 负责：

- 判断近义表达是否属于同一 canonical value
- 识别哪些值无法稳定映射
- 把不确定情况放入：
  - `missingFields`
  - `riskFlags`
  - `humanReviewFocus`

### 9.3 人工层最终拍板

人工负责：

- 边界品牌
- 含糊 market
- 无法稳定判定的 product type
- 是否允许进入 draft
- 是否允许发布

---

## 10. 当前与代码的关系

### 10.1 已有实现

当前代码里已经有以下基础能力：

- `normalizeKnownValue()`
- `normalizeProductTypeValue()`
- `knownBrands`
- `knownMarkets`
- `brand-not-standard` warning
- `market-not-standard` warning
- `product_type` aliases 会归一到 canonical value，例如：
  - `Vape Kits` / `starter kit` → `Vape Kit`
  - `podkit` → `Pod Kit`
  - `eliquid` / `e liquid` → `E-liquid`
  - `disposable` / `disposable devices` → `Disposable Vape`

### 10.2 还未完全收口的点

当前仍未完全收口的点：

- `brand` / `market` 尚无独立 synonym mapping 表
- 文档已有标准写法，但还没完全转成代码层固定映射

---

## 11. 当前结论

当前阶段的正式口径是：

- `brand`：半约束，归一化处理
- `market`：半约束，归一化处理
- `product_type`：强约束，使用固定标准枚举
- `contact_visibility`：强约束，仅 `contact_required / public`

---

## 12. 下一步建议

如果后续继续推进，实现顺序建议为：

1. 先让 Excel / LLM / draft 处理过程遵循本文件
2. 再把 `product_type` 的代码选项口径统一到当前拍板
3. 再补 `brand` / `market` 的 synonym mapping 表
4. 最后再补更细的规则自动化
