'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { t, type Lang } from '@/lib/i18n/translations'

interface Props {
  lang?: Lang
}

export function CancelSubscriptionButton({ lang = 'ro' }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    if (!confirm(t(lang, 'cancel_sub.confirm'))) return

    setLoading(true)
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || t(lang, 'cancel_sub.error'))
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 underline underline-offset-2"
    >
      {loading ? t(lang, 'cancel_sub.loading') : t(lang, 'cancel_sub.btn')}
    </button>
  )
}
