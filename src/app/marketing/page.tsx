'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { trackGrowthEvent } from '@/lib/growth'

type ProductType = 'soul' | 'fortune' | 'both'
type ChannelType = 'xiaohongshu' | 'douyin' | 'wechat'

type MarketingIdea = {
  title: string
  hook: string
  outline: string[]
  cta: string
  hashtags: string[]
}

type MarketingPack = {
  goal: string
  today_tasks: string[]
  post_ideas: MarketingIdea[]
  dm_openers: string[]
  comment_replies: string[]
  kpi: {
    uploads_target: string
    completion_rate_target: string
    lead_rate_target: string
  }
  raw_text?: string
}

const DEFAULT_SCRIPTS = [
  {
    title: '首评引导',
    text: '先别急着下结论，发我3-8张连续截图，我先给你试读版。',
  },
  {
    title: '私聊开场',
    text: '你先发原图（别压缩），我直接给你：结论、证据、今晚怎么聊。',
  },
  {
    title: '成交收口',
    text: '你现在最需要的不是继续猜，是一句今晚就能发出去的话。',
  },
]

const VIBE_PRESETS = [
  '闺蜜口吻，像深夜语音转文字，有细节，不端着',
  '理性拆解，短句，少形容词，多证据',
  '反常识开场，先结论后解释，像真人复盘',
  '情绪安抚+行动建议，像朋友给建议',
]

