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
  topWords: Record<string, Record<string, number>>  // 每人高频词
  emojiCount: Record<string, Record<string, number>> // 表情统计
  lateNightRatio: Record<string, number> // 深夜消息比例(23:00-05:00)
  firstMessage: ChatMessage | null
  lastMessage: ChatMessage | null
  totalDays: number
  initiatorCount: Record<string, number> // 谁先发起聊天次数
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

  senders.forEach(s => {
    messagesBySender[s] = 0
    totalLength[s] = 0
    textCount[s] = 0
    wordFreq[s] = {}
    emojiFreq[s] = {}
    lateNightCount[s] = 0
    initiatorCount[s] = 0
  })

  // 遍历消息
  let lastDate = ''
  let lastSender = ''
  let lastTimestamp = 0

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

    lastSender = sender
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
  senders.forEach(s => { responseTime[s] = 0 })

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
    topWords,
    emojiCount: emojiFreq,
    lateNightRatio,
    firstMessage: messages[0] || null,
    lastMessage: messages[messages.length - 1] || null,
    totalDays: allDates.length,
    initiatorCount,
  }
}

