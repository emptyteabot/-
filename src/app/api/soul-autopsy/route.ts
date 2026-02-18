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

    // Prevent "toy" outputs: too little signal leads to low trust and bad retention.
    const participants = Object.entries(stats.messagesBySender || {})
    const minPerSide = participants.length ? Math.min(...participants.map(([, n]) => Number(n) || 0)) : 0
    if (stats.totalMessages < 12 || participants.length < 2 || minPerSide < 3) {
      return NextResponse.json(
        { error: '聊天内容太少，无法给出可信结论。请上传更连续的对话（建议至少 3-8 张截图，或 30 条以上消息）。' },
        { status: 422 }
      )
    }

    const paid = growthModeEnabled() || (await isPaid('soul'))

    const systemPrompt = [
      '你是一位冷静、克制、直接的关系分析师。',
      '请根据聊天统计输出结构化结论，不要空话，不要恐吓。',
      '输出 Markdown。',
      paid
        ? [
            '必须包含以下小节：',
            '## 关系诊断（1句结论 + 1句解释）',
            '## 关键证据（3-6条，写清“指标 -> 含义”）',
            '## 风险信号（3条）',
            '## 今晚可复制的话术（3句，直接可发）',
            '## 行动建议（3条）',
            '所有建议要可执行、低成本、可立即开始。',
            '话术要克制、不过度讨好、不试图操控对方。',
          ].join('\n')
        : [
            '这是试读版：给到结论 + 证据 + 1条行动建议即可。',
            '必须包含以下小节：',
            '## 关系诊断',
            '## 关键证据（最多3条）',
            '## 行动建议（1条）',
            '结尾用一句话引导解锁完整版本（不出现价格）。',
          ].join('\n'),
    ].join('\n')
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
      : `请基于以下统计信息，生成试读版关系分析报告（350-550字）：\n\n${JSON.stringify(summary, null, 2)}`

    const report = await withApiTimeout(
      chatCompletion(systemPrompt, userMessage, {
        temperature: 0.7,
        maxTokens: paid ? 2200 : 1000,
        preferFast: true,
      }),
      32000
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
