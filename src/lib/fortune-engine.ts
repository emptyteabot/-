/**
 * AI 占卜核心引擎
 * 提供：塔罗抽牌、星座计算、简化八字、提示词模板。
 */

export interface TarotCard {
  id: number
  name: string
  nameEn: string
  meaning: string
  reversed: string
  element: '火' | '水' | '风' | '土'
  keywords: string[]
  isReversed?: boolean
}

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name: '愚者', nameEn: 'The Fool', meaning: '新的开始、冒险、自由', reversed: '冲动、盲目、逃避责任', element: '风', keywords: ['开始', '冒险', '自由'] },
  { id: 1, name: '魔术师', nameEn: 'The Magician', meaning: '行动力、创造力、掌控力', reversed: '操控、虚张声势、资源浪费', element: '风', keywords: ['行动', '创造', '掌控'] },
  { id: 2, name: '女祭司', nameEn: 'The High Priestess', meaning: '直觉、洞察、内在智慧', reversed: '压抑、封闭、忽视直觉', element: '水', keywords: ['直觉', '洞察', '智慧'] },
  { id: 3, name: '女皇', nameEn: 'The Empress', meaning: '丰盛、滋养、稳定成长', reversed: '过度依赖、空虚、失衡', element: '土', keywords: ['丰盛', '滋养', '成长'] },
  { id: 4, name: '皇帝', nameEn: 'The Emperor', meaning: '规则、边界、责任', reversed: '控制欲强、僵化、冷硬', element: '火', keywords: ['规则', '边界', '责任'] },
  { id: 5, name: '教皇', nameEn: 'The Hierophant', meaning: '传统、学习、信念', reversed: '盲从、固化、教条', element: '土', keywords: ['传统', '学习', '信念'] },
  { id: 6, name: '恋人', nameEn: 'The Lovers', meaning: '关系、选择、价值观匹配', reversed: '摇摆、冲突、不一致', element: '风', keywords: ['关系', '选择', '匹配'] },
  { id: 7, name: '战车', nameEn: 'The Chariot', meaning: '推进、胜利、意志力', reversed: '失控、分心、方向感不足', element: '水', keywords: ['推进', '胜利', '意志'] },
  { id: 8, name: '力量', nameEn: 'Strength', meaning: '温柔的坚定、耐心、自我控制', reversed: '内耗、怯场、过度压抑', element: '火', keywords: ['坚定', '耐心', '自控'] },
  { id: 9, name: '隐士', nameEn: 'The Hermit', meaning: '独处、反思、寻找答案', reversed: '封闭、孤立、停滞', element: '土', keywords: ['独处', '反思', '答案'] },
  { id: 10, name: '命运之轮', nameEn: 'Wheel of Fortune', meaning: '转机、周期、机会', reversed: '卡顿、重复、抗拒变化', element: '火', keywords: ['转机', '周期', '机会'] },
  { id: 11, name: '正义', nameEn: 'Justice', meaning: '公平、因果、对等', reversed: '偏见、推责、不平衡', element: '风', keywords: ['公平', '因果', '对等'] },
  { id: 12, name: '倒吊人', nameEn: 'The Hanged Man', meaning: '暂停、换位思考、重新理解', reversed: '拖延、僵持、无效牺牲', element: '水', keywords: ['暂停', '换位', '理解'] },
  { id: 13, name: '死神', nameEn: 'Death', meaning: '结束旧阶段、重启、蜕变', reversed: '不愿放手、反复拉扯', element: '水', keywords: ['结束', '重启', '蜕变'] },
  { id: 14, name: '节制', nameEn: 'Temperance', meaning: '平衡、协调、修复', reversed: '极端、失衡、急躁', element: '火', keywords: ['平衡', '协调', '修复'] },
  { id: 15, name: '恶魔', nameEn: 'The Devil', meaning: '执念、上瘾、情绪束缚', reversed: '觉察、松绑、脱离控制', element: '土', keywords: ['执念', '束缚', '觉察'] },
  { id: 16, name: '高塔', nameEn: 'The Tower', meaning: '真相暴露、突然变化、结构重组', reversed: '拖延崩塌、假性稳定', element: '火', keywords: ['真相', '变化', '重组'] },
  { id: 17, name: '星星', nameEn: 'The Star', meaning: '希望、疗愈、愿景', reversed: '失望、信心不足、迷茫', element: '风', keywords: ['希望', '疗愈', '愿景'] },
  { id: 18, name: '月亮', nameEn: 'The Moon', meaning: '潜意识、情绪波动、隐秘信息', reversed: '误判、焦虑放大、幻象', element: '水', keywords: ['潜意识', '波动', '隐秘'] },
  { id: 19, name: '太阳', nameEn: 'The Sun', meaning: '清晰、热情、正向结果', reversed: '短期开心、后劲不足', element: '火', keywords: ['清晰', '热情', '成果'] },
  { id: 20, name: '审判', nameEn: 'Judgement', meaning: '复盘、觉醒、升级', reversed: '否认问题、错过重启', element: '火', keywords: ['复盘', '觉醒', '升级'] },
  { id: 21, name: '世界', nameEn: 'The World', meaning: '完成、整合、阶段闭环', reversed: '临门一脚不足、收尾拖延', element: '土', keywords: ['完成', '整合', '闭环'] },
]

