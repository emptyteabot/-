import type { Metadata } from 'next'
import './globals.css'
import GrowthModeBanner from '@/components/GrowthModeBanner'
import GrowthTracker from '@/components/GrowthTracker'
import { Suspense } from 'react'
import SiteFooter from '@/components/SiteFooter'
import Analytics from '@/components/Analytics'

export const metadata: Metadata = {
  title: '月见 | AI情感透视 × 塔罗占卜 - 看清他的心',
  description: '月见 - 上传聊天记录AI帮你看清感情真相，塔罗占卜给你此刻最需要的答案。内测开放中。',
  keywords: '塔罗占卜,AI塔罗,情感分析,聊天记录分析,星座运势,八字合婚,感情咨询,分手挽回,暧昧分析',
  openGraph: {
    title: '月见 | 看清他的心',
    description: '上传聊天记录，AI帮你看穿他到底爱不爱你。塔罗占卜，给迷茫的你一个方向。',
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
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=Noto+Serif+SC:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌙</text></svg>" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900 antialiased">
        <Suspense fallback={null}>
          <GrowthTracker />
        </Suspense>
        <Analytics />
        <GrowthModeBanner />
        <main className="relative z-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
