'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type PayProduct = 'soul' | 'fortune-tarot' | 'fortune-daily' | 'launderer'

const PRODUCTS: Record<PayProduct, { name: string; price: string; originalPrice: string; icon: string; desc: string; redirect: string; features: string[] }> = {
  'soul': {
    name: '灵魂尸检报告',
    price: '9.9',
    originalPrice: '49.9',
    icon: '🔬',
    desc: '上传微信聊天记录，AI 生成 3000 字扎心分析报告',
    redirect: '/soul-autopsy',
    features: ['关系类型判定', '舔狗指数计算', '扎心真相 Top5', '人格画像', '处方建议'],
  },
  'fortune-tarot': {
    name: 'AI 塔罗占卜',
    price: '19.9',
    originalPrice: '99',
    icon: '🃏',
    desc: '三张命运之牌，AI 深度解读你的过去、现在与未来',
    redirect: '/ai-fortune',
    features: ['3张专属牌面', '1000字深度解读', '牌面关联分析', '核心建议', '转运秘诀'],
  },
  'fortune-daily': {
    name: '今日运势详批',
    price: '9.9',
    originalPrice: '39.9',
    icon: '⭐',
    desc: '星座 × 八字 × AI 融合解读，感情事业财运一次说透',
    redirect: '/ai-fortune',
    features: ['星座运势', '八字命盘', '五行分析', '今日运势详解', '幸运指南'],
  },
  'launderer': {
    name: '爆文洗稿机（终身版）',
    price: '599',
    originalPrice: '1999',
    icon: '⚡',
    desc: '监控爆款 → AI 改写 → 植入推广，批量生成引流内容',
    redirect: '/content-launderer',
    features: ['无限改写', '4大平台适配', '自动植入推广', '批量标题生成', '终身更新'],
  },
}

