# VapeStockHub 供应商库存提报模板（V1）

## 0. 文档用途
- 本文用于给愿意配合的供应商发送标准化库存提报模板。
- 模板目标不是让供应商直接理解数据库字段，而是让他们尽量按统一结构提供可用库存信息。
- 本文同时提供：
  - 表格版字段模板
  - 文本版模板
  - 供应商填写说明
  - 你向供应商收集反馈时可问的问题

---

## 1. 使用建议
- 优先把“文本版模板”发给首次接触、回复习惯偏聊天的供应商。
- 对愿意配合、库存量较大、信息相对规范的供应商，优先发送“表格版模板”。
- 不要要求供应商完全像系统录入员一样填写。
- 目标是让对方比“随手丢一份乱表格”更接近标准，而不是一步到位做到完美。

---

## 2. 对外发送时建议的说明话术

### 中文参考话术
- 我们在整理一个长期合作的库存提报格式，方便更快同步库存、减少反复沟通。
- 如果方便的话，您后续可以尽量按下面这个模板提供信息。
- 不需要一次填得非常完整，先把核心字段发给我们也可以。
- 如果哪里不方便填写，也欢迎直接告诉我们，我们会再优化模板。

### English version for suppliers
- We are building a simple stock submission format to make inventory sharing faster and reduce back-and-forth communication.
- If possible, please send your stock information using the template below.
- It does not need to be perfect at the beginning. Core fields are enough.
- If any part is inconvenient to fill in, please let us know and we will simplify the format.

---

## 3. 表格版模板（推荐给配合度较高的供应商）

### 3.1 表格字段结构

| Field | Required | Example | Notes |
|---|---|---|---|
| Brand | Yes | Vozol | Brand only, no model in this field |
| Model / Product Name | Yes | Star 10000 | Main model name |
| Product Type | Yes | Disposable | Disposable / Pod System / Kit / E-liquid / Accessory |
| Unit Price (USD) | Yes | 3.20 | Number only |
| Available Qty | Yes | 5000 | Total available quantity |
| MOQ | Yes | 500 | Minimum order quantity |
| Target Market | Yes | Middle East | Main market or target region |
| Warehouse Location | Yes | Dubai, UAE | City + Country/Region |
| Puff Count | Recommended | 10000 | Number only if available |
| Nicotine Strength | Recommended | 5% | Example: 5%, 2%, 0% |
| E-liquid Capacity | Recommended | 18ml | If available |
| Flavor List | Yes | Blue Razz Ice, Watermelon Ice, Mint | Comma-separated list for overview |
| Flavor Breakdown | Recommended | Blue Razz Ice - 300 pcs / Watermelon Ice - 500 pcs | Can be line-separated in one cell |
| Image Link | Recommended | https://... | Product photo or stock image |
| Stock Notes | Recommended | Mixed carton / Sealed / Ready to dispatch | Raw notes are fine |
| Market Notes | Optional | Suitable for MENA buyers | Any market or compliance note |
| Packaging Notes | Optional | 10 pcs/box, 200 pcs/carton | If available |
| Extra Notes | Optional | Clearance / fast moving / factory stock | Any additional comment |

---

## 4. 文本版模板（推荐先发给聊天型供应商）

### 4.1 可直接复制发送的英文模板

```text
Please send your stock in this format:

Brand:
Model / Product Name:
Product Type:
Unit Price (USD):
Available Qty:
MOQ:
Target Market:
Warehouse Location:
Puff Count:
Nicotine Strength:
E-liquid Capacity:

Flavor List:

Flavor Breakdown:

Image Link:

Stock Notes:

Market Notes:

Packaging Notes:

Extra Notes:
```

### 4.2 供应商填写示例

```text
Brand: Vozol
Model / Product Name: Star 10000
Product Type: Disposable
Unit Price (USD): 3.20
Available Qty: 5000
MOQ: 500
Target Market: Middle East
Warehouse Location: Dubai, UAE
Puff Count: 10000
Nicotine Strength: 5%
E-liquid Capacity: 18ml

Flavor List:
Blue Razz Ice, Watermelon Ice, Mint, Strawberry Kiwi

Flavor Breakdown:
Blue Razz Ice - 1200 pcs
Watermelon Ice - 1500 pcs
Mint - 800 pcs
Strawberry Kiwi - 1500 pcs

Image Link:
https://example.com/vozol-star-10000.jpg

Stock Notes:
Ready stock in Dubai warehouse. Mixed flavors available.

Market Notes:
Suitable for Middle East distribution.

Packaging Notes:
10 pcs/box, 200 pcs/carton

Extra Notes:
Clearance batch, fast-moving stock.
```

---

## 5. 关键字段解释

### 5.1 Flavor List
- 这是口味概览层。
- 用于快速看这条库存大概有哪些口味。
- 示例：
  - Blue Razz Ice, Watermelon Ice, Mint

### 5.2 Flavor Breakdown
- 这是口味明细层。
- 用于记录每个口味对应多少库存。
- 示例：
  - Blue Razz Ice - 300 pcs
  - Watermelon Ice - 500 pcs
  - Mint - 200 pcs

### 5.3 Stock Notes
- 不要求供应商写成正式文案。
- 只要把原始说明、库存情况、发货状态、清仓信息、限制说明发出来即可。
- 后续这部分可以由系统或 AI 整理成前台可展示内容。

---

## 6. 对供应商的填写要求建议
- Core fields first. If not all fields are available, please send the required fields first.
- Price should be number only in USD.
- Warehouse should preferably be in “City, Country/Region” format.
- Flavor List should be separated by commas.
- Flavor Breakdown can be written line by line.
- Stock Notes do not need to be polished. Raw operational notes are acceptable.

---

## 7. 你向供应商收集反馈时建议重点问的问题

### 7.1 中文版
- 这个模板是否太复杂？
- 哪些字段你们平时最不方便提供？
- 你们更愿意填表格，还是直接按文本格式回复？
- Flavor Breakdown 这种写法是否方便你们提供？
- 图片链接、库存备注、包装备注这些字段是否容易提供？
- 你们是否有自己常用的库存表格式，可以发给我们参考？

### 7.2 English version
- Is this template too complicated for your team?
- Which fields are difficult for you to provide regularly?
- Do you prefer a spreadsheet format or a text message format?
- Is the Flavor Breakdown section easy for you to provide?
- Are image links, stock notes, and packaging notes easy for you to share?
- Do you already have your own stock sheet format that we can adapt to?

---

## 8. 收到第一波反馈后建议重点观察的事
- 供应商最愿意填的是哪些字段
- 供应商最常漏掉的是哪些字段
- Flavor Breakdown 是否普遍能配合
- Warehouse / Market 是否经常写得很散
- 供应商更偏好表格还是文本
- 哪些字段可以从“推荐”下调为“可选”
- 哪些字段虽然麻烦，但对你们仍然必须保留

---

## 9. 当前版本定位
- 本模板是 V1，目标是快速试探供应商配合度，而不是一次性定死最终格式。
- 第一轮反馈回来后，再决定：
  - 哪些字段简化
  - 哪些字段改名
  - 是否要拆成不同供应商版本
  - 是否进入系统化表单或 AI 自动读取流程
