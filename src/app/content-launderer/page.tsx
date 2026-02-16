'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { trackGrowthEvent } from '@/lib/growth'

type TabType = 'examples' | 'rewrite' | 'generate' | 'titles'
type Platform = 'xiaohongshu' | 'douyin' | 'wechat' | 'weibo'
type PromoTarget = 'soul' | 'fortune' | 'both' | 'none'

const PLATFORMS: Array<{ id: Platform; label: string }> = [
  { id: 'xiaohongshu', label: '小红书' },
  { id: 'douyin', label: '抖音' },
  { id: 'wechat', label: '公众号' },
  { id: 'weibo', label: '微博' },
]

const PROMO_OPTIONS: Array<{ id: PromoTarget; label: string }> = [
  { id: 'both', label: '双产品联动' },
  { id: 'soul', label: '情感法医' },
  { id: 'fortune', label: 'AI 占卜' },
  { id: 'none', label: '不植入' },
]

const READY_EXAMPLES = [
  {
    title: '别猜了，先看聊天证据',
    content:
      '昨晚我把三个月聊天记录丢给 AI，结果它直接给出四个维度：主动度、回复时延、深夜互动、情绪稳定性。\n最扎心一句：你不是“被误会”，你是在单向维护关系。\n如果你也陷在反复内耗，先别继续猜，先看证据。',
  },
  {
    title: '本周运势不是玄学，是执行建议',
    content:
      '我用 AI 做了本周塔罗解读，重点不是“会不会发财”，而是三条行动建议：要见谁、该停什么、今天先做哪件事。\n好内容不是神神叨叨，是看完能立刻执行。',
  },
  {
    title: '低价引流，高价值服务的三段式',
    content:
      '第一步：用低门槛报告解决“当下焦虑”。\n第二步：给出可执行建议建立信任。\n第三步：承接深度服务（复盘/咨询/长期跟踪）。\n内容不要靠夸张，靠结果。',
  },
]

export default function ContentLaundererPage() {
  const [tab, setTab] = useState<TabType>('examples')
  const [platform, setPlatform] = useState<Platform>('xiaohongshu')
  const [promoTarget, setPromoTarget] = useState<PromoTarget>('both')
  const [inputContent, setInputContent] = useState('')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const placeholder = useMemo(() => {
    if (tab === 'rewrite') return '粘贴你要改写的原文（建议 100-1500 字）'
    if (tab === 'generate') return '例如：怀疑对象冷淡时，如何用数据判断关系趋势'
    return '例如：聊天记录分析、关系焦虑、自我成长'
  }, [tab])

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      trackGrowthEvent({ name: 'template_copy', page: '/content-launderer' })
      setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  async function runTask() {
    if (tab === 'examples') return

    setLoading(true)
    setError('')
    setResult('')

    try {
      const body: any = { platform, promoTarget }
      if (tab === 'rewrite') {
        if (!inputContent.trim()) throw new Error('请先输入要改写的内容')
        body.type = 'rewrite'
        body.content = inputContent.trim()
      }
      if (tab === 'generate') {
        if (!topic.trim()) throw new Error('请先输入创作主题')
        body.type = 'generate'
        body.topic = topic.trim()
      }
      if (tab === 'titles') {
        if (!topic.trim()) throw new Error('请先输入标题主题')
        body.type = 'batch-titles'
        body.topic = topic.trim()
      }

      const res = await fetch('/api/content-launderer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          throw new Error('该功能当前需要解锁后使用。')
        }
        throw new Error(data.error || '生成失败，请稍后重试')
      }

      setResult(String(data.result || ''))
      trackGrowthEvent({ name: 'analysis_done', page: '/content-launderer', detail: tab })
    } catch (e: any) {
      setError(e?.message || '生成失败')
      trackGrowthEvent({ name: 'analysis_fail', page: '/content-launderer', detail: String(e?.message || 'error') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent px-4 pb-16 pt-8">
      <div className="app-shell">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Content Studio</div>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900 md:text-4xl">内容工厂</h1>
            <p className="mt-2 text-sm text-slate-600">一键改写、主题创作、批量标题，直接用于你的小红书/抖音投放。</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/marketing" className="btn-secondary px-3 py-2">营销作战台</Link>
            <Link href="/" className="btn-secondary px-3 py-2">返回首页</Link>
          </div>
        </header>

        <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {[
            { id: 'examples', label: '现成模板' },
            { id: 'rewrite', label: '改写' },
            { id: 'generate', label: '创作' },
            { id: 'titles', label: '批量标题' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as TabType)
                setError('')
                setResult('')
              }}
              className={`rounded-xl px-4 py-2 text-sm transition ${tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'examples' && (
          <div className="grid gap-4 md:grid-cols-3">
            {READY_EXAMPLES.map((e) => (
              <section key={e.title} className="glass-card p-5">
                <h2 className="text-base font-semibold text-slate-900">{e.title}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{e.content}</p>
                <button
                  onClick={() => copyText(`${e.title}\n\n${e.content}`)}
                  className="mt-4 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {copied ? '已复制' : '复制模板'}
                </button>
              </section>
            ))}
          </div>
        )}

        {tab !== 'examples' && (
          <div className="grid gap-5 md:grid-cols-2">
            <section className="glass-card p-5">
              <div className="mb-4">
                <div className="mb-2 text-xs text-slate-500">目标平台</div>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm ${platform === p.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 text-xs text-slate-500">推广植入</div>
                <div className="flex flex-wrap gap-2">
                  {PROMO_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setPromoTarget(o.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm ${promoTarget === o.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'rewrite' ? (
                <textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={placeholder}
                  className="h-52 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                />
              ) : (
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                />
              )}

              {error ? <div className="mt-3 text-sm text-rose-600">{error}</div> : null}

              <button
                onClick={runTask}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? '生成中...' : tab === 'rewrite' ? '开始改写' : tab === 'generate' ? '开始创作' : '生成标题'}
              </button>
            </section>

            <section className="glass-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">输出结果</div>
                {result ? (
                  <button
                    onClick={() => copyText(result)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    复制结果
                  </button>
                ) : null}
              </div>
              <div className="min-h-[260px] whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                {result || '结果会显示在这里。'}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
