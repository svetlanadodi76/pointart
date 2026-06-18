interface LogRow {
  id: string
  user_email: string
  event: string
  plan: string | null
  note: string | null
  created_at: string
}

const EVENT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  activated_starter: { label: 'Activat Starter', color: 'text-violet-700 bg-violet-50', icon: '✓' },
  activated_pro:     { label: 'Activat Pro',     color: 'text-indigo-700 bg-indigo-50', icon: '✓' },
  deactivated:       { label: 'Dezactivat',       color: 'text-red-700 bg-red-50',       icon: '✕' },
  expired_trial:     { label: 'Expirat Trial',    color: 'text-gray-600 bg-gray-100',    icon: '⏰' },
  expired_pro:       { label: 'Expirat Pro',      color: 'text-orange-700 bg-orange-50', icon: '⏰' },
}

export function ActivityLog({ logs }: { logs: LogRow[] }) {
  return (
    <>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nicio activitate înregistrată</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Data</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Eveniment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Notă</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {logs.map(log => {
                const cfg = EVENT_CONFIG[log.event] ?? { label: log.event, color: 'text-gray-600 bg-gray-100', icon: '•' }
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString('ro-RO', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                      {' '}
                      <span className="text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString('ro-RO', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{log.user_email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <span>{cfg.icon}</span>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{log.note ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3 text-right">{logs.length} evenimente</p>
    </>
  )
}
