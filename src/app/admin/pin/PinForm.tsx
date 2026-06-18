'use client'

import { useState, useTransition } from 'react'
import { verifyPin, setPin } from './actions'

export function PinForm({ isFirstSetup }: { isFirstSetup: boolean }) {
  const [pin, setPin_] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isFirstSetup) {
      if (pin !== confirm) { setError('PIN-urile nu coincid.'); return }
      if (pin.length < 4) { setError('PIN-ul trebuie să aibă minim 4 caractere.'); return }
      startTransition(async () => {
        const res = await setPin(pin)
        if (res?.error) setError(res.error)
      })
    } else {
      startTransition(async () => {
        const res = await verifyPin(pin)
        if (res?.error) setError(res.error)
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          {isFirstSetup ? 'PIN nou' : 'PIN'}
        </label>
        <input
          type="password"
          value={pin}
          onChange={e => setPin_(e.target.value)}
          autoFocus
          placeholder="••••"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>

      {isFirstSetup && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Confirmă PIN</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !pin}
        className="w-full bg-violet-700 hover:bg-violet-800 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
      >
        {isPending ? 'Se verifică...' : isFirstSetup ? 'Setează PIN' : 'Intră în admin'}
      </button>
    </form>
  )
}
