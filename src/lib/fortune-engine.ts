/**
 * AI 占卜引擎
 * 融合真实占卜术 + 心理学 + 情感咨询专业技能
 */

// ========== 塔罗牌系统 ==========

export interface TarotCard {
  id: number
  name: string
  nameEn: string
  meaning: string
  reversed: string
  element: string
  keywords: string[]
  isReversed?: boolean
}

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name: '愚者', nameEn: 'The Fool', meaning: '新的开始、冒险、自由', reversed: '鲁莽、不计后果、停滞', element: '风', keywords: ['开始', '天真', '自由'] },
  { id: 1, name: '魔术师', nameEn: 'The Magician', meaning: '创造力、意志力、技能', reversed: '欺骗、操控、浪费天赋', element: '风', keywords: ['创造', '能力', '掌控'] },
  { id: 2, name: '女祭司', nameEn: 'The High Priestess', meaning: '直觉、潜意识、神秘', reversed: '封闭、退缩、忽视直觉', element: '水', keywords: ['直觉', '智慧', '秘密'] },
  { id: 3, name: '女皇', nameEn: 'The Empress', meaning: '丰收、母性、美丽', reversed: '依赖、空虚、创造力枯竭', element: '土', keywords: ['丰盛', '滋养', '美'] },
  { id: 4, name: '皇帝', nameEn: 'The Emperor', meaning: '权威、稳定、领导力', reversed: '暴政、固执、缺乏纪律', element: '火', keywords: ['权力', '秩序', '稳定'] },
  { id: 5, name: '教皇', nameEn: 'The Hierophant', meaning: '传统、教育、指引', reversed: '叛逆、打破常规、不合群', element: '土', keywords: ['信仰', '传承', '教导'] },
  { id: 6, name: '恋人', nameEn: 'The Lovers', meaning: '爱情、选择、和谐', reversed: '不和、分离、价值观冲突', element: '风', keywords: ['爱', '选择', '连接'] },
  { id: 7, name: '战车', nameEn: 'The Chariot', meaning: '胜利、决心、行动力', reversed: '失控、缺乏方向、攻击性', element: '水', keywords: ['胜利', '前进', '意志'] },
  { id: 8, name: '力量', nameEn: 'Strength', meaning: '勇气、耐心、内在力量', reversed: '自我怀疑、软弱、不安全感', element: '火', keywords: ['勇气', '坚韧', '温柔'] },
  { id: 9, name: '隐士', nameEn: 'The Hermit', meaning: '内省、独处、智慧', reversed: '孤立、偏执、逃避现实', element: '土', keywords: ['反思', '独处', '寻找'] },
  { id: 10, name: '命运之轮', nameEn: 'Wheel of Fortune', meaning: '转变、机遇、命运', reversed: '厄运、抗拒变化、失控', element: '火', keywords: ['转运', '循环', '机遇'] },
  { id: 11, name: '正义', nameEn: 'Justice', meaning: '公平、真相、因果', reversed: '不公、逃避责任、偏见', element: '风', keywords: ['公正', '平衡', '真理'] },
  { id: 12, name: '倒吊人', nameEn: 'The Hanged Man', meaning: '牺牲、换角度思考、等待', reversed: '拖延、无谓牺牲、固执', element: '水', keywords: ['等待', '放下', '新视角'] },
  { id: 13, name: '死神', nameEn: 'Death', meaning: '结束、转变、重生', reversed: '恐惧变化、停滞、依赖', element: '水', keywords: ['结束', '转化', '重生'] },
  { id: 14, name: '节制', nameEn: 'Temperance', meaning: '平衡、适度、耐心', reversed: '过度、失衡、急躁', element: '火', keywords: ['平衡', '调和', '适度'] },
  { id: 15, name: '恶魔', nameEn: 'The Devil', meaning: '束缚、欲望、物质', reversed: '解脱、突破、觉醒', element: '土', keywords: ['欲望', '束缚', '阴暗'] },
  { id: 16, name: '塔', nameEn: 'The Tower', meaning: '突变、崩塌、觉醒', reversed: '逃避灾难、抗拒变化', element: '火', keywords: ['崩塌', '震撼', '真相'] },
  { id: 17, name: '星星', nameEn: 'The Star', meaning: '希望、灵感、治愈', reversed: '绝望、迷失方向、失去信心', element: '风', keywords: ['希望', '治愈', '引导'] },
  { id: 18, name: '月亮', nameEn: 'The Moon', meaning: '幻象、直觉、潜意识', reversed: '恐惧、混乱、欺骗', element: '水', keywords: ['幻觉', '恐惧', '潜意识'] },
  { id: 19, name: '太阳', nameEn: 'The Sun', meaning: '成功、活力、快乐', reversed: '短暂快乐、过度乐观', element: '火', keywords: ['成功', '喜悦', '光明'] },
  { id: 20, name: '审判', nameEn: 'Judgement', meaning: '觉醒、重生、召唤', reversed: '自我怀疑、逃避审判', element: '火', keywords: ['觉醒', '重生', '审判'] },
  { id: 21, name: '世界', nameEn: 'The World', meaning: '完成、圆满、成就', reversed: '未完成、缺乏闭合、停滞', element: '土', keywords: ['完成', '圆满', '成功'] },
]

