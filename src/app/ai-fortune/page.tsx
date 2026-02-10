'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'
import { trackGrowthEvent } from '@/lib/growth'

type FortuneMode = 'menu' | 'tarot-select' | 'tarot-reading' | 'daily-input' | 'daily-result'
type TarotCategory = '爱情' | '事业' | '财运' | '综合'

interface TarotCardData {
  id: number
  name: string
  nameEn: string
  meaning: string
  reversed: string
  element: string
  keywords: string[]
  isReversed?: boolean
}

const TAROT_CATEGORIES: { label: TarotCategory; icon: string; color: string }[] = [
  { label: '爱情', icon: '💕', color: 'from-pink-500 to-rose-600' },
  { label: '事业', icon: '💼', color: 'from-blue-500 to-indigo-600' },
  { label: '财运', icon: '💰', color: 'from-amber-500 to-yellow-600' },
  { label: '综合', icon: '🌟', color: 'from-purple-500 to-violet-600' },
]

const CARD_BACK_SYMBOLS = ['✦', '☽', '✧', '⚝', '☆', '✦', '☽', '✧']

export default function AIFortunePage() {
  const [mode, setMode] = useState<FortuneMode>('menu')
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState<TarotCategory>('综合')
  const [cards, setCards] = useState<TarotCardData[]>([])
  const [reading, setReading] = useState('')
  const [lockedTarot, setLockedTarot] = useState(false)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consented, setConsented] = useState(false)

  // 每日运势
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthHour, setBirthHour] = useState<number | ''>('')
  const [dailyResult, setDailyResult] = useState<any>(null)
  const [lockedDaily, setLockedDaily] = useState(false)
  const birthday = birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : ''

  // 分享截图 ref
  const tarotResultRef = useRef<HTMLDivElement>(null)
  const dailyResultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const resume = new URLSearchParams(window.location.search).get('resume')
    if (resume !== '1') return
    try {
      const raw = sessionStorage.getItem('soul-lab-fortune-last') || ''
      if (!raw) return
      const last = JSON.parse(raw)
      setConsented(true)
      if (last.type === 'tarot') {
        setQuestion(last.question || '')
        setCategory(last.category || '综合')
        setMode('tarot-select')
        // defer one tick so state is applied
        setTimeout(() => startTarotReading(), 0)
      } else if (last.type === 'daily') {
        setBirthYear(last.birthYear || '')
        setBirthMonth(last.birthMonth || '')
        setBirthDay(last.birthDay || '')
        setBirthHour(last.birthHour ?? '')
        setMode('daily-input')
        setTimeout(() => getDailyFortune(), 0)
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ========== 塔罗牌流程 ==========
  const startTarotReading = async () => {
    if (!consented) {
      setError('请先勾选同意协议与隐私政策')
      return
    }
    try {
      sessionStorage.setItem('soul-lab-fortune-last', JSON.stringify({ type: 'tarot', question, category }))
    } catch {}
    trackGrowthEvent({ name: 'analysis_start', page: '/ai-fortune', detail: 'tarot' })
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tarot',
          question: question || `我想了解最近的${category}运势`,
          cardCount: 3,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '塔罗牌解读失败')
      }

      const data = await res.json()
      setCards(data.cards)
      setReading(data.reading)
      setLockedTarot(!!data.locked)
      setFlippedCards(new Set())
      setMode('tarot-reading')
      trackGrowthEvent({ name: 'analysis_done', page: '/ai-fortune', detail: 'tarot' })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const flipCard = (index: number) => {
    setFlippedCards(prev => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  // ========== 每日运势流程 ==========
  const getDailyFortune = async () => {
    if (!birthYear || !birthMonth || !birthDay) {
      setError('请选择完整的出生日期（年、月、日）')
      return
    }
    if (!consented) {
      setError('请先勾选同意协议与隐私政策')
      return
    }
    try {
      sessionStorage.setItem('soul-lab-fortune-last', JSON.stringify({ type: 'daily', birthYear, birthMonth, birthDay, birthHour }))
    } catch {}
    trackGrowthEvent({ name: 'analysis_start', page: '/ai-fortune', detail: 'daily' })
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily',
          birthday,
          birthHour: birthHour !== '' ? birthHour : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '运势获取失败')
      }

      const data = await res.json()
      setDailyResult(data)
      setLockedDaily(!!data.locked)
      setMode('daily-result')
      trackGrowthEvent({ name: 'analysis_done', page: '/ai-fortune', detail: 'daily' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setMode('menu')
    setCards([])
    setReading('')
    setLockedTarot(false)
    setFlippedCards(new Set())
    setDailyResult(null)
    setLockedDaily(false)
    setError('')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔮</span>
            <span className="font-bold text-gradient-fortune">AI 塔罗占卜</span>
          </div>
        </div>
      </header>


      <div className="pt-24 px-4 pb-20">
        {/* ===== 主菜单 ===== */}
        {mode === 'menu' && (
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <div className="text-center mb-16">
              <div className="text-7xl mb-6 animate-float">🔮</div>
              <h1 className="text-4xl md:text-5xl font-black mb-3">
                <span className="text-gradient-fortune">命运指引</span>
              </h1>
              <p className="text-fortune-muted text-lg">给迷茫的你一个方向，给纠结的你一个答案</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fortune-purple/10 border border-fortune-purple/20 text-sm text-fortune-muted">
                <span className="w-2 h-2 rounded-full bg-fortune-accent animate-pulse" />
                今日已为 <span className="text-fortune-accent font-medium">3,847</span> 位姐妹指引方向
              </div>
            </div>

            <div className="grid gap-6">
              {/* 塔罗牌 */}
              <button
                onClick={() => setMode('tarot-select')}
                className="group relative glass-card p-8 text-left hover:bg-fortune-purple/10 transition-all duration-300 hover:scale-[1.02] hover:border-fortune-purple/30"
              >
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium">
                    ✨ 限时免费
                  </span>
                </div>
                <div className="flex items-start gap-5">
                  <div className="text-5xl group-hover:scale-110 transition-transform">🃏</div>
                  <div>
                    <h2 className="text-2xl font-bold text-fortune-text mb-2">塔罗三牌阵</h2>
                    <p className="text-fortune-muted leading-relaxed">
                      三张命运之牌，给你此刻最需要的答案。他在想什么？该不该放手？未来会更好吗？
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-fortune-accent text-sm flex items-center gap-2">
                        立即体验
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      <span className="text-slate-300 text-xs">|</span>
                      <span className="text-slate-400 line-through text-xs">¥19.9/次</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* 每日运势 */}
              <button
                onClick={() => setMode('daily-input')}
                className="group relative glass-card p-8 text-left hover:bg-fortune-purple/10 transition-all duration-300 hover:scale-[1.02] hover:border-fortune-purple/30"
              >
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 text-white font-medium">
                    ✨ 限时免费
                  </span>
                </div>
                <div className="flex items-start gap-5">
                  <div className="text-5xl group-hover:scale-110 transition-transform">⭐</div>
                  <div>
                    <h2 className="text-2xl font-bold text-fortune-text mb-2">今日运势详批</h2>
                    <p className="text-fortune-muted leading-relaxed">
                      星座 × 八字 × AI 深度解读。感情、桃花、财运、事业，一次说透。
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-fortune-accent text-sm flex items-center gap-2">
                        查看运势
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      <span className="text-slate-300 text-xs">|</span>
                      <span className="text-slate-400 line-through text-xs">¥9.9/次</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* 底部引流 */}
            <div className="mt-10 glass-card-dark p-6 text-center">
              <p className="text-fortune-muted text-sm mb-3">💎 想知道他到底怎么想的？</p>
              <Link
                href="/soul-autopsy"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400 hover:text-pink-300 transition-colors text-sm"
              >
                上传聊天记录，AI 帮你看穿他的心 →
              </Link>
            </div>

            <label className="mt-6 flex items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                我已阅读并同意 <Link href="/terms" className="text-purple-300 hover:text-purple-200">用户协议</Link> 与 <Link href="/privacy" className="text-purple-300 hover:text-purple-200">隐私政策</Link>，并确认我提供的信息为本人或已获授权。
              </span>
            </label>
          </div>
        )}

        {/* ===== 塔罗牌 - 选择问题 ===== */}
        {mode === 'tarot-select' && (
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="text-6xl mb-4">🃏</div>
              <h1 className="text-3xl font-black mb-2 text-fortune-text">选择你的命题</h1>
              <p className="text-fortune-muted">集中精神，想着你最想知道的事情</p>
            </div>

            <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 leading-5">
              提示：本服务为参考与娱乐用途，提交内容将发送至第三方 AI 服务生成结果。继续即表示你同意协议与隐私政策。
            </div>

            {/* 问题分类 */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {TAROT_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setCategory(cat.label)}
                  className={`glass-card p-5 text-center transition-all duration-300 hover:scale-[1.03] ${
                    category === cat.label
                      ? 'border-fortune-accent bg-fortune-accent/10'
                      : 'hover:border-fortune-purple/30'
                  }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="text-fortune-text font-bold">{cat.label}</div>
                </button>
              ))}
            </div>

            {/* 自定义问题 */}
            <div className="glass-card p-6 mb-8">
              <label className="block text-fortune-muted text-sm mb-2">✨ 你想问什么？(选填)</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：我和 TA 还有没有可能？/ 这份工作值得跳槽吗？"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-fortune-text placeholder-fortune-muted/70 focus:outline-none focus:border-fortune-purple/60 resize-none h-24"
              />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                ❌ {error}
              </div>
            )}

            {/* 开始按钮 */}
            <button
              onClick={startTarotReading}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-bold text-lg hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  命运正在回应...
                </span>
              ) : (
                '🃏 开始占卜'
              )}
            </button>

            <button
              onClick={resetAll}
              className="mt-4 w-full py-3 rounded-xl border border-slate-200 text-fortune-muted hover:text-fortune-text hover:border-slate-300 transition-all text-sm"
            >
              ← 返回
            </button>
          </div>
        )}

        {/* ===== 塔罗牌 - 解读结果 ===== */}
        {mode === 'tarot-reading' && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black mb-2">
                <span className="text-gradient-fortune">命运之牌已揭晓</span>
              </h1>
              <p className="text-fortune-muted text-sm">点击卡牌翻转查看</p>
            </div>

            {/* 截图区域 */}
            <div ref={tarotResultRef} className="share-target">
              {/* 三张牌 */}
              <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12 max-w-2xl mx-auto">
                {cards.map((card, index) => (
                  <div key={index} className="card-container aspect-[2/3]">
                    <div
                      className={`card-inner cursor-pointer ${flippedCards.has(index) ? 'flipped' : ''}`}
                      onClick={() => flipCard(index)}
                    >
                      {/* 卡牌背面 */}
                      <div className="card-front glass-card bg-gradient-to-br from-[#1a1040] to-[#2d1b69] flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl md:text-5xl mb-2 text-fortune-accent/70">
                            {CARD_BACK_SYMBOLS[index % CARD_BACK_SYMBOLS.length]}
                          </div>
                          <div className="text-fortune-muted/50 text-xs">点击翻牌</div>
                        </div>
                      </div>
                      {/* 卡牌正面 */}
                      <div className={`card-back glass-card p-3 md:p-4 flex flex-col items-center justify-center text-center ${
                        card.isReversed ? 'bg-red-950/30' : 'bg-purple-950/30'
                      }`}>
                        <div className={`text-3xl md:text-4xl mb-1 ${card.isReversed ? 'rotate-180' : ''}`}>
                          {getCardEmoji(card.id)}
                        </div>
                        <div className="text-fortune-text font-bold text-sm md:text-base">{card.name}</div>
                        <div className="text-fortune-muted text-[10px] md:text-xs">{card.nameEn}</div>
                        <div className={`mt-1 text-[10px] px-2 py-0.5 rounded-full ${
                          card.isReversed
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {card.isReversed ? '逆位' : '正位'}
                        </div>
                        <div className="mt-2 text-fortune-muted/70 text-[10px] leading-tight hidden md:block">
                          {card.isReversed ? card.reversed : card.meaning}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI 解读 */}
              <div className="glass-card p-8 md:p-12 mb-8">
                <h2 className="text-2xl font-black text-gradient-fortune mb-6">🔮 命运解读</h2>
                {lockedTarot && (
                  <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <div className="font-bold">这是试读版解读</div>
                    <div className="mt-1 text-amber-100/80 text-xs leading-5">
                      解锁完整版后会更长、更具体（包含更多细节与行动建议）。解锁后刷新本页即可生效。
                    </div>
                    <div className="mt-3">
                      <Link
                        href="/pay?product=fortune-tarot"
                        className="inline-flex items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/30 px-4 py-2 text-xs text-amber-100 hover:bg-amber-500/30"
                      >
                        去解锁完整版
                      </Link>
                    </div>
                  </div>
                )}
                <div className="prose prose-invert max-w-none prose-p:text-fortune-text/80 prose-p:leading-relaxed prose-h2:text-fortune-accent prose-h3:text-fortune-text prose-strong:text-fortune-text">
                  <div dangerouslySetInnerHTML={{ __html: formatFortuneText(reading) }} />
                </div>
              </div>
            </div>

            {/* 操作栏 */}
            <div className="flex flex-col gap-4 mb-8">
              {/* 分享 & 操作 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <ShareButton
                  targetRef={tarotResultRef}
                  title="我的塔罗占卜结果"
                  productName="AI玄学算命"
                  cta="你也来测测 →"
                  className="flex-1 justify-center"
                />
                <button
                  onClick={() => { setMode('tarot-select'); setCards([]); setReading(''); setFlippedCards(new Set()) }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-fortune-muted hover:text-fortune-text hover:border-slate-300 transition-all text-sm"
                >
                  🃏 再抽一次
                </button>
              </div>

              {/* 交叉引流 */}
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('daily-input')}
                  className="py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white font-bold text-center hover:opacity-90 transition-opacity text-sm"
                >
                  ⭐ 查看今日运势
                </button>
                <Link
                  href="/soul-autopsy"
                  className="py-3 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-purple-600 text-white font-bold text-center hover:opacity-90 transition-opacity text-sm"
                >
                  💎 感情透视
                </Link>
              </div>
            </div>

            {/* 微信引流卡片 */}
          </div>
        )}

        {/* ===== 每日运势 - 输入 ===== */}
        {mode === 'daily-input' && (
          <div className="max-w-lg mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="text-6xl mb-4 animate-float">⭐</div>
              <h1 className="text-3xl font-black mb-2 text-fortune-text">今日运势详批</h1>
              <p className="text-fortune-muted">告诉我你的生辰，为你揭开命运的面纱</p>
            </div>

            <div className="glass-card p-8 mb-6">
              {/* 年 月 日 三列选择 */}
              <label className="block text-fortune-text font-medium mb-3">🌙 出生日期</label>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="bg-white/5 border border-fortune-purple/30 rounded-xl px-3 py-3.5 text-fortune-text text-center focus:outline-none focus:border-fortune-accent/50"
                >
                  <option value="" className="bg-[#1a1530]">年</option>
                  {Array.from({ length: 80 }, (_, i) => 2010 - i).map(y => (
                    <option key={y} value={String(y)} className="bg-[#1a1530]">{y}年</option>
                  ))}
                </select>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="bg-white/5 border border-fortune-purple/30 rounded-xl px-3 py-3.5 text-fortune-text text-center focus:outline-none focus:border-fortune-accent/50"
                >
                  <option value="" className="bg-[#1a1530]">月</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={String(m).padStart(2, '0')} className="bg-[#1a1530]">{m}月</option>
                  ))}
                </select>
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="bg-white/5 border border-fortune-purple/30 rounded-xl px-3 py-3.5 text-fortune-text text-center focus:outline-none focus:border-fortune-accent/50"
                >
                  <option value="" className="bg-[#1a1530]">日</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={String(d).padStart(2, '0')} className="bg-[#1a1530]">{d}日</option>
                  ))}
                </select>
              </div>

              {/* 时辰 - 用网格按钮替代 select */}
              <label className="block text-fortune-text font-medium mb-3">
                ✧ 出生时辰 <span className="text-fortune-muted text-sm font-normal">(选填)</span>
              </label>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { v: '', label: '不知道' },
                  { v: '0', label: '子时' }, { v: '2', label: '丑时' }, { v: '4', label: '寅时' },
                  { v: '6', label: '卯时' }, { v: '8', label: '辰时' }, { v: '10', label: '巳时' },
                  { v: '12', label: '午时' }, { v: '14', label: '未时' }, { v: '16', label: '申时' },
                  { v: '18', label: '酉时' }, { v: '20', label: '戌时' }, { v: '22', label: '亥时' },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBirthHour(v === '' ? '' : Number(v))}
                    className={`py-2 rounded-lg text-sm transition-all ${
                      String(birthHour) === v || (v === '' && birthHour === '')
                        ? 'bg-fortune-accent/20 border border-fortune-accent/40 text-fortune-accent'
                        : 'bg-white border border-slate-200 text-fortune-muted hover:border-fortune-purple/30'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="px-3 py-2 rounded-lg bg-fortune-purple/10 border border-fortune-purple/20 text-fortune-muted text-xs text-center">
                ✧ 出生时辰越精确，八字命盘越准确 ✧
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                ❌ {error}
              </div>
            )}

            <button
              onClick={getDailyFortune}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white font-bold text-lg hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  正在窥探天机...
                </span>
              ) : (
                '⭐ 揭示今日运势'
              )}
            </button>

            <button
              onClick={resetAll}
              className="mt-4 w-full py-3 rounded-xl border border-slate-200 text-fortune-muted hover:text-fortune-text hover:border-slate-300 transition-all text-sm"
            >
              ← 返回
            </button>
          </div>
        )}

        {/* ===== 每日运势 - 结果 ===== */}
        {mode === 'daily-result' && dailyResult && (
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            {/* 截图区域 */}
            <div ref={dailyResultRef} className="share-target">
              {/* 头部 */}
              <div className="text-center mb-10">
                <div className="text-6xl mb-3">{dailyResult.zodiac?.symbol || '⭐'}</div>
                <h1 className="text-3xl font-black mb-1">
                  <span className="text-gradient-fortune">{dailyResult.zodiac?.name || '运势'}</span>
                  <span className="text-fortune-text"> 今日运势</span>
                </h1>
                <p className="text-fortune-muted text-sm">
                  {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </p>
              </div>

              {/* 星座信息卡 */}
              {dailyResult.zodiac && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="glass-card p-4 text-center">
                    <div className="text-fortune-muted text-xs mb-1">守护星</div>
                    <div className="text-fortune-text font-bold">{dailyResult.zodiac.ruling}</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-fortune-muted text-xs mb-1">元素</div>
                    <div className="text-fortune-text font-bold">{dailyResult.zodiac.element}</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-fortune-muted text-xs mb-1">特质</div>
                    <div className="text-fortune-text font-bold text-sm">{dailyResult.zodiac.traits?.join(' · ')}</div>
                  </div>
                </div>
              )}

              {/* 八字信息 */}
              {dailyResult.bazi && (
                <div className="glass-card p-6 mb-8">
                  <h3 className="text-fortune-text font-bold mb-4 flex items-center gap-2">
                    <span>🏮</span> 八字命盘
                  </h3>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: '年柱', value: dailyResult.bazi.yearPillar },
                      { label: '月柱', value: dailyResult.bazi.monthPillar },
                      { label: '日柱', value: dailyResult.bazi.dayPillar },
                      { label: '时柱', value: dailyResult.bazi.hourPillar },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center p-3 rounded-lg bg-fortune-purple/10 border border-fortune-purple/20">
                        <div className="text-fortune-muted text-xs mb-1">{label}</div>
                        <div className="text-fortune-accent font-bold text-lg">{value}</div>
                      </div>
                    ))}
                  </div>
                  {/* 五行分布 */}
                  <div className="flex items-center gap-3 mt-4">
                    {Object.entries(dailyResult.bazi.wuxing || {}).map(([element, count]) => (
                      <div key={element} className="flex-1 text-center">
                        <div className="text-fortune-text font-bold">{element}</div>
                        <div className="w-full h-2 bg-white/5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-fortune-accent to-fortune-purple"
                            style={{ width: `${((count as number) / 8) * 100}%` }}
                          />
                        </div>
                        <div className="text-fortune-muted text-xs mt-1">{count as number}/8</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-fortune-muted text-sm">
                    命主五行: <span className="text-fortune-accent font-medium">{dailyResult.bazi.dominant}</span>
                    {dailyResult.bazi.lacking !== '无' && (
                      <> · 五行缺: <span className="text-red-400 font-medium">{dailyResult.bazi.lacking}</span></>
                    )}
                  </div>
                </div>
              )}

              {/* AI 运势报告 */}
              <div className="glass-card p-8 md:p-12 mb-8">
                <h2 className="text-2xl font-black text-gradient-fortune mb-6">✨ 今日运势详解</h2>
                {lockedDaily && (
                  <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <div className="font-bold">这是试读版运势</div>
                    <div className="mt-1 text-amber-100/80 text-xs leading-5">
                      解锁完整版后会包含更细的场景建议与补充分析。解锁后刷新本页即可生效。
                    </div>
                    <div className="mt-3">
                      <Link
                        href="/pay?product=fortune-daily"
                        className="inline-flex items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/30 px-4 py-2 text-xs text-amber-100 hover:bg-amber-500/30"
                      >
                        去解锁完整版
                      </Link>
                    </div>
                  </div>
                )}
                <div className="prose prose-invert max-w-none prose-p:text-fortune-text/80 prose-p:leading-relaxed prose-h2:text-fortune-accent prose-h3:text-fortune-text prose-strong:text-fortune-text prose-li:text-fortune-text/70">
                  <div dangerouslySetInnerHTML={{ __html: formatFortuneText(dailyResult.fortune || '') }} />
                </div>
              </div>
            </div>

            {/* 操作栏 */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <ShareButton
                  targetRef={dailyResultRef}
                  title="我的今日运势"
                  productName="AI玄学算命"
                  cta="你也来看看今日运势 →"
                  className="flex-1 justify-center"
                />
                <button
                  onClick={resetAll}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-fortune-muted hover:text-fortune-text hover:border-slate-300 transition-all text-sm"
                >
                  🔮 换种算法
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => { setMode('tarot-select'); setCards([]); setReading('') }}
                  className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold text-center hover:opacity-90 transition-opacity text-sm"
                >
                  🃏 塔罗占卜
                </button>
                <Link
                  href="/soul-autopsy"
                  className="py-3 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-purple-600 text-white font-bold text-center hover:opacity-90 transition-opacity text-sm"
                >
                  💎 感情透视
                </Link>
              </div>
            </div>

            {/* 微信引流卡片 */}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============ 工具函数 ============ */

function getCardEmoji(id: number): string {
  const emojis: Record<number, string> = {
    0: '🤡', 1: '🎩', 2: '🌙', 3: '👑', 4: '🏛️', 5: '⛪',
    6: '💕', 7: '⚔️', 8: '🦁', 9: '🏔️', 10: '🎡', 11: '⚖️',
    12: '🙃', 13: '💀', 14: '⚗️', 15: '😈', 16: '🗼', 17: '⭐',
    18: '🌙', 19: '☀️', 20: '📯', 21: '🌍',
  }
  return emojis[id] || '🔮'
}

function formatFortuneText(text: string): string {
  return text
    .replace(/## (.*)/g, '<h2 class="text-xl font-black mt-8 mb-3">$1</h2>')
    .replace(/### (.*)/g, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="opacity-70">$1</em>')
    .replace(/^- (.*)/gm, '<li class="ml-4">$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br />')
}
