'use client'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium AI',
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-violet-100 text-violet-700',
  pro: 'bg-indigo-100 text-indigo-700',
  premium: 'bg-amber-100 text-amber-700',
}

interface PendingPayment {
  id: string
  user_email: string
  plan: string
  transaction_number: string | null
  transaction_date: string | null
  created_at: string
}

export function PendingPaymentsSection({ payments }: { payments: PendingPayment[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">Nicio confirmare în așteptare</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-orange-200">
      <table className="w-full text-sm">
        <thead className="bg-orange-50 border-b border-orange-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Data confirmare</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Plan</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Nr. tranzacție</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Data transfer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-orange-100 bg-white">
          {payments.map(p => (
            <tr key={p.id} className="hover:bg-orange-50">
              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                {new Date(p.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-4 py-3 text-gray-900 font-medium max-w-[180px] truncate">{p.user_email}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[p.plan] ?? 'bg-gray-100 text-gray-600'}`}>
                  {PLAN_LABELS[p.plan] ?? p.plan}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-sm text-green-700 font-semibold">
                {p.transaction_number ? `#${p.transaction_number}` : '—'}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {p.transaction_date
                  ? new Date(p.transaction_date).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-4 py-2 bg-orange-50 border-t border-orange-100">
        Caută emailul în tabelul de utilizatori de mai sus pentru a activa abonamentul.
      </p>
    </div>
  )
}
