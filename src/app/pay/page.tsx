'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type PayProduct = 'soul'

const PRODUCTS: Record<PayProduct, { name: string; price: string; originalPrice: string; desc: string; redirect: string; features: string[] }> = {
  soul: {
    name: '关系透视报告',
    price: '19.9',
    originalPrice: '49.9',
    desc: '聊天记录深度分析，输出结论、证据和今晚就能用的话术。',
    redirect: '/soul-autopsy',
    features: ['关系诊断', '关键证据', '风险信号', '今晚三句话', '行动建议'],
  },
}

function PayPageContent() {
  const searchParams = useSearchParams()
  const urlProduct = searchParams.get('product') as PayProduct | null

  const [product, setProduct] = useState<PayProduct>(urlProduct && PRODUCTS[urlProduct] ? urlProduct : 'soul')
  const [step, setStep] = useState<'select' | 'qr' | 'success'>('select')
  const [orderId, setOrderId] = useState('')
  const [unlockCode, setUnlockCode] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  const current = PRODUCTS[product]

  useEffect(() => {
    const id = `SL${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    setOrderId(id)
  }, [product])

  async function verifyUnlock() {
    setUnlockError('')
    if (!unlockCode.trim()) return setUnlockError('请输入解锁码')
    setUnlocking(true)
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, code: unlockCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '解锁失败')
      setStep('success')
      setTimeout(() => {
        window.location.href = `${current.redirect}?resume=1`
      }, 1000)
    } catch (e: any) {
      setUnlockError(e?.message || '解锁失败')
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        {step === 'select' && (
          <div className="animate-fade-in-up">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-slate-900">支付并解锁</h1>
              <p className="mt-2 text-sm text-slate-600">选择产品后扫码付款，输入解锁码立即使用。</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PRODUCTS) as [PayProduct, (typeof PRODUCTS)[PayProduct]][]).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setProduct(key)}
                  className={`rounded-xl border p-3 text-left transition ${product === key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <div className="text-xs font-medium">{item.name}</div>
                  <div className="mt-1 text-lg font-semibold">¥{item.price}</div>
                  <div className={`text-xs ${product === key ? 'text-slate-300' : 'text-slate-400'} line-through`}>¥{item.originalPrice}</div>
                </button>
              ))}
            </div>

            <div className="glass-card mt-4 p-5">
              <h3 className="text-sm font-semibold text-slate-900">{current.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{current.desc}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {current.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-center">
                <div className="text-xs text-slate-500">订单号</div>
                <div className="text-sm font-semibold text-slate-900">{orderId}</div>
              </div>
            </div>

            <button onClick={() => setStep('qr')} className="btn-primary mt-4 w-full text-base">
              立即支付 ¥{current.price}
            </button>
          </div>
        )}

        {step === 'qr' && (
          <div className="animate-fade-in-up glass-card p-6 text-center">
            <h2 className="text-xl font-semibold text-slate-900">扫码支付</h2>
            <p className="mt-2 text-sm text-slate-600">支付后输入你收到的解锁码。</p>

            <div className="mx-auto mt-4 w-fit rounded-2xl border border-slate-200 bg-white p-3">
              <Image src="/qr-pay.jpg" alt="支付二维码" width={220} height={220} priority />
            </div>

            <input
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value)}
              placeholder="输入解锁码"
              className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />
            {unlockError && <div className="mt-2 text-xs text-rose-600">{unlockError}</div>}

            <button onClick={verifyUnlock} disabled={unlocking} className="btn-primary mt-4 w-full">
              {unlocking ? '验证中...' : '验证并解锁'}
            </button>
            <button onClick={() => setStep('select')} className="btn-secondary mt-3 w-full">返回上一步</button>
          </div>
        )}

        {step === 'success' && (
          <div className="animate-fade-in-up glass-card p-8 text-center">
            <h2 className="text-2xl font-semibold text-slate-900">支付成功</h2>
            <p className="mt-2 text-sm text-slate-600">正在跳转到功能页面...</p>
          </div>
        )}

        <div className="mt-5 text-center text-xs text-slate-500">
          <Link href="/" className="underline">返回首页</Link>
        </div>
      </div>
    </div>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PayPageContent />
    </Suspense>
  )
}
