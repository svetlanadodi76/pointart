import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PricingCards } from './PricingCards'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentPlan: string | null = null
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()
    if (sub?.status === 'active') currentPlan = sub.plan
  }

  const payment = {
    iban: process.env.PAYMENT_IBAN ?? '',
    name: process.env.PAYMENT_NAME ?? '',
    bank: process.env.PAYMENT_BANK ?? '',
    contact: process.env.PAYMENT_CONTACT ?? '',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🧵</span>
            <span className="text-xl font-bold text-violet-700">PointArt</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="text-sm text-violet-700 font-medium hover:underline">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Intră în cont</Link>
                <Link href="/auth/register" className="text-sm bg-violet-700 text-white px-4 py-2 rounded-lg hover:bg-violet-800 transition-colors">
                  Înregistrare
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Titlu */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Planuri simple și clare</h1>
          <p className="text-lg text-gray-500">Alege planul potrivit pentru proiectele tale</p>
        </div>

        <PricingCards
          currentPlan={currentPlan}
          userEmail={user?.email ?? null}
          payment={payment}
        />

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Întrebări frecvente</h2>

          {[
            {
              q: 'Cum plătesc?',
              a: 'Prin transfer bancar direct în contul nostru. Dai click pe "Cumpără", urmezi instrucțiunile și trimiți confirmarea. Activăm planul în maxim 24 ore.',
            },
            {
              q: 'Planul Starter expiră?',
              a: 'Nu. Plătești o singură dată și ai acces la 3 scheme permanent, fără abonament lunar.',
            },
            {
              q: 'Pot schimba planul mai târziu?',
              a: 'Da. Poți trece de la Starter la Pro oricând. Contactează-ne și facem upgrade.',
            },
            {
              q: 'Ce se întâmplă cu schemele generate în trial?',
              a: 'Rămân salvate în contul tău. La upgrade le poți vizualiza și descărca PDF.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="font-semibold text-gray-900 mb-1">{q}</p>
              <p className="text-gray-500 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
