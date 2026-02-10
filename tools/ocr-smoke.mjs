import fs from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'

function loadDotEnvLocal() {
  try {
    const p = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(p)) return
    const raw = fs.readFileSync(p, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i <= 0) continue
      const k = t.slice(0, i).trim()
      const v = t.slice(i + 1).trim()
      if (!process.env[k]) process.env[k] = v
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

const file = process.argv[2] || 'c9faefeb738a1fea295da47ddf2f9c29.jpg'
if (!fs.existsSync(file)) {
  console.error('Missing file:', file)
  process.exit(3)
}

const ext = path.extname(file).toLowerCase()
const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg'
const img = `data:${mediaType};base64,${fs.readFileSync(file).toString('base64')}`

const client = new OpenAI({ apiKey, baseURL })

try {
  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'Extract all text exactly. Output only text.' },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: img } },
          { type: 'text', text: 'OCR' },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 512,
  })

  console.log(resp.choices?.[0]?.message?.content || '')
} catch (e) {
  console.error('ocr_failed:', e?.message || e)
  process.exit(1)
}

