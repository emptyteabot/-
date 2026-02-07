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
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">Growth Dashboard</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEvents(readGrowthEvents())}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:text-white"
            >
              刷新
            </button>
            <button
              onClick={() => {
                clearGrowthEvents()
                setEvents([])
              }}
              className="rounded-lg border border-red-400/30 px-3 py-1.5 text-sm text-red-300 hover:text-red-200"
            >
              清空
            </button>
            <Link href="/" className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:text-white">
              返回首页
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="glass-card p-4">
            <div className="text-xs text-white/50">今日访问</div>
            <div className="mt-1 text-2xl font-bold">{views}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-white/50">开始分析</div>
            <div className="mt-1 text-2xl font-bold">{starts}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-white/50">完成分析</div>
            <div className="mt-1 text-2xl font-bold">{dones}</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-xs text-white/50">完成率</div>
            <div className="mt-1 text-2xl font-bold">{rate}%</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card p-4">
            <div className="mb-2 text-sm font-semibold text-white/80">今日热门页面</div>
            <div className="space-y-2 text-sm">
              {topPages.slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex justify-between text-white/70">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="mb-2 text-sm font-semibold text-white/80">来源分布（src/utm_source）</div>
            <div className="space-y-2 text-sm">
              {topSources.length === 0 && <div className="text-white/50">暂无来源参数数据</div>}
              {topSources.slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex justify-between text-white/70">
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-4 text-sm text-white/70">
          <div className="font-semibold text-white/90">今日执行建议</div>
          <div className="mt-2">1. 访问 &lt; 300: 优先发内容，不优化产品细节。</div>
          <div>2. 开始分析多但完成率低: 优先缩短上传/等待步骤。</div>
          <div>3. 分享点击少: 在结果页多放“转发领权益”按钮。</div>
          <div className="mt-2 text-xs text-white/50">今日分享点击：{shares}</div>
        </div>
      </div>
    </div>
  )
}
