'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Acces interzis')
  }
  return user
}

export async function activateStarter(userId: string) {
  await checkAdmin()
  const admin = createAdminClient()
  await admin.from('subscriptions').update({
    plan: 'starter',
    status: 'active',
    schemas_remaining: 3,
    trial_ends_at: null,
    current_period_end: null,
  }).eq('user_id', userId)
  revalidatePath('/admin')
}

export async function activatePro(userId: string) {
  await checkAdmin()
  const admin = createAdminClient()
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)
  await admin.from('subscriptions').update({
    plan: 'pro',
    status: 'active',
    schemas_remaining: null,
    trial_ends_at: null,
    current_period_end: periodEnd.toISOString(),
  }).eq('user_id', userId)
  revalidatePath('/admin')
}

export async function deactivateUser(userId: string) {
  await checkAdmin()
  const admin = createAdminClient()
  await admin.from('subscriptions').update({
    status: 'cancelled',
  }).eq('user_id', userId)
  revalidatePath('/admin')
}
