'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackGrowthEvent } from '@/lib/growth'

export default function GrowthTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const source = searchParams.get('src') || searchParams.get('utm_source') || undefined
    trackGrowthEvent({
      name: 'page_view',
      page: pathname || '/',
      source,
      detail: searchParams.toString() || undefined,
    })
  }, [pathname, searchParams])

  return null
}

