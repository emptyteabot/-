import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'
import { applyRateLimit } from '@/lib/rate-limit'
import type { PayProduct } from '@/lib/paywall'

const ADMIN_COOKIE = 'admin_dash'

function adminSecret(): string {
  return String(process.env.ADMIN_DASH_PASSWORD || '').trim()
}

function adminToken(secret: string): string {
  return createHash('sha256').update(`admin:${secret}`).digest('hex')
}

function isAdmin(req: NextRequest): boolean {
  const secret = adminSecret()
  if (!secret) return false
  const token = req.cookies.get(ADMIN_COOKIE)?.value || ''
  if (!token) return false
  return token === adminToken(secret)
}

function paywallSecret(): string {
  return String(process.env.PAYWALL_SECRET || '').trim()
}

function unlockSig(product: PayProduct, orderId: string): string {
  const secret = paywallSecret()
  return createHmac('sha256', secret).update(`unlock:${product}:${orderId}`).digest('hex').slice(0, 10)
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status })
}

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'admin-unlock-code', {
    limit: Number(process.env.RL_ADMIN_SESSION_LIMIT || 20),
    windowMs: Number(process.env.RL_ADMIN_SESSION_WINDOW_MS || 60_000),
  })
  if (limited) return limited

  if (!isAdmin(req)) return bad('未授权', 401)

  const secret = paywallSecret()
  if (!secret) return bad('PAYWALL_SECRET 未配置', 500)

  const body = await req.json().catch(() => ({}))
  const product = String(body?.product || 'soul') as PayProduct
  const orderId = String(body?.orderId || '').trim().toUpperCase()

  if (!orderId) return bad('请输入订单号')
  if (!/^SL[A-Z0-9]{6,32}$/.test(orderId)) return bad('订单号格式不正确')
  if (!['soul', 'fortune-tarot', 'fortune-daily', 'launderer'].includes(product)) {
    return bad('产品类型不支持')
  }

  const sig = unlockSig(product, orderId)
  const code = `${orderId}.${sig}`
  return NextResponse.json({ ok: true, code })
}

