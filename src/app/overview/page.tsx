'use client'

import Link from 'next/link'

const doneModules = [
  {
    title: '增长追踪引擎',
    desc: '记录访问、来源和关键行为事件，支撑转化优化。',
    files: ['src/lib/growth.ts', 'src/components/GrowthTracker.tsx'],
  },
  {
    title: '全站增长模式',
    desc: '全站统一展示增长状态与核心入口。',
    files: ['src/components/GrowthModeBanner.tsx', 'src/app/layout.tsx'],
  },
  {
    title: '增长看板',
    desc: '可视化查看访问、开始分析、完成分析与来源分布。',
    files: ['src/app/growth/page.tsx'],
  },
  {
    title: '关键漏斗埋点',
    desc: '主页 CTA、分析开始/完成、分享点击全部可追踪。',
    files: ['src/app/page.tsx', 'src/app/soul-autopsy/page.tsx', 'src/app/ai-fortune/page.tsx'],
  },
]

const nowStatus = [
  '本地构建通过（npm run build）',
  '增长看板可访问（/growth）',
  '项目总览可访问（/overview）',
  '线上可自动部署更新',
]

export default function OverviewPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="app-shell">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700">
            项目状态总览
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">当前交付内容</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
            这是当前版本的功能和交付清单，方便你快速判断项目完成度与下一步动作。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary">打开首页</Link>
            <Link href="/growth" className="btn-secondary">打开增长看板</Link>
            <Link href="/soul-autopsy" className="btn-secondary">打开情感法医</Link>
            <Link href="/ai-fortune" className="btn-secondary">打开 AI 占卜</Link>
          </div>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-2">
          {nowStatus.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              <span className="mr-2 text-emerald-600">●</span>
              {item}
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {doneModules.map((m) => (
            <section key={m.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{m.title}</h2>
              <p className="mb-3 mt-2 text-sm text-slate-600">{m.desc}</p>
              <div className="space-y-1">
                {m.files.map((f) => (
                  <div key={f} className="rounded-lg bg-slate-50 px-2 py-1.5 font-mono text-xs text-slate-700">
                    {f}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
