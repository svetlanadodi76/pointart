import type { SupabaseClient } from '@supabase/supabase-js'

export interface Subscription {
  user_id: string
  plan: string
  status: string
  schemas_remaining: number | null
  trial_ends_at: string | null
  current_period_end: string | null
  created_at: string
}

export async function getSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subscription | null> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!sub) return null

  const now = new Date()

  // Auto-expiră Trial
  if (
    sub.plan === 'free_trial' &&
    sub.status === 'active' &&
    sub.trial_ends_at &&
    new Date(sub.trial_ends_at) < now
  ) {
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', userId)
    return { ...sub, status: 'expired' }
  }

  // Auto-expiră Pro
  if (
    sub.plan === 'pro' &&
    sub.status === 'active' &&
    sub.current_period_end &&
    new Date(sub.current_period_end) < now
  ) {
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', userId)
    return { ...sub, status: 'expired' }
  }

  return sub
}
