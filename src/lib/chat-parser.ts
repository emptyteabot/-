/**
 * 微信聊天记录解析器
 * 支持导出文本及 OCR 文本的兜底解析。
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
  messagesByHour: number[]
  messagesByDay: number[]
  messagesByMonth: Record<string, number>
  avgMessageLength: Record<string, number>
  longestStreak: number
  responseTime: Record<string, number>
  responseTimeVar: Record<string, number>
  topWords: Record<string, Record<string, number>>
  emojiCount: Record<string, Record<string, number>>
  lateNightRatio: Record<string, number>
  firstMessage: ChatMessage | null
  lastMessage: ChatMessage | null
  totalDays: number
  initiatorCount: Record<string, number>
  pronounCount: Record<string, Record<string, number>>
}

/** 解析微信聊天记录文本 */
export function parseWechatChat(text: string): ChatMessage[] {
  const normalized = String(text || '').replace(/\r/g, '')
  const lines = normalized.split('\n')
  const messages: ChatMessage[] = []

  const headerPattern = /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+(.+?)\s*$/
  const inlinePattern = /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+(.+?)\s*[:：]\s*(.+)$/

  let currentTimestamp = ''
  let currentSender = ''
  let pendingContent: string[] = []

  function pushMessage() {
    if (!currentSender || pendingContent.length === 0) {
      pendingContent = []
      return
    }

    const content = pendingContent.join('\n').trim()
    if (!content) {
      pendingContent = []
      return
    }

    messages.push({
      timestamp: currentTimestamp,
      sender: currentSender,
      content,
      type: detectMessageType(content),
    })

    pendingContent = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const inlineMatch = trimmed.match(inlinePattern)
    if (inlineMatch) {
      pushMessage()
      currentTimestamp = inlineMatch[1]
      currentSender = inlineMatch[2].trim()
      pendingContent = [inlineMatch[3].trim()]
      continue
    }

    const headerMatch = trimmed.match(headerPattern)
    if (headerMatch) {
      pushMessage()
      currentTimestamp = headerMatch[1]
      currentSender = headerMatch[2].trim()
      continue
    }

    if (currentSender) {
      pendingContent.push(trimmed)
    }
  }

  pushMessage()

  if (messages.length === 0) {
    return parseUnstructuredChatFallback(normalized)
  }

  return messages
}

