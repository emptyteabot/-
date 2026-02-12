'use client'

import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/95 px-4 py-7 text-xs text-slate-500">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/privacy" className="transition hover:text-slate-900">隐私政策</Link>
          <span className="text-slate-300">|</span>
          <Link href="/terms" className="transition hover:text-slate-900">用户协议</Link>
          <span className="text-slate-300">|</span>
          <Link href="/overview" className="transition hover:text-slate-900">项目总览</Link>
        </div>
        <p className="max-w-4xl leading-5 text-slate-600">
          提示：上传或粘贴内容可能会发送至第三方 AI 服务进行处理。请先打码敏感信息，并确保你拥有合法授权。
        </p>
        <div className="text-slate-400">© {new Date().getFullYear()} 月见</div>
      </div>
    </footer>
  )
}
