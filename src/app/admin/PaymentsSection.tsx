interface PaymentRow {
  id: string
  user_email: string
  plan: string
  amount_eur: number | null
  amount_mdl: number | null
  note: string | null
  created_at: string
}

interface Props {
  payments: PaymentRow[]
  totalEur: number
  totalMdl: number
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-violet-100 text-violet-700',
  pro: 'bg-indigo-100 text-indigo-700',
}

export function PaymentsSection({ payments, totalEur, totalMdl }: Props) {
  return (
    <>
      {/* Totaluri */}
      <div className="flex items-center gap-6 mb-5">
        <div>
          <p className="text-xs text-gray-400">Total EUR</p>
          <p className="text-xl font-bold text-violet-700">{totalEur.toFixed(2)} €</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total MDL</p>
          <p className="text-xl font-bold text-indigo-700">{totalMdl.toFixed(0)} MDL</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nicio încasare înregistrată</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Data</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Plan</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">EUR</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">MDL</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Notă</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('ro-RO', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{p.user_email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[p.plan] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.plan === 'starter' ? 'Starter' : 'Pro'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {p.amount_eur != null ? `${p.amount_eur} €` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {p.amount_mdl != null ? `${p.amount_mdl} MDL` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3 text-right">{payments.length} tranzacții</p>
    </>
  )
}