export default function MarketingPage() {
  const [copied, setCopied] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [degraded, setDegraded] = useState(false)
  const [pack, setPack] = useState<MarketingPack | null>(null)
  const [product, setProduct] = useState<ProductType>('both')
  const [channel, setChannel] = useState<ChannelType>('xiaohongshu')
  const [vibe, setVibe] = useState('闺蜜口吻，像深夜语音转文字，有细节，不端着')

  const [unlockOrderId, setUnlockOrderId] = useState('')
  const [unlockCode, setUnlockCode] = useState('')
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  useEffect(() => {
    trackGrowthEvent({ name: 'marketing_open', page: '/marketing' })
  }, [])

  const quickTasks = useMemo(() => {
    if (pack?.today_tasks?.length) return pack.today_tasks
    return [
      '发布 3 条内容（案例、方法、观点各 1 条）',
      '每条内容至少回复 20 条评论',
      '私信引导 10 人进入试读报告',
      '记录上传人数、报告完成人数、留资人数',
    ]
  }, [pack])

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      trackGrowthEvent({ name: 'template_copy', page: '/marketing', detail: key })
      setTimeout(() => setCopied(''), 1200)
    } catch {
      // no-op
    }
  }

  async function generatePack() {
    setLoading(true)
    setError('')
    setDegraded(false)
    try {
      trackGrowthEvent({ name: 'cta_click', page: '/marketing', detail: 'generate_pack' })
      const res = await fetch('/api/marketing-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, channel, vibe }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || '营销包生成失败')
      setPack(data.pack || null)
      setDegraded(Boolean(data?.degraded))
    } catch (e: any) {
      setError(e?.message || '营销包生成失败')
    } finally {
      setLoading(false)
    }
  }

  async function generateUnlockCode() {
    setUnlockLoading(true)
    setUnlockError('')
    setUnlockCode('')
    try {
      const orderId = unlockOrderId.trim().toUpperCase()
      if (!orderId) throw new Error('请输入订单号')

      const res = await fetch('/api/admin-unlock-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'soul', orderId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) throw new Error(data?.error || '生成失败')
      setUnlockCode(String(data.code || ''))
    } catch (e: any) {
      setUnlockError(String(e?.message || '生成失败'))
    } finally {
      setUnlockLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent px-4 pb-16 pt-10">
      <div className="app-shell space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Marketing Stage</div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 md:text-4xl">营销作战台</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
            先做活人感内容，再做转化。目标是让用户感觉在和真人说话，不是在看 AI 模板。
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value as ProductType)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="both">双产品联动</option>
              <option value="soul">关系透视</option>
              <option value="fortune">AI 占卜</option>
            </select>

            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as ChannelType)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="xiaohongshu">小红书</option>
              <option value="douyin">抖音</option>
              <option value="wechat">公众号</option>
            </select>

            <input
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="活人感风格"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            活人感四要素：具体时间、具体场景、一句原话、一个动作。缺一项就会像 AI。
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {VIBE_PRESETS.map((item) => (
              <button
                key={item}
                onClick={() => setVibe(item)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={generatePack} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? '生成中...' : '一键生成今日营销包'}
            </button>
            <Link
              href="/soul-autopsy?src=marketing"
              onClick={() => trackGrowthEvent({ name: 'campaign_start', page: '/marketing', detail: 'soul-autopsy' })}
              className="btn-secondary"
            >
              启动关系透视转化
            </Link>
            <Link href="/growth" className="btn-secondary">查看增长看板</Link>
            <Link href="/" className="btn-secondary">返回首页</Link>
          </div>
          {degraded ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              当前使用兜底营销包（AI 服务波动）。先执行，再按增长数据迭代。
            </div>
          ) : null}
          {error ? <div className="mt-3 text-sm text-rose-600">{error}</div> : null}
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">今日执行清单</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {quickTasks.map((item) => (
                <div key={item} className="flex gap-2">
                  <span className="mt-0.5 text-emerald-600">●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">7日 KPI 目标</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div>上传截图人数：{pack?.kpi?.uploads_target || '300'}</div>
              <div>报告完成率：{pack?.kpi?.completion_rate_target || '70%'}</div>
              <div>留资转化率：{pack?.kpi?.lead_rate_target || '8%'}</div>
            </div>
          </div>
        </section>

        <section className="glass-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">即用话术</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {DEFAULT_SCRIPTS.map((s) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{s.text}</p>
                <button
                  onClick={() => copy(s.text, s.title)}
                  className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  {copied === s.title ? '已复制' : '复制话术'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {pack ? (
          <section className="glass-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">自动营销包</h2>
            <div className="mt-2 text-sm text-slate-700">{pack.goal}</div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {pack.post_ideas?.map((idea, idx) => (
                <article key={`${idea.title}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{idea.title}</h3>
                  <p className="mt-2 text-sm text-slate-700">{idea.hook}</p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {(idea.outline || []).map((p, i) => (
                      <li key={`${idx}-${i}`}>- {p}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-slate-700">CTA: {idea.cta}</p>
                  <p className="mt-2 text-xs text-slate-500">{(idea.hashtags || []).join(' ')}</p>
                  <button
                    onClick={() => copy(`${idea.title}\n${idea.hook}\n${(idea.outline || []).join('\n')}\nCTA:${idea.cta}`, `idea-${idx}`)}
                    className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {copied === `idea-${idx}` ? '已复制' : '复制素材'}
                  </button>
                </article>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">私信开场</div>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  {(pack.dm_openers || []).map((t, i) => (
                    <div key={`dm-${i}`} className="flex items-start justify-between gap-2">
                      <span>{t}</span>
                      <button onClick={() => copy(t, `dm-${i}`)} className="text-xs text-slate-500 hover:text-slate-900">复制</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">评论区回复</div>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  {(pack.comment_replies || []).map((t, i) => (
                    <div key={`reply-${i}`} className="flex items-start justify-between gap-2">
                      <span>{t}</span>
                      <button onClick={() => copy(t, `reply-${i}`)} className="text-xs text-slate-500 hover:text-slate-900">复制</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {pack.raw_text ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-slate-500">查看原始输出</summary>
                <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{pack.raw_text}</pre>
              </details>
            ) : null}
          </section>
        ) : null}

        <section className="glass-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">解锁码生成器（站长用）</h2>
          <p className="mt-2 text-sm text-slate-600">
            客户支付后把订单号发你，你在这里一键生成解锁码回给她。
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={unlockOrderId}
              onChange={(e) => setUnlockOrderId(e.target.value)}
              placeholder="订单号（例如 SLXXXX...）"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
            <button
              onClick={generateUnlockCode}
              disabled={unlockLoading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {unlockLoading ? '生成中...' : '生成解锁码'}
            </button>
            <button
              onClick={() => unlockCode && copy(unlockCode, 'unlock-code')}
              disabled={!unlockCode}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {copied === 'unlock-code' ? '已复制' : '复制解锁码'}
            </button>
          </div>

          {unlockError ? <div className="mt-3 text-sm text-rose-600">{unlockError}</div> : null}
          {unlockCode ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
              {unlockCode}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
