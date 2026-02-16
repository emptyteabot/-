# 角色文档：架构设计师

## 当前架构
- 前端：Next.js App Router（`src/app`）。
- API：Next Route Handlers（`/api/ocr-chat`、`/api/ocr`、`/api/soul-autopsy`）。
- AI 网关：OpenAI-compatible 接口（主模型 + fallback）。
- 部署：Cloudflare/OpenNext + Railway/Vercel 备选。

## 目标架构（上线版）
1. 接入层：Web + API 网关 + 限流（IP + 指纹）。
2. 任务层：OCR 与分析拆为异步任务（Queue）。
3. 模型层：OCR 专用模型与分析模型隔离，独立超时/重试。
4. 数据层：事件埋点、报告元数据、错误日志持久化。
5. 观测层：日志、指标、告警三位一体。

## 关键技术决策
- OCR 和分析必须分离，避免单点超时。
- 采用“短超时 + 快速失败 + 回退模型”的策略。
- 服务端统一错误码：
  - `OCR_TIMEOUT`
  - `OCR_EMPTY_TEXT`
  - `ANALYSIS_TIMEOUT`
  - `MODEL_UNAVAILABLE`
  - `RATE_LIMITED`

## 性能预算
- OCR p95 < 25s（3-8 张图）。
- 分析 p95 < 20s。
- 总流程 p95 < 45s，p99 < 90s。

## 技术债清单
1. 目前缺少消息队列和幂等任务机制。
2. 缺少统一 tracing id。
3. 缺少缓存与重复请求去重。
