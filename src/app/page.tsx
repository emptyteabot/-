'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trackGrowthEvent } from '@/lib/growth'
import LeadCapture from '@/components/LeadCapture'

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const projects = [
    {
      id: 1,
      title: '感情透视报告',
      subtitle: '看清他的心',
      description: '上传聊天记录或截图，AI 帮你识别关系模式、回复热度、情绪波动和风险信号。',
      icon: '💎',
      href: '/soul-autopsy',
      gradient: 'from-rose-400 via-pink-500 to-purple-500',
      glowColor: 'rgba(244, 114, 182, 0.3)',
      price: '限时免费',
      tag: '内测开放中',
    },
    {
      id: 2,
      title: 'AI 塔罗占卜',
      subtitle: '命运指引',
      description: '塔罗解读 + 运势建议，帮助用户在情感和决策场景里快速获得行动方向。',
      icon: '🔮',
      href: '/ai-fortune',
      gradient: 'from-violet-400 via-purple-500 to-indigo-500',
      glowColor: 'rgba(167, 139, 250, 0.3)',
      price: '限时免费',
      tag: '内测开放中',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="text-6xl mb-6">🌙</div>
          <h1 className="text-5xl md:text-7xl font-black font-display mb-4 tracking-tight">
            <span className="text-gradient-fortune">月见</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 font-light max-w-md mx-auto">
            用 AI 给情绪和关系一个更清晰的答案
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-600">
            <span className="pulse-dot" />
            内测开放中，欢迎体验并分享
          </div>
        </div>

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
              <div className="relative glass-card p-8 hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
                <div className="absolute top-4 right-4">
                  <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${project.gradient} text-white font-medium`}>
                    {project.tag}
                  </span>
                </div>

                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{project.icon}</div>

                <h2 className="text-2xl font-bold mb-1">{project.title}</h2>
                <p className="text-sm text-slate-500 mb-3">{project.subtitle}</p>
                <p className="text-slate-700 leading-relaxed mb-6">{project.description}</p>

                <div className="flex items-center justify-between">
                  <span className={`text-xl font-black bg-gradient-to-r ${project.gradient} bg-clip-text text-transparent`}>
                    {project.price}
                  </span>
                  <span className="flex items-center gap-2 text-slate-500 group-hover:text-slate-900 transition-colors">
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

        <div className="mt-8 flex items-center gap-6 text-slate-500 text-xs">
          <span>🔒 隐私说明透明</span>
          <span>📈 可追踪转化漏斗</span>
          <span>📄 使用前请阅读协议</span>
        </div>

        <LeadCapture page="/" />
      </section>
    </div>
  )
}
