'use client'

import Link from 'next/link'
import { trackGrowthEvent } from '@/lib/growth'

export default function GrowthModeBanner() {
  const v = process.env.NEXT_PUBLIC_GROWTH_MODE
  const growthMode = !v || v === '1' || v === 'true'
  if (!growthMode) return null

  return (
    <div className="sticky top-0 z-[60] w-full border-b border-sky-200 bg-sky-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs text-sky-900 md:text-sm">
        <span>Growth Mode: 全站免费公测中，先验证增长后变现。</span>
        <div className="flex items-center gap-2">
          <Link
            href="/growth"
            onClick={() => trackGrowthEvent({ name: 'cta_click', page: '/_global', detail: 'open_growth_dashboard' })}
            className="rounded-md border border-sky-200 bg-white px-2.5 py-1 text-sky-900 transition hover:bg-sky-100"
          >
            看增长数据
          </Link>
          <Link
            href="/?src=invite"
            onClick={() => trackGrowthEvent({ name: 'invite_click', page: '/_global', detail: 'copy_invite_link' })}
            className="rounded-md bg-slate-900 px-2.5 py-1 text-white transition hover:bg-slate-800"
          >
            邀请链接
          </Link>
        </div>
      </div>
    </div>
  )
}
