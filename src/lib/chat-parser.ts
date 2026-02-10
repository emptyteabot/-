/**
 * 微信聊天记录解析器
 * 支持从微信导出的 txt/csv 格式解析聊天记录
 */

export interface ChatMessage {
  timestamp: string
  sender: string
  content: string
  type: 'text' | 'image' | 'voice' | 'video' | 'link' | 'system' | 'emoji'
}

export interface ChatStats {
  totalMessages: number
  messagesBySender: Record<string, number>
  messagesByHour: number[]        // 24小时分布
  messagesByDay: number[]         // 7天分布
  messagesByMonth: Record<string, number>
  avgMessageLength: Record<string, number>
  longestStreak: number           // 最长连续聊天天数
  responseTime: Record<string, number>  // 平均回复时间(分钟)
  responseTimeVar: Record<string, number> // 回复延迟方差(分钟^2)
  topWords: Record<string, Record<string, number>>  // 每人高频词
  emojiCount: Record<string, Record<string, number>> // 表情统计
  lateNightRatio: Record<string, number> // 深夜消息比例(23:00-05:00)
  firstMessage: ChatMessage | null
  lastMessage: ChatMessage | null
  totalDays: number
  initiatorCount: Record<string, number> // 谁先发起聊天次数
  pronounCount: Record<string, Record<string, number>> // 关键代词统计（我/我们/你...）
}

/** 解析微信聊天记录文本 */
export function parseWechatChat(text: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  const lines = text.split('\n')

  // 微信导出格式: 2024-01-15 14:30:25 昵称
  // 消息内容
  // 或: 2024-01-15 14:30:25 昵称: 消息内容
  const headerPattern = /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+(.+?)(?:\s*[:：]\s*)?$/
  const inlinePattern = /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+(.+?)[:：]\s*(.+)$/

  let currentTimestamp = ''
  let currentSender = ''
  let pendingContent: string[] = []

  function pushMessage() {
    if (currentSender && pendingContent.length > 0) {
      const content = pendingContent.join('\n').trim()
      if (content) {
        messages.push({
          timestamp: currentTimestamp,
          sender: currentSender,
          content,
          type: detectMessageType(content),
        })
      }
    }
    pendingContent = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 尝试匹配内联格式
    const inlineMatch = trimmed.match(inlinePattern)
    if (inlineMatch) {
      pushMessage()
      currentTimestamp = inlineMatch[1]
      currentSender = inlineMatch[2].trim()
      pendingContent = [inlineMatch[3]]
      continue
    }

    // 尝试匹配头部格式
    const headerMatch = trimmed.match(headerPattern)
    if (headerMatch) {
      pushMessage()
      currentTimestamp = headerMatch[1]
      currentSender = headerMatch[2].trim()
      continue
    }

    // 普通内容行
    if (currentSender) {
      pendingContent.push(trimmed)
    }
  }
  pushMessage()

  return messages
}

/** 检测消息类型 */
function detectMessageType(content: string): ChatMessage['type'] {
  if (content.includes('[图片]') || content.includes('[Image]')) return 'image'
  if (content.includes('[语音]') || content.includes('[Voice]')) return 'voice'
  if (content.includes('[视频]') || content.includes('[Video]')) return 'video'
  if (content.includes('[链接]') || content.includes('[Link]') || content.startsWith('http')) return 'link'
  if (content.includes('撤回了一条消息') || content.includes('加入了群聊')) return 'system'
  if (/^\[.+\]$/.test(content)) return 'emoji'
  return 'text'
}

