import { NextRequest, NextResponse } from 'next/server'

/**
 * 聊天截图 OCR API
 * 用 Claude 视觉能力提取截图中的聊天文字
 */
export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: '请上传至少一张截图' }, { status: 400 })
    }

    if (images.length > 20) {
      return NextResponse.json({ error: '最多支持20张截图' }, { status: 400 })
    }

    // 构建多模态消息
    const content: any[] = []
    for (const img of images) {
      // img 格式: { base64: string, mediaType: string }
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${img.mediaType};base64,${img.base64}`,
        },
      })
    }
    content.push({
      type: 'text',
      text: `请提取这些微信聊天截图中的所有对话内容。

输出格式要求（严格按此格式，每条消息一行）:
时间 发送者
消息内容

示例:
2024-01-15 08:30:15 小明
早安呀~今天天气好好
2024-01-15 10:15:30 小红
嗯刚醒

要求：
1. 提取每条消息的时间、发送者昵称、消息内容
2. 如果截图中看不清时间，用合理的递增时间代替
3. 图片消息标记为 [图片]，语音标记为 [语音]，表情标记为 [表情]
4. 系统消息（如撤回、红包等）保留原文
5. 只输出提取的聊天记录，不要加任何说明文字`,
    })

    // 调用 AI (优先 Claude，它的 OCR 更强)
    const apiKey = process.env.AI_API_KEY || process.env.AI_FALLBACK_API_KEY || ''
    const baseURL = process.env.AI_BASE_URL || process.env.AI_FALLBACK_BASE_URL || ''
    const model = process.env.AI_MODEL || process.env.AI_FALLBACK_MODEL || ''

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
        max_tokens: 8000,
        temperature: 0.1, // 低温度，精确提取
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OCR API Error:', err)
      throw new Error('图片识别失败')
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    if (!text.trim()) {
      throw new Error('未能从截图中识别出聊天内容')
    }

    return NextResponse.json({ text })
  } catch (err: any) {
    console.error('OCR Error:', err)
    return NextResponse.json(
      { error: err.message || '截图识别失败，请重试' },
      { status: 500 }
    )
  }
}



