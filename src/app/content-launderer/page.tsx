'use client'

import { useState } from 'react'
import Link from 'next/link'

type TabType = 'examples' | 'rewrite' | 'generate' | 'titles'
type Platform = 'xiaohongshu' | 'douyin' | 'wechat' | 'weibo'
type PromoTarget = 'soul' | 'fortune' | 'both' | 'none'

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: 'xiaohongshu', label: '小红书', icon: '📕' },
  { id: 'douyin', label: '抖音', icon: '🎵' },
  { id: 'wechat', label: '公众号', icon: '💬' },
  { id: 'weibo', label: '微博', icon: '🔥' },
]

const PROMO_OPTIONS: { id: PromoTarget; label: string }[] = [
  { id: 'both', label: '双产品引流' },
  { id: 'soul', label: '感情透视' },
  { id: 'fortune', label: '塔罗占卜' },
  { id: 'none', label: '不植入' },
]

// ============ 现成爆款范文（直接复制去发） ============
const READY_EXAMPLES = [
  {
    platform: '小红书',
    title: '📕 小红书 · 情感分析方向',
    posts: [
      {
        title: '😱 把和前任的聊天记录喂给AI后，我发现了细思极恐的细节',
        content: `姐妹们我真的崩溃了！！！

昨天失眠翻到和前任的聊天记录，越看越不对劲，于是我做了一件事——

把所有聊天记录导出来，让AI帮我分析。

结果出来那一刻，我直接破防了🥹

「数据显示」：
• 他平均回复时间：4小时32分钟
• 我的平均回复时间：3分钟
• 他主动发起聊天的次数：全部聊天的12%
• 深夜给我发消息的比例：0%（对，一次都没有）

最扎心的是AI给出的诊断：
"这不是爱情，这是你一个人的独角戏"

看完报告我哭了很久，但也终于想通了。

有些真相，虽然残忍，但看清了反而是解脱的开始。

姐妹们如果你也在纠结他到底爱不爱你
建议你也去测一下
有时候数据比直觉更诚实

#感情分析 #聊天记录 #分手 #恋爱 #AI`,
      },
      {
        title: '🤯 "嗯""哦""好的"——AI帮我数了一下，他一共敷衍了我847次',
        content: `今天被AI的分析报告气笑了哈哈哈哈哈

事情是这样的：
我把和暧昧对象三个月的聊天记录传上去做了个感情透视

报告里有一项叫「敷衍指数」

他排名前三的回复：
1. 嗯 — 出现 312 次
2. 哦 — 出现 287 次  
3. 好的 — 出现 248 次

而我给他发的消息平均长度是他的「4.7倍」

AI的原话："如果把你们的关系比作一场乒乓球赛，你在疯狂发球，他连球拍都没带。"

笑着笑着就哭了😂

姐妹们，别再自我欺骗了
数据不会说谎的

#暧昧 #聊天记录分析 #舔狗 #清醒恋爱 #AI分析`,
      },
      {
        title: '✨ 闺蜜：你该分手了。AI：我给你看数据。',
        content: `闺蜜说了一百遍"你该分手了"我都不信

直到AI用数据帮我算了一笔账：

📊 三个月数据：
- 我主动发起聊天的比例：89%
- 他平均回复等待时间：3小时
- 我们凌晨聊天的次数：我发了47次，他回了0次
- 他发「在吗」给我的次数：只有需要帮忙的时候

关系健康评分：23/100
AI诊断：「工具人关系」

报告最后一句话让我彻底清醒了：
"你值得一个秒回你消息的人"

当天晚上我就把他删了。

女孩子们，有时候不是你不够好
是他根本配不上你的付出

想测的姐妹去看我主页

#分手 #感情 #关系诊断 #配得感 #自我成长`,
      },
    ],
  },
  {
    platform: '小红书',
    title: '📕 小红书 · 塔罗占卜方向',
    posts: [
      {
        title: '🔮 AI塔罗说我本周有桃花运，结果今天地铁上真被搭讪了…',
        content: `好吧我现在有点慌

事情是这样的：周一的时候我闲着无聊用AI塔罗测了一下本周运势

抽到的牌是：
🃏 恋人（正位）— 新的缘分正在靠近
🃏 星星（正位）— 充满希望的开始
🃏 太阳（正位）— 快乐和温暖

AI说：本周会有意想不到的邂逅，注意你身边突然出现的温暖信号。

我当时就觉得：切，又是AI编故事

结果！今天下班坐地铁！旁边一个男生跟我搭话问路！！
关键是还长得挺好看的？？？

我不信玄学的但是这也太准了吧😳

先不说了我去翻他朋友圈了

姐妹们你们也去测测自己的桃花运！

#塔罗 #桃花运 #占卜 #星座 #缘分`,
      },
      {
        title: '🌙 连续7天让AI算命，记录了每天的准确度（震惊）',
        content: `为了验证AI塔罗到底准不准
我决定做一个7天实验

Day1 🃏 预测：会收到意外的好消息
✅ 实际：领导突然给我升了职级

Day2 🃏 预测：注意金钱损失
✅ 实际：手机在出租车上差点丢了

Day3 🃏 预测：旧人会联系你
✅ 实际：前同事突然找我吃饭

Day4 🃏 预测：今日桃花旺
❌ 一个人宅了一天哈哈

Day5 🃏 预测：有人在背后帮你
✅ 面试了一家公司 居然是朋友内推的

Day6 🃏 预测：注意健康
✅ 实际：吃坏了肚子😂

Day7 🃏 预测：会做一个重要决定
✅ 决定辞职了！

准确率：6/7 = 85.7%

我不信命了 我信数据了

#塔罗 #AI算命 #运势 #占卜记录 #每日运势`,
      },
    ],
  },
  {
    platform: '抖音',
    title: '🎵 抖音脚本 · 短视频方向',
    posts: [
      {
        title: '【视频脚本】把和渣男的聊天记录喂给AI',
        content: `【画面】手指点击上传按钮
【字幕】今天做一件刺激的事
【旁白】把和前任的聊天记录，全部喂给AI

【画面】上传中的进度条
【字幕】正在分析3个月的聊天记录...
【旁白】让AI帮我看看，他到底是怎么想的

【画面】报告出现 - 关系类型：工具人关系
【字幕】关系诊断：工具人 😭
【旁白】好的...工具人...行吧

【画面】滑动到数据对比
【字幕】我发了3247条消息，他回了412条
【旁白】三千多条消息啊姐妹们，换来四百条回复

【画面】AI的扎心结论
【字幕】"你的付出和回报比是8:1"
【旁白】这个投资回报率...炒股都不至于这么亏

【画面】报告最后一句话
【字幕】"你值得被秒回"
【旁白】好了我删了 谢谢AI帮我清醒

【结尾字幕】想测的看评论区置顶 #AI分析 #感情`,
      },
    ],
  },
]

