'use client'

import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white px-4 py-8 text-xs text-slate-500">
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/privacy" className="hover:text-slate-800">隐私政策</Link>
          <span className="text-slate-300">|</span>
          <Link href="/terms" className="hover:text-slate-800">用户协议</Link>
          <span className="text-slate-300">|</span>
          <Link href="/overview" className="hover:text-slate-800">项目总览</Link>
        </div>
        <div className="text-slate-600 leading-5">
          提示：上传/粘贴的内容将用于生成报告，并可能发送至第三方 AI 服务处理。请先打码敏感信息，并确保你对内容拥有合法授权。
        </div>
        <div className="text-slate-400">
          © {new Date().getFullYear()} 月见
        </div>
      </div>
    </footer>
  )
}
