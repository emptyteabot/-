import OpenAI from 'openai'

type ChatOptions = { temperature?: number; maxTokens?: number }

function makeClient(apiKey?: string, baseURL?: string) {
  if (!apiKey || !baseURL) return null
  return new OpenAI({ apiKey, baseURL })
}

function primary() {
  return {
    client: makeClient(process.env.AI_API_KEY, process.env.AI_BASE_URL),
    model: process.env.AI_MODEL || 'claude-sonnet-4-5-20250929',
    label: 'primary',
  }
}

function fallback() {
  return {
    client: makeClient(process.env.AI_FALLBACK_API_KEY, process.env.AI_FALLBACK_BASE_URL),
    model: process.env.AI_FALLBACK_MODEL || 'deepseek-chat',
    label: 'fallback',
  }
}

// OCR should use a vision-capable provider/model. If unset, we reuse primary/fallback.
function ocrPrimary() {
  return {
    client: makeClient(process.env.AI_OCR_API_KEY, process.env.AI_OCR_BASE_URL) || primary().client,
    model: process.env.AI_OCR_MODEL || primary().model,
    label: process.env.AI_OCR_BASE_URL || process.env.AI_OCR_API_KEY || process.env.AI_OCR_MODEL ? 'ocr_primary' : 'primary',
  }
}

function ocrFallback() {
  return {
    client: makeClient(process.env.AI_OCR_FALLBACK_API_KEY, process.env.AI_OCR_FALLBACK_BASE_URL) || fallback().client,
    model: process.env.AI_OCR_FALLBACK_MODEL || fallback().model,
    label:
      process.env.AI_OCR_FALLBACK_BASE_URL || process.env.AI_OCR_FALLBACK_API_KEY || process.env.AI_OCR_FALLBACK_MODEL
        ? 'ocr_fallback'
        : 'fallback',
  }
}

export async function chatCompletion(systemPrompt: string, userMessage: string, options?: ChatOptions): Promise<string> {
  const tries = [primary(), fallback()]
  const errors: string[] = []

  for (const t of tries) {
    if (!t.client) continue
    try {
      const response = await t.client.chat.completions.create({
        model: t.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.maxTokens ?? 4096,
      })

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
    throw new Error('未配置任何 AI API：请检查 .env.local / Vercel 环境变量 (AI_API_KEY/AI_BASE_URL 等)。')
  }
  throw new Error(`AI 服务暂时不可用，请稍后重试。详情: ${errors.join(' | ')}`)
}

export async function chatWithImages(
  systemPrompt: string,
  userText: string,
  imageBase64List: string[],
  options?: ChatOptions
): Promise<string> {
  const content: any[] = imageBase64List.map(img => ({
    type: 'image_url',
    image_url: { url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` },
  }))
  content.push({ type: 'text', text: userText })

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content },
  ]

  const tries = [ocrPrimary(), ocrFallback()]
  const errors: string[] = []

  for (const t of tries) {
    if (!t.client) continue
    try {
      const response = await t.client.chat.completions.create({
        model: t.model,
        messages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 4096,
      })
      const result = response.choices[0]?.message?.content
      if (result && result.trim()) return result
      errors.push(`${t.label}(${t.model}): empty-content`)
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err)
      console.error(`[AI] ${t.label} image call failed: ${msg}`)
      errors.push(`${t.label}(${t.model}): ${msg}`)
    }
  }

  // This is the key user-facing hint: most likely a non-vision model was used.
  throw new Error(
    `OCR失败：当前模型/接口可能不支持图片输入(image_url)。` +
      `请在环境变量里配置 AI_OCR_BASE_URL + AI_OCR_MODEL 为“支持视觉(vision)”的模型后重试。` +
      ` 详情: ${errors.join(' | ')}`
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

