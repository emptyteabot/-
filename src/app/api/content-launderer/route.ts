import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/ai'
import { growthModeEnabled, isPaid } from '@/lib/paywall'

/**
 * 爆文洗稿机 API
 * 功能: 将爆款内容改写为新文案，用于给项目1和项目2引流
 */

const REWRITE_PROMPT = `你是一个顶级自媒体文案高手，擅长改写爆款内容。你的改写原则是:
1. 保留原文的核心信息和情绪钩子
2. 完全换一种表达方式，避免查重
3. 语言要更接地气、更有网感
4. 适当增加"金句"和"扎心文案"
5. 保持与原文相同的篇幅
6. 自然植入推广内容（如有要求）

你精通各种平台的文案风格:
- 小红书: 标题要有emoji，要夸张，内容分段短，多用「」强调
- 抖音/视频脚本: 开头3秒设悬念，节奏快，口语化
- 公众号: 故事化叙事，层层递进，结尾升华
- 微博: 精炼犀利，话题性强`

const STYLE_PROMPTS: Record<string, string> = {
  xiaohongshu: `请按小红书爆款风格改写:
- 标题格式: emoji + 吸睛标题 + emoji (至少3个emoji)
- 正文第一行: 姐妹们！/ 天呐！/ 绝了！等感叹词开头
- 分段要短(每段1-3句)
- 多用「」括号强调关键词
- 结尾加话题标签 #
- 控制在300-500字`,

  douyin: `请按抖音短视频脚本风格改写:
- 开头(3秒): 设置悬念/冲突，必须让人想看下去
- 中间: 层层递进，每15秒一个信息点
- 结尾: 反转或金句，引发评论互动
- 格式: 用 【画面】 和 【旁白】 标注
- 总时长: 控制在60秒以内的旁白量`,

  wechat: `请按微信公众号爆文风格改写:
- 标题: 15字以内，制造好奇心/焦虑感
- 开头: 讲一个具体的故事或场景
- 中间: 3-5个小标题，每段300-500字
- 结尾: 升华主题 + CTA(引导关注/转发)
- 总字数: 1500-2000字`,

  weibo: `请按微博热搜风格改写:
- 控制在140字以内
- 要有话题性，能引发讨论
- 犀利直接，观点鲜明
- 结尾带2-3个话题标签 #xxx#`,
}

const TRAFFIC_TEMPLATES: Record<string, string> = {
  soul: `在文中自然植入以下推广信息(不要生硬):
「灵魂实验室」—— 上传微信聊天记录，AI帮你解剖关系真相。
链接引导语: "去搜「灵魂实验室」测一测，我直接被骂哭了"
推广要融入内容，像是作者的真实体验分享。`,

  fortune: `在文中自然植入以下推广信息(不要生硬):
「AI玄学算命」—— 塔罗牌×八字×星座，AI帮你算出路。
链接引导语: "我昨天用这个AI算命算了一卦，准得我毛骨悚然"
推广要融入内容，像是作者的亲身经历分享。`,

  both: `在文中自然植入两个产品的推广:
1.「灵魂实验室」—— 上传微信聊天记录，AI解剖关系真相。引导语:"我拿聊天记录测了一下，直接破防"
2.「AI玄学算命」—— 塔罗牌×八字命理。引导语:"算完命运发现，果然和数据分析结果对上了"
两者要形成逻辑链: 先用数据看清现实，再用玄学指引方向。`,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      type,        // 'rewrite' | 'generate' | 'batch-titles'
      content,     // 原始内容
      platform,    // 'xiaohongshu' | 'douyin' | 'wechat' | 'weibo'
      promoTarget, // 'soul' | 'fortune' | 'both' | 'none'
      topic,       // 用于生成时的主题
    } = body

    // Paywall: allow free title ideas, but require unlock for heavy generations (unless growth mode is enabled).
    const paid = growthModeEnabled() || (await isPaid('launderer'))
    if (!paid && (type === 'rewrite' || type === 'generate')) {
      return NextResponse.json(
        { error: '该功能需要解锁后使用', pay: { product: 'launderer' } },
        { status: 402 }
      )
    }

    if (type === 'rewrite') {
      if (!content) {
        return NextResponse.json({ error: '请输入要改写的内容' }, { status: 400 })
      }

      const stylePrompt = STYLE_PROMPTS[platform] || STYLE_PROMPTS.xiaohongshu
      const trafficPrompt = promoTarget && promoTarget !== 'none'
        ? TRAFFIC_TEMPLATES[promoTarget]
        : '不需要植入任何推广内容。'

      const result = await chatCompletion(
        REWRITE_PROMPT,
        `请改写以下内容:\n\n${content}\n\n${stylePrompt}\n\n推广要求:\n${trafficPrompt}`,
        { temperature: 0.9, maxTokens: 3000 }
      )

      return NextResponse.json({ result })
    }

    if (type === 'generate') {
      if (!topic) {
        return NextResponse.json({ error: '请输入创作主题' }, { status: 400 })
      }

      const stylePrompt = STYLE_PROMPTS[platform] || STYLE_PROMPTS.xiaohongshu
      const trafficPrompt = promoTarget && promoTarget !== 'none'
        ? TRAFFIC_TEMPLATES[promoTarget]
        : '不需要植入任何推广内容。'

      const result = await chatCompletion(
        REWRITE_PROMPT,
        `请围绕以下主题创作全新的爆款内容:\n\n主题: ${topic}\n\n${stylePrompt}\n\n推广要求:\n${trafficPrompt}`,
        { temperature: 0.95, maxTokens: 3000 }
      )

      return NextResponse.json({ result })
    }

    if (type === 'batch-titles') {
      if (!topic) {
        return NextResponse.json({ error: '请输入主题' }, { status: 400 })
      }

      const result = await chatCompletion(
        `你是一个研究过10万+爆款标题的自媒体专家。你深谙人性弱点: 好奇心、恐惧、贪婪、虚荣、焦虑。`,
        `请为以下主题生成 10 个${platform === 'xiaohongshu' ? '小红书' : platform === 'douyin' ? '抖音' : platform === 'wechat' ? '公众号' : '微博'}爆款标题:

主题: ${topic}

要求:
1. 每个标题用不同的钩子策略(悬念/数字/对比/反常识/情绪/蹭热点)
2. 标题要让人有点击冲动
3. ${platform === 'xiaohongshu' ? '加emoji，20字以内' : '15字以内，制造好奇心'}
4. 输出格式: 每行一个标题，前面标上序号`,
        { temperature: 1.0, maxTokens: 1500 }
      )

      return NextResponse.json({ result })
    }

    return NextResponse.json({ error: '未知的操作类型' }, { status: 400 })
  } catch (err: any) {
    console.error('Content Launderer Error:', err)
    return NextResponse.json(
      { error: err.message || '内容生成失败' },
      { status: 500 }
    )
  }
}



