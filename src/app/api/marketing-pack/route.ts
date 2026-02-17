import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/ai'
import { applyRateLimit } from '@/lib/rate-limit'

type ProductType = 'soul' | 'fortune' | 'both'
type ChannelType = 'xiaohongshu' | 'douyin' | 'wechat'

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
  try {
    const limited = applyRateLimit(req, 'marketing-pack', {
      limit: Number(process.env.RL_MARKETING_PACK_LIMIT || 8),
      windowMs: Number(process.env.RL_MARKETING_PACK_WINDOW_MS || 60_000),
    })
    if (limited) return limited

    const body = await req.json().catch(() => ({}))
    const product = normalizeProduct(String(body?.product || 'both'))
    const channel = normalizeChannel(String(body?.channel || 'xiaohongshu'))
    const vibe = String(body?.vibe || '高转化、克制、直接').slice(0, 120)

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
      return NextResponse.json({ ok: true, pack: parsed })
    } catch {
      // Fallback: still return the raw content so frontend can display.
      return NextResponse.json({
        ok: true,
        pack: {
          goal: '今日营销包',
          today_tasks: ['请先人工检查模型输出格式'],
          post_ideas: [],
          dm_openers: [],
          comment_replies: [],
          kpi: {
            uploads_target: '300',
            completion_rate_target: '70%',
            lead_rate_target: '8%',
          },
          raw_text: cleaned,
        },
      })
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || '营销包生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

