'use client'

import Link from 'next/link'
import { trackGrowthEvent } from '@/lib/growth'
import LeadCapture from '@/components/LeadCapture'

export default function HomePage() {
  const products = [
    {
      id: 1,
      title: 'AI 情感法医',
      subtitle: '上传聊天截图，10 分钟出报告',
      description: 'OCR 提取聊天内容 + 关系模式分析 + 风险信号识别，帮用户停止内耗、快速决策。',
      href: '/soul-autopsy',
      badge: '主打产品',
      cta: '开始分析',
    },
    {
      id: 2,
      title: 'AI 赛博占卜',
      subtitle: '塔罗 / 流年 / 决策建议',
      description: '面向焦虑型用户的轻咨询产品，秒级出结果，可做低价引流和复购入口。',
      href: '/ai-fortune',
      badge: '引流产品',
      cta: '马上占卜',
    },
  ] as const

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-140px] h-[360px] w-[680px] -translate-x-1/2 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-80px] h-[300px] w-[300px] rounded-full bg-violet-200/40 blur-3xl" />
      </div>

      <section className="relative mx-auto flex w-full max-w-6xl flex-col px-5 pb-12 pt-16 md:px-8 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-600">
            <span className="pulse-dot" />
            内测开放中
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
            把关系问题交给 AI，给出可执行结论
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-slate-600 md:text-lg">
            月见是一个面向情感与决策场景的 AI 工具站，主打看得懂、出结果快、可直接落地。
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/soul-autopsy"
              onClick={() => trackGrowthEvent({ name: 'cta_click', page: '/', detail: 'hero_soul_autopsy' })}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              立即体验情感法医
            </Link>
            <Link
              href="/ai-fortune"
              onClick={() => trackGrowthEvent({ name: 'cta_click', page: '/', detail: 'hero_ai_fortune' })}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              打开 AI 占卜
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {products.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="group"
              onClick={() => trackGrowthEvent({ name: 'cta_click', page: '/', detail: product.href })}
            >
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-slate-300 group-hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {product.badge}
                  </span>
                  <span className="text-xs text-slate-400">产品 {product.id}</span>
                </div>

                <h2 className="text-xl font-semibold text-slate-900">{product.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{product.subtitle}</p>
                <p className="mt-4 text-sm leading-relaxed text-slate-700">{product.description}</p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{product.cta}</span>
                  <span className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-slate-900">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 text-sm text-slate-600 md:grid-cols-3">
          <div>隐私优先：上传数据仅用于本次分析</div>
          <div>报告可读：包含结论、证据、建议动作</div>
          <div>增长导向：低客单 + 高转化 + 复购路径</div>
        </div>

        <LeadCapture page="/" />
      </section>
    </div>
  )
}
