import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_PREFIX = 'soul_paid_'

function secret(): string {
  // Prefer dedicated secret. Fallbacks are for convenience only.
  return (
    process.env.PAYWALL_SECRET ||
    process.env.VERCEL_PROJECT_ID ||
    process.env.AI_API_KEY ||
    'dev-paywall-secret'
  )
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
}

export type PayProduct = 'soul' | 'fortune-tarot' | 'fortune-daily' | 'launderer'

export async function setPaidCookie(product: PayProduct, maxAgeSeconds: number = 60 * 60 * 24 * 365) {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds
  const nonce = crypto.randomBytes(8).toString('hex')
  const payload = `${product}.${exp}.${nonce}`
  const sig = sign(payload)
  const store = await cookies()
  store.set({
    name: `${COOKIE_PREFIX}${product}`,
    value: `${payload}.${sig}`,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: maxAgeSeconds,
  })
}

export async function isPaid(product: PayProduct): Promise<boolean> {
  const store = await cookies()
  const v = store.get(`${COOKIE_PREFIX}${product}`)?.value
  if (!v) return false
  const parts = v.split('.')
  if (parts.length !== 4) return false
  const [p, expStr, nonce, sig] = parts
  if (p !== product) return false
  const exp = Number(expStr)
  if (!Number.isFinite(exp)) return false
  if (Math.floor(Date.now() / 1000) > exp) return false
  const payload = `${p}.${expStr}.${nonce}`
  return sign(payload) === sig
}

export function growthModeEnabled(): boolean {
  const v = process.env.GROWTH_MODE
  if (!v) return true // default to growth-mode to avoid breaking current flow
  return v === '1' || v.toLowerCase() === 'true'
}
