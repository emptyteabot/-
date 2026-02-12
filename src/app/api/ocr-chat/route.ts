import { NextRequest, NextResponse } from 'next/server'
import { chatWithImages } from '@/lib/ai'

/**
 * OCR screenshots -> extracted plain chat text.
 * Accepts:
 * - string: data URL or raw base64
 * - object: { base64, mediaType }
 */

const OCR_PROMPT = `You are an OCR engine for chat screenshots.

Output ONLY visible text from images.
Do not explain. Do not refuse. Do not add policy text.

Rules:
1) Preserve line breaks in reading order.
2) If speaker can be inferred, prefix lines as:\n我: ...\n对方: ...
3) Keep timestamps/system hints if visible.
4) If partially unreadable, still output readable text.`

function cleanOcrText(input: string): string {
  return (input || '')
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/\r/g, '')
    .trim()
}

function looksLikeRefusal(input: string): boolean {
  const t = (input || '').toLowerCase()
  const keys = ['无法', '不能', '抱歉', "i can't", 'cannot', 'policy', '不支持']
  return keys.some((k) => t.includes(k))
}

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

    const raw = await chatWithImages(
      OCR_PROMPT,
      `Extract visible chat text from ${normalizedImages.length} screenshot(s).`,
      normalizedImages,
      { temperature: 0.1, maxTokens: 4096 }
    )

    const chatText = cleanOcrText(raw)

    if (!chatText || chatText.length < 12 || looksLikeRefusal(chatText)) {
      return NextResponse.json({ error: '未识别到有效聊天文字' }, { status: 422 })
    }

    return NextResponse.json({ chatText })
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : '截图识别失败，请重试'
    console.error('OCR Error:', err)
    return NextResponse.json({ error: msg, code: 'OCR_CHAT_FAILED' }, { status: 500 })
  }
}
