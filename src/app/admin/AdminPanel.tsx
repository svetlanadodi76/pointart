'use client'

import { useState, useTransition } from 'react'
import { activateStarter, activatePro, activatePremium, deactivateUser } from './actions'

interface UserRow {
  user_id: string
  email: string
  plan: string
  status: string
  schemas_remaining: number | null
  trial_ends_at: string | null
  current_period_end: string | null
  created_at: string
}

interface PaymentModal {
  userId: string
  userEmail: string
  plan: 'starter' | 'pro' | 'premium'
}

const PLAN_LABELS: Record<string, string> = {
  free_trial: 'Trial',
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium AI',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

export function AdminPanel({ users }: { users: UserRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<PaymentModal | null>(null)
  const [currency, setCurrency] = useState<'EUR' | 'MDL'>('EUR')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const openModal = (userId: string, userEmail: string, plan: 'starter' | 'pro' | 'premium') => {
    setModal({ userId, userEmail, plan })
    setCurrency('EUR')
    setAmount(plan === 'starter' ? '5' : plan === 'pro' ? '10' : '25')
    setNote('')
  }

  const closeModal = () => {
    setModal(null)
    setAmount('')
    setNote('')
  }

  const handleActivate = () => {
    if (!modal) return
    const val = amount ? parseFloat(amount) : undefined
    const eur = currency === 'EUR' ? val : undefined
    const mdl = currency === 'MDL' ? val : undefined
    startTransition(async () => {
      if (modal.plan === 'starter') {
        await activateStarter(modal.userId, modal.userEmail, eur, mdl, note || undefined)
      } else if (modal.plan === 'pro') {
        await activatePro(modal.userId, modal.userEmail, eur, mdl, note || undefined)
      } else {
        await activatePremium(modal.userId, modal.userEmail, eur, mdl, note || undefined)
      }
      closeModal()
    })
  }

  const handleDeactivate = (userId: string, userEmail: string) => {
    if (confirmId !== userId) { setConfirmId(userId); return }
    setConfirmId(null)
    startTransition(() => deactivateUser(userId, userEmail))
  }

  return (
    <>
      {/* Căutare */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Caută după email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>

      <div className={`transition-opacity ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Plan</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Scheme rămase</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Expiră</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(u => (
                <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-medium">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-violet-700">{PLAN_LABELS[u.plan] ?? u.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.plan === 'pro' || u.plan === 'premium' ? '∞' : (u.schemas_remaining ?? '—')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.current_period_end
                      ? new Date(u.current_period_end).toLocaleDateString('ro-RO')
                      : u.trial_ends_at
                      ? `Trial: ${new Date(u.trial_ends_at).toLocaleDateString('ro-RO')}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {u.plan !== 'starter' && (
                        <button
                          onClick={() => openModal(u.user_id, u.email, 'starter')}
                          className="text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 px-2 py-1 rounded-lg font-medium transition-colors"
                        >
                          → Starter
                        </button>
                      )}
                      {u.plan !== 'pro' && (
                        <button
                          onClick={() => openModal(u.user_id, u.email, 'pro')}
                          className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-lg font-medium transition-colors"
                        >
                          → Pro
                        </button>
                      )}
                      {u.plan !== 'premium' && (
                        <button
                          onClick={() => openModal(u.user_id, u.email, 'premium')}
                          className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-2 py-1 rounded-lg font-medium transition-colors"
                        >
                          → Premium AI
                        </button>
                      )}
                      {u.status !== 'expired' && (
                        <button
                          onClick={() => handleDeactivate(u.user_id, u.email)}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg transition-colors"
                        >
                          {confirmId === u.user_id ? 'Sigur?' : 'Dezactivează'}
                        </button>
                      )}
                      {confirmId === u.user_id && (
                        <button onClick={() => setConfirmId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                          Nu
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Niciun utilizator găsit
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-right">{users.length} utilizatori total</p>
      </div>

      {/* Modal activare + încasare */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Activare {modal.plan === 'starter' ? 'Starter' : modal.plan === 'pro' ? 'Pro' : 'Premium AI'}
            </h2>
            <p className="text-sm text-gray-500 mb-5">{modal.userEmail}</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Valuta primită</label>
                <div className="flex gap-2">
                  {(['EUR', 'MDL'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCurrency(c)
                        setAmount(modal
                          ? c === 'EUR'
                            ? (modal.plan === 'starter' ? '5' : modal.plan === 'pro' ? '10' : '25')
                            : (modal.plan === 'starter' ? '99' : modal.plan === 'pro' ? '199' : '499')
                          : '')
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        currency === c
                          ? 'bg-violet-700 text-white border-violet-700'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Suma {currency}</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder={currency === 'EUR' ? (modal.plan === 'starter' ? '5' : modal.plan === 'pro' ? '10' : '25') : (modal.plan === 'starter' ? '99' : modal.plan === 'pro' ? '199' : '499')}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Notă (opțional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="ex: transfer 14.06.2026"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={handleActivate}
                disabled={isPending}
                className="flex-1 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                Activează
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
