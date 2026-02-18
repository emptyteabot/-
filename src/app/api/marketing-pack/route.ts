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
      '发布 3 条内容：一个真实案例、一个方法拆解、一个反常识观点。',
      '每条内容发布后 30 分钟内完成首轮评论互动（至少 20 条）。',
      '筛选高意向评论，私信引导上传聊天截图进入试读报告。',
      '记录当日漏斗：曝光、私信数、上传数、报告完成数、留资数。',
      '晚间复盘 20 分钟：保留高转化话术，淘汰低转化内容角度。',
    ],
    post_ideas: [
      {
        title: '别再猜了，聊天会说话',
        hook: '昨晚 1 点她把截图发我，第一句就是“我是不是想太多了”。',
        outline: ['先看谁在主动找话题', '再看回复速度和内容温度', '最后给一个今晚就能做的动作'],
        cta: '你也可以发最近 3-8 张连续截图，我先给你一版试读。',
        hashtags: tags,
      },
      {
        title: '秒回，不一定是上心',
        hook: '说实话，很多人卡在“他回得快=他在乎我”。',
        outline: ['给你看一个秒回但很敷衍的例子', '拆“回复快”和“投入高”的区别', '给你一句不卑微的试探话术'],
        cta: '把聊天记录给我，我帮你拆下一步怎么聊。',
        hashtags: tags,
      },
      {
        title: '内耗这件事，今晚先止损',
        hook: '我见过太多人在“想他爱不爱我”里熬到凌晨。',
        outline: ['先停掉脑补，改看证据', '用三条线索判断关系状态', '给你一个低压力破冰开场'],
        cta: '先做一版报告，再决定继续还是止损。',
        hashtags: tags,
      },
    ],
    dm_openers: [
      '先别急着下结论，你把连续截图发我，我先给你做试读版。',
      '我会按“结论-证据-下一步”给你，尽量说人话，不绕弯。',
      '先看证据再决定，能少很多内耗。',
    ],
    comment_replies: [
      '太懂了，最累的就是一直猜。你可以先做证据化判断。',
      '这事不用硬扛，先看聊天细节，再决定下一步。',
      '你要是愿意，我可以先给你一版试读，看合不合适。',
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

const HUMAN_VIBE_RULES = [
  '你写的是小红书真人号口吻，不是机构号、客服号或咨询公司。',
  '禁止 AI 套话：赋能、矩阵、抓手、闭环、大数据告诉你、精准触达、情绪价值拉满。',
  '每条内容都要带一个具体细节（时间/场景/一句原话/一个动作），不要空话。',
  '标题控制在 12-20 字，优先“别再X了 / X的本质是Y / 我发现...”这类自然句式。',
  '语气像朋友聊天，允许短句和口头词（说实话、我当时、后来）。',
  '不要夸张承诺和恐吓，结尾给温和可执行动作。',
].join('\n')

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
      HUMAN_VIBE_RULES,
    ].join('\n')

    const userPrompt = [
      `风格偏好：${vibe}`,
      '生成字段要求：',
      '{',
      '  "goal": "一句话目标",',
      '  "today_tasks": ["4-6条可执行动作"],',
      '  "post_ideas": [',
      '    {',
      '      "title": "标题（12-20字）",',
      '      "hook": "开场钩子（必须有具体细节）",',
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
      '每条 post_idea 标题都要像真人随手写的，不要运营腔。',
      '每条 hook 都要有一个具体细节：时间、地点、原话或动作。',
      '禁止“AI味”词汇和企业公关腔。',
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
