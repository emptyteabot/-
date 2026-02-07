'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PayWallProps {
  /** 产品ID */
  productId: 'soul' | 'fortune-tarot' | 'fortune-daily'
  /** 免费体验的结果(被遮罩的内容) */
  children: React.ReactNode
  /** 免费可见的比例 (0-1) */
  freeRatio?: number
  /** 产品名称 */
  productName: string
  /** 原价 */
  originalPrice: string
  /** 现价 */
  currentPrice: string
  /** 付费引导文案 */
  hookText?: string
}

const FREE_TRIAL_KEY = 'soul-lab-trials'

/** 检查是否有免费次数 */
function hasFreeTrial(productId: string): boolean {
  // 免费体验期：全部免费开放
  // 到期后改回: return (trials[productId] || 0) < 1
  return true
}

/** 消耗一次免费次数 */
function useFreeTrial(productId: string): void {
  try {
    const trials = JSON.parse(localStorage.getItem(FREE_TRIAL_KEY) || '{}')
    trials[productId] = (trials[productId] || 0) + 1
    localStorage.setItem(FREE_TRIAL_KEY, JSON.stringify(trials))
  } catch {}
}

/** 检查是否已付费 */
function hasPaid(productId: string): boolean {
  try {
    const paid = JSON.parse(localStorage.getItem('soul-lab-paid') || '{}')
    return !!paid[productId]
  } catch {
    return false
  }
}

export default function PayWall({
  productId,
  children,
  freeRatio = 0.3,
  productName,
  originalPrice,
  currentPrice,
  hookText = '完整报告包含深度分析 + 专属建议 + 转运秘诀',
}: PayWallProps) {
  const [isPaid, setIsPaid] = useState(false)
  const [isFree, setIsFree] = useState(true)
  const [showLock, setShowLock] = useState(false)

  useEffect(() => {
    const paid = hasPaid(productId)
    const free = hasFreeTrial(productId)
    setIsPaid(paid)
    setIsFree(free)

    if (free && !paid) {
      // 免费体验：消耗一次
      useFreeTrial(productId)
      setShowLock(false)
    } else if (!paid) {
      setShowLock(true)
    }
  }, [productId])

  // 已付费或免费体验：完整显示
  if (isPaid || (isFree && !showLock)) {
    return <>{children}</>
  }

  // 未付费且无免费次数：显示付费墙
  return (
    <div className="relative">
      {/* 模糊遮罩的内容预览 */}
      <div className="relative overflow-hidden" style={{ maxHeight: '600px' }}>
        <div className="pointer-events-none select-none">
          {children}
        </div>
        {/* 渐变遮罩 */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent ${freeRatio * 100}%, rgba(8,8,15,0.7) ${freeRatio * 100 + 10}%, rgba(8,8,15,0.95) 70%, #08080f 100%)`,
          }}
        />
      </div>

      {/* 付费解锁卡片 */}
      <div className="relative -mt-20 z-10 glass-card p-8 text-center mx-auto max-w-lg border-white/20">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-xl font-black mb-2 text-white/90">解锁完整报告</h3>
        <p className="text-white/50 text-sm mb-6">{hookText}</p>

        {/* 价格 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-white/30 line-through text-lg">¥{originalPrice}</span>
          <span className="text-3xl font-black text-gradient-soul">¥{currentPrice}</span>
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium animate-pulse">
            限时特价
          </span>
        </div>

        {/* 解锁按钮 */}
        <Link
          href={`/pay?product=${productId}`}
          className="block w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-purple-600 text-white font-bold text-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          💎 立即解锁 ¥{currentPrice}
        </Link>

        {/* 权益说明 */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-white/40 text-xs">
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">📊</span>
            <span>完整数据分析</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">💡</span>
            <span>专属行动建议</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">📸</span>
            <span>分享精美图片</span>
          </div>
        </div>

        {/* 已售数量 */}
        <div className="mt-4 text-white/20 text-xs">
          🔥 今日已有 <span className="text-white/50">{237 + Math.floor(Math.random() * 50)}</span> 人解锁
        </div>
      </div>
    </div>
  )
}

/** 标记已付费(供支付页调用) */
export function markAsPaid(productId: string): void {
  try {
    const paid = JSON.parse(localStorage.getItem('soul-lab-paid') || '{}')
    paid[productId] = Date.now()
    localStorage.setItem('soul-lab-paid', JSON.stringify(paid))
  } catch {}
}

