import Link from 'next/link'
import { register } from '../actions'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translations'
import { LanguageToggle } from '@/components/LanguageToggle'

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const lang = await getLang()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-2xl">🧵</span>
              <span className="text-xl font-bold text-violet-700">PointArt</span>
            </Link>
            <LanguageToggle lang={lang} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t(lang, 'auth.register_title')}</h1>
          <p className="text-gray-500 mt-2">{t(lang, 'auth.register_subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={register} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t(lang, 'auth.name')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder={lang === 'ru' ? 'Мария Иванова' : 'Maria Ionescu'}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t(lang, 'auth.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="adresa@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t(lang, 'auth.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder={lang === 'ru' ? 'Минимум 6 символов' : 'Minim 6 caractere'}
              minLength={6}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-700 text-white py-3 rounded-xl font-semibold hover:bg-violet-800 transition-colors"
          >
            {t(lang, 'auth.register_btn')}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-4">
          {lang === 'ru'
            ? 'Регистрируясь, вы соглашаетесь с условиями использования.'
            : 'Prin înregistrare, ești de acord cu termenii de utilizare.'}
        </p>

        <p className="text-center text-gray-500 text-sm mt-4">
          {t(lang, 'auth.have_account')}{' '}
          <Link href="/auth/login" className="text-violet-700 font-medium hover:underline">
            {t(lang, 'auth.login_link')}
          </Link>
        </p>
      </div>
    </div>
  )
}
