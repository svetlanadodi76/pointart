import { createClient } from '@/lib/supabase/server'
import { getAppSettings } from '@/lib/supabase/getAppSettings'
import Link from 'next/link'
import { PricingCards } from './PricingCards'
import { SiteFooter } from '@/components/SiteFooter'
import { LanguageToggle } from '@/components/LanguageToggle'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translations'

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

  const [appSettings, lang] = await Promise.all([
    getAppSettings(),
    getLang(),
  ])

  const payment = {
    iban:    process.env.PAYMENT_IBAN    || '',
    name:    process.env.PAYMENT_NAME    || '',
    bank:    process.env.PAYMENT_BANK    || '',
    contact: process.env.PAYMENT_CONTACT || '',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🧵</span>
            <span className="text-xl font-bold text-violet-700">PointArt</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle lang={lang} />
            {user ? (
              <Link href="/dashboard" className="text-sm text-violet-700 font-medium hover:underline">
                {t(lang, 'nav.dashboard')} →
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">{t(lang, 'nav.login')}</Link>
                <Link href="/auth/register" className="text-sm bg-violet-700 text-white px-4 py-2 rounded-lg hover:bg-violet-800 transition-colors">
                  {t(lang, 'nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Titlu */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t(lang, 'pricing.title')}</h1>
          <p className="text-lg text-gray-500">{t(lang, 'pricing.subtitle')}</p>
        </div>

        <PricingCards
          currentPlan={currentPlan}
          userEmail={user?.email ?? null}
          payment={payment}
        />

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">{t(lang, 'pricing.faq_title')}</h2>

          {([
            { qKey: 'pricing.faq1_q', aKey: 'pricing.faq1_a' },
            { qKey: 'pricing.faq2_q', aKey: 'pricing.faq2_a' },
            { qKey: 'pricing.faq3_q', aKey: 'pricing.faq3_a' },
            { qKey: 'pricing.faq4_q', aKey: 'pricing.faq4_a' },
          ] as const).map(({ qKey, aKey }) => (
            <div key={qKey} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="font-semibold text-gray-900 mb-1">{t(lang, qKey)}</p>
              <p className="text-gray-500 text-sm">{t(lang, aKey)}</p>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
