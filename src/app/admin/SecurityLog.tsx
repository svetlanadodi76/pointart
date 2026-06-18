interface SecurityLogRow {
  id: string
  event: string
  email: string
  details: string | null
  created_at: string
}

interface Props {
  logs: SecurityLogRow[]
}

const EVENT_CONFIG: Record<string, { label: string; color: string }> = {
  login_failed:       { label: 'Login eșuat',       color: 'bg-red-100 text-red-700' },
  register_failed:    { label: 'Înregistrare eșuată', color: 'bg-orange-100 text-orange-700' },
  generation_failed:  { label: 'Eroare generare',   color: 'bg-yellow-100 text-yellow-700' },
  generation_blocked: { label: 'Generare blocată',  color: 'bg-gray-100 text-gray-600' },
  admin_pin_failed:   { label: 'PIN admin greșit',  color: 'bg-rose-100 text-rose-700' },
}

export function SecurityLog({ logs }: Props) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Nicio înregistrare de securitate</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Data & ora</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Eveniment</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Detalii</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {logs.map(log => {
            const cfg = EVENT_CONFIG[log.event] ?? { label: log.event, color: 'bg-gray-100 text-gray-600' }
            return (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('ro-RO', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 text-xs max-w-[160px] truncate">{log.email}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[220px] truncate">{log.details ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 p-3 text-right">{logs.length} înregistrări (ultimele 100)</p>
    </div>
  )
}
