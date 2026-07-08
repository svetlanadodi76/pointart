'use client'

import { useState } from 'react'
import Image from 'next/image'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — 5€ / 99 MDL',
  pro: 'Pro — 10€ / 199 MDL / lună',
  premium: 'Premium AI — 25€ / 499 MDL / lună',
}

export function ConfirmForm({ email, planId, planName }: { email: string; planId: string; planName: string }) {
  const [txNumber, setTxNumber] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!txNumber.trim()) { setError('Introdu numărul tranzacției.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, planId, planName, transactionNumber: txNumber.trim(), transactionDate: txDate }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      setError('A apărut o eroare. Încearcă din nou sau contactează contact@pointart.art')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Confirmare trimisă!</h2>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Am primit confirmarea plății. Abonamentul va fi activat în maxim 24 de ore.
          Vei primi un email de confirmare.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
        <input
          type="text"
          value={PLAN_LABELS[planId] ?? planName}
          readOnly
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Număr tranzacție <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={txNumber}
          onChange={e => setTxNumber(e.target.value)}
          placeholder="ex. 123456789"
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <p className="text-xs text-gray-400 mt-1">Numărul din extrasul de cont / confirmarea băncii</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data transferului <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={txDate}
          onChange={e => setTxDate(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-700 text-white rounded-xl py-3 font-semibold text-sm hover:bg-violet-800 transition-colors disabled:opacity-60"
      >
        {loading ? 'Se trimite...' : 'Confirmă plata →'}
      </button>
    </form>
  )
}
