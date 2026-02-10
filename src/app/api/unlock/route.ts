import { NextRequest, NextResponse } from 'next/server'
import { setPaidCookie, type PayProduct } from '@/lib/paywall'

const PRODUCT_ENV: Record<PayProduct, string> = {
  soul: 'UNLOCK_CODE_SOUL',
  'fortune-tarot': 'UNLOCK_CODE_FORTUNE_TAROT',
  'fortune-daily': 'UNLOCK_CODE_FORTUNE_DAILY',
  launderer: 'UNLOCK_CODE_LAUNDERER',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const product = body?.product as PayProduct
    const code = (body?.code as string | undefined)?.trim()

    if (!product || !(product in PRODUCT_ENV)) {
      return NextResponse.json({ error: '未知的产品' }, { status: 400 })
    }
    if (!code) {
      return NextResponse.json({ error: '请输入解锁码' }, { status: 400 })
    }

    const envKey = PRODUCT_ENV[product]
    const expected = (process.env[envKey] || '').trim()
    if (!expected) {
      return NextResponse.json({ error: '未配置解锁码，请联系站点管理员' }, { status: 500 })
    }

    if (code !== expected) {
      return NextResponse.json({ error: '解锁码不正确' }, { status: 401 })
    }

    await setPaidCookie(product)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '解锁失败' }, { status: 500 })
  }
}
