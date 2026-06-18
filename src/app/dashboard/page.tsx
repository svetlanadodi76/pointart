import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import { redirect } from 'next/navigation'
import { logout } from '../auth/actions'
import Link from 'next/link'
import { SchemaCard } from './SchemaCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const subscription = await getSubscription(supabase, user.id)

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
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm hidden sm:block">{user.email}</span>
            <Link href="/pricing" className="text-violet-600 hover:text-violet-800 text-sm font-medium transition-colors">
              Planuri
            </Link>
            <form action={logout}>
              <button type="submit" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                Ieși din cont
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Banner expirat */}
        {subscription?.status === 'expired' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-red-800">
                  {subscription.plan === 'free_trial' ? 'Perioada trial a expirat' : 'Abonamentul tău a expirat'}
                </p>
                <p className="text-red-600 text-sm">Schemele tale sunt păstrate. Activează un plan pentru a genera altele noi.</p>
              </div>
            </div>
            <Link href="/pricing" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              Reînnoiește
            </Link>
          </div>
        )}

        {/* Banner Starter — scheme epuizate */}
        {subscription?.plan === 'starter' && subscription?.status === 'active' && (subscription.schemas_remaining ?? 0) <= 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-orange-800">Ai generat toate cele 3 scheme Starter</p>
                <p className="text-orange-600 text-sm">Treci la Pro pentru scheme nelimitate.</p>
              </div>
            </div>
            <Link href="/pricing" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
              Upgrade Pro
            </Link>
          </div>
        )}

        {/* Banner trial activ — scheme epuizate */}
        {subscription?.plan === 'free_trial' && subscription?.status === 'active' && (subscription.schemas_remaining ?? 0) <= 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-red-800">Ai folosit schema trial</p>
                <p className="text-red-600 text-sm">Activează un plan plătit pentru a genera scheme noi.</p>
              </div>
            </div>
            <Link href="/pricing" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              Upgrade
            </Link>
          </div>
        )}

        {/* Banner trial activ — scheme disponibile */}
        {subscription?.plan === 'free_trial' && subscription?.status === 'active' && (subscription.schemas_remaining ?? 0) > 0 && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-violet-800">Trial gratuit — {trialDaysLeft} zile rămase</p>
                <p className="text-violet-600 text-sm">Mai ai {subscription.schemas_remaining} schemă disponibilă în trial</p>
              </div>
            </div>
            <Link href="/pricing" className="bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-800 transition-colors">
              Upgrade
            </Link>
          </div>
        )}

        {/* Banner Pro expiră în curând (3 zile) */}
        {subscription?.plan === 'pro' && subscription?.status === 'active' && subscription.current_period_end && (
          (() => {
            const daysLeft = Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86400000)
            return daysLeft <= 3 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-800">Abonamentul Pro expiră în {daysLeft} {daysLeft === 1 ? 'zi' : 'zile'}</p>
                    <p className="text-amber-600 text-sm">Efectuează transferul pentru a continua fără întreruperi.</p>
                  </div>
                </div>
                <Link href="/pricing" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                  Reînnoiește
                </Link>
              </div>
            ) : null
          })()
        )}

        {/* Titlu + buton */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Schemele mele</h1>
          <Link href="/generate" className="bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-violet-800 transition-colors flex items-center gap-2">
            <span>+</span> Schemă nouă
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
                    <SchemaCard key={schema.id} schema={schema} existingFolders={existingFolders} />
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
                    <h2 className="text-lg font-semibold text-gray-500">Fără folder</h2>
                    <span className="text-xs text-gray-400">({unfoldered.length})</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unfoldered.map(schema => (
                    <SchemaCard key={schema.id} schema={schema} existingFolders={existingFolders} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <div className="text-5xl mb-4">🧵</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Nicio schemă încă</h2>
            <p className="text-gray-500 mb-6">Generează prima ta schemă din orice fotografie</p>
            <Link href="/generate" className="bg-violet-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-800 transition-colors">
              Generează acum
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
