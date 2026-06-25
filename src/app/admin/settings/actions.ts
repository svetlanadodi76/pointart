'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) throw new Error('Acces interzis')
}

async function upsertSetting(key: string, value: string) {
  const admin = createAdminClient()
  await admin.from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
}

export async function savePaymentSettings(formData: FormData) {
  await checkAdmin()
  await upsertSetting('whatsapp_message', formData.get('whatsapp_message') as string)
  revalidatePath('/admin/settings')
  revalidatePath('/pricing')
}

export async function savePlanSettings(formData: FormData) {
  await checkAdmin()
  await Promise.all([
    upsertSetting('starter_schemas', formData.get('starter_schemas') as string),
    upsertSetting('trial_days',      formData.get('trial_days') as string),
  ])
  revalidatePath('/admin/settings')
}

export async function changePin(formData: FormData) {
  await checkAdmin()
  const currentPin  = formData.get('current_pin') as string
  const newPin      = formData.get('new_pin') as string
  const confirmPin  = formData.get('confirm_pin') as string

  if (newPin !== confirmPin) return { error: 'PIN-urile noi nu coincid.' }
  if (newPin.length < 4)     return { error: 'PIN-ul trebuie să aibă minim 4 caractere.' }

  const admin = createAdminClient()
  const { data } = await admin.from('app_settings')
    .select('value').eq('key', 'admin_pin_hash').single()

  // Dacă există PIN setat, verifică PIN-ul curent
  if (data?.value) {
    const valid = await bcrypt.compare(currentPin, data.value)
    if (!valid) return { error: 'PIN-ul curent este incorect.' }
  }

  const hash = await bcrypt.hash(newPin, 10)
  await upsertSetting('admin_pin_hash', hash)

  // Actualizează cookie-ul cu noul hash
  const cookieStore = await cookies()
  cookieStore.set('admin_pin_session', hash, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/admin',
    maxAge: 60 * 60 * 24 * 365 * 10,
  })

  revalidatePath('/admin/settings')
  return { success: true }
}