export function drawTarotCards(count = 3): TarotCard[] {
  const n = Math.max(1, Math.min(7, Math.floor(count)))
  const shuffled = [...MAJOR_ARCANA].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n).map((card) => ({
    ...card,
    isReversed: Math.random() > 0.5,
  }))
}

export interface ZodiacSign {
  name: string
  nameEn: string
  symbol: string
  dateRange: string
  element: '火' | '水' | '风' | '土'
  ruling: string
  traits: string[]
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: '白羊座', nameEn: 'Aries', symbol: '♈', dateRange: '3.21-4.19', element: '火', ruling: '火星', traits: ['直接', '行动快', '好胜'] },
  { name: '金牛座', nameEn: 'Taurus', symbol: '♉', dateRange: '4.20-5.20', element: '土', ruling: '金星', traits: ['稳定', '重感受', '慢热'] },
  { name: '双子座', nameEn: 'Gemini', symbol: '♊', dateRange: '5.21-6.21', element: '风', ruling: '水星', traits: ['机灵', '表达强', '变化快'] },
  { name: '巨蟹座', nameEn: 'Cancer', symbol: '♋', dateRange: '6.22-7.22', element: '水', ruling: '月亮', traits: ['敏感', '顾家', '保护欲'] },
  { name: '狮子座', nameEn: 'Leo', symbol: '♌', dateRange: '7.23-8.22', element: '火', ruling: '太阳', traits: ['自信', '热情', '需要被看见'] },
  { name: '处女座', nameEn: 'Virgo', symbol: '♍', dateRange: '8.23-9.22', element: '土', ruling: '水星', traits: ['细致', '谨慎', '高标准'] },
  { name: '天秤座', nameEn: 'Libra', symbol: '♎', dateRange: '9.23-10.23', element: '风', ruling: '金星', traits: ['平衡', '审美强', '怕冲突'] },
  { name: '天蝎座', nameEn: 'Scorpio', symbol: '♏', dateRange: '10.24-11.22', element: '水', ruling: '冥王星', traits: ['深情', '敏锐', '占有欲'] },
  { name: '射手座', nameEn: 'Sagittarius', symbol: '♐', dateRange: '11.23-12.21', element: '火', ruling: '木星', traits: ['乐观', '自由', '直率'] },
  { name: '摩羯座', nameEn: 'Capricorn', symbol: '♑', dateRange: '12.22-1.19', element: '土', ruling: '土星', traits: ['务实', '耐力强', '有目标'] },
  { name: '水瓶座', nameEn: 'Aquarius', symbol: '♒', dateRange: '1.20-2.18', element: '风', ruling: '天王星', traits: ['独立', '创新', '反常规'] },
  { name: '双鱼座', nameEn: 'Pisces', symbol: '♓', dateRange: '2.19-3.20', element: '水', ruling: '海王星', traits: ['共情强', '浪漫', '想象力强'] },
]

export function getZodiacSign(month: number, day: number): ZodiacSign {
  const m = Number(month)
  const d = Number(day)
  const signs = [
    { m: 1, d: 20, i: 10 },
    { m: 2, d: 19, i: 11 },
    { m: 3, d: 21, i: 0 },
    { m: 4, d: 20, i: 1 },
    { m: 5, d: 21, i: 2 },
    { m: 6, d: 22, i: 3 },
    { m: 7, d: 23, i: 4 },
    { m: 8, d: 23, i: 5 },
    { m: 9, d: 23, i: 6 },
    { m: 10, d: 24, i: 7 },
    { m: 11, d: 23, i: 8 },
    { m: 12, d: 22, i: 9 },
  ]

  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return ZODIAC_SIGNS[9]

  for (let i = 0; i < signs.length; i++) {
    const s = signs[i]
    if (m === s.m && d >= s.d) return ZODIAC_SIGNS[s.i]
  }

  const idx = Math.max(0, Math.min(11, m - 2))
  return ZODIAC_SIGNS[idx]
}

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const WU_XING_MAP: Record<string, '金' | '木' | '水' | '火' | '土'> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
}