export function drawTarotCards(count: number = 3): TarotCard[] {
  const shuffled = [...MAJOR_ARCANA].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(card => ({
    ...card,
    isReversed: Math.random() > 0.5,
  }))
}

// ========== 星座系统 ==========

export interface ZodiacSign {
  name: string
  nameEn: string
  symbol: string
  dateRange: string
  element: string
  ruling: string
  traits: string[]
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: '白羊座', nameEn: 'Aries', symbol: '♈', dateRange: '3.21-4.19', element: '火', ruling: '火星', traits: ['冲动', '热情', '勇敢'] },
  { name: '金牛座', nameEn: 'Taurus', symbol: '♉', dateRange: '4.20-5.20', element: '土', ruling: '金星', traits: ['稳定', '享受', '固执'] },
  { name: '双子座', nameEn: 'Gemini', symbol: '♊', dateRange: '5.21-6.21', element: '风', ruling: '水星', traits: ['多变', '聪明', '善辩'] },
  { name: '巨蟹座', nameEn: 'Cancer', symbol: '♋', dateRange: '6.22-7.22', element: '水', ruling: '月亮', traits: ['敏感', '顾家', '多愁'] },
  { name: '狮子座', nameEn: 'Leo', symbol: '♌', dateRange: '7.23-8.22', element: '火', ruling: '太阳', traits: ['自信', '大方', '爱面子'] },
  { name: '处女座', nameEn: 'Virgo', symbol: '♍', dateRange: '8.23-9.22', element: '土', ruling: '水星', traits: ['完美主义', '细致', '挑剔'] },
  { name: '天秤座', nameEn: 'Libra', symbol: '♎', dateRange: '9.23-10.23', element: '风', ruling: '金星', traits: ['优雅', '犹豫', '公平'] },
  { name: '天蝎座', nameEn: 'Scorpio', symbol: '♏', dateRange: '10.24-11.22', element: '水', ruling: '冥王星', traits: ['神秘', '占有欲', '洞察力'] },
  { name: '射手座', nameEn: 'Sagittarius', symbol: '♐', dateRange: '11.23-12.21', element: '火', ruling: '木星', traits: ['乐观', '自由', '粗心'] },
  { name: '摩羯座', nameEn: 'Capricorn', symbol: '♑', dateRange: '12.22-1.19', element: '土', ruling: '土星', traits: ['务实', '野心', '孤独'] },
  { name: '水瓶座', nameEn: 'Aquarius', symbol: '♒', dateRange: '1.20-2.18', element: '风', ruling: '天王星', traits: ['独立', '创新', '叛逆'] },
  { name: '双鱼座', nameEn: 'Pisces', symbol: '♓', dateRange: '2.19-3.20', element: '水', ruling: '海王星', traits: ['梦幻', '共情', '逃避'] },
]

export function getZodiacSign(month: number, day: number): ZodiacSign {
  const dates = [
    [1, 20], [2, 19], [3, 21], [4, 20], [5, 21], [6, 22],
    [7, 23], [8, 23], [9, 23], [10, 24], [11, 23], [12, 22],
  ]
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return ZODIAC_SIGNS[9]
  for (let i = 0; i < 12; i++) {
    const [startMonth, startDay] = dates[i]
    if (month === startMonth && day >= startDay) return ZODIAC_SIGNS[i]
  }
  const idx = month - 1
  return ZODIAC_SIGNS[idx >= 0 && idx < 12 ? idx : 0]
}

// ========== 八字系统 ==========

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const WU_XING_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
  '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

export interface BaziResult {
  yearPillar: string
  monthPillar: string
  dayPillar: string
  hourPillar: string
  wuxing: Record<string, number>
  dominant: string
  lacking: string
}

