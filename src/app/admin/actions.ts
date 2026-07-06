'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendActivationEmail } from '@/lib/email/resend'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Acces interzis')
  }
  return user
}

export async function activateStarter(
  userId: string,
  userEmail: string,
  amountEur?: number,
  amountMdl?: number,
  note?: string,
) {
  await checkAdmin()
  const admin = createAdminClient()

  await admin.from('subscriptions').update({
    plan: 'starter',
    status: 'active',
    schemas_remaining: 3,
    trial_ends_at: null,
    current_period_end: null,
  }).eq('user_id', userId)

  await admin.from('payments').insert({
    user_id: userId,
    user_email: userEmail,
    plan: 'starter',
    amount_eur: amountEur ?? null,
    amount_mdl: amountMdl ?? null,
    note: note ?? null,
  })

  await admin.from('subscription_logs').insert({
    user_id: userId,
    user_email: userEmail,
    event: 'activated_starter',
    plan: 'starter',
    note: note ?? null,
  })

  try { await sendActivationEmail({ toEmail: userEmail, plan: 'starter', periodEnd: null }) } catch {}

  revalidatePath('/admin')
}

export async function activatePro(
  userId: string,
  userEmail: string,
  amountEur?: number,
  amountMdl?: number,
  note?: string,
) {
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

  await admin.from('payments').insert({
    user_id: userId,
    user_email: userEmail,
    plan: 'pro',
    amount_eur: amountEur ?? null,
    amount_mdl: amountMdl ?? null,
    note: note ?? null,
  })

  await admin.from('subscription_logs').insert({
    user_id: userId,
    user_email: userEmail,
    event: 'activated_pro',
    plan: 'pro',
    note: note ?? null,
  })

  try { await sendActivationEmail({ toEmail: userEmail, plan: 'pro', periodEnd }) } catch {}

  revalidatePath('/admin')
}

export async function activatePremium(
  userId: string,
  userEmail: string,
  amountEur?: number,
  amountMdl?: number,
  note?: string,
) {
  await checkAdmin()
  const admin = createAdminClient()
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await admin.from('subscriptions').update({
    plan: 'premium',
    status: 'active',
    schemas_remaining: null,
    trial_ends_at: null,
    current_period_end: periodEnd.toISOString(),
  }).eq('user_id', userId)

  await admin.from('payments').insert({
    user_id: userId,
    user_email: userEmail,
    plan: 'premium',
    amount_eur: amountEur ?? null,
    amount_mdl: amountMdl ?? null,
    note: note ?? null,
  })

  await admin.from('subscription_logs').insert({
    user_id: userId,
    user_email: userEmail,
    event: 'activated_premium',
    plan: 'premium',
    note: note ?? null,
  })

  try { await sendActivationEmail({ toEmail: userEmail, plan: 'premium', periodEnd }) } catch {}

  revalidatePath('/admin')
}

export async function deactivateUser(userId: string, userEmail: string) {
  await checkAdmin()
  const admin = createAdminClient()

  await admin.from('subscriptions').update({
    status: 'cancelled',
  }).eq('user_id', userId)

  await admin.from('subscription_logs').insert({
    user_id: userId,
    user_email: userEmail,
    event: 'deactivated',
    plan: null,
    note: null,
  })

  revalidatePath('/admin')
}

export async function reactivateUser(userId: string, userEmail: string) {
  await checkAdmin()
  const admin = createAdminClient()

  await admin.from('subscriptions').update({
    status: 'active',
  }).eq('user_id', userId)

  await admin.from('subscription_logs').insert({
    user_id: userId,
    user_email: userEmail,
    event: 'reactivated',
    plan: null,
    note: 'reactivat manual de admin',
  })

  revalidatePath('/admin')
}
