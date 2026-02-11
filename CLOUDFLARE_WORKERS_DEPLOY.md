# Cloudflare Workers Deploy (Recommended)

This project uses `OpenNext + Cloudflare Workers` (no Vercel build dependency).

## 1) Login once
```powershell
npx wrangler login
```

## 2) Build and deploy
```powershell
npm run cf:deploy
```

## 3) Set env vars in Cloudflare dashboard
Workers & Pages -> your worker -> Settings -> Variables:
- `AI_API_KEY`
- `AI_BASE_URL=https://api.deepseek.com/v1`
- `AI_MODEL=deepseek-reasoner`
- `AI_OCR_API_KEY`
- `AI_OCR_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1`
- `AI_OCR_MODEL=qwen-vl-ocr`

Then redeploy:
```powershell
npm run cf:deploy
```

