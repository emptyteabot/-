'use client'

import Link from 'next/link'

const doneModules = [
  {
    title: '增长追踪引擎',
    desc: '自动记录访问、来源、关键行为事件，作为增长决策数据底座。',
    files: ['src/lib/growth.ts', 'src/components/GrowthTracker.tsx'],
    status: '已完成',
  },
  {
    title: '全站增长模式横幅',
    desc: '全站显示“免费公测+增长优先”提示，并提供快捷入口。',
    files: ['src/components/GrowthModeBanner.tsx', 'src/app/layout.tsx'],
    status: '已完成',
  },
  {
    title: '增长数据看板',
    desc: '可视化查看访问、开始分析、完成分析、完成率、来源分布。',
    files: ['src/app/growth/page.tsx'],
    status: '已完成',
  },
  {
    title: '关键漏斗埋点',
    desc: '首页CTA、分析开始/完成、分享点击都可追踪。',
    files: [
      'src/app/page.tsx',
      'src/app/soul-autopsy/page.tsx',
      'src/app/ai-fortune/page.tsx',
      'src/components/ShareButton.tsx',
    ],
    status: '已完成',
  },
  {
    title: '部署与安全修复',
    desc: '去掉硬编码密钥，避免脚本覆盖本地环境配置。',
    files: ['start.bat', 'deploy.bat', 'deploy-script.js'],
    status: '已完成',
  },
]

const nowStatus = [
  '本地构建已通过（npm run build）',
  '增长页面已可访问：/growth',
  '总览页面已可访问：/overview',
  '线上发布待执行（需你的 Vercel 凭据）',
]

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.22),transparent_30%),#070b14] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur">
          <div className="mb-3 inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
            项目状态总览
          </div>
          <h1 className="text-3xl font-black md:text-4xl">你的网站我做成了什么</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/70 md:text-base">
            这是“24小时增长版本”的可视化说明页。你现在不用看代码，直接看这里就知道功能、状态和入口。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className="rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white">
              打开首页
            </Link>
            <Link href="/growth" className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-400/20">
              打开增长看板
            </Link>
            <Link href="/soul-autopsy" className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 hover:text-white">
              打开灵魂报告
            </Link>
            <Link href="/ai-fortune" className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 hover:text-white">
              打开塔罗运势
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-2">
          {nowStatus.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/85">
              <span className="mr-2 text-emerald-300">●</span>
              {item}
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {doneModules.map((m) => (
            <section key={m.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xl font-bold">{m.title}</h2>
                <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">
                  {m.status}
                </span>
              </div>
              <p className="mb-3 text-sm text-white/70">{m.desc}</p>
              <div className="space-y-1">
                {m.files.map((f) => (
                  <div key={f} className="rounded-lg bg-black/25 px-2 py-1.5 font-mono text-xs text-cyan-200/90">
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