export interface BaziResult {
  yearPillar: string
  monthPillar: string
  dayPillar: string
  hourPillar: string
  wuxing: Record<'金' | '木' | '水' | '火' | '土', number>
  dominant: '金' | '木' | '水' | '火' | '土'
  lacking: Array<'金' | '木' | '水' | '火' | '土'>
}

export function calculateBazi(year: number, month: number, day: number, hour: number): BaziResult {
  const yearIdx = (year - 4 + 6000) % 60
  const yearGan = TIAN_GAN[yearIdx % 10]
  const yearZhi = DI_ZHI[yearIdx % 12]

  const monthGanBase = ((yearIdx % 10) % 5) * 2
  const monthGan = TIAN_GAN[(monthGanBase + month - 1) % 10]
  const monthZhi = DI_ZHI[(month + 1) % 12]

  const daySerial = Math.floor((year - 1900) * 365.2422 + (month - 1) * 30.44 + day)
  const dayGan = TIAN_GAN[((daySerial % 10) + 10) % 10]
  const dayZhi = DI_ZHI[((daySerial % 12) + 12) % 12]

  const hourZhiIdx = Math.floor(((hour % 24) + 1) / 2) % 12
  const hourGanBase = ((daySerial % 10) % 5) * 2
  const hourGan = TIAN_GAN[(hourGanBase + hourZhiIdx) % 10]
  const hourZhi = DI_ZHI[hourZhiIdx]

  const allChars = [yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi]
  const wuxing: Record<'金' | '木' | '水' | '火' | '土', number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }

  for (const c of allChars) {
    const wx = WU_XING_MAP[c]
    if (wx) wuxing[wx] += 1
  }

  const dominant = (Object.entries(wuxing).sort((a, b) => b[1] - a[1])[0]?.[0] || '土') as BaziResult['dominant']
  const lacking = (Object.entries(wuxing)
    .filter(([, v]) => v === 0)
    .map(([k]) => k) as BaziResult['lacking'])

  return {
    yearPillar: `${yearGan}${yearZhi}`,
    monthPillar: `${monthGan}${monthZhi}`,
    dayPillar: `${dayGan}${dayZhi}`,
    hourPillar: `${hourGan}${hourZhi}`,
    wuxing,
    dominant,
    lacking,
  }
}

export const FORTUNE_PROMPTS = {
  tarot: (cards: TarotCard[], question: string) => {
    const cardDesc = cards
      .map((c, i) => `${i + 1}. ${c.name}(${c.nameEn}) ${c.isReversed ? '逆位' : '正位'}｜正位:${c.meaning}｜逆位:${c.reversed}`)
      .join('\n')

    return [
      '你是温和、直接、具备咨询经验的塔罗解读师。',
      '请用中文输出结构化解读，不要玄而又玄，不要恐吓。',
      '必须包含：',
      '## 总体判断',
      '## 三张牌逐张解读',
      '## 风险提醒',
      '## 未来7天行动建议（3条）',
      `用户问题：${question || '我最近的整体运势如何？'}`,
      `抽到的牌：\n${cardDesc}`,
    ].join('\n')
  },

  daily: (zodiac: ZodiacSign, bazi?: BaziResult) => {
    const baziInfo = bazi
      ? `\n八字：${bazi.yearPillar} ${bazi.monthPillar} ${bazi.dayPillar} ${bazi.hourPillar}；五行分布=${JSON.stringify(bazi.wuxing)}`
      : ''

    return [
      '你是兼具占星和命理知识的中文运势顾问。',
      '请输出具体、可执行、不过度承诺的建议。',
      '必须包含：感情、事业、财运、今日提醒、3条行动建议。',
      `用户星座：${zodiac.name} ${zodiac.symbol}（${zodiac.dateRange}）`,
      `星座特质：${zodiac.traits.join('、')}`,
      `日期：${new Date().toLocaleDateString('zh-CN')}`,
      baziInfo,
    ].join('\n')
  },
}
