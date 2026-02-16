import { NextRequest, NextResponse } from 'next/server'

type WindowState = {
  count: number
  resetAt: number
}

type LimitOptions = {
  limit: number
  windowMs: number
}

const storeKey = '__soul_biz_rate_limit_store__'

function getStore(): Map<string, WindowState> {
  const g = globalThis as any
  if (!g[storeKey]) g[storeKey] = new Map<string, WindowState>()
  return g[storeKey] as Map<string, WindowState>
}

export function getClientIp(req: NextRequest): string {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return 'unknown'
}

export function applyRateLimit(
  req: NextRequest,
  keyPrefix: string,
  options: LimitOptions
): NextResponse | null {
  const ip = getClientIp(req)
  const ua = (req.headers.get('user-agent') || 'unknown').slice(0, 120)
  const key = `${keyPrefix}:${ip}:${ua}`
  const now = Date.now()
  const limit = Math.max(1, options.limit)
  const windowMs = Math.max(1000, options.windowMs)

  const store = getStore()
  const current = store.get(key)
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  current.count += 1
  store.set(key, current)
  if (current.count <= limit) return null

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
  return NextResponse.json(
    {
      error: '请求过于频繁，请稍后重试',
      code: 'RATE_LIMITED',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'Cache-Control': 'no-store',
      },
    }
  )
}
