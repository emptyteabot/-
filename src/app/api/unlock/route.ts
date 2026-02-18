import { NextRequest, NextResponse } from 'next/server'
import { setPaidCookie, type PayProduct } from '@/lib/paywall'
import { applyRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

const PRODUCT_ENV: Record<PayProduct, string> = {
  soul: 'UNLOCK_CODE_SOUL',
  'fortune-tarot': 'UNLOCK_CODE_FORTUNE_TAROT',
  'fortune-daily': 'UNLOCK_CODE_FORTUNE_DAILY',
  launderer: 'UNLOCK_CODE_LAUNDERER',
}

function paywallSecret(): string {
  return String(process.env.PAYWALL_SECRET || '').trim()
}

function signedUnlockSig(product: PayProduct, orderId: string): string {
  const secret = paywallSecret()
  if (!secret) return ''
  return crypto.createHmac('sha256', secret).update(`unlock:${product}:${orderId}`).digest('hex').slice(0, 10)
}

function verifySignedUnlockCode(product: PayProduct, code: string): boolean {
  const secret = paywallSecret()
  if (!secret) return false
  const trimmed = String(code || '').trim()
  const idx = trimmed.lastIndexOf('.')
  if (idx <= 0) return false
  const orderId = trimmed.slice(0, idx)
  const sig = trimmed.slice(idx + 1)
  if (!orderId || !sig) return false
  if (!/^SL[A-Z0-9]{6,32}$/.test(orderId)) return false
  if (!/^[a-f0-9]{10}$/i.test(sig)) return false

  const expected = signedUnlockSig(product, orderId)
  if (!expected) return false

  try {
    return crypto.timingSafeEqual(Buffer.from(sig.toLowerCase()), Buffer.from(expected.toLowerCase()))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = applyRateLimit(req, 'unlock', {
      limit: Number(process.env.RL_UNLOCK_LIMIT || 30),
      windowMs: Number(process.env.RL_UNLOCK_WINDOW_MS || 60_000),
    })
    if (limited) return limited

    const body = await req.json()
    const product = body?.product as PayProduct
    const code = (body?.code as string | undefined)?.trim()
    const orderId = (body?.orderId as string | undefined)?.trim()

    if (!product || !(product in PRODUCT_ENV)) {
      return NextResponse.json({ error: '未知的产品类型' }, { status: 400 })
    }
    if (!code && !orderId) {
      return NextResponse.json({ error: '请输入解锁码或订单号' }, { status: 400 })
    }

    const envKey = PRODUCT_ENV[product]
    const expected = (process.env[envKey] || '').trim()

    let ok = false

    // 1) Static unlock code (legacy)
    if (expected && code && code === expected) ok = true

    // 2) Signed unlock code: "{ORDER_ID}.{SIG}"
    if (!ok && code && verifySignedUnlockCode(product, code)) ok = true

    // 3) Compat: code is sent via orderId field
    if (!ok && orderId && verifySignedUnlockCode(product, orderId)) ok = true

    if (!ok) {
      return NextResponse.json(
        { error: expected ? '解锁码不正确' : '解锁码不正确（站点未配置静态码，请使用订单号签名码）' },
        { status: 401 }
      )
    }

    await setPaidCookie(product)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '解锁失败' }, { status: 500 })
  }
}
