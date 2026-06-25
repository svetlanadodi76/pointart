'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PaymentDetails {
  contact: string  // număr WhatsApp
  email: string    // adresă email contact
}

interface Props {
  currentPlan: string | null
  userEmail: string | null
  payment: PaymentDetails
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
    color: 'gray',
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
    color: 'violet',
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
    color: 'indigo',
    features: ['Scheme nelimitate', 'Export PDF schemă', 'Tipărire pânză 1:1', 'Foldere organizare', 'Prioritate la funcții noi'],
    cta: 'Cumpără Pro',
    badge: 'Recomandat',
  },
]

export function PricingCards({ currentPlan, userEmail, payment }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null)

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
                <button
                  onClick={() => setSelectedPlan(plan as PaidPlan)}
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

      {/* Modal contact pentru activare */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Activare plan {selectedPlan.name}
              </h2>
              <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Suma */}
            <div className="bg-violet-50 rounded-xl p-4 mb-5 text-center">
              <p className="text-xs text-violet-500 uppercase tracking-wide mb-1">Suma de plată</p>
              <p className="text-4xl font-bold text-violet-700">{selectedPlan.amountEur}€</p>
              <p className="text-gray-400 text-sm mt-1">sau {selectedPlan.amountMdl} MDL</p>
            </div>

            <p className="text-sm text-gray-600 text-center mb-5">
              Scrie-ne pe WhatsApp sau email — îți trimitem datele de transfer și activăm planul în <strong>maxim 24 ore</strong>.
            </p>

            <div className="space-y-3">
              {payment.contact && (
                <a
                  href={`https://wa.me/${payment.contact.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Bună! Doresc să activez planul ${selectedPlan.name} PointArt (${selectedPlan.amountEur}€ / ${selectedPlan.amountMdl} MDL).\nEmail cont: ${userEmail ?? ''}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}

              <a
                href={`mailto:${payment.email}?subject=${encodeURIComponent(`Activare plan ${selectedPlan.name} PointArt`)}&body=${encodeURIComponent(
                  `Bună ziua,\n\nDoresc să activez planul ${selectedPlan.name} PointArt (${selectedPlan.amountEur}€ / ${selectedPlan.amountMdl} MDL).\nEmail contul meu: ${userEmail ?? ''}\n\nVă rog să îmi trimiteți detaliile de transfer bancar.\n\nMulțumesc!`
                )}`}
                className="flex items-center justify-center gap-2 w-full bg-violet-700 hover:bg-violet-800 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email — {payment.email}
              </a>
            </div>

            <button
              onClick={() => setSelectedPlan(null)}
              className="w-full mt-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors"
            >
              Închide
            </button>
          </div>
        </div>
      )}
    </>
  )
}
