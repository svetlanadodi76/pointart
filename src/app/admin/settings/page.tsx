import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAppSettings } from '@/lib/supabase/getAppSettings'
import { SettingsForm } from './SettingsForm'
import { cookies } from 'next/headers'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard')

  const settings = await getAppSettings()

  // Verifică PIN
  const cookieStore = await cookies()
  const pinCookie = cookieStore.get('admin_pin_session')?.value
  if (settings.admin_pin_hash && pinCookie !== settings.admin_pin_hash) {
    redirect('/admin/pin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700 text-sm">← Admin</Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-bold text-gray-900">Setări</h1>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}
