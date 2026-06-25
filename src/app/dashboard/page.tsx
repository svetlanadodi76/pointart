import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import { redirect } from 'next/navigation'
import { logout } from '../auth/actions'
import Link from 'next/link'
import { SchemaCard } from './SchemaCard'
import { LanguageToggle } from '@/components/LanguageToggle'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translations'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [subscription, lang] = await Promise.all([
    getSubscription(supabase, user.id),
    getLang(),
  ])

  const { data: schemas } = await supabase
    .from('schemas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  type SchemaRow = {
    id: string
    name: string
    craft_type: string
    canvas_type: string | null
    width_stitches: number
    height_stitches: number
    colors_used: number
    created_at: string
    folder: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }

  const schemaList: SchemaRow[] = (schemas ?? []) as SchemaRow[]

  // Câte scheme din aceeași poză (după image_hash) — pentru badge "N variante"
  const hashCount = new Map<string, number>()
  for (const s of schemaList) {
    if (s.image_hash) hashCount.set(s.image_hash, (hashCount.get(s.image_hash) ?? 0) + 1)
  }

  // Extrage folderele existente (unice, fără null)
  const existingFolders: string[] = [...new Set(
    schemaList.map(s => s.folder).filter(Boolean) as string[]
  )].sort()

  // Grupare scheme pe foldere
  const grouped = new Map<string, SchemaRow[]>()
  for (const schema of schemaList) {
    const key = schema.folder ?? ''
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(schema)
  }

  // Ordine: foldere numite (alfabetic) → fără folder la urmă
  const namedFolders = existingFolders // deja sortate
  const unfoldered = grouped.get('') ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧵</span>
            <span className="text-xl font-bold text-violet-700">PointArt</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageToggle lang={lang} />
            <span className="text-gray-500 text-sm hidden sm:block">{user.email}</span>

            {/* Badge plan actual */}
            {subscription && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1 ${
                subscription.plan === 'pro'
                  ? 'bg-violet-100 text-violet-700'
                  : subscription.plan === 'starter'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {subscription.plan === 'pro' ? '⭐ Pro' : subscription.plan === 'starter' ? '✦ Starter' : '○ Trial'}
              </span>
            )}

            {/* Upgrade dacă nu e Pro */}
            {subscription?.plan !== 'pro' && (
              <Link href="/pricing" className="bg-violet-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-violet-800 transition-colors whitespace-nowrap">
                ↑ Upgrade
              </Link>
            )}

            <form action={logout}>
              <button type="submit" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                {t(lang, 'nav.logout')}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Banner expirat */}
        {subscription?.status === 'expired' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-red-800">
                  {subscription.plan === 'free_trial' ? t(lang, 'banner.trial_expired') : t(lang, 'banner.sub_expired')}
                </p>
                <p className="text-red-600 text-sm">{t(lang, 'banner.expired_desc')}</p>
              </div>
            </div>
            <Link href="/pricing" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              {t(lang, 'banner.renew')}
            </Link>
          </div>
        )}

        {/* Banner Starter — scheme epuizate */}
        {subscription?.plan === 'starter' && subscription?.status === 'active' && (subscription.schemas_remaining ?? 0) <= 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-orange-800">{t(lang, 'banner.starter_exhausted')}</p>
                <p className="text-orange-600 text-sm">{t(lang, 'banner.starter_exhausted_desc')}</p>
              </div>
            </div>
            <Link href="/pricing" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
              {t(lang, 'banner.upgrade_pro')}
            </Link>
          </div>
        )}

        {/* Banner trial activ — scheme epuizate */}
        {subscription?.plan === 'free_trial' && subscription?.status === 'active' && (subscription.schemas_remaining ?? 0) <= 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-red-800">{t(lang, 'banner.trial_used')}</p>
                <p className="text-red-600 text-sm">{t(lang, 'banner.trial_used_desc')}</p>
              </div>
            </div>
            <Link href="/pricing" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              {t(lang, 'banner.upgrade')}
            </Link>
          </div>
        )}

        {/* Banner trial activ — scheme disponibile */}
        {subscription?.plan === 'free_trial' && subscription?.status === 'active' && (subscription.schemas_remaining ?? 0) > 0 && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-violet-800">
                  {t(lang, 'banner.trial_active').replace('{days}', String(trialDaysLeft))}
                </p>
                <p className="text-violet-600 text-sm">
                  {t(lang, 'banner.trial_schemas_left').replace('{n}', String(subscription.schemas_remaining ?? 0))}
                </p>
              </div>
            </div>
            <Link href="/pricing" className="bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-800 transition-colors">
              {t(lang, 'banner.upgrade')}
            </Link>
          </div>
        )}

        {/* Banner Pro expiră în curând (3 zile) */}
        {subscription?.plan === 'pro' && subscription?.status === 'active' && subscription.current_period_end && (
          (() => {
            const daysLeft = Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86400000)
            return daysLeft <= 3 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-800">
                      {t(lang, 'banner.pro_expiring')
                        .replace('{days}', String(daysLeft))
                        .replace('{unit}', lang === 'ru' ? (daysLeft === 1 ? 'день' : 'дн.') : (daysLeft === 1 ? 'zi' : 'zile'))
                      }
                    </p>
                    <p className="text-amber-600 text-sm">{t(lang, 'banner.pro_expiring_desc')}</p>
                  </div>
                </div>
                <Link href="/pricing" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                  {t(lang, 'banner.renew')}
                </Link>
              </div>
            ) : null
          })()
        )}

        {/* Titlu + buton */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t(lang, 'dashboard.my_schemas')}</h1>
          <Link href="/generate" className="bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-violet-800 transition-colors flex items-center gap-2">
            {t(lang, 'dashboard.new_schema')}
          </Link>
        </div>

        {schemaList.length > 0 ? (
          <div className="space-y-8">
            {/* Foldere numite */}
            {namedFolders.map(folderName => (
              <section key={folderName}>
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-700">{folderName}</h2>
                  <span className="text-xs text-gray-400">({(grouped.get(folderName) ?? []).length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(grouped.get(folderName) ?? []).map(schema => (
                    <SchemaCard key={schema.id} schema={schema} existingFolders={existingFolders} variantCount={schema.image_hash ? (hashCount.get(schema.image_hash) ?? 1) : 1} />
                  ))}
                </div>
              </section>
            ))}

            {/* Scheme fără folder */}
            {unfoldered.length > 0 && (
              <section>
                {namedFolders.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-500">{t(lang, 'dashboard.no_folder')}</h2>
                    <span className="text-xs text-gray-400">({unfoldered.length})</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unfoldered.map(schema => (
                    <SchemaCard key={schema.id} schema={schema} existingFolders={existingFolders} variantCount={schema.image_hash ? (hashCount.get(schema.image_hash) ?? 1) : 1} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <div className="text-5xl mb-4">🧵</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{t(lang, 'dashboard.no_schemas')}</h2>
            <p className="text-gray-500 mb-6">{t(lang, 'dashboard.no_schemas_desc')}</p>
            <Link href="/generate" className="bg-violet-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-800 transition-colors">
              {t(lang, 'dashboard.generate_now')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
