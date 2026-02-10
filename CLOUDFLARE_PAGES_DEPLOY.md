# Cloudflare Pages (Free Domain) Deploy

You chose: Cloudflare Pages + free `*.pages.dev` domain.

This is a full-stack Next.js app (API routes + SSR). On Pages we deploy it via `@cloudflare/next-on-pages`.

## 1) Create Pages Project
1. Cloudflare Dashboard -> Workers & Pages -> Pages -> Create a project.
2. Connect GitHub and select repo: `emptyteabot/-`.

## 2) Build Settings
- Build command: `npm run pages:build`
- Build output directory: `.vercel/output/static`
- Node version: `20` (or `18+`)

## 3) Environment Variables (Required)
Cloudflare Pages -> Project -> Settings -> Environment Variables.

DeepSeek (text analysis):
- `AI_API_KEY`
- `AI_BASE_URL` = `https://api.deepseek.com/v1`
- `AI_MODEL` = `deepseek-reasoner`

Qwen (screenshot OCR, vision):
- `AI_OCR_API_KEY`
- `AI_OCR_BASE_URL` = `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `AI_OCR_MODEL` = `qwen-vl-ocr`

Optional:
- `GROWTH_MODE`, `NEXT_PUBLIC_GROWTH_MODE`
- `PAYWALL_SECRET`, `UNLOCK_CODE_*`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

## 4) Notes (Windows)
`@cloudflare/next-on-pages` calls the Vercel CLI internally. Local builds on Windows may fail, but Cloudflare's build environment is Linux, so CI builds usually work.

## 5) Reality Check (China Mobile)
`pages.dev` is often more reachable than `vercel.app` on China mobile networks, but still not guaranteed. If it still times out, the real fix is:
- your own domain + a China-friendly CDN, or
- moving hosting to Tencent/Ali (often requires ICP filing).

