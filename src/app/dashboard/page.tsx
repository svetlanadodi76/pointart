import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '../auth/actions'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: schemas } = await supabase
    .from('schemas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

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
            <span className="text-gray-500 text-sm">{user.email}</span>
            <form action={logout}>
              <button type="submit" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                Ieși din cont
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Banner trial */}
        {subscription?.plan === 'free_trial' && subscription?.status === 'active' && (
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

        {/* Titlu + buton */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Schemele mele</h1>
          <Link href="/generate" className="bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-violet-800 transition-colors flex items-center gap-2">
            <span>+</span> Schemă nouă
          </Link>
        </div>

        {/* Liste scheme */}
        {schemas && schemas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemas.map(schema => (
              <div key={schema.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{schema.name}</h3>
                  <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full">
                    {schema.craft_type === 'cross_stitch' ? 'Broderie' : schema.craft_type === 'goblene' ? 'Goblene' : 'Diamante'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>📐 {schema.width_stitches}×{schema.height_stitches} puncte</p>
                  <p>🎨 {schema.colors_used} culori DMC</p>
                  {schema.canvas_type && <p>🧵 Canvas {schema.canvas_type}</p>}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(schema.created_at).toLocaleDateString('ro-RO')}
                </p>
              </div>
            ))}
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
