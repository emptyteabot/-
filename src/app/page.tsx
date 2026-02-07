'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { trackGrowthEvent } from '@/lib/growth'

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [userCount, setUserCount] = useState(302847)

  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3) + 1)
    }, 5000 + Math.random() * 10000)
    return () => clearInterval(interval)
  }, [])

  const projects = [
    {
      id: 1,
      title: '感情透视报告',
      subtitle: '看清他的心',
      description: '上传你们的聊天记录，AI 帮你看穿那些「嗯嗯哦哦」背后的真实想法。他到底爱不爱你？答案都在对话里。',
      icon: '💎',
      href: '/soul-autopsy',
      gradient: 'from-rose-400 via-pink-500 to-purple-500',
      glowColor: 'rgba(244, 114, 182, 0.3)',
      price: '✨ 限时免费',
      tag: '🔥 30万+姐妹都在用',
    },
    {
      id: 2,
      title: 'AI 塔罗占卜',
      subtitle: '命运指引',
      description: '三张命运之牌 × 八字命盘 × 星座运势。给迷茫的你一个方向，给纠结的你一个答案。',
      icon: '🔮',
      href: '/ai-fortune',
      gradient: 'from-violet-400 via-purple-500 to-indigo-500',
      glowColor: 'rgba(167, 139, 250, 0.3)',
      price: '✨ 限时免费',
      tag: '✨ 今日已占 3,847 次',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        {/* Brand */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="text-6xl mb-6">🌙</div>
          <h1 className="text-5xl md:text-7xl font-black font-display mb-4 tracking-tight">
            <span className="text-gradient-fortune">月见</span>
          </h1>
          <p className="text-lg md:text-xl text-white/40 font-light max-w-md mx-auto">
            每个女人都值得看清真相，找到方向
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-white/50">
            <span className="pulse-dot" />
            已为 <span className="text-purple-300 font-medium">{userCount.toLocaleString()}</span> 位姐妹解读困惑
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full px-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={project.href}
              className="group relative"
              onClick={() => trackGrowthEvent({ name: 'cta_click', page: '/', detail: project.href })}
              onMouseEnter={() => setHoveredCard(project.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: project.glowColor }}
              />
              <div className="relative glass-card p-8 hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
                <div className="absolute top-4 right-4">
                  <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${project.gradient} text-white font-medium`}>
                    {project.tag}
                  </span>
                </div>

                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {project.icon}
                </div>

                <h2 className="text-2xl font-bold mb-1">{project.title}</h2>
                <p className="text-sm text-purple-300/50 mb-3">{project.subtitle}</p>

                <p className="text-white/60 leading-relaxed mb-6">
                  {project.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`text-xl font-black bg-gradient-to-r ${project.gradient} bg-clip-text text-transparent`}>
                    {project.price}
                  </span>
                  <span className="flex items-center gap-2 text-white/40 group-hover:text-white/80 transition-colors">
                    立即体验
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-12 max-w-2xl w-full px-4">
          <div className="glass-card-dark p-4">
            <div className="flex items-center gap-2 text-white/30 text-xs mb-3">
              <span>💬</span> 姐妹们的真实反馈
            </div>
            <div className="space-y-2">
              {[
                { text: '看完报告我直接哭了…原来他真的只是在敷衍我', time: '刚刚' },
                { text: '塔罗牌说我会遇到新的缘分，心里踏实多了', time: '2分钟前' },
                { text: '分析得比我闺蜜还准，关键是不会劝我将就', time: '5分钟前' },
                { text: '终于看清了，该放手就放手吧，谢谢月见', time: '8分钟前' },
              ].map((msg, i) => (
                <div key={i} className="flex items-center gap-2 text-xs animate-fade-in-up" style={{ animationDelay: `${i * 0.2}s` }}>
                  <span className="text-pink-400/40">♡</span>
                  <span className="text-white/50 flex-1">{msg.text}</span>
                  <span className="text-white/20 whitespace-nowrap">{msg.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust */}
        <div className="mt-8 flex items-center gap-6 text-white/20 text-xs">
          <span>🔒 隐私保护，阅后即焚</span>
          <span>💜 专为女性设计</span>
          <span>⭐ 好评率 98.7%</span>
        </div>
      </section>
    </div>
  )
}
