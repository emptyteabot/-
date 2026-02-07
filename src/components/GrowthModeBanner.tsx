'use client'

import Link from 'next/link'
import { trackGrowthEvent } from '@/lib/growth'

export default function GrowthModeBanner() {
  return (
    <div className="sticky top-0 z-[60] w-full border-b border-emerald-400/30 bg-emerald-500/10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs text-emerald-100 md:text-sm">
        <span>Growth Mode: 全站免费公测中，先增长后变现。</span>
        <div className="flex items-center gap-3">
          <Link
            href="/growth"
            onClick={() => trackGrowthEvent({ name: 'cta_click', page: '/_global', detail: 'open_growth_dashboard' })}
            className="rounded-md border border-emerald-300/40 px-2 py-1 text-emerald-100 hover:bg-emerald-400/10"
          >
            看增长数据
          </Link>
          <a
            href="/?src=invite"
            onClick={() => trackGrowthEvent({ name: 'invite_click', page: '/_global', detail: 'copy_invite_link' })}
            className="rounded-md bg-emerald-500/30 px-2 py-1 text-emerald-50 hover:bg-emerald-500/40"
          >
            邀请链接
          </a>
        </div>
      </div>
    </div>
  )
}

