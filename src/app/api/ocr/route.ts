import { NextRequest, NextResponse } from 'next/server'
import { chatWithImages } from '@/lib/ai'

type ImgObj = { base64: string; mediaType?: string }

const OCR_SYSTEM = `You are an OCR engine.

Output ONLY visible text from image(s). No explanation.
Keep line breaks.`

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
    const body = await req.json()
    const images = (body?.images || []) as ImgObj[]

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: '请上传至少一张截图' }, { status: 400 })
    }
    if (images.length > 20) {
      return NextResponse.json({ error: '最多支持20张截图' }, { status: 400 })
    }

    for (const img of images) {
      if (!img?.base64 || typeof img.base64 !== 'string') continue
      if (img.base64.length > 6_000_000) {
        return NextResponse.json({ error: '单张截图过大，请压缩后再试' }, { status: 413 })
      }
    }

    const normalized: string[] = images
      .map((img) => {
        const mt = img?.mediaType && typeof img.mediaType === 'string' ? img.mediaType : 'image/jpeg'
        const b64 = img?.base64
        if (!b64 || typeof b64 !== 'string') return ''
        if (b64.startsWith('data:')) return b64
        return `data:${mt};base64,${b64}`
      })
      .filter(Boolean)

    if (normalized.length === 0) {
      return NextResponse.json({ error: '截图格式不支持，请重新上传' }, { status: 400 })
    }

    const raw = await chatWithImages(
      OCR_SYSTEM,
      `Extract readable text from ${normalized.length} screenshot(s).`,
      normalized,
      { temperature: 0.1, maxTokens: 4096 }
    )

    const text = cleanOcrText(raw)
    if (!text || text.length < 8 || looksLikeRefusal(text)) {
      return NextResponse.json({ error: '未识别到有效文字' }, { status: 422 })
    }

    return NextResponse.json({ text })
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : '截图识别失败，请重试'
    console.error('OCR Error:', err)
    return NextResponse.json({ error: msg, code: 'OCR_FAILED' }, { status: 500 })
  }
}
