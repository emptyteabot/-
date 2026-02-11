import { NextResponse } from 'next/server'

function has(v?: string) {
  return Boolean(v && v.trim())
}

export async function GET() {
  const checks = {
    ai_primary: has(process.env.AI_API_KEY) && has(process.env.AI_BASE_URL) && has(process.env.AI_MODEL),
    ai_ocr: has(process.env.AI_OCR_API_KEY) && has(process.env.AI_OCR_BASE_URL) && has(process.env.AI_OCR_MODEL),
    paywall_secret: has(process.env.PAYWALL_SECRET),
  }

  const status = Object.values(checks).every(Boolean) ? 'ok' : 'degraded'

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      service: 'xuanxue',
      checks,
      runtime: {
        node: process.version,
        env: process.env.NODE_ENV || 'unknown',
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
