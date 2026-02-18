import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { applyRateLimit } from '@/lib/rate-limit'

const COOKIE = 'admin_dash'

function adminPassword(): string {
  return (process.env.ADMIN_DASH_PASSWORD || '').trim()
}

function adminToken(secret: string): string {
  return createHash('sha256').update(`admin:${secret}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'admin-session', {
    limit: Number(process.env.RL_ADMIN_SESSION_LIMIT || 20),
    windowMs: Number(process.env.RL_ADMIN_SESSION_WINDOW_MS || 60_000),
  })
  if (limited) return limited

  const secret = adminPassword()
  if (!secret) {
    return NextResponse.json({ error: '管理员密码未配置（ADMIN_DASH_PASSWORD）' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const password = String(body?.password || '').trim()
  if (!password) {
    return NextResponse.json({ error: '请输入管理员密码' }, { status: 400 })
  }
  if (password !== secret) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: COOKIE,
    value: adminToken(secret),
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0,
  })
  return res
}
