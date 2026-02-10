'use client'

import { useState } from 'react'

interface WechatFollowProps {
  /** 微信号 */
  wechatId?: string
  /** 公众号名称 */
  gzhName?: string
  /** 引导场景 */
  scene: 'after-fortune' | 'after-autopsy' | 'after-free' | 'general'
  /** 是否显示为弹窗 */
  asPopup?: boolean
  /** 关闭回调 */
  onClose?: () => void
}

const SCENE_CONFIG = {
  'after-fortune': {
    title: '🔮 想要更详细的命运解读？',
    desc: '关注公众号，姐妹每日免费领取专属运势',
    cta: '还能解锁【三个月桃花运预测】',
    icon: '🔮',
  },
  'after-autopsy': {
    title: '💜 想知道这段关系还有没有救？',
    desc: '关注公众号获取专属修复建议，还能免费再测一次',
    cta: '前 100 名送【高情商回复话术包】',
    icon: '💜',
  },
  'after-free': {
    title: '🎁 免费体验已用完',
    desc: '关注公众号回复暗号，再送你一次',
    cta: '暗号见下方 ↓',
    icon: '🎁',
  },
  'general': {
    title: '✨ 每日运势 & 感情洞察',
    desc: '关注公众号，做最懂你的闺蜜',
    cta: '回复「占卜」免费测一次',
    icon: '✨',
  },
}

export default function WechatFollow({
  wechatId = 'your_wechat_id',
  gzhName = '月见塔罗',
  scene = 'general',
  asPopup = false,
  onClose,
}: WechatFollowProps) {
  const [copied, setCopied] = useState(false)
  const config = SCENE_CONFIG[scene]

  const copyWechatId = async () => {
    try {
      await navigator.clipboard.writeText(gzhName)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = gzhName
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const content = (
    <div className="relative">
      {asPopup && onClose && (
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-900/10 transition-all"
        >
          ✕
        </button>
      )}

      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{config.icon}</div>
        <h3 className="text-lg font-bold text-slate-900">{config.title}</h3>
        <p className="text-slate-600 text-sm mt-1">{config.desc}</p>
      </div>

      {/* 公众号二维码占位 */}
      <div className="w-40 h-40 mx-auto bg-white rounded-2xl flex items-center justify-center mb-4">
        <div className="text-center px-3">
          <div className="text-3xl mb-1">📱</div>
          <div className="text-gray-500 text-[10px] leading-tight">
            替换为你的<br />公众号二维码
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        <button
          onClick={copyWechatId}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
            copied
              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90'
          }`}
        >
          {copied ? '✅ 已复制，去微信搜索' : `📋 复制公众号名: ${gzhName}`}
        </button>

      {wechatId && wechatId !== 'your_wechat_id' && (
          <button
            onClick={async () => {
              try { await navigator.clipboard.writeText(wechatId) } catch {}
              setCopied(true)
              setTimeout(() => setCopied(false), 3000)
            }}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs hover:text-slate-900 hover:border-slate-300 transition-all"
          >
            或加个人微信: {wechatId}
          </button>
        )}
      </div>

      {/* CTA 钩子 */}
      <div className="mt-4 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-xs text-center">
        💡 {config.cta}
      </div>

      {/* 信任标识 */}
      <div className="mt-3 flex items-center justify-center gap-3 text-slate-500 text-[10px]">
        <span>🔒 隐私说明透明</span>
        <span>·</span>
        <span>📩 发送订单号获取解锁码</span>
      </div>
    </div>
  )

  if (asPopup) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-card p-8 max-w-sm w-full animate-fade-in-up">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6">
      {content}
    </div>
  )
}
