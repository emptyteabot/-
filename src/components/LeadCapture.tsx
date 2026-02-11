'use client'

import { FormEvent, useState } from 'react'
import { trackGrowthEvent } from '@/lib/growth'

interface LeadCaptureProps {
  page: string
}

export default function LeadCapture({ page }: LeadCaptureProps) {
  const [contact, setContact] = useState('')
  const [channel, setChannel] = useState('')
  const [intent, setIntent] = useState<'trial' | 'purchase' | 'agent' | 'other'>('trial')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    setOk(false)
    trackGrowthEvent({ name: 'lead_submit', page, detail: intent, source: channel || undefined })
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, channel, intent, note, page }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || '提交失败')
      setOk(true)
      setMsg('已提交，我们会尽快联系你。')
      setContact('')
      setNote('')
      trackGrowthEvent({ name: 'lead_success', page, detail: intent, source: channel || undefined })
    } catch (err: any) {
      setOk(false)
      setMsg(err?.message || '提交失败，请稍后重试')
      trackGrowthEvent({ name: 'lead_fail', page, detail: String(err?.message || 'error') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-10 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">获取私域转化方案</h3>
      <p className="mt-1 text-sm text-slate-600">留个联系方式，我给你一套「引流-成交-复购」脚本和报价模板。</p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          placeholder="微信 / 手机 / 邮箱"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
        <input
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder="来源渠道（小红书/抖音/朋友）"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
        <select
          value={intent}
          onChange={(e) => setIntent(e.target.value as 'trial' | 'purchase' | 'agent' | 'other')}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="trial">先试用</option>
          <option value="purchase">直接购买</option>
          <option value="agent">代理合作</option>
          <option value="other">其他</option>
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="备注（可选）"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
        <button
          disabled={loading}
          type="submit"
          className="md:col-span-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? '提交中...' : '提交线索'}
        </button>
      </form>
      {msg ? (
        <div className={`mt-3 text-sm ${ok ? 'text-emerald-700' : 'text-rose-600'}`}>{msg}</div>
      ) : null}
    </section>
  )
}
