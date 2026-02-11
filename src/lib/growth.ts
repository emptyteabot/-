export type GrowthEventName =
  | 'page_view'
  | 'cta_click'
  | 'analysis_start'
  | 'analysis_done'
  | 'analysis_fail'
  | 'ocr_start'
  | 'ocr_done'
  | 'ocr_fail'
  | 'upload_add'
  | 'share_click'
  | 'invite_click'
  | 'lead_submit'
  | 'lead_success'
  | 'lead_fail'

export interface GrowthEvent {
  name: GrowthEventName
  page: string
  at: number
  sessionId?: string
  source?: string
  detail?: string
}

const STORAGE_KEY = 'soul-lab-growth-events'
const SESSION_KEY = 'soul-lab-growth-session-id'

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    const exists = localStorage.getItem(SESSION_KEY)
    if (exists) return exists
    const sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(SESSION_KEY, sid)
    return sid
  } catch {
    return 'unknown'
  }
}

export function trackGrowthEvent(event: Omit<GrowthEvent, 'at'>): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: GrowthEvent[] = raw ? JSON.parse(raw) : []
    const sessionId = getSessionId()
    list.push({ ...event, sessionId, at: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-5000)))

    // If PostHog is configured, send a copy for real cross-user analytics.
    const ph = (window as any).posthog
    if (ph && typeof ph.capture === 'function') {
      ph.capture(event.name, {
        session_id: sessionId,
        page: event.page,
        source: event.source,
        detail: event.detail,
      })
    }
  } catch {
    // no-op
  }
}

export function readGrowthEvents(): GrowthEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearGrowthEvents(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op
  }
}
