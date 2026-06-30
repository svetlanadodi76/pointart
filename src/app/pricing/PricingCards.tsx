'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  currentPlan: string | null
  userEmail: string | null
}

interface PaidPlan {
  id: string
  name: string
  price: string
  priceMdl: string
  period: string
  amountEur: number
  amountMdl: number
  features: string[]
  cta: string
  badge?: string
}

const PLANS = [
  {
    id: 'free_trial',
    name: 'Trial Gratuit',
    price: '0€',
    priceMdl: null,
    period: '5 zile',
    features: ['1 schemă', 'Preview browser', 'Toate tipurile de pânză'],
    cta: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '5€',
    priceMdl: '99 MDL',
    period: 'o singură dată',
    amountEur: 5,
    amountMdl: 99,
    features: ['3 scheme', 'Export PDF schemă', 'Tipărire pânză 1:1', 'Foldere organizare', 'Valabil permanent'],
    cta: 'Cumpără Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '10€',
    priceMdl: '199 MDL',
    period: 'pe lună',
    amountEur: 10,
    amountMdl: 199,
    features: ['Scheme nelimitate', 'Export PDF schemă', 'Tipărire pânză 1:1', 'Foldere organizare', 'Prioritate la funcții noi'],
    cta: 'Cumpără Pro',
    badge: 'Recomandat',
  },
  {
    id: 'premium',
    name: 'Premium AI',
    price: '25€',
    priceMdl: '499 MDL',
    period: 'pe lună',
    amountEur: 25,
    amountMdl: 499,
    features: ['Scheme nelimitate', 'Export PDF schemă', 'Tipărire pânză 1:1', 'Foldere organizare', 'Mărire imagine AI (4×)', 'Fundal simplificat automat', 'Îmbunătățire portret AI', 'Culori perceptuale CIEDE2000'],
    cta: 'Cumpără Premium AI',
    badge: 'AI ✨',
  },
]

export function PricingCards({ currentPlan, userEmail }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null)
  const [sending, setSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setSelectedPlan(null)
    setSending(false)
    setEmailSent(false)
    setError(null)
  }

  const handleSendEmail = async () => {
    if (!selectedPlan) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/send-payment-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: selectedPlan.name,
          amountEur: selectedPlan.amountEur,
          amountMdl: selectedPlan.amountMdl,
        }),
      })
      if (!res.ok) throw new Error()
      setEmailSent(true)
    } catch {
      setError('Nu am putut trimite emailul. Încearcă din nou.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Carduri planuri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.id
          const isPaid = plan.id !== 'free_trial'

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                plan.id === 'premium'
                  ? 'border-amber-400 shadow-lg shadow-amber-100'
                  : plan.badge
                  ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                  : 'border-gray-200'
              } ${isCurrent ? 'ring-2 ring-violet-400' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`text-white text-xs font-semibold px-3 py-1 rounded-full ${plan.id === 'premium' ? 'bg-amber-500' : 'bg-indigo-600'}`}>
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
                <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.priceMdl && (
                    <span className="text-lg font-semibold text-gray-400">/ {plan.priceMdl}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{plan.period}</p>
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
                userEmail ? (
                  <button
                    onClick={() => { setEmailSent(false); setError(null); setSelectedPlan(plan as PaidPlan) }}
                    className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                      plan.id === 'premium'
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : plan.badge
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-violet-700 text-white hover:bg-violet-800'
                    }`}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link href="/auth/login" className={`w-full py-3 rounded-xl font-semibold text-center transition-colors block ${
                    plan.id === 'premium'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : plan.badge
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-violet-700 text-white hover:bg-violet-800'
                  }`}>
                    {plan.cta}
                  </Link>
                )
              ) : !userEmail ? (
                <Link href="/auth/register" className="w-full py-3 rounded-xl font-semibold text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors block">
                  Începe gratuit
                </Link>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Modal activare */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Activare plan {selectedPlan.name}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {emailSent ? (
              /* Confirmare trimitere */
              <div className="text-center py-4">
                <div className="text-5xl mb-4">✉️</div>
                <h3 className="font-semibold text-gray-900 mb-2">Emailul a fost trimis!</h3>
                <p className="text-sm text-gray-500 mb-1">
                  Verifică inbox-ul la <strong>{userEmail}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Răspunde la email după ce efectuezi transferul. Planul se activează în <strong>maxim 24 ore</strong>.
                </p>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 bg-violet-700 text-white rounded-xl text-sm font-semibold hover:bg-violet-800 transition-colors"
                >
                  Am înțeles
                </button>
              </div>
            ) : (
              <>
                {/* Suma */}
                <div className={`rounded-xl p-4 mb-5 text-center ${selectedPlan.id === 'premium' ? 'bg-amber-50' : 'bg-violet-50'}`}>
                  <p className={`text-xs uppercase tracking-wide mb-1 ${selectedPlan.id === 'premium' ? 'text-amber-500' : 'text-violet-500'}`}>Suma de plată</p>
                  <p className={`text-4xl font-bold ${selectedPlan.id === 'premium' ? 'text-amber-600' : 'text-violet-700'}`}>{selectedPlan.amountEur}€</p>
                  <p className="text-gray-400 text-sm mt-1">sau {selectedPlan.amountMdl} MDL</p>
                </div>

                <p className="text-sm text-gray-600 text-center mb-5">
                  Îți trimitem pe email detaliile cardului pentru transfer. După plată, răspunde la email cu confirmarea — activăm planul în <strong>maxim 24 ore</strong>.
                </p>

                {error && (
                  <p className="text-sm text-red-500 text-center mb-3">{error}</p>
                )}

                <button
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="flex items-center justify-center gap-2 w-full bg-violet-700 hover:bg-violet-800 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Se trimite...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Trimite-mi detaliile pe email
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  Se trimite la {userEmail}
                </p>

                <button
                  onClick={handleClose}
                  className="w-full mt-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors"
                >
                  Închide
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
