import { NextRequest, NextResponse } from 'next/server'
import { parseWechatChat, generateChatStats } from '@/lib/chat-parser'
import { chatCompletion } from '@/lib/ai'
import { growthModeEnabled, isPaid } from '@/lib/paywall'
import { applyRateLimit } from '@/lib/rate-limit'

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
    const limited = applyRateLimit(req, 'analysis', {
      limit: Number(process.env.RL_ANALYSIS_LIMIT || 12),
      windowMs: Number(process.env.RL_ANALYSIS_WINDOW_MS || 60_000),
    })
    if (limited) return limited

    const { chatText } = await req.json()

    if (!chatText || typeof chatText !== 'string') {
      return NextResponse.json({ error: '请上传有效的聊天记录文本' }, { status: 400 })
    }

    const messages = parseWechatChat(chatText)
    if (!messages.length) {
      return NextResponse.json(
        { error: '未识别到有效聊天消息，请上传更清晰的连续聊天截图（建议 3-8 张原图）。' },
        { status: 422 }
      )
    }

    const stats = generateChatStats(messages)

    const systemPrompt = [
      '你是一位冷静、克制、直接的关系分析师。',
      '请根据聊天统计输出结构化结论，不要空话，不要恐吓。',
      '输出 Markdown，必须包含以下小节：',
      '## 关系诊断',
      '## 关键证据',
      '## 风险信号',
      '## 行动建议（3条）',
      '所有建议要可执行、低成本、可立即开始。',
    ].join('\n')

    const paid = growthModeEnabled() || (await isPaid('soul'))
    const summary = {
      participants: Object.keys(stats.messagesBySender),
      totalMessages: stats.totalMessages,
      totalDays: stats.totalDays,
      longestStreak: stats.longestStreak,
      responseTime: stats.responseTime,
      responseTimeVar: stats.responseTimeVar,
      lateNightRatio: stats.lateNightRatio,
      initiatorCount: stats.initiatorCount,
      pronounCount: stats.pronounCount,
      topWords: stats.topWords,
    }

    const userMessage = paid
      ? `请基于以下统计信息，生成完整关系分析报告：\n\n${JSON.stringify(summary, null, 2)}`
      : `请基于以下统计信息，生成试读版关系分析报告（600-900字）：\n\n${JSON.stringify(summary, null, 2)}\n\n要求：\n1) 只输出报告正文。\n2) 结尾给出一句“如需完整版本可继续解锁”的引导，不提价格。`

    const report = await withApiTimeout(
      chatCompletion(systemPrompt, userMessage, {
        temperature: 0.7,
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
      { error: err?.message || '分析失败，请稍后重试' },
      { status: 500 }
    )
  }
}