function parseUnstructuredChatFallback(text: string): ChatMessage[] {
  const raw = String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const lines = raw.filter((l) => {
    if (/^(微信|聊天信息|返回|更多|发送|按住说话|输入消息|语音输入|拍摄|相册)$/i.test(l)) return false
    if (/^[\[\(]?(昨天|今天|前天|星期[一二三四五六日天]|周[一二三四五六日天])[\]\)]?$/i.test(l)) return false
    return true
  })

  const messages: ChatMessage[] = []
  const base = new Date()
  base.setHours(12, 0, 0, 0)
  const baseDate = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`
  let nextIsMe = false
  let currentTime: string | null = null

  for (const line of lines) {
    if (!line) continue
    const timeOnly = line.match(/^(\d{1,2}):(\d{2})$/)
    if (timeOnly) {
      currentTime = `${timeOnly[1].padStart(2, '0')}:${timeOnly[2]}`
      continue
    }

    let sender = nextIsMe ? '我' : '对方'
    let content = line

    const meMatch = line.match(/^(我|me|Me|ME|自己|本人)\s*[:：]\s*(.+)$/i)
    const otherMatch = line.match(/^(对方|ta|TA|Ta|他|她|好友|朋友)\s*[:：]\s*(.+)$/i)
    const nameMatch = line.match(/^([\u4e00-\u9fa5A-Za-z0-9_]{1,12})\s*[:：]\s*(.+)$/)

    if (meMatch) {
      sender = '我'
      content = meMatch[2].trim()
    } else if (otherMatch) {
      sender = '对方'
      content = otherMatch[2].trim()
    } else if (nameMatch) {
      sender = nameMatch[1].trim()
      content = nameMatch[2].trim()
    }

    if (!content) continue

    // If no reliable per-message timestamp exists (common in OCR output),
    // do NOT fabricate reply delays; keep date-only or use the nearest visible time marker.
    const timestamp = currentTime ? `${baseDate} ${currentTime}:00` : baseDate

    messages.push({
      timestamp,
      sender,
      content,
      type: detectMessageType(content),
    })

    nextIsMe = !nextIsMe
  }

  return messages
}

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
  const senders = Array.from(new Set(messages.map((m) => m.sender)))

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

  senders.forEach((s) => {
    messagesBySender[s] = 0
    totalLength[s] = 0
    textCount[s] = 0
    wordFreq[s] = {}
    emojiFreq[s] = {}
    lateNightCount[s] = 0
    initiatorCount[s] = 0
    pronounCount[s] = { 我: 0, 我们: 0, 你: 0, 你们: 0, 他: 0, 她: 0, 咱们: 0 }
  })

  let lastDate = ''
  let prevSender = ''
  let prevTs: number | null = null
  const responseSamples: Record<string, number[]> = {}
  senders.forEach((s) => {
    responseSamples[s] = []
  })

  function parseTs(ts: string): number | null {
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

    const timeParts = msg.timestamp.match(/(\d{1,2}):(\d{2})/)
    if (timeParts) {
      const hour = parseInt(timeParts[1], 10)
      if (hour >= 0 && hour <= 23) {
        messagesByHour[hour] += 1
        if (hour >= 23 || hour < 5) {
          lateNightCount[sender] = (lateNightCount[sender] || 0) + 1
        }
      }
    }

    const dateParts = msg.timestamp.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
    if (dateParts) {
      const date = new Date(parseInt(dateParts[1], 10), parseInt(dateParts[2], 10) - 1, parseInt(dateParts[3], 10))
      messagesByDay[date.getDay()] += 1

      const monthKey = `${dateParts[1]}-${dateParts[2].padStart(2, '0')}`
      messagesByMonth[monthKey] = (messagesByMonth[monthKey] || 0) + 1

      const dateStr = `${dateParts[1]}-${dateParts[2]}-${dateParts[3]}`
      if (dateStr !== lastDate) {
        initiatorCount[sender] = (initiatorCount[sender] || 0) + 1
        lastDate = dateStr
      }
    }

    if (msg.type === 'text') {
      totalLength[sender] = (totalLength[sender] || 0) + msg.content.length
      textCount[sender] = (textCount[sender] || 0) + 1

      const pc = pronounCount[sender] || (pronounCount[sender] = {})
      for (const k of Object.keys(pc)) {
        const hit = msg.content.split(k).length - 1
        if (hit > 0) pc[k] = (pc[k] || 0) + hit
      }

      const words = msg.content.match(/[\u4e00-\u9fa5]{2,4}/g) || []
      words.forEach((w) => {
        wordFreq[sender][w] = (wordFreq[sender][w] || 0) + 1
      })

      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu
      const emojis = msg.content.match(emojiRegex) || []
      emojis.forEach((e) => {
        emojiFreq[sender][e] = (emojiFreq[sender][e] || 0) + 1
      })
    }

    const curTs = parseTs(msg.timestamp)
    if (curTs !== null && prevTs !== null && prevSender && sender !== prevSender) {
      const deltaMin = (curTs - prevTs) / (1000 * 60)
      if (deltaMin >= 0.1 && deltaMin <= 12 * 60) {
        responseSamples[sender].push(deltaMin)
      }
    }

    if (curTs !== null) {
      prevTs = curTs
      prevSender = sender
    }
  }

  const avgMessageLength: Record<string, number> = {}
  senders.forEach((s) => {
    avgMessageLength[s] = textCount[s] ? Math.round(totalLength[s] / textCount[s]) : 0
  })

  const topWords: Record<string, Record<string, number>> = {}
  senders.forEach((s) => {
    const sorted = Object.entries(wordFreq[s])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
    topWords[s] = Object.fromEntries(sorted)
  })

  const lateNightRatio: Record<string, number> = {}
  senders.forEach((s) => {
    lateNightRatio[s] = messagesBySender[s] ? +(lateNightCount[s] / messagesBySender[s]).toFixed(3) : 0
  })

  const responseTime: Record<string, number> = {}
  const responseTimeVar: Record<string, number> = {}
  senders.forEach((s) => {
    const arr = responseSamples[s] || []
    if (arr.length === 0) {
      responseTime[s] = 0
      responseTimeVar[s] = 0
      return
    }
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const variance = arr.reduce((acc, x) => acc + (x - mean) * (x - mean), 0) / arr.length
    responseTime[s] = Math.round(mean * 10) / 10
    responseTimeVar[s] = Math.round(variance * 10) / 10
  })

  const allDates = Array.from(
    new Set(
      messages
        .map((m) => {
          const match = m.timestamp.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/)
          return match ? match[1].replace(/\//g, '-') : ''
        })
        .filter(Boolean)
    )
  ).sort()

  let longestStreak = allDates.length > 0 ? 1 : 0
  let currentStreak = allDates.length > 0 ? 1 : 0

  for (let i = 1; i < allDates.length; i++) {
    const prev = new Date(allDates[i - 1])
    const curr = new Date(allDates[i])
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) {
      currentStreak += 1
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
