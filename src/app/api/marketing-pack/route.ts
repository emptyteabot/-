import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/ai'
import { applyRateLimit } from '@/lib/rate-limit'

type ProductType = 'soul' | 'fortune' | 'both'
type ChannelType = 'xiaohongshu' | 'douyin' | 'wechat'

type MarketingIdea = {
  title: string
  hook: string
  outline: string[]
  cta: string
  hashtags: string[]
}

type MarketingPack = {
  goal: string
  today_tasks: string[]
  post_ideas: MarketingIdea[]
  dm_openers: string[]
  comment_replies: string[]
  kpi: {
    uploads_target: string
    completion_rate_target: string
    lead_rate_target: string
  }
  raw_text?: string
}

const AI_JARGON_REPLACERS: Array<[RegExp, string]> = [
  [/赋能/g, '帮到'],
  [/矩阵/g, '多账号'],
  [/抓手/g, '做法'],
  [/闭环/g, '跑通'],
  [/精准触达/g, '找到对的人'],
  [/高净值/g, '高消费意愿'],
  [/降本增效/g, '少花钱多出单'],
  [/情绪价值拉满/g, '情绪被照顾到'],
  [/赛道/g, '方向'],
  [/流量池/g, '流量来源'],
  [/私域沉淀/g, '私信留联'],
]

const XHS_HUMAN_FRAMES = [
  '反直觉开头：先给结论，再补证据。',
  '细节锚点：必须出现具体时间、场景、动作或一句原话。',
  '短句表达：段落短，像私聊，不像公关稿。',
  '收口动作：每条内容给出今晚就能执行的一步。',
]

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

function extractJsonString(text: string): string {
  const cleaned = stripFence(text)
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1)
  return cleaned
}

