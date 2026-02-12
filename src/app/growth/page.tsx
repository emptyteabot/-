'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { clearGrowthEvents, readGrowthEvents, trackGrowthEvent, type GrowthEvent } from '@/lib/growth'

function groupCount(items: GrowthEvent[], key: (e: GrowthEvent) => string) {
  const map = new Map<string, number>()
  for (const e of items) {
    const k = key(e)
    map.set(k, (map.get(k) || 0) + 1)
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
}

export default function GrowthPage() {
  const [events, setEvents] = useState<GrowthEvent[]>([])

  useEffect(() => {
    trackGrowthEvent({ name: 'page_view', page: '/growth' })
    setEvents(readGrowthEvents())
  }, [])

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [])

  const todayEvents = useMemo(() => events.filter((e) => e.at >= todayStart), [events, todayStart])
  const views = todayEvents.filter((e) => e.name === 'page_view').length
  const shares = todayEvents.filter((e) => e.name === 'share_click').length
  const starts = todayEvents.filter((e) => e.name === 'analysis_start').length
  const dones = todayEvents.filter((e) => e.name === 'analysis_done').length
  const rate = starts ? Math.round((dones / starts) * 100) : 0

  const topPages = useMemo(() => groupCount(todayEvents.filter((e) => e.name === 'page_view'), (e) => e.page), [todayEvents])
  const topSources = useMemo(
    () => groupCount(todayEvents.filter((e) => !!e.source), (e) => e.source || 'unknown'),
    [todayEvents]
  )

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="app-shell space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">增长看板</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEvents(readGrowthEvents())}
              className="btn-secondary px-3 py-1.5"
            >
              刷新
            </button>
            <button
              onClick={() => {
                clearGrowthEvents()
                setEvents([])
              }}
              className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              清空
            </button>
            <Link href="/" className="btn-secondary px-3 py-1.5">返回首页</Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="glass-card p-4"><div className="text-xs text-slate-500">今日访问</div><div className="mt-1 text-2xl font-semibold">{views}</div></div>
          <div className="glass-card p-4"><div className="text-xs text-slate-500">开始分析</div><div className="mt-1 text-2xl font-semibold">{starts}</div></div>
          <div className="glass-card p-4"><div className="text-xs text-slate-500">完成分析</div><div className="mt-1 text-2xl font-semibold">{dones}</div></div>
          <div className="glass-card p-4"><div className="text-xs text-slate-500">完成率</div><div className="mt-1 text-2xl font-semibold">{rate}%</div></div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card p-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">热门页面</div>
            <div className="space-y-2 text-sm">
              {topPages.slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex justify-between text-slate-700">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="mb-2 text-sm font-semibold text-slate-900">来源分布</div>
            <div className="space-y-2 text-sm">
              {topSources.length === 0 && <div className="text-slate-500">暂无来源数据</div>}
              {topSources.slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex justify-between text-slate-700">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">执行建议</div>
          <div className="mt-2">1. 访问低于 300：优先发内容引流。</div>
          <div>2. 开始分析高但完成率低：继续缩短上传到结果的等待时间。</div>
          <div>3. 分享低：在结果页强化“分享领取权益”。</div>
          <div className="mt-2 text-xs text-slate-500">今日分享点击：{shares}</div>
        </div>
      </div>
    </div>
  )
}
