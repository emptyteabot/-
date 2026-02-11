import { NextRequest, NextResponse } from 'next/server'
import { parseWechatChat, generateChatStats } from '@/lib/chat-parser'
import { chatCompletion } from '@/lib/ai'
import { growthModeEnabled, isPaid } from '@/lib/paywall'

async function withApiTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`analysis timeout ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { chatText } = await req.json()

    if (!chatText || typeof chatText !== 'string') {
      return NextResponse.json({ error: '请上传有效的聊天记录' }, { status: 400 })
    }

    // 1. 解析聊天记录
    const messages = parseWechatChat(chatText)

    // 2. 生成统计数据
    const stats = generateChatStats(messages)

    // 3. 调用 AI 生成报告
    const prompt = [
      '你是冷静直接的情感分析师。',
      '根据聊天统计给出结构化结论，不要空话。',
      '输出 Markdown，严格包含以下小节：',
      '## 关系诊断',
      '## 关键证据',
      '## 风险信号',
      '## 行动建议（3条）',
      '语气：清晰、克制、可执行。',
    ].join('\n')

    const paid = growthModeEnabled() || (await isPaid('soul'))
    const userMessage = paid
      ? `请根据以上数据，生成一份完整的灵魂尸检报告。聊天记录涉及 ${Object.keys(stats.messagesBySender).join('、')} 之间的对话，共 ${stats.totalMessages} 条消息，跨越 ${stats.totalDays} 天。`
      : `请根据以上数据，生成“试读版灵魂尸检报告”（约800-1200字）。\n\n要求：\n1) 只输出报告正文（不要提到解锁码、付费墙、价格）。\n2) 结尾加一段“想看完整版建议/行动清单”的引导（不出现具体金额）。\n3) 语气温柔但直击要害。`

    const report = await withApiTimeout(
      chatCompletion(prompt, userMessage, {
        temperature: 0.7,
        // Keep response bounded to avoid timeout on slower providers/models.
        maxTokens: paid ? 2200 : 1000,
        preferFast: true,
      }),
      25000
    )

    return NextResponse.json({
      report,
      locked: !paid,
      stats: {
        totalMessages: stats.totalMessages,
        totalDays: stats.totalDays,
        longestStreak: stats.longestStreak,
        messagesBySender: stats.messagesBySender,
        messagesByHour: stats.messagesByHour,
        avgMessageLength: stats.avgMessageLength,
        responseTime: stats.responseTime,
        responseTimeVar: stats.responseTimeVar,
        lateNightRatio: stats.lateNightRatio,
        initiatorCount: stats.initiatorCount,
        topWords: stats.topWords,
        pronounCount: stats.pronounCount,
      },
    })
  } catch (err: any) {
    console.error('Soul Autopsy Error:', err)
    return NextResponse.json(
      { error: err.message || '分析失败，请稍后重试' },
      { status: 500 }
    )
  }
}
