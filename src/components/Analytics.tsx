'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function Analytics() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return

    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
    posthog.init(key, {
      api_host: host,
      autocapture: true,
      capture_pageview: false, // we do page_view ourselves (GrowthTracker)
      capture_pageleave: true,
    })
  }, [])

  return null
}