export default function ContentLaundererPage() {
  const [tab, setTab] = useState<TabType>('examples')
  const [platform, setPlatform] = useState<Platform>('xiaohongshu')
  const [promo, setPromo] = useState<PromoTarget>('both')
  const [inputContent, setInputContent] = useState('')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError('')
    setResult('')
    setLoading(true)
    try {
      const body: any = { platform, promoTarget: promo }
      if (tab === 'rewrite') {
        if (!inputContent.trim()) { setError('请输入要改写的内容'); setLoading(false); return }
        body.type = 'rewrite'
        body.content = inputContent
      } else if (tab === 'generate') {
        if (!topic.trim()) { setError('请输入创作主题'); setLoading(false); return }
        body.type = 'generate'
        body.topic = topic
      } else if (tab === 'titles') {
        if (!topic.trim()) { setError('请输入主题'); setLoading(false); return }
        body.type = 'batch-titles'
        body.topic = topic
      }
      const res = await fetch('/api/content-launderer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || '生成失败') }
      const data = await res.json()
      setResult(data.result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-bold text-gray-800">内容工厂</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">内部工具</span>
          </div>
          <Link href="/" className="text-gray-400 text-sm hover:text-gray-600">← 回主站</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-gray-200 max-w-2xl">
          {[
            { id: 'examples' as TabType, label: '📦 现成范文', desc: '复制即发' },
            { id: 'rewrite' as TabType, label: '🔄 改写', desc: '改写爆款' },
            { id: 'generate' as TabType, label: '✨ 创作', desc: '主题创作' },
            { id: 'titles' as TabType, label: '🎯 标题', desc: '批量标题' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setResult(''); setError('') }}
              className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== 现成范文 Tab ===== */}
        {tab === 'examples' && (
          <div className="space-y-8">
            {READY_EXAMPLES.map((section, si) => (
              <div key={si}>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{section.title}</h2>
                <div className="grid gap-4">
                  {section.posts.map((post, pi) => {
                    const postId = `${si}-${pi}`
                    return (
                      <div key={pi} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-gray-900 mb-3 text-lg">{post.title}</h3>
                        <pre className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-sans mb-4 max-h-60 overflow-y-auto">
                          {post.content}
                        </pre>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-gray-400 text-xs">{post.content.length} 字</span>
                          <button
                            onClick={() => copyText(post.title + '\n\n' + post.content, postId)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              copied === postId
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                          >
                            {copied === postId ? '✅ 已复制' : '📋 复制全文'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== AI 工具 Tabs ===== */}
        {tab !== 'examples' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 左: 输入 */}
            <div className="space-y-4">
              {/* 平台 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">📱 目标平台</h3>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`py-2.5 rounded-lg text-center transition-all text-sm ${
                        platform === p.id
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-lg mb-0.5">{p.icon}</div>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 推广 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">🎯 推广植入</h3>
                <div className="grid grid-cols-4 gap-2">
                  {PROMO_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setPromo(opt.id)}
                      className={`py-2 rounded-lg text-sm transition-all ${
                        promo === opt.id ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 输入 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                {tab === 'rewrite' ? (
                  <>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm">📝 粘贴爆款内容</h3>
                    <textarea
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      placeholder="粘贴你看到的爆款文案..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none h-40"
                    />
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm">
                      {tab === 'generate' ? '💡 创作主题' : '🎯 标题主题'}
                    </h3>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder={tab === 'generate' ? '输入主题...' : '输入需要生成标题的主题...'}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['聊天记录分析', 'AI算命', '塔罗牌', '感情', '分手', '暧昧', '舔狗', '星座运势'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTopic(t)}
                          className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs hover:bg-gray-200 transition-all"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? '⏳ AI 生成中...' : tab === 'rewrite' ? '🔄 一键改写' : tab === 'generate' ? '✨ 开始创作' : '🎯 批量生成'}
              </button>
            </div>

            {/* 右: 输出 */}
            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-sm">📤 生成结果</h3>
                  {result && (
                    <button
                      onClick={() => copyText(result, 'result')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        copied === 'result' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {copied === 'result' ? '✅ 已复制' : '📋 复制'}
                    </button>
                  )}
                </div>
                {result ? (
                  <div className="bg-gray-50 rounded-xl p-5 max-h-[500px] overflow-y-auto">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{result}</div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-12 text-center">
                    <div className="text-4xl mb-3 opacity-30">📝</div>
                    <p className="text-gray-400 text-sm">{loading ? 'AI 正在生成...' : '结果显示在这里'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