function PayPageContent() {
  const searchParams = useSearchParams()
  const urlProduct = searchParams.get('product') as PayProduct | null

  const [product, setProduct] = useState<PayProduct>(urlProduct && PRODUCTS[urlProduct] ? urlProduct : 'fortune-tarot')
  const [step, setStep] = useState<'select' | 'qr' | 'success'>('select')
  const [orderId, setOrderId] = useState('')
  const [countdown, setCountdown] = useState(15 * 60) // 15分钟限时

  const current = PRODUCTS[product]

  // 生成订单号
  useEffect(() => {
    const id = `SL${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    setOrderId(id)
  }, [product])

  // 倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const handlePay = () => {
    setStep('qr')
  }

  const confirmPaid = () => {
    // 标记已付费
    try {
      const paid = JSON.parse(localStorage.getItem('soul-lab-paid') || '{}')
      paid[product] = Date.now()
      localStorage.setItem('soul-lab-paid', JSON.stringify(paid))

      // 记录订单
      const orders = JSON.parse(localStorage.getItem('soul-lab-orders') || '[]')
      orders.push({
        id: orderId,
        product,
        price: current.price,
        time: new Date().toISOString(),
      })
      localStorage.setItem('soul-lab-orders', JSON.stringify(orders))
    } catch {}

    setStep('success')
    setTimeout(() => {
      window.location.href = current.redirect
    }, 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {step === 'select' && (
          <div className="animate-fade-in-up">
            {/* 限时优惠横幅 */}
            {countdown > 0 && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <div className="text-red-400 text-sm font-medium">
                  ⏰ 限时优惠还剩 <span className="font-mono font-bold text-lg">{formatTime(countdown)}</span>
                </div>
                <div className="text-red-400/60 text-xs mt-0.5">过时恢复原价</div>
              </div>
            )}

            {/* 产品卡 */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{current.icon}</div>
              <h1 className="text-2xl font-black mb-1">{current.name}</h1>
              <p className="text-white/40 text-sm">{current.desc}</p>
            </div>

            {/* 产品选择 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(Object.entries(PRODUCTS) as [PayProduct, typeof current][]).map(([key, prod]) => (
                <button
                  key={key}
                  onClick={() => { setProduct(key); setStep('select') }}
                  className={`p-3 rounded-xl text-left transition-all ${
                    product === key
                      ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30'
                      : 'bg-white/5 border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-xl mb-1">{prod.icon}</div>
                  <div className={`text-xs font-medium ${product === key ? 'text-white' : 'text-white/60'}`}>
                    {prod.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-lg font-black ${product === key ? 'text-pink-400' : 'text-white/40'}`}>
                      ¥{prod.price}
                    </span>
                    <span className="text-white/20 line-through text-xs">¥{prod.originalPrice}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* 包含内容 */}
            <div className="glass-card p-5 mb-6">
              <h3 className="text-white/70 text-sm font-bold mb-3">📦 包含内容</h3>
              <div className="space-y-2">
                {current.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/60 text-sm">
                    <span className="text-green-400">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* 价格 & 支付 */}
            <div className="glass-card p-6 text-center mb-4">
              <div className="text-white/40 text-sm mb-1">应付金额</div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-white/30 line-through text-lg">¥{current.originalPrice}</span>
                <span className="text-4xl font-black text-gradient-soul">¥{current.price}</span>
              </div>
              <div className="text-white/20 text-xs mt-2">订单号: {orderId}</div>
            </div>

            <button
              onClick={handlePay}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              💳 立即支付 ¥{current.price}
            </button>

            {/* 信任标识 */}
            <div className="mt-4 flex items-center justify-center gap-4 text-white/20 text-xs">
              <span>🔒 安全支付</span>
              <span>📱 即时到账</span>
              <span>💯 不满意退款</span>
            </div>

            {/* 用户评价 */}
            <div className="mt-6 glass-card-dark p-4">
              <div className="text-white/40 text-xs mb-3">💬 最近评价</div>
              <div className="space-y-2.5">
                {[
                  { name: '小*花', text: '分析得太准了，看完直接破防...', time: '3分钟前' },
                  { name: 'A*Q', text: '比我花299找的情感咨询师强多了', time: '12分钟前' },
                  { name: '月*人', text: '算命那个太准了吧！推荐给闺蜜了', time: '28分钟前' },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-white/30">{r.name}</span>
                    <span className="text-white/50 flex-1">{r.text}</span>
                    <span className="text-white/20 whitespace-nowrap">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'qr' && (
          <div className="animate-fade-in-up">
            <div className="glass-card p-8 text-center mb-6">
              <div className="text-white/60 text-sm mb-4">请使用微信/支付宝扫码支付</div>

              {/* 收款码区域 */}
              <div className="w-52 h-52 mx-auto bg-white rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
                {/* 替换说明 */}
                <div className="text-center px-4">
                  <div className="text-4xl mb-2">📱</div>
                  <div className="text-gray-500 text-xs leading-tight">
                    将此处替换为你的<br/>微信/支付宝收款码图片
                  </div>
                  <div className="text-gray-400 text-[10px] mt-1">
                    放在 public/qr-pay.jpg
                  </div>
                </div>
                {/* 实际收款码图片(取消上面的注释，使用下面的) */}
                {/* <img src="/qr-pay.jpg" alt="收款码" className="w-full h-full object-contain" /> */}
              </div>

              <div className="text-3xl font-black text-green-400 mb-1">¥{current.price}</div>
              <div className="text-white/40 text-sm">{current.name}</div>
              <div className="text-white/20 text-xs mt-2">订单号: {orderId}</div>
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-xs">
                ⚠️ 付款时请备注订单号: <span className="font-mono font-bold">{orderId}</span>
              </div>
            </div>

            <button
              onClick={confirmPaid}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-purple-600 text-white font-bold text-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              ✅ 我已支付完成
            </button>

            <button
              onClick={() => setStep('select')}
              className="mt-3 w-full py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/70 transition-all text-sm"
            >
              ← 返回选择
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center animate-fade-in-up">
            <div className="text-7xl mb-4">🎉</div>
            <h1 className="text-3xl font-black mb-2 text-gradient-soul">支付成功!</h1>
            <p className="text-white/40 mb-2">正在跳转到 {current.name}...</p>
            <p className="text-white/20 text-xs mb-8">订单号: {orderId}</p>
            <div className="w-12 h-12 mx-auto border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 底部返回 */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-white/30 text-sm hover:text-white/60 transition-colors">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PayPageContent />
    </Suspense>
  )
}