/** 生成聊天统计数据 */
export function generateChatStats(messages: ChatMessage[]): ChatStats {
  const textMessages = messages.filter(m => m.type === 'text')
  const senders = Array.from(new Set(messages.map(m => m.sender)))

  // 基础统计
  const messagesBySender: Record<string, number> = {}
  const messagesByHour = new Array(24).fill(0)
  const messagesByDay = new Array(7).fill(0)
  const messagesByMonth: Record<string, number> = {}
  const totalLength: Record<string, number> = {}
  const textCount: Record<string, number> = {}
  const wordFreq: Record<string, Record<string, number>> = {}
  const emojiFreq: Record<string, Record<string, number>> = {}
  const lateNightCount: Record<string, number> = {}
  const initiatorCount: Record<string, number> = {}
  const pronounCount: Record<string, Record<string, number>> = {}

  senders.forEach(s => {
    messagesBySender[s] = 0
    totalLength[s] = 0
    textCount[s] = 0
    wordFreq[s] = {}
    emojiFreq[s] = {}
    lateNightCount[s] = 0
    initiatorCount[s] = 0
    pronounCount[s] = { '我': 0, '我们': 0, '你': 0, '你们': 0, '他': 0, '她': 0, '咱们': 0 }
  })

  // 遍历消息
  let lastDate = ''
  let prevSender = ''
  let prevTs: number | null = null
  const responseSamples: Record<string, number[]> = {}
  senders.forEach(s => { responseSamples[s] = [] })

  function parseTs(ts: string): number | null {
    // Accept: 2024-01-15 14:30:25 or 2024/1/15 14:30
    const m = ts.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (!m) return null
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    const h = Number(m[4])
    const mi = Number(m[5])
    const s = m[6] ? Number(m[6]) : 0
    const dt = new Date(y, mo - 1, d, h, mi, s)
    const t = dt.getTime()
    return Number.isFinite(t) ? t : null
  }

  for (const msg of messages) {
    const sender = msg.sender
    messagesBySender[sender] = (messagesBySender[sender] || 0) + 1

    // 时间分布
    const timeParts = msg.timestamp.match(/(\d{1,2}):(\d{2})/)
    if (timeParts) {
      const hour = parseInt(timeParts[1])
      messagesByHour[hour]++

      // 深夜消息
      if (hour >= 23 || hour < 5) {
        lateNightCount[sender] = (lateNightCount[sender] || 0) + 1
      }
    }

    // 日期分布
    const dateParts = msg.timestamp.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
    if (dateParts) {
      const date = new Date(parseInt(dateParts[1]), parseInt(dateParts[2]) - 1, parseInt(dateParts[3]))
      messagesByDay[date.getDay()]++
      const monthKey = `${dateParts[1]}-${dateParts[2].padStart(2, '0')}`
      messagesByMonth[monthKey] = (messagesByMonth[monthKey] || 0) + 1

      // 判断谁先发起聊天(同一天第一条消息)
      const dateStr = `${dateParts[1]}-${dateParts[2]}-${dateParts[3]}`
      if (dateStr !== lastDate) {
        initiatorCount[sender] = (initiatorCount[sender] || 0) + 1
        lastDate = dateStr
      }
    }

    // 文本统计
    if (msg.type === 'text') {
      totalLength[sender] = (totalLength[sender] || 0) + msg.content.length
      textCount[sender] = (textCount[sender] || 0) + 1

      // 代词统计（支持单字）
      const pc = pronounCount[sender] || (pronounCount[sender] = {})
      const keys = Object.keys(pc)
      for (const k of keys) {
        const hit = msg.content.split(k).length - 1
        if (hit > 0) pc[k] = (pc[k] || 0) + hit
      }

      // 分词统计(简单按长度>=2的连续中文)
      const words = msg.content.match(/[\u4e00-\u9fa5]{2,4}/g) || []
      words.forEach(w => {
        wordFreq[sender][w] = (wordFreq[sender][w] || 0) + 1
      })

      // 表情符号统计
      const emojiRegex = new RegExp('[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]', 'gu')
      const emojis = msg.content.match(emojiRegex) || []
      emojis.forEach(e => {
        emojiFreq[sender][e] = (emojiFreq[sender][e] || 0) + 1
      })
    }

    // 回复时间：把“当前消息的发送者”视为对上一条不同发送者消息的响应
    const curTs = parseTs(msg.timestamp)
    if (curTs !== null && prevTs !== null && prevSender && sender !== prevSender) {
      const deltaMin = (curTs - prevTs) / (1000 * 60)
      // ignore too small or too large gaps (e.g. overnight, long silence)
      if (deltaMin >= 0.1 && deltaMin <= 12 * 60) {
        responseSamples[sender].push(deltaMin)
      }
    }
    if (curTs !== null) {
      prevTs = curTs
      prevSender = sender
    }
  }

  // 平均消息长度
  const avgMessageLength: Record<string, number> = {}
  senders.forEach(s => {
    avgMessageLength[s] = textCount[s] ? Math.round(totalLength[s] / textCount[s]) : 0
  })

  // Top 词频(每人取前20)
  const topWords: Record<string, Record<string, number>> = {}
  senders.forEach(s => {
    const sorted = Object.entries(wordFreq[s])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
    topWords[s] = Object.fromEntries(sorted)
  })

  // 深夜消息比例
  const lateNightRatio: Record<string, number> = {}
  senders.forEach(s => {
    lateNightRatio[s] = messagesBySender[s] ? +(lateNightCount[s] / messagesBySender[s]).toFixed(3) : 0
  })

  // 回复时间计算(简化版)
  const responseTime: Record<string, number> = {}
  const responseTimeVar: Record<string, number> = {}
  senders.forEach(s => {
    const arr = responseSamples[s] || []
    if (arr.length === 0) {
      responseTime[s] = 0
      responseTimeVar[s] = 0
      return
    }
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const varr = arr.reduce((acc, x) => acc + (x - mean) * (x - mean), 0) / arr.length
    responseTime[s] = Math.round(mean * 10) / 10
    responseTimeVar[s] = Math.round(varr * 10) / 10
  })

  // 最长连续聊天天数
  const allDates = Array.from(new Set(messages.map(m => {
    const match = m.timestamp.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/)
    return match ? match[1].replace(/\//g, '-') : ''
  }).filter(Boolean))).sort()

  let longestStreak = 1
  let currentStreak = 1
  for (let i = 1; i < allDates.length; i++) {
    const prev = new Date(allDates[i - 1])
    const curr = new Date(allDates[i])
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return {
    totalMessages: messages.length,
    messagesBySender,
    messagesByHour,
    messagesByDay,
    messagesByMonth,
    avgMessageLength,
    longestStreak,
    responseTime,
    responseTimeVar,
    topWords,
    emojiCount: emojiFreq,
    lateNightRatio,
    firstMessage: messages[0] || null,
    lastMessage: messages[messages.length - 1] || null,
    totalDays: allDates.length,
    initiatorCount,
    pronounCount,
  }
}
