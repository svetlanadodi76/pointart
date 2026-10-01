'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { t, type Lang } from '@/lib/i18n/translations'

export function ReactivateButton({ lang = 'ro' }: { lang?: Lang }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleReactivate() {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/reactivate', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Eroare la reactivare')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleReactivate}
      disabled={loading}
      className="text-sm bg-violet-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-40"
    >
      {loading ? '...' : t(lang, 'banner.reactivate')}
    </button>
  )
}
