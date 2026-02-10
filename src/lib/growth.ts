export type GrowthEventName =
  | 'page_view'
  | 'cta_click'
  | 'analysis_start'
  | 'analysis_done'
  | 'share_click'
  | 'invite_click'

export interface GrowthEvent {
  name: GrowthEventName
  page: string
  at: number
  source?: string
  detail?: string
}

const STORAGE_KEY = 'soul-lab-growth-events'

export function trackGrowthEvent(event: Omit<GrowthEvent, 'at'>): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: GrowthEvent[] = raw ? JSON.parse(raw) : []
    list.push({ ...event, at: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-5000)))

    // If PostHog is configured, send a copy for real cross-user analytics.
    const ph = (window as any).posthog
    if (ph && typeof ph.capture === 'function') {
      ph.capture(event.name, {
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
