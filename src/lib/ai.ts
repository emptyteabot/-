import OpenAI from 'openai'

type ChatOptions = {
  temperature?: number
  maxTokens?: number
  preferFast?: boolean
}

type ProviderConfig = {
  client: OpenAI | null
  model: string
  label: string
}

function toMs(v: string | undefined, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

async function withTimeout<T>(p: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout ${timeoutMs}ms`)), timeoutMs)
  })
  try {
    return await Promise.race([p, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function makeClient(apiKey?: string, baseURL?: string) {
  if (!apiKey || !baseURL) return null
  return new OpenAI({ apiKey, baseURL })
}

function primary(): ProviderConfig {
  return {
    client: makeClient(process.env.AI_API_KEY, process.env.AI_BASE_URL),
    model: process.env.AI_MODEL || 'claude-sonnet-4-5-20250929',
    label: 'primary',
  }
}

function fallback(): ProviderConfig {
  return {
    client: makeClient(process.env.AI_FALLBACK_API_KEY, process.env.AI_FALLBACK_BASE_URL),
    model: process.env.AI_FALLBACK_MODEL || 'deepseek-chat',
    label: 'fallback',
  }
}

function isReasoningModel(model: string): boolean {
  const m = (model || '').toLowerCase()
  return m.includes('reasoner') || m.includes('r1')
}

function fastModelFor(model: string): string {
  if (process.env.AI_FAST_MODEL) return process.env.AI_FAST_MODEL
  if (model.toLowerCase().includes('deepseek')) return 'deepseek-chat'
  return model
}

function ocrPrimary(): ProviderConfig {
  return {
    client: makeClient(process.env.AI_OCR_API_KEY, process.env.AI_OCR_BASE_URL) || primary().client,
    model: process.env.AI_OCR_MODEL || primary().model,
    label:
      process.env.AI_OCR_BASE_URL || process.env.AI_OCR_API_KEY || process.env.AI_OCR_MODEL
        ? 'ocr_primary'
        : 'primary',
  }
}

function ocrFallback(): ProviderConfig {
  return {
    client: makeClient(process.env.AI_OCR_FALLBACK_API_KEY, process.env.AI_OCR_FALLBACK_BASE_URL) || fallback().client,
    model: process.env.AI_OCR_FALLBACK_MODEL || fallback().model,
    label:
      process.env.AI_OCR_FALLBACK_BASE_URL ||
      process.env.AI_OCR_FALLBACK_API_KEY ||
      process.env.AI_OCR_FALLBACK_MODEL
        ? 'ocr_fallback'
        : 'fallback',
  }
}

function ocrLatestAlias(model: string): string | null {
  if (!model || /-latest$/i.test(model)) return null
  if (/^qwen-vl-ocr/i.test(model)) return 'qwen-vl-ocr-latest'
  if (/^qwen-vl-plus/i.test(model)) return 'qwen-vl-plus-latest'
  return null
}

export async function chatCompletion(systemPrompt: string, userMessage: string, options?: ChatOptions): Promise<string> {
  const p = primary()
  const f = fallback()
  const pFast: ProviderConfig | null = p.client
    ? {
        ...p,
        model: fastModelFor(p.model),
        label: `${p.label}_fast`,
      }
    : null

  const preferFast = Boolean(options?.preferFast)
  const tries = preferFast
    ? [pFast, f, p].filter(Boolean) as ProviderConfig[]
    : [p, pFast, f].filter(Boolean) as ProviderConfig[]

  const maxTries = toMs(process.env.AI_MAX_TRIES, 2)
  const totalBudgetMs = toMs(process.env.AI_TOTAL_TIMEOUT_MS, 38000)
  const startedAt = Date.now()
  const errors: string[] = []

  for (const t of tries.slice(0, maxTries)) {
    if (Date.now() - startedAt > totalBudgetMs) {
      errors.push(`total-timeout(${totalBudgetMs}ms)`)
      break
    }
    if (!t.client) continue

    try {
      const timeoutMs = toMs(process.env.AI_TIMEOUT_MS, isReasoningModel(t.model) ? 18000 : 20000)
      const timeoutCapMs = toMs(process.env.AI_TIMEOUT_CAP_MS, 22000)
      const boundedTimeoutMs = Math.min(timeoutMs, timeoutCapMs)

      const response = await withTimeout(
        t.client.chat.completions.create({
          model: t.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: options?.temperature ?? 0.8,
          max_tokens: options?.maxTokens ?? 4096,
        }),
        boundedTimeoutMs,
        `${t.label}(${t.model})`
      )

      const content = response.choices[0]?.message?.content
      if (content) return content
      errors.push(`${t.label}(${t.model}): empty-content`)
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err)
      console.error(`[AI] ${t.label} failed: ${msg}`)
      errors.push(`${t.label}(${t.model}): ${msg}`)
    }
  }

  if (!primary().client && !fallback().client) {
    throw new Error('未配置可用的 AI 接口，请检查环境变量 AI_API_KEY / AI_BASE_URL（及可选 fallback）。')
  }

  throw new Error(`AI 服务暂时不可用，请稍后重试。详情: ${errors.join(' | ')}`)
}

export async function chatWithImages(
  systemPrompt: string,
  userText: string,
  imageBase64List: string[],
  options?: ChatOptions
): Promise<string> {
  const content: any[] = imageBase64List.map((img) => ({
    type: 'image_url',
    image_url: { url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` },
  }))
  content.push({ type: 'text', text: userText })

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content },
  ]

  const p = ocrPrimary()
  const f = ocrFallback()
  const tries: ProviderConfig[] = [p]

  const alias = ocrLatestAlias(p.model)
  if (alias && p.client) {
    tries.push({ ...p, model: alias, label: `${p.label}_latest` })
  }

  if (p.client && /^qwen-vl/i.test(p.model)) {
    tries.push({ ...p, model: 'qwen-vl-plus-latest', label: `${p.label}_vlplus` })
  }

  tries.push(f)

  const errors: string[] = []

  for (const t of tries) {
    if (!t.client) continue

    try {
      const response = await withTimeout(
        t.client.chat.completions.create({
          model: t.model,
          messages,
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 4096,
        }),
        toMs(process.env.AI_OCR_TIMEOUT_MS, 45000),
        `${t.label}(${t.model})`
      )

      const result = response.choices[0]?.message?.content
      if (result && result.trim()) return result
      errors.push(`${t.label}(${t.model}): empty-content`)
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err)
      console.error(`[AI] ${t.label} image call failed: ${msg}`)
      errors.push(`${t.label}(${t.model}): ${msg}`)
    }
  }

  throw new Error(
    `OCR 失败：当前模型或接口可能不支持图像输入（image_url）。请配置 AI_OCR_BASE_URL + AI_OCR_MODEL 为视觉模型后重试。详情: ${errors.join(' | ')}`
  )
}

export async function* chatCompletionStream(
  systemPrompt: string,
  userMessage: string,
  options?: ChatOptions
): AsyncGenerator<string> {
  const tries = [primary(), fallback()]

  for (const t of tries) {
    if (!t.client) continue

    try {
      const stream = await t.client.chat.completions.create({
        model: t.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) yield content
      }
      return
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err)
      console.error(`[AI] ${t.label} stream failed: ${msg}`)
    }
  }

  throw new Error('AI 流式服务暂时不可用，请稍后重试。')
}
