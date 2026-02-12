'use client'

import { useState } from 'react'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'

type ProductMode = 'menu' | 'tarot' | 'daily'
type TarotCategory = '感情' | '事业' | '财运' | '综合'

interface TarotCardData {
  id: number
  name: string
  nameEn: string
  meaning: string
  reversed: string
  element: string
  keywords: string[]
  isReversed?: boolean
}

interface DailyResult {
  zodiac?: { name?: string; symbol?: string; traits?: string[] }
  fortune?: string
  locked?: boolean
}

const CATEGORIES: TarotCategory[] = ['感情', '事业', '财运', '综合']

export default function AIFortunePage() {
  const [mode, setMode] = useState<ProductMode>('menu')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consented, setConsented] = useState(false)

  const [category, setCategory] = useState<TarotCategory>('综合')
  const [question, setQuestion] = useState('')
  const [cards, setCards] = useState<TarotCardData[]>([])
  const [reading, setReading] = useState('')

  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthHour, setBirthHour] = useState<number | ''>('')
  const [daily, setDaily] = useState<DailyResult | null>(null)

  async function runTarot() {
    if (!consented) return setError('请先勾选同意协议')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tarot',
          cardCount: 3,
          question: question || `我想了解最近的${category}走势`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成失败')
      setCards(data.cards || [])
      setReading(String(data.reading || ''))
    } catch (e: any) {
      setError(e?.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  async function runDaily() {
    if (!consented) return setError('请先勾选同意协议')
    if (!birthYear || !birthMonth || !birthDay) return setError('请填写完整生日')
    setLoading(true)
    setError('')
    try {
      const birthday = `${birthYear}-${birthMonth}-${birthDay}`
      const res = await fetch('/api/ai-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily',
          birthday,
          birthHour: birthHour === '' ? undefined : birthHour,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成失败')
      setDaily(data)
    } catch (e: any) {
      setError(e?.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMode('menu')
    setCards([])
    setReading('')
    setDaily(null)
    setError('')
  }

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 transition hover:text-slate-900">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回
          </Link>
          <div className="text-sm font-semibold tracking-wide text-slate-900">AI 占卜</div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pb-20 pt-24">
        {mode === 'menu' && (
          <div className="animate-fade-in-up">
            <div className="mb-10 text-center">
              <div className="mb-5 text-xs uppercase tracking-[0.2em] text-slate-400">AI Fortune</div>
              <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">命运指引</h1>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">极简输入，快速得到可执行建议。</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button onClick={() => setMode('tarot')} className="glass-card p-6 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <div className="text-sm font-semibold text-slate-900">塔罗三牌</div>
                <p className="mt-2 text-sm text-slate-600">适合关系、工作、抉择场景，给出方向判断。</p>
              </button>
              <button onClick={() => setMode('daily')} className="glass-card p-6 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <div className="text-sm font-semibold text-slate-900">今日运势</div>
                <p className="mt-2 text-sm text-slate-600">输入生日，快速看感情/事业/财运建议。</p>
              </button>
            </div>

            <label className="mt-6 flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} className="mt-0.5" />
              <span>我已阅读并同意 <Link href="/terms" className="text-slate-900 underline">用户协议</Link> 与 <Link href="/privacy" className="text-slate-900 underline">隐私政策</Link>。</span>
            </label>
          </div>
        )}

        {mode === 'tarot' && (
          <div className="animate-fade-in-up space-y-5">
            <h2 className="text-2xl font-semibold text-slate-900">塔罗三牌</h2>
            <div className="glass-card p-5">
              <div className="mb-3 text-sm text-slate-600">问题分类</div>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} className={`rounded-xl border px-3 py-2 text-sm transition ${category === c ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="可选：输入你最关心的问题"
                className="mt-4 h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500"
              />
            </div>

            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}

            <button onClick={runTarot} disabled={loading} className="btn-primary w-full text-base disabled:opacity-60">
              {loading ? '生成中...' : '开始解读'}
            </button>

            {cards.length > 0 && (
              <div className="glass-card p-5">
                <div className="mb-3 text-sm font-semibold text-slate-900">抽到的牌</div>
                <div className="grid gap-2 md:grid-cols-3">
                  {cards.map((c, i) => (
                    <div key={`${c.id}-${i}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.isReversed ? '逆位' : '正位'} · {c.element}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reading && (
              <div className="glass-card p-6">
                <div className="prose max-w-none prose-slate">
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{reading}</div>
                </div>
                <div className="mt-4">
                  <ShareButton title="我的 AI 占卜结果" productName="月见" cta="你也来试试" className="w-full justify-center" />
                </div>
              </div>
            )}

            <button onClick={reset} className="btn-secondary w-full">返回</button>
          </div>
        )}

        {mode === 'daily' && (
          <div className="animate-fade-in-up space-y-5">
            <h2 className="text-2xl font-semibold text-slate-900">今日运势</h2>
            <div className="glass-card p-5">
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                <input value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="年" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
                <input value={birthMonth} onChange={(e) => setBirthMonth(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="月" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
                <input value={birthDay} onChange={(e) => setBirthDay(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="日" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
                <input value={birthHour === '' ? '' : String(birthHour)} onChange={(e) => setBirthHour(e.target.value === '' ? '' : Number(e.target.value.replace(/\D/g, '').slice(0, 2)))} placeholder="时(选填)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
              </div>
            </div>

            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}

            <button onClick={runDaily} disabled={loading} className="btn-primary w-full text-base disabled:opacity-60">
              {loading ? '生成中...' : '查看运势'}
            </button>

            {daily?.fortune && (
              <div className="glass-card p-6">
                <div className="mb-2 text-sm font-semibold text-slate-900">{daily.zodiac?.name || '今日运势'}</div>
                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{daily.fortune}</div>
                <div className="mt-4">
                  <ShareButton title="我的今日运势" productName="月见" cta="你也来测测" className="w-full justify-center" />
                </div>
              </div>
            )}

            <button onClick={reset} className="btn-secondary w-full">返回</button>
          </div>
        )}
      </div>
    </div>
  )
}
