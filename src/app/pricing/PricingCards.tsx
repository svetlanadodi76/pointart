'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PaymentDetails {
  iban: string
  name: string
  bank: string
  contact: string
}

interface Props {
  currentPlan: string | null
  userEmail: string | null
  payment: PaymentDetails
}

const PLANS = [
  {
    id: 'free_trial',
    name: 'Trial Gratuit',
    price: '0€',
    period: '5 zile',
    color: 'gray',
    features: ['1 schemă', 'Preview browser', 'Toate tipurile de pânză'],
    cta: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '5€',
    period: 'o singură dată',
    amount: 5,
    color: 'violet',
    features: ['3 scheme', 'Export PDF schemă', 'Tipărire pânză 1:1', 'Foldere organizare', 'Valabil permanent'],
    cta: 'Cumpără Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '8€',
    period: 'pe lună',
    amount: 8,
    color: 'indigo',
    features: ['Scheme nelimitate', 'Export PDF schemă', 'Tipărire pânză 1:1', 'Foldere organizare', 'Prioritate la funcții noi'],
    cta: 'Cumpără Pro',
    badge: 'Recomandat',
  },
]

export function PricingCards({ currentPlan, userEmail, payment }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[1] | null>(null)
  const [copied, setCopied] = useState(false)

  const copyIban = () => {
    navigator.clipboard.writeText(payment.iban)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Carduri planuri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.id
          const isPaid = plan.id !== 'free_trial'

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                plan.badge ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-gray-200'
              } ${isCurrent ? 'ring-2 ring-violet-400' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-violet-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Plan actual
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-center text-sm text-violet-600 font-medium py-2">
                  ✓ Planul tău curent
                </div>
              ) : isPaid ? (
                <button
                  onClick={() => setSelectedPlan(plan as typeof PLANS[1])}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                    plan.badge
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-violet-700 text-white hover:bg-violet-800'
                  }`}
                >
                  {plan.cta}
                </button>
              ) : !userEmail ? (
                <Link href="/auth/register" className="w-full py-3 rounded-xl font-semibold text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors block">
                  Începe gratuit
                </Link>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Modal plată cu IBAN */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Activare plan {selectedPlan.name}
              </h2>
              <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="bg-violet-50 rounded-xl p-4 mb-4 space-y-3">
              <p className="text-sm font-semibold text-violet-800">Detalii transfer bancar:</p>

              <div>
                <p className="text-xs text-gray-500 mb-1">Beneficiar</p>
                <p className="font-semibold text-gray-900">{payment.name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Banca</p>
                <p className="font-semibold text-gray-900">{payment.bank}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">IBAN</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-gray-900 text-sm">{payment.iban}</p>
                  <button onClick={copyIban} className="text-violet-600 hover:text-violet-800 text-xs font-medium shrink-0">
                    {copied ? '✓ Copiat' : 'Copiază'}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Suma</p>
                <p className="font-bold text-xl text-violet-700">{selectedPlan.amount}€</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Referință obligatorie</p>
                <p className="font-mono text-sm bg-yellow-50 border border-yellow-200 rounded px-2 py-1 text-yellow-800 font-semibold">
                  {userEmail ?? 'emailul tău'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Scrie exact această referință în câmpul "Detalii plată"</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">După transfer</span>, trimite confirmarea de plată (screenshot sau nr. tranzacție) la:
              </p>
              <p className="font-semibold text-violet-700 mt-1">{payment.contact}</p>
              <p className="text-xs text-gray-400 mt-1">Activarea se face în maximum 24 ore lucrătoare</p>
            </div>

            <button
              onClick={() => setSelectedPlan(null)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Am înțeles, închide
            </button>
          </div>
        </div>
      )}
    </>
  )
}
