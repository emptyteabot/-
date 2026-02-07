import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/ai'
import {
  drawTarotCards,
  getZodiacSign,
  calculateBazi,
  FORTUNE_PROMPTS,
} from '@/lib/fortune-engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body // 'tarot' | 'daily'

    if (type === 'tarot') {
      const { question, cardCount } = body
      const cards = drawTarotCards(cardCount || 3)
      const prompt = FORTUNE_PROMPTS.tarot(cards, question || '')

      const reading = await chatCompletion(
        prompt,
        `请为我解读这 ${cards.length} 张塔罗牌。${question ? `我的问题是：${question}` : '我想知道最近的整体运势。'}`,
        { temperature: 0.9, maxTokens: 3000 }
      )

      return NextResponse.json({ cards, reading })
    }

    if (type === 'daily') {
      const { birthday, birthHour } = body
      if (!birthday) {
        return NextResponse.json({ error: '请输入生日' }, { status: 400 })
      }

      const [year, month, day] = birthday.split('-').map(Number)
      const zodiac = getZodiacSign(month, day)
      const bazi = birthHour !== undefined
        ? calculateBazi(year, month, day, birthHour)
        : undefined

      const prompt = FORTUNE_PROMPTS.daily(zodiac, bazi)
      const fortune = await chatCompletion(
        prompt,
        `今天是 ${new Date().toLocaleDateString('zh-CN')}，请为我生成今日运势报告。`,
        { temperature: 0.85, maxTokens: 2000 }
      )

      return NextResponse.json({ zodiac, bazi, fortune })
    }

    return NextResponse.json({ error: '未知的算命类型' }, { status: 400 })
  } catch (err: any) {
    console.error('AI Fortune Error:', err)
    return NextResponse.json(
      { error: err.message || '算命失败，天道不允许' },
      { status: 500 }
    )
  }
}



