import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/ai'
import { growthModeEnabled, isPaid } from '@/lib/paywall'
import { applyRateLimit } from '@/lib/rate-limit'

type Platform = 'xiaohongshu' | 'douyin' | 'wechat' | 'weibo'
type PromoTarget = 'soul' | 'fortune' | 'both' | 'none'

const PLATFORM_PROMPTS: Record<Platform, string> = {
  xiaohongshu: [
    '平台：小红书。',
    '风格：真实口吻、短段落、明确情绪钩子。',
    '结构：标题 -> 冲突 -> 证据 -> 行动。',
    '结尾加 3-5 个相关话题标签。',
  ].join('\n'),
  douyin: [
    '平台：抖音短视频脚本。',
    '结构：前3秒钩子 -> 中段信息点 -> 结尾互动提问。',
    '输出时用【画面】和【旁白】格式。',
  ].join('\n'),
  wechat: [
    '平台：微信公众号。',
    '结构：开场故事 -> 观点拆解 -> 结尾行动建议。',
    '语言要求逻辑清楚，适合深度阅读。',
  ].join('\n'),
  weibo: [
    '平台：微博。',
    '要求：高密度、观点鲜明、短句有冲击力。',
    '结尾附 2-3 个话题。',
  ].join('\n'),
}

const PROMO_HINTS: Record<PromoTarget, string> = {
  soul: '自然提及“聊天记录分析/关系诊断”类产品，不要硬广。',
  fortune: '自然提及“塔罗/运势解读”类产品，不要硬广。',
  both: '内容里自然串联“关系分析 + 运势建议”的组合路径。',
  none: '不插入任何推广内容。',
}

function asPlatform(v: string): Platform {
  if (v === 'douyin' || v === 'wechat' || v === 'weibo') return v
  return 'xiaohongshu'
}

function asPromo(v: string): PromoTarget {
  if (v === 'soul' || v === 'fortune' || v === 'both' || v === 'none') return v
  return 'none'
}

export async function POST(req: NextRequest) {
  try {
    const limited = applyRateLimit(req, 'content-launderer', {
      limit: Number(process.env.RL_LAUNDERER_LIMIT || 10),
      windowMs: Number(process.env.RL_LAUNDERER_WINDOW_MS || 60_000),
    })
    if (limited) return limited

    const body = await req.json()
    const type = String(body?.type || '').trim() // rewrite | generate | batch-titles
    const content = String(body?.content || '').trim()
    const topic = String(body?.topic || '').trim()
    const platform = asPlatform(String(body?.platform || 'xiaohongshu'))
    const promoTarget = asPromo(String(body?.promoTarget || 'none'))

    const paid = growthModeEnabled() || (await isPaid('launderer'))
    if (!paid && (type === 'rewrite' || type === 'generate')) {
      return NextResponse.json(
        { error: '该功能需要解锁后使用', pay: { product: 'launderer' } },
        { status: 402 }
      )
    }

    if (type === 'rewrite') {
      if (!content) {
        return NextResponse.json({ error: '请先输入要改写的内容' }, { status: 400 })
      }

      const prompt = [
        '你是中文内容改写编辑。',
        '要求：保留核心信息，重写表达方式，避免重复。',
        PLATFORM_PROMPTS[platform],
        `推广要求：${PROMO_HINTS[promoTarget]}`,
      ].join('\n')

      const result = await chatCompletion(
        prompt,
        `请改写以下内容：\n\n${content}`,
        { temperature: 0.9, maxTokens: 2600, preferFast: true }
      )

      return NextResponse.json({ result })
    }

    if (type === 'generate') {
      if (!topic) {
        return NextResponse.json({ error: '请先输入创作主题' }, { status: 400 })
      }

      const prompt = [
        '你是中文内容策划与写作专家。',
        '请围绕主题生成一篇可发布内容。',
        PLATFORM_PROMPTS[platform],
        `推广要求：${PROMO_HINTS[promoTarget]}`,
      ].join('\n')

      const result = await chatCompletion(
        prompt,
        `主题：${topic}\n请直接输出可发布内容。`,
        { temperature: 0.95, maxTokens: 2600, preferFast: true }
      )

      return NextResponse.json({ result })
    }

    if (type === 'batch-titles') {
      if (!topic) {
        return NextResponse.json({ error: '请先输入主题' }, { status: 400 })
      }

      const prompt = [
        '你是中文爆款标题策划。',
        `请为主题“${topic}”生成 12 个标题。`,
        '要求：每个标题策略不同（数字、对比、悬念、反常识、情绪共鸣等）。',
        `平台语境：${platform}`,
        '输出格式：每行一个，带序号。',
      ].join('\n')

      const result = await chatCompletion(prompt, '开始生成标题。', {
        temperature: 1,
        maxTokens: 1100,
        preferFast: true,
      })

      return NextResponse.json({ result })
    }

    return NextResponse.json({ error: '未知操作类型' }, { status: 400 })
  } catch (err: any) {
    console.error('Content Launderer Error:', err)
    return NextResponse.json(
      { error: err?.message || '内容生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}
