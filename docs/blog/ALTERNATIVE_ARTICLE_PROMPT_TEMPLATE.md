# Alternative Article Prompt Template

Use this prompt in chat whenever you want the assistant to plan an `alternative`-style article from live inventory.

```text
请按我们的 alternative blog 工作流处理这篇文章。

文章方向：
- 目标关键词：<填写主关键词>
- 文章标题草案：<填写标题>
- 文章类型：<品牌级 alternative / 单爆款 alternative / 其他>
- 目标市场：<可选，填写国家或区域；没有可写 not specified>

库存输入方式：
- 请你不要依赖我手工解释产品卖点。
- 请直接使用我提供的库存链接或 slug，自行抓取站内库存数据并做特征抽取。

库存链接或 slug：
- <inventory url or slug 1>
- <inventory url or slug 2>
- <inventory url or slug 3>
- <inventory url or slug 4>

本次任务要求：
1. 先抓取这些库存的真实字段。
2. 再做特征抽取，不要先拍脑袋定推荐位。
3. 输出动态推荐槽位结构。
4. 标记哪些字段足够支撑文章，哪些字段缺失。
5. 等我确认推荐槽位结构后，再进入正式文章写作。

写作边界：
- 可以写 alternative、similar format、similar puff range、wholesale-friendly option。
- 不要把非官方库存写成官方品牌库存。
- 不要制造商标误导。
```

## Notes
- The inventory count is flexible. It is not limited to 4 items.
- Use as many inventory URLs or slugs as needed for the article angle.
- If the supplied inventory is too homogeneous, the assistant should say that the slot diversity is weak instead of forcing artificial slot labels.
