import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/ai'
import {
  drawTarotCards,
  getZodiacSign,
  calculateBazi,
  FORTUNE_PROMPTS,
} from '@/lib/fortune-engine'
import { growthModeEnabled, isPaid } from '@/lib/paywall'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body // 'tarot' | 'daily'

    if (type === 'tarot') {
      const { question, cardCount } = body
      const cards = drawTarotCards(cardCount || 3)
      const prompt = FORTUNE_PROMPTS.tarot(cards, question || '')

      const paid = growthModeEnabled() || (await isPaid('fortune-tarot'))
      const reading = await chatCompletion(
        prompt,
        paid
          ? `请为我解读这 ${cards.length} 张塔罗牌。${question ? `我的问题是：${question}` : '我想知道最近的整体运势。'}`
          : `请为我输出“试读版塔罗解读”（300-500字）。${question ? `我的问题是：${question}` : ''}\n\n要求：\n1) 输出要具体、有场景。\n2) 结尾给3条可执行建议。\n3) 不要提到解锁码/付费/价格。`,
        { temperature: 0.9, maxTokens: paid ? 3000 : 900 }
      )

      return NextResponse.json({ cards, reading, locked: !paid })
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
      const paid = growthModeEnabled() || (await isPaid('fortune-daily'))
      const fortune = await chatCompletion(
        prompt,
        paid
          ? `今天是 ${new Date().toLocaleDateString('zh-CN')}，请为我生成今日运势报告。`
          : `今天是 ${new Date().toLocaleDateString('zh-CN')}，请为我生成“试读版今日运势”（200-350字），包含：感情/事业/财运各一句 + 2条行动建议。不要提到解锁码/付费/价格。`,
        { temperature: 0.85, maxTokens: paid ? 2000 : 700 }
      )

      return NextResponse.json({ zodiac, bazi, fortune, locked: !paid })
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



