'use client'

import { useState, useTransition } from 'react'
import { activateStarter, activatePro, deactivateUser } from './actions'

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

const PLAN_LABELS: Record<string, string> = {
  free_trial: 'Trial',
  starter: 'Starter',
  pro: 'Pro',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

export function AdminPanel({ users }: { users: UserRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleActivate = (userId: string, plan: 'starter' | 'pro') => {
    startTransition(async () => {
      if (plan === 'starter') await activateStarter(userId)
      else await activatePro(userId)
    })
  }

  const handleDeactivate = (userId: string) => {
    if (confirmId !== userId) { setConfirmId(userId); return }
    setConfirmId(null)
    startTransition(() => deactivateUser(userId))
  }

  return (
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
            {users.map(u => (
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
                  {u.plan === 'pro' ? '∞' : (u.schemas_remaining ?? '—')}
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
                        onClick={() => handleActivate(u.user_id, 'starter')}
                        className="text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 px-2 py-1 rounded-lg font-medium transition-colors"
                      >
                        → Starter
                      </button>
                    )}
                    {u.plan !== 'pro' && (
                      <button
                        onClick={() => handleActivate(u.user_id, 'pro')}
                        className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-lg font-medium transition-colors"
                      >
                        → Pro
                      </button>
                    )}
                    {u.status === 'active' && (
                      <button
                        onClick={() => handleDeactivate(u.user_id)}
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
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">{users.length} utilizatori total</p>
    </div>
  )
}
