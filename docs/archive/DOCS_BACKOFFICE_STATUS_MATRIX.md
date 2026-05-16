# VapeStockHub docs 后台文档状态矩阵

## 1. 文档目的

本文件用于解决一个现实问题：

`docs` 目录中存在多份与后台流程、IA、UIUX、执行清单相关的文档，它们分别诞生于不同阶段，部分内容已经过时，部分内容仍然有价值，但如果不重新标记状态，后续会继续出现“多人引用不同基线”的问题。

本文件从现在开始承担三件事：

- 标记哪些文档仍是主基线
- 标记哪些文档保留但需要迭代更新
- 标记哪些文档降级为历史参考，不再作为当前实施依据

---

## 2. 当前后台文档总原则

从本轮起，后台相关文档统一按以下优先级理解：

### A. 当前主基线

- `BACKOFFICE_WORKFLOW_REFACTOR_V1.md`
- `BACKOFFICE_REFACTOR_EXECUTION_PLAN.md`

### B. 继续保留但需按新基线迭代

- `ADMIN_INTERNAL_WORKFLOW_GUIDE.md`
- `BACKOFFICE_UIUX_EXECUTION_CHECKLIST.md`
- `BACKOFFICE_ROLE_ENTRY_CHECKLIST.md`
- `BACKOFFICE_WORKFLOW_WALKTHROUGH_CHECKLIST.md`

### C. 保留为历史蓝图参考

- `BACKOFFICE_IA_REFACTOR_BLUEPRINT.md`

### D. 仍属项目级主文档，不因后台重构失效

- `MVP_PLAN.md`
- `PRE_DEV_CHECKLIST.md`
- `PRD.md`
- `PARKING_LOT.md`
- `MVP_COLD_START_MINIMAL_OPERATIONS_PLAN.md`

---

## 3. 文档逐项判断

## 3.1 后台主基线

### `BACKOFFICE_WORKFLOW_REFACTOR_V1.md`

状态：

- `新增，当前有效`

原因：

- 已统一这轮后台重构的目标链路、页面职责、字段分层和 LLM 边界

后续动作：

- 所有后台讨论默认引用本文件

### `BACKOFFICE_REFACTOR_EXECUTION_PLAN.md`

状态：

- `新增，当前有效`

原因：

- 已明确执行顺序与依赖关系

后续动作：

- 所有后台开发排期默认引用本文件

---

## 3.2 继续保留但需要更新的文档

### `ADMIN_INTERNAL_WORKFLOW_GUIDE.md`

状态：

- `保留，需更新`

问题：

- 已经表达了内部主链路，但还没有完全承接本轮“取消 access code、统一登录、页面重新定位、LLM 正式落点”的新决策

建议动作：

- 保留作为日常操作说明
- 后续按 V1 文档重写结构与页面名称

### `BACKOFFICE_UIUX_EXECUTION_CHECKLIST.md`

状态：

- `保留，需更新`

问题：

- 当前清单仍偏向轻量收敛思路，但没有完全承接本轮新的页面定位和前台内容拆分要求

建议动作：

- 保留为执行检查清单
- 后续按“录入台 / 提报队列 / LLM 完善与审核 / 发布前确认”重新排序

### `BACKOFFICE_ROLE_ENTRY_CHECKLIST.md`

状态：

- `保留，需更新`

问题：

- 文档中仍记录 `submit-stock` 由独立 access code 控制的现状，这已不再符合当前决策

建议动作：

- 保留最小角色边界判断
- 更新为统一后台登录体系

### `BACKOFFICE_WORKFLOW_WALKTHROUGH_CHECKLIST.md`

状态：

- `保留，需更新`

问题：

- walkthrough 的执行前提与步骤需要改成新链路，不应再基于旧页面理解去验收

建议动作：

- 在阶段 3 到阶段 5 完成后，按新链路重写 walkthrough

---

## 3.3 保留为历史参考的文档

### `BACKOFFICE_IA_REFACTOR_BLUEPRINT.md`

状态：

- `保留，历史参考`

原因：

- 这份文档仍有价值，尤其是对后台 IA、工作台化方向的思考
- 但它已经不应继续作为当前实施基线，因为本轮新方案已对页面定位和执行顺序做了更新收口

建议动作：

- 保留文件
- 在文件顶部标记“历史蓝图参考”
- 后续只在回看历史决策时引用

---

## 3.4 继续保持有效的项目级文档

### `MVP_PLAN.md`

状态：

- `继续有效`

原因：

- 项目边界、目标和范围仍有效

### `PRE_DEV_CHECKLIST.md`

状态：

- `继续有效`

原因：

- 仍是主要前置检查文档

### `PRD.md`

状态：

- `继续有效`

原因：

- 项目级目标和需求说明未被本轮后台重构推翻

### `MVP_COLD_START_MINIMAL_OPERATIONS_PLAN.md`

状态：

- `继续有效，局部需对齐`

原因：

- 其中的核心链路
  - `打开 submit-stock -> 录入 -> LLM 完善 -> 审核 -> 发布`
  仍然成立

建议动作：

- 保留
- 后续把页面命名与登录策略按新方案做轻量同步

---

## 4. 建议的后续整理动作

## 4.1 立即执行

建议立即做的文档动作：

1. 新增本轮 3 份主文档
2. 给关键旧文档顶部补状态说明
3. 后续讨论统一先看 V1 与执行顺序文档

## 4.2 下一轮执行时同步更新

建议随着开发阶段推进同步更新：

- `ADMIN_INTERNAL_WORKFLOW_GUIDE.md`
- `BACKOFFICE_UIUX_EXECUTION_CHECKLIST.md`
- `BACKOFFICE_ROLE_ENTRY_CHECKLIST.md`
- `BACKOFFICE_WORKFLOW_WALKTHROUGH_CHECKLIST.md`

## 4.3 暂不删除的原因

当前不建议删除旧文档，原因如下：

- 里面仍保留不少已验证过的判断
- 删除会损失历史决策上下文
- 目前更适合通过“状态标记”来降级，而不是直接清理

---

## 5. 推荐的文档使用方式

为了避免后续再次混乱，建议团队统一采用以下使用顺序：

1. 先看 `BACKOFFICE_WORKFLOW_REFACTOR_V1.md`
2. 再看 `BACKOFFICE_REFACTOR_EXECUTION_PLAN.md`
3. 如需核对旧思路，再按本文件决定是否引用旧文档

不要再反过来先看旧 checklist 或旧蓝图来决定当前开发方向。

---

## 6. 结论

这次不是要把旧文档“一刀切删掉”，而是要重新建立文档层级。

当前后台文档体系应理解为：

- 新文档负责定当前方向
- 旧执行清单负责后续按新方向迭代
- 旧蓝图负责保留历史思考

这样既不会丢上下文，也能避免继续多基线并行。
