import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppSettings } from '@/lib/supabase/getAppSettings'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { AdminPanel } from './AdminPanel'
import { PaymentsSection } from './PaymentsSection'
import { ActivityLog } from './ActivityLog'
import { SecurityLog } from './SecurityLog'
import { CollapsibleSection } from './CollapsibleSection'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  // Verifică PIN
  const settings = await getAppSettings()
  const cookieStore = await cookies()
  const pinCookie = cookieStore.get('admin_pin_session')?.value
  if (settings.admin_pin_hash && pinCookie !== settings.admin_pin_hash) {
    redirect('/admin/pin')
  }

  const admin = createAdminClient()

  const [
    { data: subscriptions },
    { data: profiles },
    { data: paymentsRaw },
    { data: logsRaw },
    { data: securityRaw },
  ] = await Promise.all([
    admin.from('subscriptions')
      .select('user_id, plan, status, schemas_remaining, trial_ends_at, current_period_end, created_at')
      .order('created_at', { ascending: false }),
    admin.from('profiles').select('id, email'),
    admin.from('payments')
      .select('id, user_email, plan, amount_eur, amount_mdl, note, created_at')
      .order('created_at', { ascending: false }),
    admin.from('subscription_logs')
      .select('id, user_email, event, plan, note, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    admin.from('security_logs')
      .select('id, event, email, details, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const payments = paymentsRaw ?? []
  const logs = logsRaw ?? []
  const securityLogs = securityRaw ?? []

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
    // Activi
    activeTotal: users.filter(u => u.status === 'active').length,
    activeTrial: users.filter(u => u.plan === 'free_trial' && u.status === 'active').length,
    activeStarter: users.filter(u => u.plan === 'starter' && u.status === 'active').length,
    activePro: users.filter(u => u.plan === 'pro' && u.status === 'active').length,
    // Inactivi
    inactiveTotal: users.filter(u => u.status !== 'active').length,
    expired: users.filter(u => u.status === 'expired').length,
    cancelled: users.filter(u => u.status === 'cancelled').length,
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
            <Link
              href="/admin/settings"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-violet-700 border border-gray-200 hover:border-violet-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Setări
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Statistici — Activi */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Abonamente active</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total activi', value: stats.activeTotal, color: 'text-gray-900' },
              { label: 'Trial',        value: stats.activeTrial,   color: 'text-blue-600' },
              { label: 'Starter',      value: stats.activeStarter, color: 'text-violet-600' },
              { label: 'Pro',          value: stats.activePro,     color: 'text-indigo-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Statistici — Inactivi */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Abonamente inactive</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total inactivi', value: stats.inactiveTotal, color: 'text-gray-900' },
              { label: 'Expirate',       value: stats.expired,       color: 'text-orange-500' },
              { label: 'Anulate',        value: stats.cancelled,     color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabel utilizatori */}
        <CollapsibleSection title="Utilizatori" badge={users.length}>
          <AdminPanel users={users} />
        </CollapsibleSection>

        {/* Încasări */}
        <CollapsibleSection title="Încasări" badge={payments.length}>
          <PaymentsSection payments={payments} />
        </CollapsibleSection>

        {/* Jurnal activitate */}
        <CollapsibleSection title="Jurnal activitate" badge={logs.length} defaultOpen={false}>
          <ActivityLog logs={logs} />
        </CollapsibleSection>

        {/* Jurnal securitate */}
        <CollapsibleSection
          title="Jurnal securitate"
          badge={securityLogs.length}
          defaultOpen={false}
        >
          <SecurityLog logs={securityLogs} />
        </CollapsibleSection>

      </div>
    </div>
  )
}
