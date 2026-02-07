import { NextRequest, NextResponse } from 'next/server'
import { chatWithImages } from '@/lib/ai'

/**
 * OCR 聊天截图 → 提取纯文本聊天记录
 * 支持微信/QQ等聊天截图
 */

const OCR_PROMPT = `你是一个聊天记录提取专家。用户会上传微信/QQ等聊天截图。

请从截图中精确提取所有聊天内容，按以下格式输出每条消息：

时间 发送者
消息内容

规则：
1. 如果截图中有时间戳，保留原始时间（格式：2024-01-15 14:30:00）
2. 如果没有时间戳，用递增的假时间（从2024-01-15 08:00:00开始，每条间隔5-30分钟）
3. 准确识别每条消息的发送者（左边是对方，右边是"我"）
4. [图片]、[语音]、[表情]等非文字消息用方括号标注
5. 不要添加任何解释或评论，只输出提取的聊天记录
6. 如果有多张截图，按时间顺序合并输出`

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: '请上传至少一张聊天截图' }, { status: 400 })
    }

    if (images.length > 10) {
      return NextResponse.json({ error: '最多支持10张截图' }, { status: 400 })
    }

    const chatText = await chatWithImages(
      OCR_PROMPT,
      `请从这${images.length}张聊天截图中提取所有聊天记录。只输出聊天内容，不要解释。`,
      images,
      { temperature: 0.1, maxTokens: 4096 }
    )

    return NextResponse.json({ chatText })
  } catch (err: any) {
    console.error('OCR Error:', err)
    return NextResponse.json(
      { error: err.message || '截图识别失败，请重试' },
      { status: 500 }
    )
  }
}

