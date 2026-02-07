import OpenAI from 'openai'

/**
 * 双引擎 AI 系统
 * 主力: Claude Sonnet 4.5 (via 12AI) — 输出质量更高
 * 备胎: DeepSeek — Claude 挂了自动切换
 */

// ========== 主力 AI (Claude via 12AI OpenAI兼容接口) ==========
function getPrimaryClient() {
  const apiKey = process.env.AI_API_KEY
  const baseURL = process.env.AI_BASE_URL
  if (!apiKey || !baseURL) return null
  return new OpenAI({ apiKey, baseURL })
}

function getPrimaryModel() {
  return process.env.AI_MODEL || 'claude-sonnet-4-5-20250929'
}

// ========== 备胎 AI (DeepSeek) ==========
function getFallbackClient() {
  const apiKey = process.env.AI_FALLBACK_API_KEY
  const baseURL = process.env.AI_FALLBACK_BASE_URL
  if (!apiKey || !baseURL) return null
  return new OpenAI({ apiKey, baseURL })
}

function getFallbackModel() {
  return process.env.AI_FALLBACK_MODEL || 'deepseek-chat'
}

// ========== 统一调用(自动容灾) ==========

/** 基础 AI 对话 — 自动主力/备胎切换 */
export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  // 1️⃣ 先试主力 (Claude)
  const primary = getPrimaryClient()
  if (primary) {
    try {
      const response = await primary.chat.completions.create({
        model: getPrimaryModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.maxTokens ?? 4096,
      })
      const content = response.choices[0]?.message?.content
      if (content) {
        console.log(`[AI] ✅ Claude 响应成功 (${content.length}字)`)
        return content
      }
    } catch (err: any) {
      console.error(`[AI] ⚠️ Claude 失败: ${err.message}, 切换到备胎...`)
    }
  }

  // 2️⃣ 备胎 (DeepSeek)
  const fallback = getFallbackClient()
  if (fallback) {
    try {
      const response = await fallback.chat.completions.create({
        model: getFallbackModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.maxTokens ?? 4096,
      })
      const content = response.choices[0]?.message?.content
      if (content) {
        console.log(`[AI] ✅ DeepSeek 备胎响应成功 (${content.length}字)`)
        return content
      }
    } catch (err: any) {
      console.error(`[AI] ❌ DeepSeek 也失败了: ${err.message}`)
      throw new Error('AI 服务暂时不可用，请稍后再试')
    }
  }

  throw new Error('未配置任何 AI API，请检查 .env.local')
}

/** 带图片的 AI 对话 — 用于 OCR 截图识别 */
export async function chatWithImages(
  systemPrompt: string,
  userText: string,
  imageBase64List: string[],
  options?: { temperature?: number; maxTokens?: number }
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

  // 主力 Claude (支持视觉)
  const primary = getPrimaryClient()
  if (primary) {
    try {
      const response = await primary.chat.completions.create({
        model: getPrimaryModel(),
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 4096,
      })
      const result = response.choices[0]?.message?.content
      if (result) {
        console.log(`[AI] ✅ Claude 图片识别成功 (${result.length}字)`)
        return result
      }
    } catch (err: any) {
      console.error(`[AI] ⚠️ Claude 图片识别失败: ${err.message}`)
    }
  }

  // 备胎 DeepSeek (也支持视觉)
  const fallback = getFallbackClient()
  if (fallback) {
    try {
      const response = await fallback.chat.completions.create({
        model: getFallbackModel(),
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 4096,
      })
      const result = response.choices[0]?.message?.content
      if (result) return result
    } catch (err: any) {
      console.error(`[AI] ❌ DeepSeek 图片识别也失败: ${err.message}`)
    }
  }

  throw new Error('图片识别失败，请重试')
}

/** 流式 AI 对话 — 自动主力/备胎切换 */
export async function* chatCompletionStream(
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number; maxTokens?: number }
): AsyncGenerator<string> {
  // 1️⃣ 先试主力 (Claude)
  const primary = getPrimaryClient()
  if (primary) {
    try {
      const stream = await primary.chat.completions.create({
        model: getPrimaryModel(),
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
      console.error(`[AI] ⚠️ Claude 流式失败: ${err.message}, 切换备胎...`)
    }
  }

  // 2️⃣ 备胎 (DeepSeek)
  const fallback = getFallbackClient()
  if (fallback) {
    const stream = await fallback.chat.completions.create({
      model: getFallbackModel(),
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
  }

  throw new Error('未配置任何 AI API')
}
