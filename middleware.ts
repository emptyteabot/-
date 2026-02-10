import { NextRequest, NextResponse } from 'next/server'

// Best-effort rate limit. On serverless/edge this may reset across instances,
// but it still blocks basic abuse and accidental infinite loops.
const WINDOW_MS = 60_000
const MAX_REQ = 60

type Bucket = { n: number; resetAt: number }

const buckets: Map<string, Bucket> = new Map()

function getIp(req: NextRequest): string {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return 'unknown'
}

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()

  const ip = getIp(req)
  const key = `${ip}:${req.nextUrl.pathname}`
  const now = Date.now()

  const b = buckets.get(key)
  if (!b || now > b.resetAt) {
    buckets.set(key, { n: 1, resetAt: now + WINDOW_MS })
    return NextResponse.next()
  }

  b.n++
  if (b.n > MAX_REQ) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((b.resetAt - now) / 1000)) } }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
