'use client'
import { useEffect } from 'react'

export function TrackView({ path }: { path: string }) {
  useEffect(() => {
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }).catch(() => {})
  }, [path])
  return null
}
