import { NextRequest, NextResponse } from 'next/server'
import { parseWechatChat, generateChatStats } from '@/lib/chat-parser'
import { chatCompletion } from '@/lib/ai'
import { FORTUNE_PROMPTS } from '@/lib/fortune-engine'

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
    const prompt = FORTUNE_PROMPTS.soulAutopsy(stats)
    const report = await chatCompletion(
      prompt,
      `请根据以上数据，生成一份完整的灵魂尸检报告。聊天记录涉及 ${Object.keys(stats.messagesBySender).join('、')} 之间的对话，共 ${stats.totalMessages} 条消息，跨越 ${stats.totalDays} 天。`,
      { temperature: 0.9, maxTokens: 4096 }
    )

    return NextResponse.json({
      report,
      stats: {
        totalMessages: stats.totalMessages,
        totalDays: stats.totalDays,
        longestStreak: stats.longestStreak,
        messagesBySender: stats.messagesBySender,
        messagesByHour: stats.messagesByHour,
        avgMessageLength: stats.avgMessageLength,
        lateNightRatio: stats.lateNightRatio,
        initiatorCount: stats.initiatorCount,
        topWords: stats.topWords,
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



