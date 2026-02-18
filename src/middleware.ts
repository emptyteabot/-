import { NextRequest, NextResponse } from 'next/server'

// Best-effort rate limit. On serverless/edge this may reset across instances,
// but it still blocks basic abuse and accidental infinite loops.
const WINDOW_MS = 60_000
const MAX_REQ = 60
const ADMIN_COOKIE = 'admin_dash'
const ADMIN_PATH_PREFIXES = ['/marketing', '/growth', '/overview', '/content-launderer']
const ADMIN_API_PATHS = ['/api/marketing-pack', '/api/content-launderer', '/api/admin-unlock-code']

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

function isAdminPath(pathname: string): boolean {
  if (ADMIN_API_PATHS.includes(pathname)) return true
  return ADMIN_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  const raw = process.env.ADMIN_DASH_PASSWORD
  const secret = raw ? raw.trim() : ''
  if (!secret) return false

  const token = req.cookies.get(ADMIN_COOKIE)?.value || ''
  if (!token) return false

  const expected = await sha256Hex(`admin:${secret}`)
  return token === expected
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (isAdminPath(pathname)) {
    const ok = await checkAdminAuth(req)
    if (!ok) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin-login'
      loginUrl.searchParams.set('next', `${pathname}${req.nextUrl.search}`)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (!pathname.startsWith('/api/')) return NextResponse.next()

  const ip = getIp(req)
  const key = `${ip}:${pathname}`
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
  matcher: ['/api/:path*', '/marketing/:path*', '/growth/:path*', '/overview/:path*', '/content-launderer/:path*'],
}
