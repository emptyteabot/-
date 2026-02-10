import { NextRequest, NextResponse } from 'next/server'
import { chatWithImages } from '@/lib/ai'

type ImgObj = { base64: string; mediaType?: string }

const OCR_SYSTEM = `You are an OCR extraction engine. Extract the chat messages from screenshots precisely.

Rules:
1) Output only extracted chat logs, no commentary.
2) Each message uses 2 lines:
   YYYY-MM-DD HH:mm:ss Sender
   Message content
3) If timestamp is missing/unclear, fabricate a reasonable increasing timestamp.
4) Mark non-text messages as [image] [voice] [emoji] etc.
5) Keep system messages (recall/red packet) if visible.`

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

    // Basic payload safety: reject extremely large base64 inputs.
    for (const img of images) {
      if (!img?.base64 || typeof img.base64 !== 'string') continue
      if (img.base64.length > 6_000_000) {
        return NextResponse.json({ error: '单张截图过大，请压缩后再试' }, { status: 413 })
      }
    }

    const normalized: string[] = images
      .map(img => {
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

    const text = await chatWithImages(
      OCR_SYSTEM,
      `Extract chat logs from ${normalized.length} screenshot(s).`,
      normalized,
      { temperature: 0.1, maxTokens: 4096 }
    )

    return NextResponse.json({ text })
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : '截图识别失败，请重试'
    console.error('OCR Error:', err)
    // Return the message to frontend (already sanitized; no secrets).
    return NextResponse.json({ error: msg, code: 'OCR_FAILED' }, { status: 500 })
  }
}

