import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminPanel } from './AdminPanel'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Acces doar pentru admin
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  // Fetch toți utilizatorii cu subscripții (bypass RLS cu admin client)
  const admin = createAdminClient()
  const { data: subscriptions } = await admin
    .from('subscriptions')
    .select('user_id, plan, status, schemas_remaining, trial_ends_at, current_period_end, created_at')
    .order('created_at', { ascending: false })

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email')

  const emailMap = new Map((profiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email]))

  const users = (subscriptions ?? []).map((s: {
    user_id: string
    plan: string
    status: string
    schemas_remaining: number | null
    trial_ends_at: string | null
    current_period_end: string | null
    created_at: string
  }) => ({
    ...s,
    email: emailMap.get(s.user_id) ?? 'necunoscut',
  }))

  const stats = {
    total: users.length,
    trial: users.filter(u => u.plan === 'free_trial' && u.status === 'active').length,
    starter: users.filter(u => u.plan === 'starter').length,
    pro: users.filter(u => u.plan === 'pro').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-sm">← Dashboard</Link>
            <span className="text-gray-300">/</span>
            <h1 className="font-bold text-gray-900">Admin Panel</h1>
          </div>
          <span className="text-xs text-gray-400">{user.email}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Statistici */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total utilizatori', value: stats.total, color: 'text-gray-900' },
            { label: 'Trial activ', value: stats.trial, color: 'text-blue-600' },
            { label: 'Starter', value: stats.starter, color: 'text-violet-600' },
            { label: 'Pro', value: stats.pro, color: 'text-indigo-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabel utilizatori */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Utilizatori</h2>
          <AdminPanel users={users} />
        </div>
      </div>
    </div>
  )
}
