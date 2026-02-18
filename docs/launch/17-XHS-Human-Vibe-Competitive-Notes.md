# 小红书活人感竞品拆解（2026-02-18）

## 目的
把“AI腔”改成“真人感”，并在同赛道竞品里形成差异化文案优势。

## 线上样本（公开可访问）
1. RelatIQ（聊天关系分析）
- 链接：https://www.relatiq.ai/
- 观察：主打“Understand your connections in a new way”，强调和聊天场景直接绑定，不讲技术名词。

2. Wrapchat（聊天关系解读）
- 链接：https://www.wrapchat.ai/
- 观察：入口句非常短，直接说结果（兼容 WhatsApp/IG）。CTA 清晰，不绕。

3. Mosaic（关系洞察）
- 链接：https://www.joinmosaic.app/
- 观察：强调“learn from your relationship data”，文案是“结果 + 安抚 + 行动”，没有企业黑话。

4. maybe（关系咨询风格）
- 链接：https://maybe.love/
- 观察：强调“More than advice. A personal relationship coach.”，语言像真人咨询师，而非产品经理。

5. 新榜（小红书爆文方法）
- 链接：https://www.newrank.cn/article/detail/29613
- 观察：爆文结构上，用户更吃“具体场景 + 强情绪 + 明确动作”的组合，不吃空泛方法论。

## 可执行改造清单
1. 标题
- 使用真人句式：`别再X了`、`我发现X的本质是Y`、`昨晚我才明白...`。
- 控制在 12-20 字，避免“全网最全/系统化拆解”这类AI感标题。

2. 开头钩子
- 每条必须出现 1 个细节锚点：时间、地点、原话、动作。
- 示例：`昨晚11:42，她发来6张截图，第一句是“我是不是又想太多了”。`

3. 正文结构
- 三段短句：`结论` -> `证据` -> `今晚可执行动作`。
- 每段尽量不超过 40 字，读起来像私信，不像讲座。

4. 词汇黑名单
- 禁止：赋能、矩阵、抓手、闭环、精准触达、情绪价值拉满、降本增效、赛道。
- 替换：帮到、做法、跑通、找到对的人、少花钱多出单、方向。

5. CTA
- 不要硬广命令。
- 用低压力动作：`先发3-8张连续截图，我给你试读版。`

## 本轮已落地到代码
1. `src/app/api/marketing-pack/route.ts`
- 增加“去AI腔词汇替换”与输出清洗。
- 强制 hook 含具体细节。
- fallback 话术改成真人口吻。

2. `src/app/marketing/page.tsx`
- 新增活人感风格预设按钮。
- 默认风格改为“闺蜜口吻 + 细节锚点”。

3. `tools/marketing-autopilot.ps1`
- 默认 vibe 改为真人口吻，自动化任务直接产出可发内容。
