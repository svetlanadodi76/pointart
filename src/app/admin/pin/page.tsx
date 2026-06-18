import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAppSettings } from '@/lib/supabase/getAppSettings'
import { PinForm } from './PinForm'

export default async function AdminPinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard')

  const settings = await getAppSettings()
  const isFirstSetup = !settings.admin_pin_hash

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-gray-900">
            {isFirstSetup ? 'Configurează PIN admin' : 'PIN admin'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isFirstSetup
              ? 'Setează un PIN pentru accesul la panoul de administrare'
              : 'Introdu PIN-ul pentru a accesa panoul de administrare'}
          </p>
        </div>
        <PinForm isFirstSetup={isFirstSetup} />
      </div>
    </div>
  )
}
