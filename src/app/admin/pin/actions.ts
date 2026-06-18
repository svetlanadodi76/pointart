'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppSettings } from '@/lib/supabase/getAppSettings'
import { logSecurity } from '@/lib/supabase/logSecurity'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

const COOKIE_NAME = 'admin_pin_session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/admin',
  maxAge: 60 * 60 * 24 * 365 * 10, // 10 ani = permanent practic
}

async function verifyAdminEmail() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard')
  return user
}

export async function verifyPin(pin: string) {
  const user = await verifyAdminEmail()
  const settings = await getAppSettings()

  if (!settings.admin_pin_hash) {
    return { error: 'PIN nu este setat. Configurează mai întâi un PIN.' }
  }

  const valid = await bcrypt.compare(pin, settings.admin_pin_hash)
  if (!valid) {
    await logSecurity('admin_pin_failed', user.email ?? 'admin', 'PIN incorect introdus')
    return { error: 'PIN incorect.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, settings.admin_pin_hash, COOKIE_OPTIONS)
  redirect('/admin')
}

export async function setPin(pin: string) {
  await verifyAdminEmail()

  if (pin.length < 4) return { error: 'PIN-ul trebuie să aibă minim 4 caractere.' }

  const hash = await bcrypt.hash(pin, 10)
  const admin = createAdminClient()

  await admin.from('app_settings')
    .upsert({ key: 'admin_pin_hash', value: hash, updated_at: new Date().toISOString() })

  // Setează cookie cu noul hash — invalidează sesiunile vechi automat
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, hash, COOKIE_OPTIONS)
  redirect('/admin')
}
