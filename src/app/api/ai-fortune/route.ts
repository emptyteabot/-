import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/ai'
import { drawTarotCards, getZodiacSign, calculateBazi, FORTUNE_PROMPTS } from '@/lib/fortune-engine'
import { growthModeEnabled, isPaid } from '@/lib/paywall'
import { applyRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const limited = applyRateLimit(req, 'fortune', {
      limit: Number(process.env.RL_FORTUNE_LIMIT || 16),
      windowMs: Number(process.env.RL_FORTUNE_WINDOW_MS || 60_000),
    })
    if (limited) return limited

    const body = await req.json()
    const type = String(body?.type || '').trim() // tarot | daily

    if (type === 'tarot') {
      const question = String(body?.question || '').trim()
      const cardCount = Number(body?.cardCount || 3)
      const cards = drawTarotCards(cardCount)
      const prompt = FORTUNE_PROMPTS.tarot(cards, question)

      const paid = growthModeEnabled() || (await isPaid('fortune-tarot'))
      const reading = await chatCompletion(
        prompt,
        paid
          ? '请给我完整解读。'
          : '请输出试读版解读（300-500字），结尾用一句话引导查看完整建议，不出现价格。',
        { temperature: 0.9, maxTokens: paid ? 2200 : 800, preferFast: true }
      )

      return NextResponse.json({ cards, reading, locked: !paid })
    }

    if (type === 'daily') {
      const birthday = String(body?.birthday || '').trim()
      const birthHour = body?.birthHour

      if (!birthday) {
        return NextResponse.json({ error: '请输入生日（YYYY-MM-DD）' }, { status: 400 })
      }

      const parts = birthday.split('-').map((v: string) => Number(v))
      if (parts.length !== 3 || parts.some((v) => !Number.isFinite(v))) {
        return NextResponse.json({ error: '生日格式不正确，请使用 YYYY-MM-DD' }, { status: 400 })
      }

      const [year, month, day] = parts
      const zodiac = getZodiacSign(month, day)

      const hourNum = Number(birthHour)
      const bazi = Number.isFinite(hourNum) && hourNum >= 0 && hourNum <= 23
        ? calculateBazi(year, month, day, hourNum)
        : undefined

      const prompt = FORTUNE_PROMPTS.daily(zodiac, bazi)
      const paid = growthModeEnabled() || (await isPaid('fortune-daily'))
      const fortune = await chatCompletion(
        prompt,
        paid
          ? '请输出完整今日运势。'
          : '请输出试读版（200-350字），包含感情/事业/财运简评和2条可执行建议。',
        { temperature: 0.85, maxTokens: paid ? 1600 : 650, preferFast: true }
      )

      return NextResponse.json({ zodiac, bazi, fortune, locked: !paid })
    }

    return NextResponse.json({ error: '未知的占卜类型' }, { status: 400 })
  } catch (err: any) {
    console.error('AI Fortune Error:', err)
    return NextResponse.json(
      { error: err?.message || '占卜服务暂时不可用，请稍后重试' },
      { status: 500 }
    )
  }
}
