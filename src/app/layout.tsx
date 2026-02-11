import type { Metadata } from 'next'
import './globals.css'
import GrowthModeBanner from '@/components/GrowthModeBanner'
import GrowthTracker from '@/components/GrowthTracker'
import { Suspense } from 'react'
import SiteFooter from '@/components/SiteFooter'
import Analytics from '@/components/Analytics'

export const metadata: Metadata = {
  title: '月见 | AI 情感法医与赛博占卜',
  description: '上传聊天记录截图，生成情感关系分析报告；也可使用 AI 占卜获取情绪安抚与行动建议。',
  keywords: 'AI情感分析,聊天记录分析,关系诊断,AI占卜,塔罗,小红书变现',
  openGraph: {
    title: '月见 | 关系分析与 AI 占卜',
    description: '把截图交给 AI，快速看清关系信号与下一步建议。',
    type: 'website',
    locale: 'zh_CN',
  },
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='0.9em' font-size='90'%3E%F0%9F%8C%99%3C/text%3E%3C/svg%3E"
        />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900 antialiased">
        <Suspense fallback={null}>
          <GrowthTracker />
        </Suspense>
        <Analytics />
        <GrowthModeBanner />
        <main className="relative z-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
