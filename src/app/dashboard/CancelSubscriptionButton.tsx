'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CancelSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    if (!confirm(
      'Ești sigur că vrei să anulezi abonamentul?\n\n' +
      'Vei păstra accesul până la sfârșitul perioadei plătite. ' +
      'După expirare, generarea de scheme noi va fi blocată până la achiziția unui nou abonament.'
    )) return

    setLoading(true)
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Eroare la anulare. Încearcă din nou.')
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
      {loading ? 'Se anulează...' : 'Anulează abonamentul'}
    </button>
  )
}