async function withRouteTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout ${timeoutMs}ms`)), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function cleanText(text: unknown): string {
  let value = String(text ?? '')
  for (const [pattern, replacement] of AI_JARGON_REPLACERS) {
    value = value.replace(pattern, replacement)
  }

  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toStringArray(input: unknown, maxLen = 6): string[] {
  if (!Array.isArray(input)) return []
  return input
    .map((v) => cleanText(v))
    .filter(Boolean)
    .slice(0, maxLen)
}

function fallbackTags(channel: ChannelType): string[] {
  if (channel === 'douyin') return ['#情感', '#关系建议', '#聊天记录分析']
  if (channel === 'wechat') return ['#关系复盘', '#沟通', '#情感决策']
  return ['#关系透视', '#聊天记录分析', '#恋爱清醒']
}

function buildFallbackPack(
  product: ProductType,
  channel: ChannelType,
  vibe: string,
  reason?: string
): MarketingPack {
  const productText =
    product === 'soul' ? '关系透视' : product === 'fortune' ? 'AI 占卜' : '关系透视 + AI 占卜'

  const tags = fallbackTags(channel)

  return {
    goal: `今日目标：用3条内容验证 ${productText} 的可转化需求（风格：${cleanText(vibe)}）`,
    today_tasks: [
      '发3条内容：真实案例1条、方法拆解1条、反常识观点1条。',
      '每条发出后30分钟内完成首轮互动，至少回复20条评论。',
      '筛出高意向评论并私信，引导对方上传连续聊天截图试读。',
      '记录当天漏斗：曝光、私信、上传、报告完成、留资。',
      '晚上复盘20分钟，只保留高转化角度。',
    ],
    post_ideas: [
      {
        title: '别猜了，聊天记录会说话',
        hook: '昨晚11:42她给我发了6张截图，第一句是“我是不是又想太多了”。',
        outline: ['先看谁在主动发起话题', '再看回复节奏和内容温度', '最后给今晚能直接发的一句话'],
        cta: '你也可以发最近3-8张连续截图，我先给你试读版。',
        hashtags: tags,
      },
      {
        title: '秒回，不等于在乎',
        hook: '很多人会误判：他秒回=他投入。其实这俩不是一回事。',
        outline: ['给你看一个秒回但敷衍的真实例子', '拆开“回复快”和“投入高”的区别', '给你一句不卑微的试探话术'],
        cta: '把记录给我，我帮你拆下一步怎么聊。',
        hashtags: tags,
      },
      {
        title: '关系内耗，今晚先止损',
        hook: '凌晨1点还在翻聊天的人，通常不是不聪明，是没拿到证据。',
        outline: ['先停脑补，改看证据', '用三条线索判断关系状态', '用低压力开场测试对方回应'],
        cta: '先做一版报告，再决定继续还是止损。',
        hashtags: tags,
      },
    ],
    dm_openers: [
      '先别急着下结论，你把连续截图发我，我先给你做试读版。',
      '我会按“结论-证据-下一步动作”给你，尽量说人话，不绕。',
      '先看证据再决策，能少走很多弯路。',
    ],
    comment_replies: [
      '太懂你了，最累的就是一直猜。先做证据化判断会轻松很多。',
      '这类问题不用硬扛，先看聊天细节，再决定下一步。',
      '你愿意的话我可以先给你做一版试读，看是否有帮助。',
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
  xiaohongshu: '平台是小红书。文风要生活化、像真人日常分享，结尾带3-5个话题标签。',
  douyin: '平台是抖音。输出短视频口播结构（钩子-冲突-动作），句子更短更口语。',
  wechat: '平台是公众号。输出逻辑完整、可转发的深度文本。',
}

const PRODUCT_HINT: Record<ProductType, string> = {
  soul: '重点推广“AI 关系透视（聊天截图分析）”。',
  fortune: '重点推广“AI 赛博占卜（塔罗/运势）”。',
  both: '同时推广“关系透视 + AI 占卜”的联动路径。',
}

const HUMAN_VIBE_RULES = [
  '你是小红书真人创作者，不是咨询公司。',
  '禁止使用企业黑话和AI腔。',
  ...XHS_HUMAN_FRAMES,
  '标题控制在12-20字，优先自然句式：别再X了 / X的本质是Y / 我发现……。',
  '语气像朋友聊天，允许短句和口头词（说实话、我当时、后来）。',
  '不夸张承诺，不恐吓用户，结尾给温和可执行动作。',
].join('\n')

const JSON_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}

function normalizeIdea(idea: any, channel: ChannelType): MarketingIdea {
  return {
    title: cleanText(idea?.title) || '别猜了，先看聊天证据',
    hook: cleanText(idea?.hook) || '昨晚她把截图发来，第一句是“我是不是又想太多了”。',
    outline: toStringArray(idea?.outline, 4),
    cta: cleanText(idea?.cta) || '把最近3-8张连续截图发我，我先给你试读版。',
    hashtags: toStringArray(idea?.hashtags, 6).length ? toStringArray(idea?.hashtags, 6) : fallbackTags(channel),
  }
}

function normalizePack(raw: any, product: ProductType, channel: ChannelType, vibe: string): MarketingPack {
  const fallback = buildFallbackPack(product, channel, vibe)

  if (!raw || typeof raw !== 'object') return fallback

  const ideas = Array.isArray(raw.post_ideas)
    ? raw.post_ideas.slice(0, 3).map((idea: any) => normalizeIdea(idea, channel))
    : []

  return {
    goal: cleanText(raw.goal) || fallback.goal,
    today_tasks: toStringArray(raw.today_tasks, 6).length ? toStringArray(raw.today_tasks, 6) : fallback.today_tasks,
    post_ideas: ideas.length ? ideas : fallback.post_ideas,
    dm_openers: toStringArray(raw.dm_openers, 4).length ? toStringArray(raw.dm_openers, 4) : fallback.dm_openers,
    comment_replies:
      toStringArray(raw.comment_replies, 4).length ? toStringArray(raw.comment_replies, 4) : fallback.comment_replies,
    kpi: {
      uploads_target: cleanText(raw?.kpi?.uploads_target) || fallback.kpi.uploads_target,
      completion_rate_target: cleanText(raw?.kpi?.completion_rate_target) || fallback.kpi.completion_rate_target,
      lead_rate_target: cleanText(raw?.kpi?.lead_rate_target) || fallback.kpi.lead_rate_target,
    },
  }
}

export async function POST(req: NextRequest) {
  let product: ProductType = 'both'
  let channel: ChannelType = 'xiaohongshu'
  let vibe = '像真人在讲自己的经历，口语化，有细节，不端着'

  try {
    const limited = applyRateLimit(req, 'marketing-pack', {
      limit: Number(process.env.RL_MARKETING_PACK_LIMIT || 8),
      windowMs: Number(process.env.RL_MARKETING_PACK_WINDOW_MS || 60_000),
    })
    if (limited) return limited

    const body = await req.json().catch(() => ({}))
    product = normalizeProduct(String(body?.product || 'both'))
    channel = normalizeChannel(String(body?.channel || 'xiaohongshu'))
    vibe = cleanText(String(body?.vibe || vibe)).slice(0, 120)

    const systemPrompt = [
      '你是增长负责人，负责把AI产品推进到可执行营销阶段。',
      '请输出一个“今日营销包”，严格返回 JSON，不要任何额外说明。',
      '语言：简体中文。',
      CHANNEL_HINT[channel],
      PRODUCT_HINT[product],
      HUMAN_VIBE_RULES,
    ].join('\n')

    const userPrompt = [
      `风格偏好：${vibe}`,
      '按下面 JSON 结构输出：',
      '{',
      '  "goal": "一句话目标",',
      '  "today_tasks": ["4-6条当天可完成动作"],',
      '  "post_ideas": [',
      '    {',
      '      "title": "标题（12-20字）",',
      '      "hook": "开场钩子（必须有具体细节）",',
      '      "outline": ["要点1","要点2","要点3"],',
      '      "cta": "收口动作",',
      '      "hashtags": ["话题1","话题2","话题3"]',
      '    }',
      '  ],',
      '  "dm_openers": ["私信开场3条"],',
      '  "comment_replies": ["评论区回复3条"],',
      '  "kpi": {',
      '    "uploads_target": "数字",',
      '    "completion_rate_target": "百分比",',
      '    "lead_rate_target": "百分比"',
      '  }',
      '}',
      '硬性要求：post_ideas 生成3条；每条 hook 必须出现时间/场景/原话/动作中的至少1个。',
      '硬性要求：today_tasks 不能抽象，必须是当天可以执行的动作。',
      '硬性要求：禁止企业黑话、禁止AI腔。',
    ].join('\n')

    const routeTimeoutRaw = Number(process.env.MARKETING_PACK_TIMEOUT_MS || 12000)
    const routeTimeoutMs = Number.isFinite(routeTimeoutRaw)
      ? Math.min(Math.max(routeTimeoutRaw, 4000), 15000)
      : 12000
    const raw = await withRouteTimeout(
      chatCompletion(systemPrompt, userPrompt, {
        temperature: 0.8,
        maxTokens: 2200,
        preferFast: true,
      }),
      routeTimeoutMs,
      'marketing_pack'
    )

    const cleaned = extractJsonString(raw)
    try {
      const parsed = JSON.parse(cleaned)
      const pack = normalizePack(parsed, product, channel, vibe)
      return NextResponse.json({ ok: true, degraded: false, pack }, { headers: JSON_HEADERS })
    } catch {
      return NextResponse.json({
        ok: true,
        degraded: true,
        pack: buildFallbackPack(product, channel, vibe, 'json_parse_failed'),
        model_raw_text: cleaned,
      }, { headers: JSON_HEADERS })
    }
  } catch (err: any) {
    const reason = err?.message ? String(err.message) : '营销包生成失败'
    return NextResponse.json({
      ok: true,
      degraded: true,
      pack: buildFallbackPack(product, channel, vibe, reason),
    }, { headers: JSON_HEADERS })
  }
}
