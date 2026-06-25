import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'
import { LanguageToggle } from '@/components/LanguageToggle'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translations'

export default async function HomePage() {
  const lang = await getLang()

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧵</span>
            <span className="text-xl font-bold text-violet-700">PointArt</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageToggle lang={lang} />
            <Link href="/auth/login" className="text-sm sm:text-base text-gray-600 hover:text-violet-700 font-medium transition-colors">
              {t(lang, 'nav.login')}
            </Link>
            <Link href="/auth/register" className="bg-violet-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-violet-800 transition-colors">
              {t(lang, 'nav.try_free')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span>✨</span>
          <span>{t(lang, 'home.badge')}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {t(lang, 'home.h1_before')}<br />
          {t(lang, 'home.h1_into')}<span className="text-violet-700">{t(lang, 'home.h1_highlight')}</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          {t(lang, 'home.tagline')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/auth/register" className="bg-violet-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-violet-800 transition-colors">
            {t(lang, 'home.cta_start')}
          </Link>
          <Link href="#cum-functioneaza" className="text-gray-600 hover:text-violet-700 font-medium transition-colors">
            {t(lang, 'home.cta_how')}
          </Link>
        </div>
      </section>

      {/* Cum functioneaza */}
      <section id="cum-functioneaza" className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t(lang, 'home.how_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {([
              { step: '1', icon: '📷', titleKey: 'home.step1_title', descKey: 'home.step1_desc' },
              { step: '2', icon: '⚙️', titleKey: 'home.step2_title', descKey: 'home.step2_desc' },
              { step: '3', icon: '📄', titleKey: 'home.step3_title', descKey: 'home.step3_desc' },
            ] as const).map(item => (
              <div key={item.step} className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="w-8 h-8 bg-violet-700 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(lang, item.titleKey)}</h3>
                <p className="text-gray-500">{t(lang, item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t(lang, 'home.features_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {([
              { icon: '🎨', titleKey: 'home.f1_title', descKey: 'home.f1_desc' },
              { icon: '📏', titleKey: 'home.f2_title', descKey: 'home.f2_desc' },
              { icon: '🧵', titleKey: 'home.f3_title', descKey: 'home.f3_desc' },
              { icon: '📐', titleKey: 'home.f4_title', descKey: 'home.f4_desc' },
              { icon: '📄', titleKey: 'home.f5_title', descKey: 'home.f5_desc' },
              { icon: '📱', titleKey: 'home.f6_title', descKey: 'home.f6_desc' },
            ] as const).map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 mb-0.5">{t(lang, f.titleKey)}</p>
                  <p className="text-gray-500 text-sm">{t(lang, f.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preturi */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">{t(lang, 'home.pricing_title')}</h2>
          <p className="text-center text-gray-500 mb-12">{t(lang, 'home.tagline').split('.')[0]}.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{t(lang, 'home.pricing_free_title')}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{lang === 'ru' ? 'Бесплатно' : 'Gratuit'}</div>
              <div className="text-gray-500 text-sm mb-6">{t(lang, 'home.pricing_free_desc')}</div>
              <ul className="space-y-3 mb-8">
                {(lang === 'ru'
                  ? ['1 схема', 'Предпросмотр в браузере', 'Все типы изделий']
                  : ['1 schemă generată', 'Previzualizare în browser', 'Toate tipurile de lucrări']
                ).map(f => (
                  <li key={f} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-500">✓</span>{f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-gray-400">
                  <span>✗</span>{lang === 'ru' ? 'Скачать PDF' : 'Descărcare PDF'}
                </li>
              </ul>
              <Link href="/auth/register" className="block text-center bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                {t(lang, 'home.cta_start')}
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-2">{t(lang, 'home.pricing_starter_title')}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">5€</div>
              <div className="text-gray-500 text-sm mb-6">3 {lang === 'ru' ? 'схемы' : 'scheme'} — {t(lang, 'home.pricing_starter_desc')}</div>
              <ul className="space-y-3 mb-8">
                {(lang === 'ru'
                  ? ['3 схемы с PDF', 'Все типы изделий', 'Расчёт материалов', 'Без подписки']
                  : ['3 scheme cu PDF', 'Toate tipurile de lucrări', 'Calcul materiale', 'Fără abonament']
                ).map(f => (
                  <li key={f} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-500">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="block text-center bg-violet-100 text-violet-700 py-3 rounded-xl font-medium hover:bg-violet-200 transition-colors">
                {lang === 'ru' ? 'Купить' : 'Cumpără'}
              </Link>
            </div>

            <div className="bg-violet-700 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                {lang === 'ru' ? 'ПОПУЛЯРНЫЙ' : 'POPULAR'}
              </div>
              <div className="text-sm font-semibold text-violet-200 uppercase tracking-wide mb-2">{t(lang, 'home.pricing_pro_title')}</div>
              <div className="text-3xl font-bold text-white mb-1">10€</div>
              <div className="text-violet-200 text-sm mb-6">{t(lang, 'home.pricing_per_month')}</div>
              <ul className="space-y-3 mb-8">
                {(lang === 'ru'
                  ? ['Неограниченные схемы', 'Скачать PDF', 'Все типы изделий', 'Расчёт материалов', 'Приоритетная поддержка']
                  : ['Scheme nelimitate', 'PDF descărcabil', 'Toate tipurile de lucrări', 'Calcul materiale', 'Prioritate suport']
                ).map(f => (
                  <li key={f} className="flex items-center gap-2 text-violet-100">
                    <span className="text-green-300">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="block text-center bg-white text-violet-700 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-colors">
                {lang === 'ru' ? 'Подписаться' : 'Abonează-te'}
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-violet-600 hover:text-violet-800 font-medium transition-colors">
              {t(lang, 'home.see_all_plans')}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
