'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'
import { trackGrowthEvent } from '@/lib/growth'

type AnalysisStage = 'upload' | 'analyzing' | 'report'

interface ReportData {
  report: string
  stats: any
}

export default function SoulAutopsyPage() {
  const [stage, setStage] = useState<AnalysisStage>('upload')
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [report, setReport] = useState<ReportData | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadMode, setUploadMode] = useState<'text' | 'screenshot'>('screenshot')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [ocrLoading, setOcrLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const progressSteps = [
    '正在读取聊天记录...',
    '正在分析消息频率和时间规律...',
    '正在计算他的回复速度...',
    '正在识别谁更主动...',
    '正在分析语气和情绪变化...',
    '正在评估亲密度指数...',
    '正在生成关系画像...',
    '正在撰写感情分析报告...',
    '正在润色措辞，真相可能有点扎心...',
    '报告已生成 💜',
  ]

  const handleFile = useCallback((file: File) => {
    setError('')
    if (!file.name.match(/\.(txt|csv|text)$/i)) {
      setError('请上传 .txt 或 .csv 格式的微信聊天记录')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('文件不能超过 50MB')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      setFileContent(e.target?.result as string)
    }
    reader.readAsText(file, 'utf-8')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        handleScreenshot(file)
      } else {
        handleFile(file)
      }
    }
  }, [handleFile])

  const handleScreenshot = (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setScreenshots(prev => [...prev, base64])
      setUploadMode('screenshot')
    }
    reader.readAsDataURL(file)
  }

  const handleMultipleScreenshots = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) handleScreenshot(file)
    })
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  const ocrAndAnalyze = async () => {
    if (screenshots.length === 0) return
    setOcrLoading(true)
    setError('')
    try {
      // 把 data URL 转成 base64 + mediaType 格式
      const images = screenshots.map(dataUrl => {
        const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
        return match ? { mediaType: match[1], base64: match[2] } : null
      }).filter(Boolean)

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '截图识别失败')
      }
      const data = await res.json()
      setFileContent(data.text)
      setFileName(`${screenshots.length}张聊天截图`)
      setOcrLoading(false)
      startAnalysisWithText(data.text)
    } catch (err: any) {
      setOcrLoading(false)
      setError(err.message)
    }
  }

  const startAnalysis = async () => {
    if (uploadMode === 'screenshot' && screenshots.length > 0 && !fileContent) {
      await ocrAndAnalyze()
      return
    }
    if (!fileContent) return
    startAnalysisWithText(fileContent)
  }

  const startAnalysisWithText = async (text: string) => {
    trackGrowthEvent({ name: 'analysis_start', page: '/soul-autopsy', detail: uploadMode })
    setStage('analyzing')
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const step = Math.floor(prev / 10)
        if (step < progressSteps.length) {
          setProgressText(progressSteps[step])
        }
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 3 + 1
      })
    }, 800)

    try {
      const res = await fetch('/api/soul-autopsy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatText: text }),
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '分析失败')
      }

      const data = await res.json()
      setProgress(100)
      trackGrowthEvent({ name: 'analysis_done', page: '/soul-autopsy', detail: 'ok' })
      setProgressText('报告已生成 💜')

      setTimeout(() => {
        setReport(data)
        setStage('report')
      }, 1000)
    } catch (err: any) {
      clearInterval(progressInterval)
      setError(err.message || '分析失败，请重试')
      setStage('upload')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-card-dark border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <span className="font-bold text-gradient-soul">感情透视报告</span>
          </div>
        </div>
      </header>


      <div className="pt-24 px-4 pb-20">
        {/* ===== 上传 ===== */}
        {stage === 'upload' && (
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <div className="text-center mb-12">
              <div className="text-6xl mb-4">💎</div>
              <h1 className="text-4xl md:text-5xl font-black mb-3">
                <span className="text-gradient-soul">感情透视报告</span>
              </h1>
              <p className="text-white/40 text-lg">上传你们的聊天记录，AI 帮你看清他的心</p>
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-sm text-white/50">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                ✨ 限时免费体验
              </div>
            </div>

            {/* 上传方式切换 */}
            <div className="flex gap-2 mb-6 p-1 glass-card-dark max-w-sm mx-auto">
              <button
                onClick={() => setUploadMode('screenshot')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                  uploadMode === 'screenshot'
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                📸 截图上传
              </button>
              <button
                onClick={() => setUploadMode('text')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                  uploadMode === 'text'
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                📄 文件上传
              </button>
            </div>

            {uploadMode === 'screenshot' ? (
              <>
                {/* 截图上传区 */}
                <div
                  className={`relative glass-card p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragging ? 'border-pink-400 bg-pink-500/5 scale-[1.02]' : 'hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => imgInputRef.current?.click()}
                >
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleMultipleScreenshots(e.target.files)}
                  />
                  <div className="text-5xl mb-4">{isDragging ? '📥' : '📸'}</div>
                  <p className="text-white/60 text-lg mb-2">
                    {isDragging ? '松开上传' : '点击上传聊天截图'}
                  </p>
                  <p className="text-white/30 text-sm">支持多张截图，AI 自动识别聊天内容</p>
                </div>

                {/* 已上传的截图预览 */}
                {screenshots.length > 0 && (
                  <div className="mt-4 glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/60 text-sm">已上传 {screenshots.length} 张截图</span>
                      <button
                        onClick={() => imgInputRef.current?.click()}
                        className="text-pink-400 text-xs hover:text-pink-300"
                      >
                        + 继续添加
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {screenshots.map((src, i) => (
                        <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden group">
                          <img src={src} alt={`截图${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeScreenshot(i) }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300/80 text-xs text-center">
                  💡 直接手机截图微信聊天界面，多截几张效果更好
                </div>
              </>
            ) : (
              <>
                {/* 文件上传区 */}
                <div
                  className={`relative glass-card p-12 text-center cursor-pointer transition-all duration-300 ${
                    isDragging ? 'border-pink-400 bg-pink-500/5 scale-[1.02]' : 'hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv,.text"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  {fileName ? (
                    <div>
                      <div className="text-5xl mb-4">📄</div>
                      <p className="text-white/80 font-medium text-lg mb-1">{fileName}</p>
                      <p className="text-white/40 text-sm">点击更换文件</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-5xl mb-4">💌</div>
                      <p className="text-white/60 text-lg mb-2">点击上传聊天记录文件</p>
                      <p className="text-white/30 text-sm">支持 .txt / .csv 格式</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 glass-card-dark p-4">
                  <p className="text-white/40 text-xs">📋 微信电脑版 → 聊天窗口右上角「...」→「导出聊天记录」→ 选TXT格式</p>
                </div>
              </>
            )}

            <div className="mt-4 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300/80 text-xs text-center">
              🔒 放心，数据仅在你的浏览器中处理，我们不会保存任何聊天内容
            </div>

            {error && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {(fileContent || screenshots.length > 0) && (
              <button
                onClick={startAnalysis}
                disabled={ocrLoading}
                className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 text-white font-bold text-lg hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50"
              >
                {ocrLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    AI 正在识别截图文字...
                  </span>
                ) : '💎 开始分析（免费）'}
              </button>
            )}

            <button
              onClick={() => { setFileName('示例聊天记录.txt'); setFileContent(DEMO_CHAT) }}
              className="mt-4 w-full py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all text-sm"
            >
              🎮 没有聊天记录？用示例体验一下
            </button>
          </div>
        )}

        {/* ===== 分析中 ===== */}
        {stage === 'analyzing' && (
          <div className="max-w-lg mx-auto text-center pt-20 animate-fade-in-up">
            <div className="text-7xl mb-8 animate-float">💎</div>
            <h2 className="text-2xl font-bold mb-2">正在分析你们的关系...</h2>
            <p className="text-white/40 mb-10">{progressText}</p>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-white/30 text-sm">{Math.round(progress)}%</p>
            <div className="mt-12 glass-card-dark p-6 text-left">
              <p className="text-white/30 text-sm italic leading-relaxed">
                &ldquo;每一条消息背后都藏着一个真相。
                <br />有时候看清了，反而是解脱的开始。&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* ===== 报告 ===== */}
        {stage === 'report' && report && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div ref={reportRef} className="share-target">
              <div className="text-center mb-12">
                <div className="text-6xl mb-4">💌</div>
                <h1 className="text-3xl md:text-4xl font-black mb-2">
                  <span className="text-gradient-soul">感情透视报告</span>
                </h1>
                <p className="text-white/30 text-sm">
                  生成时间: {new Date().toLocaleString('zh-CN')}
                </p>
              </div>

              {report.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard label="总消息数" value={report.stats.totalMessages?.toLocaleString() || '0'} icon="💬" />
                  <StatCard label="跨越天数" value={`${report.stats.totalDays || 0}天`} icon="📅" />
                  <StatCard label="最长连聊" value={`${report.stats.longestStreak || 0}天`} icon="🔥" />
                  <StatCard label="参与者" value={`${Object.keys(report.stats.messagesBySender || {}).length}人`} icon="👥" />
                </div>
              )}

              {report.stats && (
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="glass-card p-6">
                    <h3 className="text-white/80 font-bold mb-4 flex items-center gap-2">
                      <span>🕐</span> 24小时消息分布
                    </h3>
                    <HourChart data={report.stats.messagesByHour || []} />
                  </div>
                  <div className="glass-card p-6">
                    <h3 className="text-white/80 font-bold mb-4 flex items-center gap-2">
                      <span>⚖️</span> 谁发的消息更多？
                    </h3>
                    <SenderChart data={report.stats.messagesBySender || {}} />
                  </div>
                </div>
              )}

              <div className="glass-card p-8 md:p-12 mb-8">
                <div className="prose prose-invert max-w-none prose-headings:text-gradient-soul prose-h2:text-2xl prose-h2:font-black prose-h2:mt-10 prose-h2:mb-4 prose-p:text-white/70 prose-p:leading-relaxed prose-li:text-white/60 prose-strong:text-white/90">
                  <div dangerouslySetInnerHTML={{ __html: formatReport(report.report) }} />
                </div>
              </div>
            </div>

            {/* 操作 */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <ShareButton
                  targetRef={reportRef}
                  title="我的感情透视报告"
                  productName="月见"
                  cta="姐妹们也来测测 →"
                  className="flex-1 justify-center"
                />
                <button
                  onClick={() => { setStage('upload'); setReport(null); setFileContent(''); setFileName('') }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 transition-all text-sm"
                >
                  📁 分析另一段关系
                </button>
              </div>
              <Link
                href="/ai-fortune"
                className="py-3 rounded-xl bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-500 text-white font-bold text-center hover:opacity-90 transition-opacity text-sm"
              >
                🔮 看完真相，不如算一卦未来会更好吗？
              </Link>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

/* ============ 子组件 ============ */

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-black text-white/90">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  )
}

function HourChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[2px] h-32">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-gradient-to-t from-pink-500/60 to-purple-500/80 transition-all hover:from-pink-400 hover:to-purple-400 min-h-[2px]"
            style={{ height: `${(val / max) * 100}%` }}
            title={`${i}:00 - ${val}条消息`}
          />
          {i % 4 === 0 && <span className="text-[10px] text-white/30">{i}</span>}
        </div>
      ))}
    </div>
  )
}

function SenderChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1
  const colors = ['from-pink-400 to-rose-400', 'from-purple-400 to-indigo-400', 'from-amber-400 to-orange-400', 'from-green-400 to-teal-400']
  return (
    <div className="space-y-3">
      {entries.map(([name, count], i) => (
        <div key={name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/70 truncate max-w-[60%]">{name}</span>
            <span className="text-white/40">{count} ({Math.round(count / total * 100)}%)</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${colors[i % colors.length]} transition-all duration-1000`} style={{ width: `${(count / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatReport(markdown: string): string {
  return markdown
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/### (.*)/g, '<h3 class="text-lg font-bold text-white/80 mt-6 mb-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-white/50">$1</em>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul class="list-disc list-inside space-y-1">$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br />')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match
      return `<p>${match}</p>`
    })
}

const DEMO_CHAT = `2024-01-15 08:30:15 小明
早安呀~今天天气好好
2024-01-15 08:30:45 小明
你起床了吗？
2024-01-15 10:15:30 小红
嗯刚醒
2024-01-15 10:16:02 小明
哈哈我都等了两个小时了
你昨晚几点睡的呀
2024-01-15 10:20:15 小红
不记得了
2024-01-15 10:20:30 小明
要注意休息哦！
我给你分享个好听的歌
2024-01-15 10:20:45 小明
[链接]
2024-01-15 10:45:00 小红
好
2024-01-15 12:00:10 小明
中午吃什么呀？
要不要一起吃饭
2024-01-15 12:30:22 小红
和同事吃了
2024-01-15 12:30:45 小明
好吧 那晚上呢？
2024-01-15 14:00:00 小明
下午好呀~
2024-01-15 15:30:00 小红
哦
2024-01-15 15:30:20 小明
你喜欢喝什么口味的 下次给你带
2024-01-15 17:00:00 小明
下班了吗？
2024-01-15 18:30:10 小红
嗯
2024-01-15 18:30:30 小明
我也刚下班！今天好累但是想到跟你聊天就开心了
2024-01-15 18:31:00 小明
你晚上有什么安排吗
2024-01-15 20:00:00 小红
在看剧
2024-01-15 20:00:15 小明
看什么剧呀 好看吗
可以推荐给我吗
2024-01-15 21:30:00 小红
你自己搜吧
2024-01-15 21:30:20 小明
好吧哈哈
那你早点休息哦 晚安~
2024-01-15 23:55:00 小明
还没睡吧？突然想到一个好笑的事情想跟你分享
2024-01-16 00:10:00 小明
你睡了吗？
晚安啦
2024-01-16 08:15:00 小明
早安！新的一天~
2024-01-16 08:15:20 小明
今天要变冷了 记得多穿点
2024-01-16 09:30:00 小红
知道了
2024-01-16 09:30:30 小明
对了你周末有空吗 想约你出去玩
2024-01-16 12:00:00 小红
再说吧
2024-01-16 12:00:20 小明
好的好的 没关系 你有空的时候告诉我就行
我随时都可以！
2024-01-16 18:00:00 小明
下班啦 今天你那边忙吗
2024-01-16 19:30:00 小红
还好
2024-01-16 19:30:15 小明
辛苦啦！周末真的不考虑出去走走吗
2024-01-16 21:00:00 小红
我周末有安排了
2024-01-16 21:00:15 小明
没关系！那下周呢？
2024-01-16 22:00:00 小红
再说
2024-01-16 22:00:15 小明
好的 那你早点休息 晚安~
2024-01-16 23:50:00 小明
睡了吗？今天的月亮好圆 拍给你看
2024-01-16 23:50:15 小明
[图片]
2024-01-17 00:05:00 小明
你一定睡了吧 晚安晚安
`
