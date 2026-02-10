import OpenAI from 'openai'
import fs from 'node:fs'
import path from 'node:path'

function loadDotEnvLocal() {
  try {
    const p = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(p)) return
    const raw = fs.readFileSync(p, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx <= 0) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // ignore
  }
}

loadDotEnvLocal()

const apiKey = process.env.AI_OCR_API_KEY
const baseURL = process.env.AI_OCR_BASE_URL
const model = process.env.AI_OCR_MODEL

if (!apiKey || !baseURL || !model) {
  console.error('Missing env: AI_OCR_API_KEY / AI_OCR_BASE_URL / AI_OCR_MODEL')
  process.exit(2)
}

const client = new OpenAI({ apiKey, baseURL })

// Use an existing local image to satisfy size constraints.
const imgPath = fs.existsSync(path.join(process.cwd(), 'public', 'qr-pay.jpg'))
  ? path.join(process.cwd(), 'public', 'qr-pay.jpg')
  : null

if (!imgPath) {
  console.error('Missing test image: public/qr-pay.jpg')
  process.exit(3)
}

const img = `data:image/jpeg;base64,${fs.readFileSync(imgPath).toString('base64')}`

try {
  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'Reply with the single word OK.' },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: img } },
          { type: 'text', text: 'Say OK.' },
        ],
      },
    ],
    max_tokens: 32,
    temperature: 0,
  })

  const out = resp.choices?.[0]?.message?.content
  console.log('vision_call_ok:', Boolean(out), 'content:', JSON.stringify(out))
} catch (e) {
  console.error('vision_call_failed:', e?.message || e)
  process.exit(1)
}