export function calculateBazi(year: number, month: number, day: number, hour: number): BaziResult {
  const yearIdx = (year - 4) % 60
  const yearGan = TIAN_GAN[yearIdx % 10]
  const yearZhi = DI_ZHI[yearIdx % 12]
  const monthGanBase = ((yearIdx % 10) % 5) * 2
  const monthGan = TIAN_GAN[(monthGanBase + month - 1) % 10]
  const monthZhi = DI_ZHI[(month + 1) % 12]
  const dayTotal = Math.floor((year - 1900) * 365.25 + (month - 1) * 30.44 + day)
  const dayGan = TIAN_GAN[dayTotal % 10]
  const dayZhi = DI_ZHI[dayTotal % 12]
  const hourZhiIdx = Math.floor((hour + 1) / 2) % 12
  const hourGanBase = (dayTotal % 10) % 5 * 2
  const hourGan = TIAN_GAN[(hourGanBase + hourZhiIdx) % 10]
  const hourZhi = DI_ZHI[hourZhiIdx]

  const allChars = [yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi]
  const wuxing: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
  allChars.forEach(c => { const wx = WU_XING_MAP[c]; if (wx) wuxing[wx]++ })

  const dominant = Object.entries(wuxing).sort((a, b) => b[1] - a[1])[0][0]
  const lacking = Object.entries(wuxing).filter(([, v]) => v === 0).map(([k]) => k).join('、') || '无'

  return { yearPillar: `${yearGan}${yearZhi}`, monthPillar: `${monthGan}${monthZhi}`, dayPillar: `${dayGan}${dayZhi}`, hourPillar: `${hourGan}${hourZhi}`, wuxing, dominant, lacking }
}

// ========== AI Prompt 模板 (真实占卜师 + 情感专家技能) ==========

