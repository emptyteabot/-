# OpenClaw 自动营销指南（合规版）

## 目标
- 自动化完成：营销包生成、素材整理、发布草稿导出、话术分发。
- 保留人工审核发布，避免平台违规风险。

## 已提供脚本
- `tools/marketing-autopilot.ps1`
- `tools/marketing-autopilot.bat`
- `tools/run-marketing-autopilot-feishu.bat`
- `tools/setup-marketing-autopilot-task.ps1`

## 一键运行（Windows）
```bat
tools\marketing-autopilot.bat
```

## 常用参数
```bat
tools\marketing-autopilot.bat -Product both -Channel xiaohongshu -Vibe "高转化、克制、直接、可执行"
```

## 发送到 OpenClaw（用于团队审核）
```bat
tools\marketing-autopilot.bat -SendViaOpenClaw -OpenClawChannel telegram -OpenClawTarget "@your_chat_id"
```

> Feishu 场景建议显式填写 `-OpenClawTarget`，确保分发到你指定的会话。

## 输出文件位置
- `outputs/marketing/{timestamp}/marketing-pack.json`
- `outputs/marketing/{timestamp}/marketing-pack.md`
- `outputs/marketing/{timestamp}/post-drafts.csv`

## 推荐流程
1. 每天自动生成营销包。
2. OpenClaw 把摘要发到你团队频道。
3. 人工审核后发布到小红书/抖音。
4. 回看 `/growth` 数据，第二天迭代。

## Windows 定时全自动执行
```bat
powershell -ExecutionPolicy Bypass -File tools\setup-marketing-autopilot-task.ps1 -RunTime 09:30
```

创建后会每天自动执行一次，并自动先跑一次做联调验证。

## 兜底机制
- 当 `/api/marketing-pack` 因上游 AI 波动失败时，脚本会自动切换为本地兜底营销包，不会中断产出。
- 页面端也会显示“兜底营销包”提示，方便你区分 AI 生成与模板生成。

## 重要说明
- 不建议、也不提供违规刷屏/批量骚扰式自动广告。
- 以平台规则、账号安全、长期转化为优先。
