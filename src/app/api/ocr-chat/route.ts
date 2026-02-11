import { NextRequest, NextResponse } from 'next/server'
import { chatWithImages } from '@/lib/ai'

/**
 * OCR screenshots -> extracted plain chat logs (for later NLP analysis).
 * Accepts:
 * - string: data URL (data:image/...;base64,xxx) or raw base64
 * - object: { base64, mediaType }
 */

const OCR_PROMPT = `You are a chat-screenshot OCR extractor.

Output only extracted chat logs. No commentary.

Format per message (2 lines):
YYYY-MM-DD HH:mm:ss Sender
Message content

Rules:
1) If timestamp missing/unclear, fabricate increasing timestamps.
2) Identify sender from UI alignment (left = other, right = me) when possible.
3) Mark non-text as [image] [voice] [emoji] etc.
4) Keep system messages if visible.`

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: '请上传至少一张聊天截图' }, { status: 400 })
    }
    if (images.length > 20) {
      return NextResponse.json({ error: '最多支持20张截图' }, { status: 400 })
    }

    const normalizedImages: string[] = images
      .map((img: any) => {
        if (!img) return ''
        if (typeof img === 'string') {
          if (img.startsWith('data:')) return img
          // treat as raw base64
          return `data:image/jpeg;base64,${img}`
        }
        if (typeof img === 'object' && typeof img.base64 === 'string') {
          const mt = typeof img.mediaType === 'string' && img.mediaType ? img.mediaType : 'image/jpeg'
          const b64 = img.base64
          if (b64.startsWith('data:')) return b64
          return `data:${mt};base64,${b64}`
        }
        return ''
      })
      .filter(Boolean)

    if (normalizedImages.length === 0) {
      return NextResponse.json({ error: '截图格式不支持，请重新上传' }, { status: 400 })
    }

    for (const u of normalizedImages) {
      if (u.length > 6_000_000) {
        return NextResponse.json({ error: '单张截图过大，请压缩后再试' }, { status: 413 })
      }
    }

    const chatText = await chatWithImages(
      OCR_PROMPT,
      `Extract chat logs from ${normalizedImages.length} screenshot(s).`,
      normalizedImages,
      { temperature: 0.1, maxTokens: 4096 }
    )

    // Treat near-empty output as OCR failure so frontend can fallback to generic OCR route.
    if (!chatText || chatText.trim().length < 12) {
      return NextResponse.json({ error: '未识别到足够聊天文本' }, { status: 422 })
    }

    return NextResponse.json({ chatText })
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : '截图识别失败，请重试'
    console.error('OCR Error:', err)
    return NextResponse.json({ error: msg, code: 'OCR_CHAT_FAILED' }, { status: 500 })
  }
}