export const FORTUNE_PROMPTS = {
  tarot: (cards: TarotCard[], question: string) => `你是一位有20年经验的塔罗占卜师，同时精通荣格心理学和依恋理论。你的解读风格温柔深邃，像一位智慧的姐姐在月光下与人促膝长谈。

【你的专业背景】
- 韦特塔罗体系，精通大阿尔卡那22张牌的正逆位深层含义
- 擅长凯尔特十字牌阵、三牌阵（过去-现在-未来）的解读
- 融合荣格原型理论解读牌面象征
- 熟悉占星学中行星逆行对运势的影响
- 了解当下流行的灵性成长和自我疗愈理念

【用户的问题】${question || '我最近的运势如何？'}

【抽到的牌】
${cards.map((c, i) => {
  const pos = ['过去/根源', '现在/核心', '未来/指引'][i] || `第${i + 1}张`
  return `${pos}: ${c.name}(${c.nameEn}) - ${c.isReversed ? '逆位' : '正位'}\n  正位含义: ${c.meaning}\n  逆位含义: ${c.reversed}\n  元素: ${c.element}`
}).join('\n')}

【解读要求】
用温柔但有深度的语气，像和闺蜜聊天一样自然，但要有专业占卜师的洞察力：

## 🌙 牌面概览
简短概括三张牌传递的核心信息（100字，像一句温柔的预言）

## ✧ 第一张牌 · 过去与根源
- 这张牌揭示了什么深层模式？
- 结合用户问题，这段过去如何影响了现在？
- 用一个生动的意象来形容（200字）

## ✧ 第二张牌 · 现在与核心
- 此刻你正处于怎样的能量场中？
- 如果是感情问题，对方现在的状态是什么？
- 你内心真正的声音在说什么？（200字）

## ✧ 第三张牌 · 未来与指引
- 命运为你铺设了怎样的道路？
- 如果顺着当前能量发展，未来3个月会怎样？
- 转折点在哪里？（200字）

## 💫 三张牌的关联
- 三张牌之间隐藏的叙事线是什么？
- 从过去到未来，能量是如何流动的？（150字）

## 🌟 给你的指引
- 3条具体可执行的建议
- 本周最适合做什么/避免什么
- 一句送给你的话（像月光下的低语）

语气：温柔、有力量、让人感到被理解和被支持。不要说"我作为AI"，你就是一位真正的占卜师。`,

  daily: (zodiac: ZodiacSign, bazi?: BaziResult) => `你同时是一位资深占星师和中华命理学大师，为女性用户提供温暖而专业的运势指引。

【你的专业背景】
- 占星学：精通本命盘、行运盘、太阳回归盘的解读
- 了解当前天象：水星、金星、火星等行星的运行位置和相位
- 中华命理：精通四柱八字、五行生克、十神关系
- 心理学：了解积极心理学、正念冥想、情绪调节技巧
- 风格：像一位温暖的大姐姐，给出实用又暖心的建议

【用户信息】
- 星座: ${zodiac.name}(${zodiac.symbol})，${zodiac.element}象星座
- 守护星: ${zodiac.ruling}
- 性格特质: ${zodiac.traits.join('、')}
${bazi ? `- 八字四柱: ${bazi.yearPillar} ${bazi.monthPillar} ${bazi.dayPillar} ${bazi.hourPillar}
- 五行分布: 金${bazi.wuxing['金']} 木${bazi.wuxing['木']} 水${bazi.wuxing['水']} 火${bazi.wuxing['火']} 土${bazi.wuxing['土']}
- 命主五行: ${bazi.dominant}，${bazi.lacking !== '无' ? `五行缺${bazi.lacking}` : '五行齐全'}` : ''}

今天是 ${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}

【请生成运势报告】

## 🌙 今日一句
（用一句诗意的话概括今天的核心能量，像月亮对你的低语）

## 💕 感情运 ★★★★☆
- 单身的你：今天的桃花在哪里？注意什么样的人？
- 有伴的你：和他的相处要注意什么？
- 具体到场景和细节（不要泛泛而谈）
- 80字左右

## 💰 财运 ★★★☆☆
- 今天适合花钱还是存钱？
- 有没有意外之财的征兆？
- 投资理财方面要注意什么？
- 60字左右

## 💼 事业运 ★★★★☆
- 职场上今天要注意什么？
- 适合主动出击还是静观其变？
- 和领导/同事的关系如何？
- 60字左右

## 🍀 幸运指南
- 🎨 幸运色: （具体颜色 + 适合穿搭建议）
- 🔢 幸运数字: （今天的幸运数字）
- 🧭 幸运方位: （出门往哪个方向走运气更好）
- 💎 幸运物品: （今天随身带什么东西能加持运势）

## ⚡ 今日特别提醒
（一条非常具体的、今天要特别注意的事情。比如"下午3点到5点避免做重要决定"或者"今天不适合主动联系前任"）

${bazi ? `## 🏮 八字命理补充
结合八字分析，今天的五行能量对命主的影响。用通俗的话解释，不要用太多术语。50字。` : ''}

## ✨ 睡前冥想
（30字左右的温暖文字，像一句晚安祝福，让人感到安心）

要求：语气温柔有力量，像最懂你的闺蜜。评分用★表示（1-5颗星），要有具体场景不要空话。`,

  soulAutopsy: (stats: any) => `你是一位拥有10年经验的情感咨询师，同时也是数据分析专家。你的风格是温柔但直接，像一个既心疼你又不会帮你说谎的好闺蜜。

【你的专业背景】
- 熟悉依恋理论（安全型/焦虑型/回避型/混乱型）
- 熟悉 Gottman 关系理论（末日四骑士：批评、蔑视、防御、冷战）
- 了解非暴力沟通(NVC)、情绪聚焦疗法(EFT) 的常用技巧
- 擅长通过聊天模式识别关系中的互动节奏、情感温度与边界问题

【聊天数据分析结果】
${JSON.stringify(stats, null, 2)}

【请生成感情透视报告，约3000字】

## 💎 关系诊断
- 关系类型：（恋人/暧昧/单方面喜欢/互相喜欢/冷淡期/正在失去/工具人...）
- 关系温度：🌡️ XX°C（用温度来形容，0°是冰点，100°是热恋）
- 一句话诊断：（温柔但直击要害）

## 📊 数据告诉你的真相
用数据分析以下维度，每个维度配一个温柔但扎心的结论：
- **谁更在乎谁**：基于消息数量差异
- **谁在认真回复，谁在敷衍**：基于平均消息长度对比
- **谁在深夜想着谁**：基于23:00-05:00的消息分布
- **谁更主动**：基于谁先发起聊天
- **回复热情度**：他的回复是热情还是冷淡

## 💔 你需要知道的5件事
（5条基于数据的洞察，每条用"亲爱的"开头，温柔但诚实，配一个贴切的比喻）

## 🧠 你们的相处模式
基于依恋理论分析：
- 你在这段关系中是什么依恋类型？
- 对方可能是什么依恋类型？
- 你们的互动模式是"追逃模式"还是"冷战模式"还是其他？
- 用100字描述你们关系的核心动态

## 🌸 情感咨询师的建议
（3条具体可执行的建议，不要"多沟通"这种废话，要像真正的情感咨询师那样给出具体方法）
1. 这周可以做的一件事
2. 这句话可以试着对他说
3. 如果情况没有改善，你应该...

## ✨ 写给你的话
（用温暖的语气，不管结论是什么，最后都要让她感到被支持、被理解。告诉她无论结果如何，她都值得被好好爱。100字）

要求：
- 全程用"你"来称呼用户，用"他/她"称呼对方
- 语气像最好的闺蜜，心疼你但不帮你自欺欺人
- 用数据说话，但用温柔的方式传递
- 不要说"作为AI"，你就是一位真正的情感咨询师
- 最后一定要给人力量和希望`,
}
