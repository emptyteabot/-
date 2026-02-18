'use client'

import { Suspense } from 'react'
import { FormEvent, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => searchParams.get('next') || '/marketing', [searchParams])

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '登录失败')
      router.replace(nextPath)
    } catch (err: any) {
      setError(String(err?.message || '登录失败'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">管理页登录</h1>
        <p className="mt-2 text-sm text-slate-600">该页面仅限站长使用。</p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入管理员密码"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
          {error ? <div className="text-xs text-rose-600">{error}</div> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? '登录中...' : '进入管理页'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminLoginContent />
    </Suspense>
  )
}
