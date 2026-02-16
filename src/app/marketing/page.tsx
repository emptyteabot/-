'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { trackGrowthEvent } from '@/lib/growth'

const SCRIPTS = [
  {
    title: '小红书首评引导',
    text: '别猜了，先看聊天证据。把3-8张连续截图发给我，2分钟看清关系信号。',
  },
  {
    title: '私聊开场',
    text: '你先发原图（别发缩略图），我先给你做一版试读报告，再决定要不要继续。',
  },
  {
    title: '成交收口',
    text: '你现在最需要的不是继续猜，而是可执行下一步。报告我给你按“结论-证据-动作”整理好。',
  },
]

const TODAY_CHECKLIST = [
  '发布 3 条内容（1 条案例、1 条方法、1 条观点）',
  '每条内容至少回复 20 条评论',
  '私信引导 10 人进入免费试读',
  '记录：上传人数、报告完成人数、留资人数',
]

export default function MarketingPage() {
  const [copied, setCopied] = useState<string>('')

  useEffect(() => {
    trackGrowthEvent({ name: 'marketing_open', page: '/marketing' })
  }, [])

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

  return (
    <div className="min-h-screen bg-transparent px-4 pb-16 pt-10">
      <div className="app-shell space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Marketing Stage</div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 md:text-4xl">营销作战台</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
            目标是先拿稳定转化数据，再放大投流。今天只做可执行动作，不做无效忙碌。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/soul-autopsy?src=marketing"
              onClick={() => trackGrowthEvent({ name: 'campaign_start', page: '/marketing', detail: 'soul-autopsy' })}
              className="btn-primary"
            >
              启动情感法医转化
            </Link>
            <Link href="/content-launderer?src=marketing" className="btn-secondary">
              打开内容工厂
            </Link>
            <Link href="/growth" className="btn-secondary">
              查看增长看板
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">今日执行清单</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {TODAY_CHECKLIST.map((item) => (
                <div key={item} className="flex gap-2">
                  <span className="mt-0.5 text-emerald-600">●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">7日目标</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div>上传截图人数：不少于 300</div>
              <div>OCR 成功率：不少于 85%</div>
              <div>报告完成率：不少于 70%</div>
              <div>留资转化率：不少于 8%</div>
            </div>
          </div>
        </section>

        <section className="glass-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">可直接复制的话术</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {SCRIPTS.map((s) => (
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

        <section className="glass-card p-5 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">执行原则</div>
          <div className="mt-2">1. 先跑通“上传→报告→留资”闭环，再谈放量。</div>
          <div>2. 每天只盯 4 个核心数据：上传、OCR成功、报告完成、留资。</div>
          <div>3. 任何渠道文案都回到一个卖点：看证据，不猜测。</div>
        </section>
      </div>
    </div>
  )
}
