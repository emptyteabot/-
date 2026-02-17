import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/ai'
import { applyRateLimit } from '@/lib/rate-limit'

type ProductType = 'soul' | 'fortune' | 'both'
type ChannelType = 'xiaohongshu' | 'douyin' | 'wechat'

type MarketingPack = {
  goal: string
  today_tasks: string[]
  post_ideas: Array<{
    title: string
    hook: string
    outline: string[]
    cta: string
    hashtags: string[]
  }>
  dm_openers: string[]
  comment_replies: string[]
  kpi: {
    uploads_target: string
    completion_rate_target: string
    lead_rate_target: string
  }
  raw_text?: string
}

function normalizeProduct(v: string): ProductType {
  if (v === 'soul' || v === 'fortune' || v === 'both') return v
  return 'both'
}

function normalizeChannel(v: string): ChannelType {
  if (v === 'douyin' || v === 'wechat') return v
  return 'xiaohongshu'
}

function stripFence(text: string): string {
  return String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
}

function fallbackTags(channel: ChannelType): string[] {
  if (channel === 'douyin') return ['#情感', '#关系建议', '#聊天记录分析']
  if (channel === 'wechat') return ['#关系复盘', '#沟通', '#情感决策']
  return ['#情感法医', '#聊天记录分析', '#恋爱清醒']
}

function buildFallbackPack(
  product: ProductType,
  channel: ChannelType,
  vibe: string,
  reason?: string
): MarketingPack {
  const productText =
    product === 'soul'
      ? '情感法医'
      : product === 'fortune'
        ? 'AI 占卜'
        : '情感法医 + AI 占卜'

  const tags = fallbackTags(channel)

  return {
    goal: `今日目标：用 3 条内容验证 ${productText} 的可转化需求（风格：${vibe}）。`,
    today_tasks: [
      '发布 3 条内容：案例拆解 1 条、方法论 1 条、反常识观点 1 条。',
      '每条内容发布后 30 分钟内完成首轮评论互动（至少 20 条）。',
      '筛选高意向评论，私信引导上传聊天截图进入试读报告。',
      '记录当日漏斗：曝光、私信数、上传数、报告完成数、留资数。',
      '晚间复盘 20 分钟：保留高转化话术，淘汰低转化内容角度。',
    ],
    post_ideas: [
      {
        title: '他到底爱不爱你？先看聊天证据',
        hook: '别再猜了，聊天里早就写了答案。',
        outline: ['展示 3 个高频信号', '给出反例避免误判', '引导上传截图做试读'],
        cta: '发你们最近 3-8 张连续聊天截图，我先给你试读版。',
        hashtags: tags,
      },
      {
        title: '高回复不等于高投入',
        hook: '秒回可能只是习惯，不代表关系投入。',
        outline: ['对比回复速度与内容质量', '解释“互动密度”指标', '给出下一步沟通动作'],
        cta: '把记录给我，我帮你拆出可执行下一步。',
        hashtags: tags,
      },
      {
        title: '关系内耗的 24 小时止损法',
        hook: '越焦虑越容易做错决定，先做证据化判断。',
        outline: ['什么是低成本证据', '如何判断风险信号', '如何发第一条破冰消息'],
        cta: '先做一版分析报告，再决定追还是停。',
        hashtags: tags,
      },
    ],
    dm_openers: [
      '你先别急着下结论，把连续截图发我，我给你先做试读版。',
      '我会按“结论-证据-动作”给你，直接看下一步怎么做。',
      '先看证据再决策，能少走很多弯路。',
    ],
    comment_replies: [
      '有同感，很多人卡在“猜”。你可以先做证据化判断。',
      '先别内耗，先看聊天行为数据，再决定怎么做。',
      '可以先试读一版，看看结论是否对你有帮助。',
    ],
    kpi: {
      uploads_target: '300',
      completion_rate_target: '70%',
      lead_rate_target: '8%',
    },
    ...(reason ? { raw_text: `fallback_reason: ${reason}` } : {}),
  }
}

const CHANNEL_HINT: Record<ChannelType, string> = {
  xiaohongshu: '平台是小红书，输出更生活化，段落短，结尾带 3-5 个话题标签。',
  douyin: '平台是抖音，输出短视频脚本结构（钩子-冲突-行动），语句更口语化。',
  wechat: '平台是公众号，输出逻辑完整，适合深度阅读与转发。',
}

const PRODUCT_HINT: Record<ProductType, string> = {
  soul: '重点推广“AI 情感法医（聊天截图分析）”。',
  fortune: '重点推广“AI 赛博占卜（塔罗/运势）”。',
  both: '同时推广“情感法医 + AI 占卜”联动路径。',
}

export async function POST(req: NextRequest) {
  let product: ProductType = 'both'
  let channel: ChannelType = 'xiaohongshu'
  let vibe = '高转化、克制、直接'

  try {
    const limited = applyRateLimit(req, 'marketing-pack', {
      limit: Number(process.env.RL_MARKETING_PACK_LIMIT || 8),
      windowMs: Number(process.env.RL_MARKETING_PACK_WINDOW_MS || 60_000),
    })
    if (limited) return limited

    const body = await req.json().catch(() => ({}))
    product = normalizeProduct(String(body?.product || 'both'))
    channel = normalizeChannel(String(body?.channel || 'xiaohongshu'))
    vibe = String(body?.vibe || '高转化、克制、直接').slice(0, 120)

    const systemPrompt = [
      '你是增长负责人，负责把 AI 产品推进到可执行营销阶段。',
      '请输出一个“今日营销包”，必须严格返回 JSON，不要任何额外说明。',
      '语言用简体中文。',
      CHANNEL_HINT[channel],
      PRODUCT_HINT[product],
    ].join('\n')

    const userPrompt = [
      `风格偏好：${vibe}`,
      '生成字段要求：',
      '{',
      '  "goal": "一句话目标",',
      '  "today_tasks": ["4-6条可执行动作"],',
      '  "post_ideas": [',
      '    {',
      '      "title": "标题",',
      '      "hook": "开场钩子",',
      '      "outline": ["内容结构要点1","内容结构要点2","内容结构要点3"],',
      '      "cta": "收口行动号召",',
      '      "hashtags": ["话题1","话题2","话题3"]',
      '    }',
      '  ],',
      '  "dm_openers": ["私信开场话术3条"],',
      '  "comment_replies": ["评论区回复模板3条"],',
      '  "kpi": {',
      '    "uploads_target": "数字",',
      '    "completion_rate_target": "百分比",',
      '    "lead_rate_target": "百分比"',
      '  }',
      '}',
      'post_ideas 生成 3 条。',
      'today_tasks 不要抽象词，必须是可以当天完成的动作。',
    ].join('\n')

    const raw = await chatCompletion(systemPrompt, userPrompt, {
      temperature: 0.8,
      maxTokens: 2200,
      preferFast: true,
    })

    const cleaned = stripFence(raw)
    try {
      const parsed = JSON.parse(cleaned)
      return NextResponse.json({ ok: true, degraded: false, pack: parsed }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return NextResponse.json({
        ok: true,
        degraded: true,
        pack: buildFallbackPack(product, channel, vibe, 'json_parse_failed'),
        model_raw_text: cleaned,
      })
    }
  } catch (err: any) {
    const reason = err?.message ? String(err.message) : '营销包生成失败'
    return NextResponse.json({
      ok: true,
      degraded: true,
      pack: buildFallbackPack(product, channel, vibe, reason),
    })
  }
}
