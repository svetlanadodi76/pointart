'use client'

import { useState } from 'react'

interface PaymentRow {
  id: string
  user_email: string
  plan: string
  amount_eur: number | null
  amount_mdl: number | null
  note: string | null
  created_at: string
}

const MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-violet-100 text-violet-700',
  pro: 'bg-indigo-100 text-indigo-700',
}

export function PaymentsSection({ payments }: { payments: PaymentRow[] }) {
  const [selectedYear, setSelectedYear]   = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')

  // Ani disponibili: de la 2025 până la curent + orice an din tranzacții
  const currentYear = new Date().getFullYear()
  const yearSet = new Set(payments.map(p => new Date(p.created_at).getFullYear()))
  for (let y = 2025; y <= currentYear; y++) yearSet.add(y)
  const years = [...yearSet].sort((a, b) => b - a)

  // Filtrare
  const filtered = payments.filter(p => {
    const d = new Date(p.created_at)
    if (selectedYear  !== 'all' && d.getFullYear() !== Number(selectedYear))  return false
    if (selectedMonth !== 'all' && d.getMonth() + 1 !== Number(selectedMonth)) return false
    return true
  })

  const totalEur = filtered.reduce((s, p) => s + (p.amount_eur ?? 0), 0)
  const totalMdl = filtered.reduce((s, p) => s + (p.amount_mdl ?? 0), 0)

  return (
    <>
      {/* Filtre */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={selectedYear}
          onChange={e => { setSelectedYear(e.target.value); setSelectedMonth('all') }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        >
          <option value="all">Toți anii</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        >
          <option value="all">Toate lunile</option>
          {MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>

        {(selectedYear !== 'all' || selectedMonth !== 'all') && (
          <button
            onClick={() => { setSelectedYear('all'); setSelectedMonth('all') }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Resetează
          </button>
        )}
      </div>

      {/* Totaluri */}
      <div className="flex flex-wrap items-center gap-6 mb-5">
        <div>
          <p className="text-xs text-gray-400">Total EUR</p>
          <p className="text-xl font-bold text-violet-700">{totalEur.toFixed(2)} €</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Total MDL</p>
          <p className="text-xl font-bold text-indigo-700">{totalMdl.toFixed(0)} MDL</p>
        </div>
        <div className="ml-auto">
          <p className="text-xs text-gray-400">Tranzacții</p>
          <p className="text-xl font-bold text-gray-700">{filtered.length}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          {payments.length === 0 ? 'Nicio încasare înregistrată' : 'Nicio încasare în perioada selectată'}
        </p>
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
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('ro-RO', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium max-w-[160px] truncate">{p.user_email}</td>
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
    </>
  )
}
